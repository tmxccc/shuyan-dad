# 🚀 Vercel部署详细指南

## 📋 准备工作

### 1. 注册Vercel账号
- 访问 https://vercel.com
- 点击 "Sign Up"
- 选择 "Continue with GitHub" 使用GitHub账号登录

### 2. 准备GitHub仓库
确保你的项目已经推送到GitHub：
```bash
# 如果还没有GitHub仓库
git init
git add .
git commit -m "Initial commit: 舒彦爸爸爸的教室"
git branch -M main
git remote add origin https://github.com/你的用户名/shuyan-dad-classroom.git
git push -u origin main
```

## 🎯 部署步骤

### 步骤1：导入项目
1. 登录Vercel后，点击 "New Project"
2. 在 "Import Git Repository" 部分找到你的仓库
3. 点击 "Import" 按钮

### 步骤2：配置项目
在配置页面中：

**Framework Preset**: 选择 "Other"
**Root Directory**: 留空（使用根目录）
**Build Command**: 留空（静态文件无需构建）
**Output Directory**: 留空（使用默认）

### 步骤3：环境变量（可选）
如果需要后端服务，可以添加环境变量：
- `NODE_ENV`: `production`
- `PORT`: `3000`

### 步骤4：部署
1. 点击 "Deploy" 按钮
2. 等待部署完成（通常1-2分钟）

## 🔧 自定义域名（可选）

### 添加自定义域名
1. 在项目仪表板中点击 "Settings"
2. 选择 "Domains"
3. 点击 "Add Domain"
4. 输入你的域名（如：math.yourdomain.com）
5. 按照提示配置DNS

### DNS配置示例
```
Type: CNAME
Name: math
Value: cname.vercel-dns.com
```

## 📱 访问地址

部署完成后，你的游戏将在以下地址可用：
- **Vercel域名**: `https://shuyan-dad-classroom.vercel.app`
- **自定义域名**: `https://math.yourdomain.com`（如果配置了）

## 🔄 自动部署

### 每次推送代码自动部署
1. Vercel会自动监听你的GitHub仓库
2. 每次推送到 `main` 分支都会触发自动部署
3. 可以在Vercel仪表板查看部署历史

### 手动触发部署
1. 在Vercel仪表板中点击项目
2. 点击 "Deployments" 标签
3. 点击 "Redeploy" 按钮

## 🛠️ 故障排除

### 常见问题

**1. 部署失败**
- 检查GitHub仓库是否正确连接
- 确认所有文件都已提交
- 查看Vercel部署日志

**2. 页面显示404**
- 确保 `index.html` 在根目录
- 检查文件路径是否正确

**3. 静态资源加载失败**
- 确认所有CSS和JS文件路径正确
- 检查CDN链接是否可用

### 调试技巧
1. 在Vercel仪表板查看 "Functions" 日志
2. 使用浏览器开发者工具检查网络请求
3. 确认所有依赖都已正确安装

## 📊 性能优化

### 启用CDN
Vercel自动提供全球CDN，确保访问速度

### 图片优化
- 使用WebP格式
- 压缩图片大小
- 使用懒加载

### 代码优化
- 压缩CSS和JS文件
- 使用浏览器缓存
- 启用Gzip压缩

## 🔒 安全设置

### HTTPS强制
Vercel自动提供SSL证书

### 安全头设置
可以在 `vercel.json` 中配置：
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        }
      ]
    }
  ]
}
```

## 📈 监控和分析

### 访问统计
- 在Vercel仪表板查看访问量
- 分析用户地理分布
- 监控页面加载速度

### 错误监控
- 查看部署日志
- 监控API错误
- 设置错误通知

## 🎉 部署完成

恭喜！你的游戏现在已经成功部署到Vercel。

### 下一步
1. 测试所有功能是否正常
2. 分享链接给朋友测试
3. 收集用户反馈
4. 持续优化和改进

### 维护建议
- 定期更新依赖包
- 监控性能指标
- 备份重要数据
- 及时修复问题 