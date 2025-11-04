#!/bin/bash
# 修复生产环境 Prisma Client 问题的脚本

echo "🔧 修复 Prisma Client 问题..."

# 1. 进入项目目录
cd /www/wwwroot/deepseek-c || exit 1

# 2. 生成 Prisma Client
echo "📦 生成 Prisma Client..."
docker exec deepseek-c npx prisma generate

# 3. 运行数据库迁移
echo "🗄️ 运行数据库迁移..."
docker exec deepseek-c npx prisma migrate deploy

# 4. 重启容器
echo "🔄 重启容器..."
docker restart deepseek-c

# 5. 等待容器启动
echo "⏳ 等待容器启动..."
sleep 5

# 6. 检查容器状态
echo "✅ 检查容器状态..."
docker ps | grep deepseek-c

# 7. 显示日志
echo "📋 最近日志:"
docker logs --tail 50 deepseek-c

echo ""
echo "✨ 修复完成!请访问你的网站检查是否正常运行。"
echo "💡 如果问题仍然存在,请查看完整日志: docker logs -f deepseek-c"
