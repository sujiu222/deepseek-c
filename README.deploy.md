# DeepSeek-C 部署指南

## 服务器部署步骤

### 1. 准备工作

在宝塔面板中安装：

- Docker
- PostgreSQL 15+

### 2. 配置数据库

```sql
-- 在宝塔 PostgreSQL 管理中执行
CREATE DATABASE "deepseek-c";
CREATE USER deepseek_user WITH PASSWORD 'your_strong_password';
GRANT ALL PRIVILEGES ON DATABASE "deepseek-c" TO deepseek_user;
```

### 3. 部署应用

```bash
# 1. 克隆代码
cd /www/wwwroot
git clone https://github.com/sujiu222/deepseek-c.git
cd deepseek-c

# 2. 创建生产环境变量
cp .env.example .env.production
nano .env.production
```

编辑 `.env.production`：

```bash
# DeepSeek API 配置
DEEPSEEK_RPC_URL=https://api.chatanywhere.tech
DEEPSEEK_API_KEY=your_production_api_key

# 数据库配置 - Docker 容器访问宿主机使用 host.docker.internal
DATABASE_URL=postgresql://deepseek_user:your_strong_password@host.docker.internal:5432/deepseek-c

# 认证配置
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=$(openssl rand -base64 32)

NODE_ENV=production
```

```bash
# 3. 构建并启动
docker-compose up -d --build

# 4. 进入容器并运行数据库迁移和 Prisma 生成
docker exec -it deepseek-c sh -c "npx prisma generate && npx prisma migrate deploy"

# 5. 查看日志
docker logs -f deepseek-c
```

### 4. 配置 Nginx 反向代理

在宝塔面板中：

1. 网站 → 添加站点 → your-domain.com
2. 设置 → 反向代理 → 添加反向代理

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_cache_bypass $http_upgrade;
}
```

3. SSL → Let's Encrypt → 申请证书

### 5. 常用命令

```bash
# 查看日志
docker logs -f deepseek-c

# 重启容器
docker restart deepseek-c

# 停止容器
docker stop deepseek-c

# 更新部署
cd /www/wwwroot/deepseek-c
git pull
docker-compose down
docker-compose up -d --build

# 查看资源使用
docker stats deepseek-c
```

## 本地开发

```bash
# 安装依赖
pnpm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填入本地配置

# 运行开发服务器
pnpm dev

# 构建
pnpm build
```

## 故障排查

### 数据库连接失败

- 检查 `DATABASE_URL` 是否正确
- 确认使用 `host.docker.internal` 而非 `localhost`
- 检查 PostgreSQL 是否启动

### Prisma Client 模块未找到错误

如果遇到 `Cannot find module '.prisma/client/default'` 错误:

```bash
# 进入容器
docker exec -it deepseek-c sh

# 生成 Prisma Client
npx prisma generate

# 重启容器
exit
docker restart deepseek-c
```

**原因**: Prisma Client 需要在部署后生成。确保:

1. `package.json` 的 `build` 脚本包含 `prisma generate`
2. 或在容器启动后手动运行 `prisma generate`

### 构建失败

- 查看详细日志: `docker build -t deepseek-c . --progress=plain --no-cache`
- 检查 `.dockerignore` 是否正确

### 容器无法启动

- 查看日志: `docker logs deepseek-c`
- 检查环境变量是否正确设置
- 确认端口 3000 未被占用

## 安全建议

1. ✅ 使用强密码
2. ✅ 定期备份数据库
3. ✅ 更新 NEXTAUTH_SECRET
4. ✅ 不要提交 `.env.production` 到 Git
5. ✅ 配置防火墙规则
6. ✅ 使用 HTTPS
