# game-2048-bff

基于 Node.js 的 2048 游戏后端服务，主要提供用户注册、登录等基础能力，后续可扩展游戏数据、排行榜等功能。

## 技术栈

- Node.js + Express：HTTP 服务与路由。
- MySQL：关系型数据库，用于持久化用户数据。
- Knex：Node.js SQL 查询构建器，作为 MySQL 访问层。
- JSON Web Token（JWT）：用户登录后的无状态认证。
- bcryptjs：用户密码加密存储。
- Docker：本地运行 MySQL 数据库。

## 项目结构

项目主目录结构示意：

- `src/`
  - `index.js`：应用入口，加载环境变量、初始化 Express、挂载路由和错误处理。
  - `routes/`
    - `auth.js`：认证相关路由（注册、登录）。
  - `services/`
    - `userService.js`：用户业务逻辑（密码加密校验、JWT 签发等）。
  - `repositories/`
    - `userRepository.js`：用户数据访问层（通过 Knex 操作 MySQL）。
- `.env`：本地开发环境变量（数据库配置、JWT 密钥等）。
- `docs`：接口技术文档（当前为认证模块说明）。
- `TODO.md`：后续功能规划。

## 本地开发环境准备

### 1. 安装依赖

确保已安装 Node.js 和 npm，然后在项目根目录执行：

```bash
npm install
```

### 2. 通过 Docker 启动本地 MySQL

本地需要有 Docker 环境。运行下面命令启动 MySQL 容器：

```bash
docker run --name game-2048-mysql \
  -e MYSQL_ROOT_PASSWORD=StrongPass123! \
  -e MYSQL_DATABASE=game_2048 \
  -p 3306:3306 \
  -d mysql:8.0
```

首次启动后，在容器内创建 `users` 表：

```bash
docker exec -it game-2048-mysql mysql -uroot -p
```

输入密码后，执行：

```sql
USE game_2048;

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_users_email (email)
);
```

### 3. 配置环境变量

在项目根目录创建 `.env` 文件（或修改已有文件），例如：

```env
PORT=3000
JWT_SECRET=请替换为一串随机长字符串

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=StrongPass123!
DB_NAME=game_2048
```

## 启动项目

在项目根目录执行：

```bash
npm start
```

启动成功后，会看到类似日志：

```text
Server listening on port 3000
```

默认监听 `http://localhost:3000`。

## 测试基础接口

### 注册

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456"}'
```

预期返回：

```json
{
  "user": {
    "id": "1",
    "email": "test@example.com",
    "createdAt": "2026-02-15T05:11:25.000Z"
  },
  "token": "..."
}
```

### 登录

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456"}'
```

返回结构与注册类似，同样包含 `user` 和 `token`。

## 开发建议

- 本地开发时：
  - MySQL 使用 Docker 容器运行；
  - 后端直接在宿主机执行 `npm start`；
  - 前端项目可以独立开发，直接通过 `http://localhost:3000/api/...` 调用本服务。
