# 🎮 多人比赛服务器

这是魔法乘法王国的多人比赛服务器，支持实时多人PK功能。

## 🚀 快速启动

### 1. 安装依赖
```bash
cd server
npm install
```

### 2. 启动服务器
```bash
# 开发模式（自动重启）
npm run dev

# 生产模式
npm start
```

### 3. 访问游戏
打开浏览器访问：`http://localhost:3000`

## 📡 功能特性

### 实时通信
- **WebSocket 连接**：实时双向通信
- **房间管理**：支持多个游戏房间
- **玩家同步**：实时同步玩家状态

### 游戏功能
- **多人PK**：2-4人同时比赛
- **实时排行榜**：动态更新排名
- **生命值系统**：3条生命，答错扣血
- **等级系统**：经验值升级机制
- **自动匹配**：智能分配房间

### API 接口
- `GET /api/rooms` - 获取房间列表
- `GET /api/room/:roomId` - 获取房间详情

## 🔧 技术栈

- **Node.js** - 服务器运行环境
- **Express** - Web框架
- **Socket.IO** - 实时通信
- **CORS** - 跨域支持

## 📁 文件结构

```
server/
├── server.js          # 主服务器文件
├── package.json       # 依赖配置
└── README.md         # 说明文档
```

## 🎯 游戏流程

1. **创建房间**：玩家输入房间号
2. **加入房间**：其他玩家加入同一房间
3. **准备阶段**：所有玩家点击准备
4. **开始比赛**：同时开始答题
5. **实时PK**：实时显示排名和分数
6. **游戏结束**：显示最终排名

## 🔌 WebSocket 事件

### 客户端 → 服务器
- `joinRoom` - 加入房间
- `playerReady` - 玩家准备
- `submitAnswer` - 提交答案

### 服务器 → 客户端
- `playerJoined` - 玩家加入
- `playerLeft` - 玩家离开
- `gameStart` - 游戏开始
- `newQuestion` - 新题目
- `answerResult` - 答题结果
- `playerGameOver` - 玩家游戏结束

## 🌐 部署说明

### 本地开发
```bash
npm run dev
```

### 生产部署
```bash
npm start
```

### 环境变量
- `PORT` - 服务器端口（默认3000）

## 🔍 调试

### 查看连接状态
```bash
# 查看服务器日志
tail -f logs/server.log
```

### 测试连接
```bash
# 使用 curl 测试 API
curl http://localhost:3000/api/rooms
```

## 📞 技术支持

如有问题，请检查：
1. Node.js 版本 >= 14.0.0
2. 端口 3000 是否被占用
3. 防火墙设置
4. 网络连接状态

---

🎮 享受多人PK的乐趣吧！ 