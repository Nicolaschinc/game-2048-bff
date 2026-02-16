# 用户注册与登录规则

## 一、接口约定

- 注册接口：`POST /api/auth/register`
- 登录接口：`POST /api/auth/login`
- 请求头：`Content-Type: application/json`

### 1. 注册请求体

```json
{
  "email": "user@example.com",
  "password": "your-password"
}
```

## 二、邮箱规则

- 校验正则：`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- 前端：
  - 使用上述正则进行格式校验；
  - 不符合时：`alert("请输入正确的邮箱地址")`，不发请求。
- 后端：
  - 使用同样正则校验；
  - 不符合时返回：
    - 状态码：`400`
    - 响应体：`{"error":"Invalid email format"}`

## 三、密码规则

- 基础要求：
  - 长度至少 6 位；
  - 必须包含至少一个字母（`[A-Za-z]`）；
  - 必须包含至少一个数字（`\d`）。
- 前端：
  - 使用字符串长度 + 正则 `/[A-Za-z]/` 和 `/\d/` 进行校验；
  - 不符合时：`alert("密码至少 6 位，且同时包含字母和数字")`，不发请求。
- 后端：
  - 同样使用长度判断和正则校验；
  - 不符合时返回：
    - 状态码：`400`
    - 响应体：`{"error":"Password must be at least 6 characters and contain both letters and numbers"}`

## 四、用户昵称规则

- 长度限制：
  - 昵称最大长度为 10 个字符；
  - 后端在生成默认昵称时会截断到 10 个字符。
- 注册阶段：
  - 当前注册接口不接受前端传入昵称字段；
  - 注册成功后，后端为新用户生成一个随机昵称（如 `Player1234` 等）并写入 `users.nickname` 字段。

## 四、密码存储与登录校验

- 前端：
  - 不做哈希或加密处理；
  - 通过 HTTPS 将明文 `password` 发送到后端。
- 后端：
  - 使用 `bcryptjs` 对密码进行哈希存储：
    - 注册：`bcrypt.hash(password, 10)`，写入 `users.password_hash`。
    - 登录：`bcrypt.compare(password, password_hash)` 校验。

## 五、用户表相关约定（概要）

- 主用户表：`users`
- 与注册 / 登录规则相关字段：
  - `email VARCHAR(255) DEFAULT NULL`：用户登录账号，必须唯一；
  - `password_hash VARCHAR(255) NOT NULL`：使用 bcrypt 生成的密码哈希；
  - `is_email_verified TINYINT(1) NOT NULL DEFAULT 0`：
    - `0`：邮箱未验证；
    - `1`：邮箱已验证（为后续邮件验证流程预留）。

## 六、注册频率与数量限制

- 全局注册数量限制：
  - 每日成功注册用户数量上限：`1000`（可通过环境变量 `MAX_DAILY_REGISTRATIONS` 配置）。
- 实现方式（后端）：
  - 在注册逻辑中通过 `users` 表统计当日创建数量（`DATE(created_at) = CURRENT_DATE`）；
  - 当日已注册数量 `>= 1000` 时，新的注册请求直接拒绝：
    - 状态码：`429`
    - 响应体：`{"error":"Daily registration limit exceeded"}`
