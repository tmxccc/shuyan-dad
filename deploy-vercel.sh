#!/bin/bash

echo "🚀 开始部署舒彦爸爸爸的教室到Vercel..."

# 检查是否安装了Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "📦 安装Vercel CLI..."
    npm install -g vercel
fi

# 检查Git状态
if [ -n "$(git status --porcelain)" ]; then
    echo "📝 提交更改..."
    git add .
    git commit -m "Deploy update: $(date)"
    git push origin main
fi

# 部署到Vercel
echo "🌐 部署到Vercel..."
vercel --prod

echo "✅ 部署完成！"
echo "📱 访问地址: https://shuyan-dad-classroom.vercel.app" 