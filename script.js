class MultiplicationGame {
    constructor() {
        this.score = 0;
        this.correctAnswers = 0;
        this.wrongAnswers = 0;
        this.currentQuestion = 0;
        this.totalQuestions = 10;
        this.timeLeft = 60;
        this.timer = null;
        this.isPaused = false;
        this.difficulty = 'beginner'; // 默认新手难度
        this.gameMode = 'single';
        this.selectedCharacter = 'nezha';
        this.playerName = ''; // 不预设默认名字
        this.playerRank = 1;
        this.playerTitle = '坚韧黑铁';
        this.playerRankIcon = 'fas fa-shield-alt';
        this.playerRankColor = '#2c2c2c';
        this.experience = 0;
        this.currentStreak = 0; // 连续答对次数
        this.lives = 3; // 生命值
        this.hintCount = 3; // 提示次数
        this.currentNum1 = 0;
        this.currentNum2 = 0;
        this.currentAnswer = 0;
        this.autoSubmitTimeout = null;
        this.totalScore = 0; // 累积总分
        this.gamesPlayed = 0; // 游戏次数
        
        this.initializeElements();
        this.bindEvents();
        this.loadHighScore();
        this.loadPlayerData(); // 加载玩家数据
        this.initializeCharacterSelection();
        this.initializeNameInput();
        this.calculateRank(); // 初始化段位
    }

    initializeElements() {
        // 获取所有需要的DOM元素
        this.startScreen = document.getElementById('start-screen');
        this.gameScreen = document.getElementById('game-screen');
        this.endScreen = document.getElementById('end-screen');
        
        this.scoreElement = document.getElementById('score');
        this.timerElement = document.getElementById('timer');
        this.progressFill = document.getElementById('progress-fill');
        this.questionCounter = document.getElementById('question-counter');
        
        this.num1Element = document.getElementById('num1');
        this.num2Element = document.getElementById('num2');
        this.operatorElement = document.getElementById('operator');
        this.answerInput = document.getElementById('answer-input');
        this.feedbackElement = document.getElementById('feedback');
        
        // 角色相关元素
        this.playerCharacter = document.getElementById('player-character');
        this.playerNameElement = document.getElementById('player-name');
        
        this.finalScoreElement = document.getElementById('final-score');
        this.correctAnswersElement = document.getElementById('correct-answers');
        this.wrongAnswersElement = document.getElementById('wrong-answers');
        this.highScoreElement = document.getElementById('high-score');
    }

    bindEvents() {
        // 名字输入
        const nameInput = document.getElementById('player-name-input');
        if (nameInput) {
            nameInput.addEventListener('input', (e) => {
                const newName = e.target.value.trim();
                this.validatePlayerName(newName);
            });
            
            nameInput.addEventListener('blur', (e) => {
                const newName = e.target.value.trim();
                this.validatePlayerName(newName);
            });
        }

        // 角色选择
        document.querySelectorAll('.character').forEach(char => {
            char.addEventListener('click', (e) => {
                this.selectCharacter(e.currentTarget.dataset.character);
            });
        });

        // 游戏模式选择
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectGameMode(e.currentTarget.dataset.mode);
            });
        });

        // 难度选择
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectDifficulty(e.currentTarget.dataset.difficulty);
            });
        });

        // 难度选择按钮
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.difficulty = e.target.closest('.difficulty-btn').dataset.difficulty;
                this.startGame();
            });
        });

        // 输入框监听 - 自动提交功能
        this.answerInput.addEventListener('input', (e) => {
            this.handleInputChange(e.target.value);
        });

        this.answerInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.checkAnswer();
            }
        });

        // 跳过和重试按钮
        document.getElementById('skip-btn').addEventListener('click', () => this.skipQuestion());
        document.getElementById('try-again-btn').addEventListener('click', () => this.tryAgain());

        // 游戏控制按钮
        document.getElementById('pause-btn').addEventListener('click', () => this.togglePause());
        document.getElementById('restart-btn').addEventListener('click', () => this.restartGame());

        // 结束界面按钮
        document.getElementById('play-again-btn').addEventListener('click', () => this.playAgain());
        document.getElementById('next-difficulty-btn').addEventListener('click', () => this.nextDifficulty());
        document.getElementById('back-to-menu-btn').addEventListener('click', () => this.backToMenu());

        // 微信扫码
        const qrCode = document.querySelector('.qr-code');
        if (qrCode) {
            qrCode.addEventListener('click', () => this.showQRCode());
        }

        // 提示按钮
        const hintBtn = document.getElementById('hint-btn');
        if (hintBtn) {
            hintBtn.addEventListener('click', () => this.showHint());
        }

        // 排行榜标签页
        const rankingTabs = document.querySelectorAll('.ranking-tab');
        rankingTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchRankingCategory(tab.dataset.category);
            });
        });

        // 添加音频上下文启动
        document.addEventListener('click', () => {
            this.initAudioContext();
            this.initSpeechSynthesis();
        }, { once: true });
    }

    initSpeechSynthesis() {
        try {
            if ('speechSynthesis' in window) {
                // 等待语音列表加载
                speechSynthesis.onvoiceschanged = () => {
                    const voices = speechSynthesis.getVoices();
                    console.log('🎤 可用语音列表:', voices.map(v => v.name));
                };
                
                // 立即获取语音列表
                const voices = speechSynthesis.getVoices();
                console.log('🎤 语音系统已初始化');
            }
        } catch (error) {
            console.error('❌ 语音系统初始化失败:', error);
        }
    }

    initAudioContext() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }
            console.log('音频上下文已启动');
        } catch (error) {
            console.error('音频上下文启动失败:', error);
        }
    }

    switchRankingCategory(category) {
        // 更新标签页状态
        document.querySelectorAll('.ranking-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-category="${category}"]`).classList.add('active');
        
        // 更新排行榜显示
        this.updateRankingList(category);
    }

    updateRankingList(category) {
        const rankingList = document.getElementById('ranking-list');
        
        // 获取当前玩家的信息
        const currentPlayer = {
            name: this.playerName || '玩家',
            character: this.selectedCharacter,
            score: this.score,
            icon: this.getCharacterIcon(this.selectedCharacter)
        };
        
        // 创建排行榜数据，确保当前玩家总是显示
        let data = [];
        
        // 如果有分数，将当前玩家添加到排行榜
        if (this.score > 0) {
            data.push(currentPlayer);
        }
        
        // 添加一些模拟的其他玩家数据
        const otherPlayers = [
            { rank: 1, name: '唐淼', character: 'nezha', score: 95, icon: 'fas fa-fire' },
            { rank: 2, name: '李小明', character: 'aobing', score: 88, icon: 'fas fa-water' },
            { rank: 3, name: '王小红', character: 'taiyi', score: 82, icon: 'fas fa-magic' },
            { rank: 4, name: '张小华', character: 'shengongbao', score: 78, icon: 'fas fa-mask' }
        ];
        
        // 合并数据并按分数排序
        data = [...data, ...otherPlayers];
        data.sort((a, b) => b.score - a.score);
        
        // 重新分配排名
        data.forEach((player, index) => {
            player.rank = index + 1;
        });
        
        // 按角色过滤（如果需要）
        if (category !== 'all') {
            data = data.filter(player => player.character === category);
        }
        
        rankingList.innerHTML = '';
        
        data.forEach((player, index) => {
            const isCurrentPlayer = player.name === this.playerName;
            const rankingItem = document.createElement('div');
            rankingItem.className = `ranking-item${isCurrentPlayer ? ' current-player' : ''}`;
            rankingItem.innerHTML = `
                <span class="rank">${player.rank}</span>
                <i class="${player.icon}"></i>
                <span>${player.name}</span>
                <span class="score">${player.score}分</span>
            `;
            rankingList.appendChild(rankingItem);
        });
    }
    
    getCharacterIcon(character) {
        const characterIcons = {
            'nezha': 'fas fa-fire',
            'aobing': 'fas fa-water',
            'taiyi': 'fas fa-magic',
            'shengongbao': 'fas fa-mask'
        };
        return characterIcons[character] || 'fas fa-user';
    }

    validatePlayerName(name) {
        const validationDiv = document.getElementById('name-validation');
        const messageSpan = validationDiv.querySelector('.validation-message');
        
        // 如果名字为空，不显示错误
        if (!name || name.length === 0) {
            this.hideNameValidation();
            return false;
        }
        
        // 检查名字长度
        if (name.length < 2) {
            this.showNameValidation('请输入至少2个字符的名字', 'error');
            return false;
        }
        
        if (name.length > 10) {
            this.showNameValidation('名字不能超过10个字符', 'error');
            return false;
        }
        
        // 检查是否包含特殊字符
        if (!/^[\u4e00-\u9fa5a-zA-Z0-9]+$/.test(name)) {
            this.showNameValidation('名字只能包含中文、英文和数字', 'error');
            return false;
        }
        
        // 检查是否与现有玩家重复
        const existingPlayers = this.getExistingPlayers();
        if (existingPlayers.includes(name)) {
            this.showNameValidation('这个名字已经被使用了，请选择其他名字', 'error');
            return false;
        }
        
        // 名字有效
        this.playerName = name;
        this.updatePlayerNameDisplay();
        this.hideNameValidation();
        return true;
    }

    showNameValidation(message, type) {
        const validationDiv = document.getElementById('name-validation');
        const messageSpan = validationDiv.querySelector('.validation-message');
        
        messageSpan.textContent = message;
        messageSpan.className = `validation-message ${type}`;
        validationDiv.style.display = 'block';
    }

    hideNameValidation() {
        const validationDiv = document.getElementById('name-validation');
        validationDiv.style.display = 'none';
    }

    getExistingPlayers() {
        // 模拟现有玩家列表，实际应用中应该从服务器获取
        return ['小明', '小红', '小华', '小强', '小丽', '小美', '小芳', '小勇', '小军', '小雅', '小婷'];
    }

    initializeCharacterSelection() {
        // 默认选择第一个角色，但不播放声音
        this.selectCharacter('nezha', false);
        
        // 确保角色选择事件正确绑定
        setTimeout(() => {
            document.querySelectorAll('.character').forEach(char => {
                char.addEventListener('click', (e) => {
                    console.log('角色被点击:', e.currentTarget.dataset.character);
                    this.selectCharacter(e.currentTarget.dataset.character, true);
                });
            });
        }, 100);
    }

    initializeNameInput() {
        // 设置名字输入框
        const nameInput = document.getElementById('player-name-input');
        if (nameInput) {
            nameInput.value = ''; // 清空输入框
            nameInput.placeholder = '请输入你的名字';
            // 更新显示的名字
            this.updatePlayerNameDisplay();
        }
    }

    updatePlayerNameDisplay() {
        const nameDisplay = document.getElementById('player-name');
        if (nameDisplay) {
            nameDisplay.textContent = this.playerName || '玩家';
        }
        
        // 同时更新输入框的值
        const nameInput = document.getElementById('player-name-input');
        if (nameInput) {
            nameInput.value = this.playerName;
        }
        
        // 当玩家姓名改变时，重新加载该玩家的数据
        if (this.playerName) {
            this.loadPlayerData();
            this.loadHighScore();
        }
    }

    async showQRCode() {
        try {
            // 生成房间ID
            const roomId = 'room_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            const playerName = this.playerName || '玩家';
            
            // 调用API生成二维码
            const response = await fetch('/api/qrcode', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    roomId: roomId,
                    playerName: playerName
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                
                // 显示二维码弹窗
                this.showQRCodeModal(data.qrCode, data.roomUrl, roomId);
            } else {
                throw new Error('二维码生成失败');
            }
        } catch (error) {
            console.error('二维码生成错误:', error);
            // 降级到演示模式
            alert('扫描二维码邀请小伙伴一起挑战！\n\n二维码功能需要后端支持，这里只是演示。');
        }
    }

    showQRCodeModal(qrCodeDataUrl, roomUrl, roomId) {
        // 创建二维码弹窗
        const modal = document.createElement('div');
        modal.className = 'qr-modal';
        modal.innerHTML = `
            <div class="qr-modal-content">
                <div class="qr-modal-header">
                    <h3>📱 邀请小伙伴</h3>
                    <button class="qr-close-btn">&times;</button>
                </div>
                <div class="qr-modal-body">
                    <div class="qr-code-container">
                        <img src="${qrCodeDataUrl}" alt="房间二维码" class="qr-code-image">
                    </div>
                    <div class="qr-info">
                        <p><strong>房间号:</strong> ${roomId}</p>
                        <p><strong>玩家:</strong> ${this.playerName || '玩家'}</p>
                        <p><strong>链接:</strong> <a href="${roomUrl}" target="_blank">${roomUrl}</a></p>
                    </div>
                    <div class="qr-instructions">
                        <p>📱 用微信扫描二维码加入游戏</p>
                        <p>🔗 或者点击链接直接加入</p>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 关闭按钮事件
        modal.querySelector('.qr-close-btn').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        // 点击背景关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    calculateRank() {
        // 英雄联盟风格的段位系统
        // 段位升级需要根据难度换算，不是单纯积分多就升级
        const ranks = [
            { rank: 1, title: "坚韧黑铁", icon: "fas fa-shield-alt", color: "#2c2c2c", 
              requirements: { beginner: 50, easy: 100, medium: 150, hard: 200, expert: 250 } },
            { rank: 2, title: "英勇黄铜", icon: "fas fa-medal", color: "#cd7f32", 
              requirements: { beginner: 150, easy: 300, medium: 450, hard: 600, expert: 750 } },
            { rank: 3, title: "不屈白银", icon: "fas fa-star", color: "#c0c0c0", 
              requirements: { beginner: 300, easy: 600, medium: 900, hard: 1200, expert: 1500 } },
            { rank: 4, title: "荣耀黄金", icon: "fas fa-crown", color: "#ffd700", 
              requirements: { beginner: 500, easy: 1000, medium: 1500, hard: 2000, expert: 2500 } },
            { rank: 5, title: "华贵铂金", icon: "fas fa-gem", color: "#e5e4e2", 
              requirements: { beginner: 750, easy: 1500, medium: 2250, hard: 3000, expert: 3750 } },
            { rank: 6, title: "璀璨钻石", icon: "fas fa-diamond", color: "#b9f2ff", 
              requirements: { beginner: 1200, easy: 2400, medium: 3600, hard: 4800, expert: 6000 } },
            { rank: 7, title: "超凡大师", icon: "fas fa-trophy", color: "#ff6b6b", 
              requirements: { beginner: 2000, easy: 4000, medium: 6000, hard: 8000, expert: 10000 } },
            { rank: 8, title: "傲世宗师", icon: "fas fa-crown", color: "#ff4757", 
              requirements: { beginner: 3000, easy: 6000, medium: 9000, hard: 12000, expert: 15000 } },
            { rank: 9, title: "最强王者", icon: "fas fa-fire", color: "#ff3838", 
              requirements: { beginner: 5000, easy: 10000, medium: 15000, hard: 20000, expert: 25000 } }
        ];
        
        // 根据当前难度和累积分数计算段位
        const currentDifficulty = this.difficulty || 'beginner';
        const totalScore = this.totalScore || 0;
        
        for (let i = ranks.length - 1; i >= 0; i--) {
            const rank = ranks[i];
            const requirement = rank.requirements[currentDifficulty];
            
            if (totalScore >= requirement) {
                this.playerRank = rank.rank;
                this.playerTitle = rank.title;
                this.playerRankIcon = rank.icon;
                this.playerRankColor = rank.color;
                return this.playerRank;
            }
        }
        
        this.playerRank = 1;
        this.playerTitle = "坚韧黑铁";
        this.playerRankIcon = "fas fa-shield-alt";
        this.playerRankColor = "#2c2c2c";
        return this.playerRank;
    }

    getPraiseMessage(score, streak) {
        const praises = [
            { condition: score >= 90, message: "🎉 完美！你是数学天才！", sound: "perfect" },
            { condition: score >= 80, message: "🌟 太棒了！你的计算能力超强！", sound: "excellent" },
            { condition: score >= 70, message: "👍 很好！继续保持！", sound: "good" },
            { condition: score >= 60, message: "💪 不错！有进步！", sound: "nice" },
            { condition: score >= 50, message: "👏 加油！你会越来越好的！", sound: "encourage" },
            { condition: score >= 40, message: "🌱 继续努力！", sound: "keep" },
            { condition: score >= 30, message: "💫 慢慢来，别着急！", sound: "steady" },
            { condition: score >= 20, message: "🌈 每次练习都是进步！", sound: "progress" },
            { condition: score >= 10, message: "⭐ 勇敢尝试！", sound: "brave" },
            { condition: true, message: "💖 你很棒！继续加油！", sound: "love" }
        ];
        
        for (let praise of praises) {
            if (praise.condition) {
                return { message: praise.message, sound: praise.sound };
            }
        }
        
        return { message: "💖 你很棒！继续加油！", sound: "love" };
    }

    getStreakMessage(streak) {
        if (streak >= 10) return "🔥 连续答对10题！你是火焰战士！";
        if (streak >= 8) return "⚡ 连续答对8题！闪电般的速度！";
        if (streak >= 6) return "🚀 连续答对6题！火箭般的进步！";
        if (streak >= 4) return "💎 连续答对4题！钻石般的闪耀！";
        if (streak >= 2) return "✨ 连续答对2题！星光般的美丽！";
        return "";
    }

    showComboBubble(streak) {
        if (streak >= 2) {
            const comboBubble = document.getElementById('combo-bubble');
            const comboText = document.getElementById('combo-text');
            
            if (comboBubble && comboText) {
                comboText.textContent = `连续答对 ${streak} 题！`;
                comboBubble.style.display = 'block';
                
                console.log(`🔥 显示连击气泡: ${streak} 连击`);
                
                // 3秒后隐藏
                setTimeout(() => {
                    comboBubble.style.display = 'none';
                }, 3000);
            }
        }
    }

    showHint() {
        if (this.hintCount <= 0) {
            this.showFeedback('💡 提示次数已用完！', 'incorrect');
            return;
        }
        
        this.hintCount--;
        const hints = [
            `${this.currentNum1} + ${this.currentNum1} + ... + ${this.currentNum1}（共${this.currentNum2}个）`,
            `${this.currentNum2} + ${this.currentNum2} + ... + ${this.currentNum2}（共${this.currentNum1}个）`,
            `想想${this.currentNum1}的倍数`,
            `${this.currentNum1} × ${this.currentNum2-1} = ${this.currentNum1*(this.currentNum2-1)}，再加${this.currentNum1}`,
            `可以用${this.currentNum1} × ${this.currentNum2}来计算`
        ];
        
        const randomHint = hints[Math.floor(Math.random() * hints.length)];
        this.showFeedback(`💡 提示：${randomHint}`, 'hint');
    }

    addExperience(exp) {
        const oldRank = this.playerRank;
        this.experience += exp;
        const newRank = this.calculateRank();
        
        if (newRank > oldRank) {
            this.showRankUpAnimation(newRank);
        }
        
        this.updateRankDisplay();
    }

    showRankUpAnimation(rank) {
        // 创建段位提升动画
        const rankUpDiv = document.createElement('div');
        rankUpDiv.className = 'level-up-animation';
        
        const rankTitles = {
            1: "坚韧黑铁", 2: "英勇黄铜", 3: "不屈白银", 4: "荣耀黄金", 5: "华贵铂金",
            6: "璀璨钻石", 7: "超凡大师", 8: "傲世宗师", 9: "最强王者"
        };
        
        const title = rankTitles[rank] || "未知";
        
        rankUpDiv.innerHTML = `
            <div class="level-up-content">
                <div class="level-up-stars">
                    <i class="fas fa-star"></i>
                    <i class="fas fa-star"></i>
                    <i class="fas fa-star"></i>
                </div>
                <h3>🏆 段位提升！</h3>
                <p class="level-title">恭喜成为 ${title}！</p>
                <p class="level-subtitle">段位 ${rank}</p>
                <div class="level-up-effects">
                    <div class="sparkle"></div>
                    <div class="sparkle"></div>
                    <div class="sparkle"></div>
                </div>
            </div>
        `;
        
        document.body.appendChild(rankUpDiv);
        
        // 播放升级音效
        this.playLevelUpSound();
        
        setTimeout(() => {
            document.body.removeChild(rankUpDiv);
        }, 4000);
    }

    playLevelUpSound() {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // 升级音效：上升的音阶
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(1200, audioContext.currentTime + 0.2);
        oscillator.frequency.setValueAtTime(1500, audioContext.currentTime + 0.3);
        oscillator.frequency.setValueAtTime(1800, audioContext.currentTime + 0.4);
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    }

    updateRankDisplay() {
        const rankBadge = document.getElementById('level-badge');
        const rankDisplay = document.getElementById('player-level-display');
        
        if (rankBadge) {
            rankBadge.innerHTML = `<i class="${this.playerRankIcon}"></i> ${this.playerTitle}`;
            rankBadge.title = `${this.playerTitle}`;
            rankBadge.style.color = this.playerRankColor;
        }
        
        if (rankDisplay) {
            rankDisplay.innerHTML = `<i class="${this.playerRankIcon}"></i> ${this.playerTitle}`;
            rankDisplay.style.color = this.playerRankColor;
        }
    }

    updateLivesDisplay() {
        const livesContainer = document.getElementById('player-lives');
        if (livesContainer) {
            const hearts = livesContainer.querySelectorAll('i');
            hearts.forEach((heart, index) => {
                if (index < this.lives) {
                    heart.classList.remove('lost');
                } else {
                    heart.classList.add('lost');
                }
            });
        }
    }

    selectCharacter(character, playSound = true) {
        this.selectedCharacter = character;
        
        // 移除所有选中状态
        document.querySelectorAll('.character').forEach(char => {
            char.classList.remove('selected');
        });
        
        // 添加选中状态
        const selectedElement = document.querySelector(`[data-character="${character}"]`);
        if (selectedElement) {
            selectedElement.classList.add('selected');
            console.log('选中角色:', character);
        }
        
        // 更新角色图标
        const characterIcons = {
            'wizard': 'fas fa-magic',
            'unicorn': 'fas fa-star',
            'dragon': 'fas fa-fire',
            'butterfly': 'fas fa-butterfly'
        };
        
        const characterNames = {
            'wizard': '魔法师',
            'unicorn': '独角兽',
            'dragon': '小龙',
            'butterfly': '蝴蝶仙子'
        };
        
        if (this.playerCharacter) {
            this.playerCharacter.className = characterIcons[character];
        }
        
        // 只有在用户点击时才播放角色宣言
        if (playSound) {
            this.playCharacterDeclaration(character);
        }
    }

    playCharacterDeclaration(character) {
        const declarations = {
            'nezha': {
                text: "🔥 哪吒：乾坤圈在手，数学题我有！",
                sound: "nezha"
            },
            'aobing': {
                text: "💧 敖丙：龙族血脉，智慧如海！",
                sound: "aobing"
            },
            'taiyi': {
                text: "✨ 太乙真人：仙法无边，数学通天！",
                sound: "taiyi"
            },
            'shengongbao': {
                text: "🎭 申公豹：变化万千，答案立现！",
                sound: "shengongbao"
            }
        };
        
        const declaration = declarations[character];
        if (declaration) {
            // 延迟一点显示宣言，让语音先开始
            setTimeout(() => {
                this.showCharacterDeclaration(declaration.text);
            }, 500);
            
            // 先播放语音
            this.playCharacterSound(declaration.sound);
        }
    }

    showCharacterDeclaration(text) {
        // 创建角色宣言显示
        const declarationDiv = document.createElement('div');
        declarationDiv.className = 'character-declaration';
        declarationDiv.innerHTML = `
            <div class="declaration-content">
                <p>${text}</p>
            </div>
        `;
        
        document.body.appendChild(declarationDiv);
        
        // 根据文本长度调整显示时间
        const displayTime = Math.max(3000, text.length * 100);
        
        setTimeout(() => {
            if (document.body.contains(declarationDiv)) {
                document.body.removeChild(declarationDiv);
            }
        }, displayTime);
    }

    playCharacterSound(soundType) {
        try {
            // 使用语音合成API让角色"说话"
            if ('speechSynthesis' in window) {
                const messages = {
                    'nezha': {
                        text: "乾坤圈在手，数学题我有！",
                        voice: 'zh-CN-YunxiNeural' // 男声
                    },
                    'aobing': {
                        text: "龙族血脉，智慧如海！",
                        voice: 'zh-CN-YunxiNeural' // 男声
                    },
                    'taiyi': {
                        text: "仙法无边，数学通天！",
                        voice: 'zh-CN-XiaoxiaoNeural' // 女声
                    },
                    'shengongbao': {
                        text: "变化万千，答案立现！",
                        voice: 'zh-CN-YunxiNeural' // 男声
                    }
                };
                
                const message = messages[soundType];
                if (message) {
                    // 停止之前的语音
                    speechSynthesis.cancel();
                    
                    const utterance = new SpeechSynthesisUtterance(message.text);
                    utterance.lang = 'zh-CN';
                    utterance.rate = 0.9; // 稍微慢一点
                    utterance.pitch = 1.1; // 稍微高一点
                    utterance.volume = 0.8;
                    
                    // 尝试设置语音
                    const voices = speechSynthesis.getVoices();
                    const preferredVoice = voices.find(voice => 
                        voice.name.includes('Xiaoxiao') || 
                        voice.name.includes('Xiaoyi') || 
                        voice.name.includes('Yunxi')
                    );
                    
                    if (preferredVoice) {
                        utterance.voice = preferredVoice;
                    }
                    
                    utterance.onstart = () => {
                        console.log(`🎤 ${soundType}角色开始说话`);
                    };
                    
                    utterance.onend = () => {
                        console.log(`✅ ${soundType}角色说话完成`);
                    };
                    
                    utterance.onerror = (event) => {
                        console.error(`❌ 语音播放失败:`, event.error);
                        // 如果语音失败，播放备用音效
                        this.playBackupSound(soundType);
                    };
                    
                    speechSynthesis.speak(utterance);
                }
            } else {
                // 如果不支持语音合成，播放备用音效
                this.playBackupSound(soundType);
            }
        } catch (error) {
            console.error('❌ 语音播放失败:', error);
            // 播放备用音效
            this.playBackupSound(soundType);
        }
    }
    
    playBackupSound(soundType) {
        try {
            // 使用全局音频上下文或创建新的
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                console.log('创建音频上下文');
            }
            
            // 确保音频上下文已启动
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
                console.log('恢复音频上下文');
            }
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            const now = this.audioContext.currentTime;
            
            switch(soundType) {
                case 'nezha':
                    // 哪吒音效：火焰声
                    oscillator.frequency.setValueAtTime(400, now);
                    oscillator.frequency.setValueAtTime(600, now + 0.1);
                    oscillator.frequency.setValueAtTime(800, now + 0.2);
                    break;
                case 'aobing':
                    // 敖丙音效：水声
                    oscillator.frequency.setValueAtTime(300, now);
                    oscillator.frequency.setValueAtTime(500, now + 0.1);
                    oscillator.frequency.setValueAtTime(700, now + 0.2);
                    break;
                case 'taiyi':
                    // 太乙真人音效：仙法声
                    oscillator.frequency.setValueAtTime(600, now);
                    oscillator.frequency.setValueAtTime(800, now + 0.1);
                    oscillator.frequency.setValueAtTime(1000, now + 0.2);
                    break;
                case 'shengongbao':
                    // 申公豹音效：变化声
                    oscillator.frequency.setValueAtTime(200, now);
                    oscillator.frequency.setValueAtTime(400, now + 0.1);
                    oscillator.frequency.setValueAtTime(600, now + 0.2);
                    break;
            }
            
            gainNode.gain.setValueAtTime(0.1, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
            
            oscillator.start(now);
            oscillator.stop(now + 0.5);
            
            console.log(`🔊 播放${soundType}备用音效`);
        } catch (error) {
            console.error('❌ 备用音效播放失败:', error);
        }
    }

    selectGameMode(mode) {
        this.gameMode = mode;
        
        // 总是显示难度选择
        document.getElementById('difficulty-section').style.display = 'block';
        
        if (mode === 'single') {
            document.getElementById('online-players').style.display = 'none';
        } else {
            document.getElementById('online-players').style.display = 'block';
        }
        
        // 默认选择新手难度
        this.selectDifficulty('beginner');
    }

    selectDifficulty(difficulty) {
        this.difficulty = difficulty;
        
        // 更新按钮状态
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const selectedBtn = document.querySelector(`[data-difficulty="${difficulty}"]`);
        if (selectedBtn) {
            selectedBtn.classList.add('active');
        }
        
        console.log(`🎯 选择难度: ${difficulty}`);
    }

    startGame() {
        this.resetGame();
        this.showScreen(this.gameScreen);
        this.generateQuestion();
        this.startTimer();
        this.answerInput.focus();
        
        // 更新游戏界面显示
        this.updateGameDisplay();
    }

    resetGame() {
        this.score = 0;
        this.correctAnswers = 0;
        this.wrongAnswers = 0;
        this.currentQuestion = 0;
        this.timeLeft = 60;
        this.isPaused = false;
        this.experience = 0;
        this.currentStreak = 0;
        this.lives = 3; // 重置生命值
        this.hintCount = 3; // 重置提示次数
        this.updateUI();
    }

    generateQuestion() {
        let num1, num2, operator;
        
        switch (this.difficulty) {
            case 'beginner':
                // 乘法口诀基础 (1-5)
                num1 = Math.floor(Math.random() * 5) + 1;
                num2 = Math.floor(Math.random() * 5) + 1;
                operator = '×';
                break;
            case 'easy':
                // 乘法口诀进阶 (1-9)
                num1 = Math.floor(Math.random() * 9) + 1;
                num2 = Math.floor(Math.random() * 9) + 1;
                operator = '×';
                break;
            case 'medium':
                // 乘法口诀熟练 (1-9，包含较大数)
                num1 = Math.floor(Math.random() * 9) + 1;
                num2 = Math.floor(Math.random() * 9) + 1;
                // 偶尔出现两位数乘一位数
                if (Math.random() < 0.3) {
                    num1 = Math.floor(Math.random() * 90) + 10; // 10-99
                    num2 = Math.floor(Math.random() * 9) + 1; // 1-9
                }
                operator = '×';
                break;
            case 'hard':
                // 乘法进阶 (两位数乘一位数，简单两位数乘两位数)
                if (Math.random() < 0.7) {
                    // 两位数乘一位数
                    num1 = Math.floor(Math.random() * 90) + 10; // 10-99
                    num2 = Math.floor(Math.random() * 9) + 1; // 1-9
                } else {
                    // 简单两位数乘两位数 (11-19 或 20, 25, 30, 40, 50)
                    const easyNumbers = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 25, 30, 40, 50];
                    num1 = easyNumbers[Math.floor(Math.random() * easyNumbers.length)];
                    num2 = Math.floor(Math.random() * 9) + 1; // 1-9
                }
                operator = '×';
                break;
            case 'expert':
                // 乘法高级 (两位数乘两位数，但控制在合理范围内)
                if (Math.random() < 0.6) {
                    // 简单两位数乘两位数
                    const easyNumbers = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 25, 30, 40, 50];
                    num1 = easyNumbers[Math.floor(Math.random() * easyNumbers.length)];
                    num2 = easyNumbers[Math.floor(Math.random() * easyNumbers.length)];
                } else {
                    // 稍复杂的两位数乘两位数 (但不超过25×25)
                    num1 = Math.floor(Math.random() * 15) + 10; // 10-24
                    num2 = Math.floor(Math.random() * 15) + 10; // 10-24
                }
                operator = '×';
                break;
            default:
                num1 = Math.floor(Math.random() * 9) + 1;
                num2 = Math.floor(Math.random() * 9) + 1;
                operator = '×';
        }

        this.currentNum1 = num1;
        this.currentNum2 = num2;
        this.currentOperator = operator;
        this.currentAnswer = num1 * num2;

        this.num1Element.textContent = this.currentNum1;
        this.num2Element.textContent = this.currentNum2;
        this.operatorElement.textContent = this.currentOperator;
        this.answerInput.value = '';
        this.feedbackElement.textContent = '';
        this.feedbackElement.className = 'feedback';
        this.hideActionButtons();
    }

    handleInputChange(value) {
        const numValue = parseInt(value);
        
        if (!isNaN(numValue)) {
            // 清除之前的自动提交定时器
            if (this.autoSubmitTimeout) {
                clearTimeout(this.autoSubmitTimeout);
            }
            
            // 如果答案正确，延迟自动提交
            if (numValue === this.currentAnswer) {
                this.autoSubmitTimeout = setTimeout(() => {
                    this.checkAnswer();
                }, 500); // 500ms延迟，给用户时间看到答案
            }
        }
    }

    checkAnswer() {
        const userAnswer = parseInt(this.answerInput.value);
        
        if (isNaN(userAnswer)) {
            this.showFeedback('请输入一个有效的数字！', 'incorrect');
            this.showActionButtons();
            return;
        }

        if (userAnswer === this.currentAnswer) {
            this.score += 10;
            this.correctAnswers++;
            this.currentStreak++; // 增加连续答对次数
            
            // 计算经验值奖励（连续答对有额外奖励）
            let expReward = 20;
            if (this.currentStreak >= 3) expReward += 10; // 连续3题额外+10
            if (this.currentStreak >= 5) expReward += 15; // 连续5题额外+15
            if (this.currentStreak >= 8) expReward += 20; // 连续8题额外+20
            
            this.addExperience(expReward);
            
            // 获取称赞语
            const praise = this.getPraiseMessage(this.score, this.currentStreak);
            const streakMessage = this.getStreakMessage(this.currentStreak);
            
            let feedbackMessage = `🎉 答对了！+10分 +${expReward}经验`;
            if (streakMessage) {
                feedbackMessage += `\n${streakMessage}`;
            }
            
            this.showFeedback(feedbackMessage, 'correct');
            this.playCorrectSound();
            this.hideActionButtons();
            
            // 显示连击气泡
            this.showComboBubble(this.currentStreak);
            
            // 添加攻击动画
            const playerAvatar = document.getElementById('player-character');
            if (playerAvatar) {
                playerAvatar.parentElement.classList.add('attack-anim');
                setTimeout(() => {
                    playerAvatar.parentElement.classList.remove('attack-anim');
                }, 500);
            }
            
            this.currentQuestion++;
            this.updateUI();

            if (this.currentQuestion >= this.totalQuestions) {
                this.endGame();
            } else {
                setTimeout(() => {
                    this.generateQuestion();
                }, 800); // 减少等待时间到800毫秒
            }
        } else {
            this.score = Math.max(0, this.score - 5);
            this.wrongAnswers++;
            this.currentStreak = 0; // 重置连续答对次数
            this.lives = Math.max(0, this.lives - 1); // 减少生命值
            this.addExperience(5); // 答错也获得5经验值鼓励
            
            const praise = this.getPraiseMessage(this.score, this.currentStreak);
            this.showFeedback(`❌ 答错了！正确答案是 ${this.currentAnswer}，-5分 +5经验\n💪 没关系，继续加油！`, 'incorrect');
            this.playIncorrectSound();
            this.showActionButtons();
            
            // 更新生命值显示
            this.updateLivesDisplay();
            
            // 检查游戏是否结束
            if (this.lives <= 0) {
                setTimeout(() => {
                    this.endGame();
                }, 2000);
            }
        }
    }

    skipQuestion() {
        this.wrongAnswers++;
        this.showFeedback(`⏭️ 跳过了！正确答案是 ${this.currentAnswer}`, 'incorrect');
        this.hideActionButtons();
        
        this.currentQuestion++;
        this.updateUI();

        if (this.currentQuestion >= this.totalQuestions) {
            this.endGame();
        } else {
            setTimeout(() => {
                this.generateQuestion();
            }, 1500);
        }
    }

    tryAgain() {
        this.answerInput.value = '';
        this.answerInput.focus();
        this.hideActionButtons();
        this.showFeedback('💪 再试一次吧！', '');
    }

    showActionButtons() {
        const actionButtons = document.getElementById('action-buttons');
        if (actionButtons) {
            actionButtons.style.display = 'flex';
        }
    }

    hideActionButtons() {
        const actionButtons = document.getElementById('action-buttons');
        if (actionButtons) {
            actionButtons.style.display = 'none';
        }
    }

    playCorrectSound() {
        // 创建音效（使用Web Audio API）
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(1200, audioContext.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    }

    playIncorrectSound() {
        // 创建错误音效
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(300, audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
    }

    showFeedback(message, type) {
        this.feedbackElement.textContent = message;
        this.feedbackElement.className = `feedback ${type}`;
    }

    startTimer() {
        this.timer = setInterval(() => {
            if (!this.isPaused) {
                this.timeLeft--;
                this.timerElement.textContent = this.timeLeft;
                
                if (this.timeLeft <= 0) {
                    this.endGame();
                }
            }
        }, 1000);
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        const pauseBtn = document.getElementById('pause-btn');
        pauseBtn.textContent = this.isPaused ? '继续' : '暂停';
        
        if (this.isPaused) {
            this.showFeedback('游戏已暂停', '');
        } else {
            this.showFeedback('', '');
        }
    }

    restartGame() {
        if (confirm('确定要重新开始游戏吗？')) {
            this.endGame();
            this.startGame();
        }
    }

    endGame() {
        clearInterval(this.timer);
        
        // 累积总分
        this.totalScore += this.score;
        this.gamesPlayed++;
        
        // 重新计算段位（基于累积分数和当前难度）
        const oldRank = this.playerRank;
        this.calculateRank();
        
        // 如果段位提升，显示动画
        if (this.playerRank > oldRank) {
            this.showRankUpAnimation(this.playerRank);
        }
        
        // 保存数据
        this.saveHighScore();
        this.savePlayerData();
        
        this.showEndScreen();
    }

    updateGameDisplay() {
        // 更新角色显示
        const characterIcons = {
            'nezha': 'fas fa-fire',
            'aobing': 'fas fa-water',
            'taiyi': 'fas fa-magic',
            'shengongbao': 'fas fa-mask'
        };
        
        if (this.playerCharacter) {
            this.playerCharacter.className = characterIcons[this.selectedCharacter];
        }
        
        // 更新名字显示
        this.updatePlayerNameDisplay();
        
        // 更新段位显示
        this.updateRankDisplay();
        
        // 更新在线竞争者分数（模拟实时更新）
        if (this.gameMode === 'multi') {
            this.updateCompetitorsScores();
        }
    }

    updateCompetitorsScores() {
        const competitors = document.querySelectorAll('.competitor-score');
        competitors.forEach((score, index) => {
            const currentScore = parseInt(score.textContent);
            const newScore = Math.max(0, currentScore + Math.floor(Math.random() * 20) - 10);
            score.textContent = newScore + '分';
        });
    }

    showEndScreen() {
        this.finalScoreElement.textContent = this.score;
        
        // 更新累积分数显示
        const totalScoreElement = document.getElementById('total-score');
        if (totalScoreElement) {
            totalScoreElement.textContent = this.totalScore;
        }
        
        // 更新游戏次数显示
        const gamesPlayedElement = document.getElementById('games-played');
        if (gamesPlayedElement) {
            gamesPlayedElement.textContent = this.gamesPlayed;
        }
        
        this.correctAnswersElement.textContent = this.correctAnswers;
        this.wrongAnswersElement.textContent = this.wrongAnswers;
        this.highScoreElement.textContent = this.getHighScore();
        
        // 更新结束界面的角色信息
        const characterIcons = {
            'nezha': 'fas fa-fire',
            'aobing': 'fas fa-water',
            'taiyi': 'fas fa-magic',
            'shengongbao': 'fas fa-mask'
        };
        
        const characterNames = {
            'nezha': '哪吒',
            'aobing': '敖丙',
            'taiyi': '太乙真人',
            'shengongbao': '申公豹'
        };
        
        if (document.getElementById('final-player-character')) {
            document.getElementById('final-player-character').className = characterIcons[this.selectedCharacter];
        }
        
        if (document.getElementById('final-player-name')) {
            document.getElementById('final-player-name').textContent = this.playerName || '玩家';
        }
        
        if (document.getElementById('final-player-score')) {
            document.getElementById('final-player-score').textContent = this.score + '分';
        }
        
        // 设置成就消息
        this.setAchievementMessage();
        
        // 更新排行榜显示当前玩家
        this.updateRankingList('all');
        
        this.showScreen(this.endScreen);
    }

    setAchievementMessage() {
        const achievementElement = document.getElementById('achievement-message');
        const praise = this.getPraiseMessage(this.score, this.currentStreak);
        
        if (achievementElement) {
            achievementElement.textContent = praise.message;
        }
    }

    playAgain() {
        this.startGame();
    }

    nextDifficulty() {
        // 获取下一个难度
        const difficulties = ['beginner', 'easy', 'medium', 'hard', 'expert'];
        const currentIndex = difficulties.indexOf(this.difficulty);
        const nextIndex = Math.min(currentIndex + 1, difficulties.length - 1);
        const nextDifficulty = difficulties[nextIndex];
        
        // 如果已经是最高难度，提示用户
        if (nextIndex === currentIndex) {
            alert('🎉 恭喜！你已经达到最高难度了！');
            return;
        }
        
        // 更新难度
        this.difficulty = nextDifficulty;
        
        // 保存玩家数据
        this.savePlayerData();
        
        // 显示难度升级提示
        const difficultyNames = {
            'beginner': '乘法口诀基础',
            'easy': '乘法口诀进阶', 
            'medium': '乘法口诀熟练',
            'hard': '乘法进阶',
            'expert': '乘法高级'
        };
        
        alert(`🚀 难度升级！\n\n从 ${difficultyNames[difficulties[currentIndex]]} 升级到 ${difficultyNames[nextDifficulty]}！\n\n准备迎接新的挑战吧！`);
        
        // 重新开始游戏
        this.startGame();
    }

    backToMenu() {
        this.showScreen(this.startScreen);
    }

    showScreen(screen) {
        // 隐藏所有屏幕
        this.startScreen.classList.remove('active');
        this.gameScreen.classList.remove('active');
        this.endScreen.classList.remove('active');
        
        // 显示指定屏幕
        screen.classList.add('active');
    }

    updateUI() {
        this.scoreElement.textContent = this.score;
        this.questionCounter.textContent = `${this.currentQuestion}/${this.totalQuestions}`;
        
        const progressPercent = (this.currentQuestion / this.totalQuestions) * 100;
        this.progressFill.style.width = `${progressPercent}%`;
        
        this.updateRankDisplay();
        this.updateLivesDisplay();
        this.updateHintCount();
    }

    updateHintCount() {
        const hintCountElement = document.getElementById('hint-count');
        const hintBtn = document.getElementById('hint-btn');
        
        if (hintCountElement) {
            hintCountElement.textContent = this.hintCount;
        }
        
        if (hintBtn) {
            hintBtn.disabled = this.hintCount <= 0;
        }
    }

    loadHighScore() {
        if (!this.playerName) {
            this.highScore = 0;
            return;
        }
        
        const playerKey = `highScore_${this.playerName}`;
        this.highScore = localStorage.getItem(playerKey) || 0;
    }

    saveHighScore() {
        if (!this.playerName) return;
        
        const playerKey = `highScore_${this.playerName}`;
        const currentHighScore = localStorage.getItem(playerKey) || 0;
        
        if (this.score > currentHighScore) {
            this.highScore = this.score;
            localStorage.setItem(playerKey, this.highScore);
        }
    }

    getHighScore() {
        if (!this.playerName) return 0;
        
        const playerKey = `highScore_${this.playerName}`;
        return localStorage.getItem(playerKey) || 0;
    }

    savePlayerData() {
        if (!this.playerName) return;
        
        const playerData = {
            totalScore: this.totalScore,
            gamesPlayed: this.gamesPlayed,
            experience: this.experience,
            playerRank: this.playerRank,
            playerTitle: this.playerTitle,
            playerRankIcon: this.playerRankIcon,
            playerRankColor: this.playerRankColor,
            difficulty: this.difficulty
        };
        localStorage.setItem(`playerData_${this.playerName}`, JSON.stringify(playerData));
    }

    loadPlayerData() {
        if (!this.playerName) return;
        
        const savedData = localStorage.getItem(`playerData_${this.playerName}`);
        if (savedData) {
            const playerData = JSON.parse(savedData);
            this.totalScore = playerData.totalScore || 0;
            this.gamesPlayed = playerData.gamesPlayed || 0;
            this.experience = playerData.experience || 0;
            this.playerRank = playerData.playerRank || 1;
            this.playerTitle = playerData.playerTitle || '坚韧黑铁';
            this.playerRankIcon = playerData.playerRankIcon || 'fas fa-shield-alt';
            this.playerRankColor = playerData.playerRankColor || '#2c2c2c';
            this.difficulty = playerData.difficulty || 'beginner';
            
            // 重新计算段位
            this.calculateRank();
        } else {
            // 新玩家，重置数据
            this.totalScore = 0;
            this.gamesPlayed = 0;
            this.experience = 0;
            this.playerRank = 1;
            this.playerTitle = '坚韧黑铁';
            this.playerRankIcon = 'fas fa-shield-alt';
            this.playerRankColor = '#2c2c2c';
            this.difficulty = 'beginner';
        }
    }
}

// 当页面加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    new MultiplicationGame();
}); 