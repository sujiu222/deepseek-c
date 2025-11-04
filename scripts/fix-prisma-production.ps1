# PowerShell 脚本 - 修复生产环境 Prisma Client 问题

Write-Host "🔧 修复 Prisma Client 问题..." -ForegroundColor Cyan

# 1. 检查 Docker 是否运行
Write-Host "📋 检查 Docker 状态..." -ForegroundColor Yellow
docker ps | Select-String "deepseek-c"

# 2. 生成 Prisma Client
Write-Host "📦 生成 Prisma Client..." -ForegroundColor Yellow
docker exec deepseek-c npx prisma generate

# 3. 运行数据库迁移
Write-Host "🗄️ 运行数据库迁移..." -ForegroundColor Yellow
docker exec deepseek-c npx prisma migrate deploy

# 4. 重启容器
Write-Host "🔄 重启容器..." -ForegroundColor Yellow
docker restart deepseek-c

# 5. 等待容器启动
Write-Host "⏳ 等待容器启动..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# 6. 检查容器状态
Write-Host "✅ 检查容器状态..." -ForegroundColor Green
docker ps | Select-String "deepseek-c"

# 7. 显示日志
Write-Host "📋 最近日志:" -ForegroundColor Yellow
docker logs --tail 50 deepseek-c

Write-Host ""
Write-Host "✨ 修复完成!请访问你的网站检查是否正常运行。" -ForegroundColor Green
Write-Host "💡 如果问题仍然存在,请查看完整日志: docker logs -f deepseek-c" -ForegroundColor Cyan
