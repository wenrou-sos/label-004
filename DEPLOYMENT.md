# 社区诊所慢病随访管理系统 - 部署说明

## 一、系统环境要求

- Node.js >= 18.0.0
- MySQL >= 8.0
- npm >= 9.0.0 或 yarn >= 1.22.0

## 二、数据库准备

### 2.1 创建数据库

```sql
CREATE DATABASE chronic_followup CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2.2 配置数据库连接

编辑项目根目录下的 `.env` 文件：

```env
DATABASE_URL="mysql://root:password@localhost:3306/chronic_followup"
JWT_SECRET="your-super-secret-jwt-key-change-in-production-please-use-a-long-random-string"
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

**注意**：
- 请将 `password` 替换为您的 MySQL root 用户密码
- 生产环境中务必修改 `JWT_SECRET` 为强随机字符串

## 三、安装步骤

### 3.1 安装依赖

```bash
npm install
```

### 3.2 生成 Prisma 客户端

```bash
npm run prisma:generate
```

### 3.3 执行数据库迁移

```bash
npm run prisma:migrate
```

### 3.4 初始化示例数据

```bash
npm run prisma:seed
```

初始化后将创建以下默认账号：
- 管理员：`admin` / `doctor123`
- 普通医生：`doctor1` / `doctor123`

## 四、启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000 即可使用系统。

## 五、生产环境部署

### 5.1 构建生产版本

```bash
npm run build
```

### 5.2 启动生产服务器

```bash
npm run start
```

### 5.3 使用 PM2 守护进程（推荐）

```bash
npm install -g pm2
pm2 start npm --name "chronic-followup" -- start
pm2 save
pm2 startup
```

## 六、Nginx 反向代理配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 七、数据备份

### 7.1 手动备份

```bash
npm run db:backup
```

备份文件将保存在 `backups/` 目录下，文件名格式为 `backup-YYYY-MM-DDTHH-MM-SS-SSS.sql`。系统自动保留最近30天的备份。

### 7.2 自动备份（使用 crontab）

```bash
# 每天凌晨2点执行备份
0 2 * * * cd /path/to/project && npm run db:backup >> backup.log 2>&1
```

## 八、安全配置建议

1. **HTTPS**：生产环境必须启用 HTTPS，建议使用 Let's Encrypt 免费证书
2. **JWT密钥**：设置足够长且随机的 JWT_SECRET
3. **数据库密码**：使用强密码，避免使用默认密码
4. **防火墙**：仅开放必要端口（80, 443）
5. **定期更新**：及时更新依赖包以修复安全漏洞
6. **访问日志**：启用访问日志监控，便于安全审计

## 九、常见问题

### Q1: 数据库连接失败
- 检查 MySQL 服务是否启动
- 确认 `.env` 中的数据库配置正确
- 确认数据库用户有足够的权限

### Q2: Prisma migrate 失败
- 删除 `prisma/migrations` 目录后重试
- 或执行 `npx prisma db push` 直接同步表结构

### Q3: 端口 3000 被占用
- 修改启动命令：`PORT=8080 npm run dev`
- 或在 `.env` 中添加 `PORT=8080`
