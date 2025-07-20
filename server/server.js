const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../')));

// 游戏房间管理
const rooms = new Map();
const players = new Map();

// 房间数据结构
class GameRoom {
    constructor(roomId, hostId) {
        this.roomId = roomId;
        this.hostId = hostId;
        this.players = new Map();
        this.gameState = 'waiting'; // waiting, playing, finished
        this.currentQuestion = null;
        this.scores = new Map();
        this.startTime = null;
        this.duration = 60; // 60秒游戏时间
    }

    addPlayer(playerId, playerData) {
        this.players.set(playerId, {
            id: playerId,
            name: playerData.name,
            character: playerData.character,
            score: 0,
            lives: 3,
            level: 1,
            experience: 0,
            currentQuestion: 0,
            isReady: false
        });
        this.scores.set(playerId, 0);
    }

    removePlayer(playerId) {
        this.players.delete(playerId);
        this.scores.delete(playerId);
    }

    getPlayerList() {
        return Array.from(this.players.values());
    }

    updatePlayerScore(playerId, score) {
        if (this.players.has(playerId)) {
            this.players.get(playerId).score = score;
            this.scores.set(playerId, score);
        }
    }

    getLeaderboard() {
        return Array.from(this.scores.entries())
            .map(([playerId, score]) => {
                const player = this.players.get(playerId);
                return {
                    id: playerId,
                    name: player.name,
                    character: player.character,
                    score: score,
                    level: player.level
                };
            })
            .sort((a, b) => b.score - a.score);
    }
}

// Socket.IO 连接处理
io.on('connection', (socket) => {
    console.log(`玩家连接: ${socket.id}`);

    // 加入房间
    socket.on('joinRoom', (data) => {
        const { roomId, playerData } = data;
        
        // 离开之前的房间
        if (players.has(socket.id)) {
            const previousRoomId = players.get(socket.id);
            if (rooms.has(previousRoomId)) {
                rooms.get(previousRoomId).removePlayer(socket.id);
            }
        }

        // 创建或加入房间
        if (!rooms.has(roomId)) {
            rooms.set(roomId, new GameRoom(roomId, socket.id));
        }

        const room = rooms.get(roomId);
        room.addPlayer(socket.id, playerData);
        players.set(socket.id, roomId);
        socket.join(roomId);

        // 通知房间内所有玩家
        io.to(roomId).emit('playerJoined', {
            playerId: socket.id,
            playerData: room.players.get(socket.id),
            allPlayers: room.getPlayerList()
        });

        console.log(`玩家 ${playerData.name} 加入房间 ${roomId}`);
    });

    // 玩家准备
    socket.on('playerReady', (data) => {
        const roomId = players.get(socket.id);
        if (roomId && rooms.has(roomId)) {
            const room = rooms.get(roomId);
            const player = room.players.get(socket.id);
            if (player) {
                player.isReady = true;
                
                // 检查是否所有玩家都准备好了
                const allReady = Array.from(room.players.values()).every(p => p.isReady);
                if (allReady && room.players.size >= 2) {
                    room.gameState = 'playing';
                    room.startTime = Date.now();
                    
                    // 生成第一个问题
                    room.currentQuestion = generateQuestion();
                    
                    io.to(roomId).emit('gameStart', {
                        question: room.currentQuestion,
                        startTime: room.startTime,
                        duration: room.duration
                    });
                } else {
                    io.to(roomId).emit('playerReady', {
                        playerId: socket.id,
                        allPlayers: room.getPlayerList()
                    });
                }
            }
        }
    });

    // 提交答案
    socket.on('submitAnswer', (data) => {
        const roomId = players.get(socket.id);
        if (roomId && rooms.has(roomId)) {
            const room = rooms.get(roomId);
            const player = room.players.get(socket.id);
            
            if (player && room.gameState === 'playing') {
                const { answer, timeSpent } = data;
                const isCorrect = answer === room.currentQuestion.answer;
                
                if (isCorrect) {
                    player.score += 10;
                    player.experience += 20;
                    player.currentQuestion++;
                } else {
                    player.lives = Math.max(0, player.lives - 1);
                    player.experience += 5;
                }

                // 更新等级
                player.level = calculateLevel(player.experience);
                
                // 更新分数
                room.updatePlayerScore(socket.id, player.score);
                
                // 发送结果给所有玩家
                io.to(roomId).emit('answerResult', {
                    playerId: socket.id,
                    playerName: player.name,
                    isCorrect: isCorrect,
                    correctAnswer: room.currentQuestion.answer,
                    playerScore: player.score,
                    playerLives: player.lives,
                    playerLevel: player.level,
                    leaderboard: room.getLeaderboard()
                });

                // 检查游戏是否结束
                if (player.lives <= 0 || player.currentQuestion >= 10) {
                    // 玩家游戏结束
                    io.to(roomId).emit('playerGameOver', {
                        playerId: socket.id,
                        playerName: player.name,
                        finalScore: player.score
                    });
                } else {
                    // 生成新问题
                    room.currentQuestion = generateQuestion();
                    io.to(roomId).emit('newQuestion', {
                        question: room.currentQuestion
                    });
                }
            }
        }
    });

    // 玩家断开连接
    socket.on('disconnect', () => {
        const roomId = players.get(socket.id);
        if (roomId && rooms.has(roomId)) {
            const room = rooms.get(roomId);
            const player = room.players.get(socket.id);
            
            if (player) {
                room.removePlayer(socket.id);
                
                // 通知其他玩家
                io.to(roomId).emit('playerLeft', {
                    playerId: socket.id,
                    playerName: player.name,
                    allPlayers: room.getPlayerList()
                });
                
                // 如果房间空了，删除房间
                if (room.players.size === 0) {
                    rooms.delete(roomId);
                }
            }
        }
        
        players.delete(socket.id);
        console.log(`玩家断开连接: ${socket.id}`);
    });
});

// 生成数学题
function generateQuestion() {
    const num1 = Math.floor(Math.random() * 9) + 1;
    const num2 = Math.floor(Math.random() * 9) + 1;
    return {
        num1: num1,
        num2: num2,
        answer: num1 * num2,
        question: `${num1} × ${num2} = ?`
    };
}

// 计算等级
function calculateLevel(experience) {
    const levels = [
        { level: 1, exp: 0 },
        { level: 2, exp: 100 },
        { level: 3, exp: 300 },
        { level: 4, exp: 600 },
        { level: 5, exp: 1000 },
        { level: 6, exp: 1500 },
        { level: 7, exp: 2100 },
        { level: 8, exp: 2800 },
        { level: 9, exp: 3600 },
        { level: 10, exp: 4500 }
    ];
    
    for (let i = levels.length - 1; i >= 0; i--) {
        if (experience >= levels[i].exp) {
            return levels[i].level;
        }
    }
    return 1;
}

// API 路由
app.get('/api/rooms', (req, res) => {
    const roomList = Array.from(rooms.values()).map(room => ({
        roomId: room.roomId,
        playerCount: room.players.size,
        gameState: room.gameState
    }));
    res.json(roomList);
});

app.get('/api/room/:roomId', (req, res) => {
    const roomId = req.params.roomId;
    if (rooms.has(roomId)) {
        const room = rooms.get(roomId);
        res.json({
            roomId: room.roomId,
            playerCount: room.players.size,
            gameState: room.gameState,
            players: room.getPlayerList(),
            leaderboard: room.getLeaderboard()
        });
    } else {
        res.status(404).json({ error: '房间不存在' });
    }
});

// 启动服务器
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🎮 多人比赛服务器运行在端口 ${PORT}`);
    console.log(`📡 WebSocket 服务器已启动`);
    console.log(`🌐 访问 http://localhost:${PORT} 开始游戏`);
});

module.exports = { app, io, rooms, players }; 