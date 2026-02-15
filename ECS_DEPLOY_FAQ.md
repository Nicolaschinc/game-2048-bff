# 阿里云 ECS 部署 game-2048-bff 运维 FAQ

> 记录从本地到阿里云 ECS 部署 Node.js + MySQL 后端过程中遇到的典型问题与解决方案。

---

## 1. 系统镜像 & 包管理

### Q1：为什么在 ECS 上运行 `apt` 提示 `-bash: apt: command not found`？

**原因**  
ECS 使用的是 Alibaba Cloud Linux / CentOS / RHEL 系列系统，这类系统使用 `yum` / `dnf`，只有 Ubuntu/Debian 系列才有 `apt`。

**解决办法**

使用 `yum` 安装基础工具：

```bash
yum update -y
yum install -y git curl
```

Node.js 推荐通过 nvm 安装，而不是使用系统自带旧版本。

---

### Q2：安装了 nvm，执行 `nvm ls` 仍然报 `-bash: nvm: command not found`？

**原因**  
nvm 安装脚本只是把初始化代码写入 `~/.bashrc` 或 `~/.bash_profile`，当前 shell 没有加载这些脚本，所以找不到 `nvm` 函数。

**排查 & 解决步骤**

1. 确认 nvm 目录存在：

```bash
ls -ld ~/.nvm
```

若不存在，重新安装：

```bash
export NVM_VERSION=v0.39.7
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/$NVM_VERSION/install.sh | bash
```

2. 在当前会话中手动加载 nvm：

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
```

3. 验证：

```bash
nvm --version
```

4. 确保下次登录自动加载，将上述三行追加到 `~/.bashrc` 后执行：

```bash
source ~/.bashrc
```

---

## 2. Docker 拉取 MySQL 镜像问题

### Q3：`docker run mysql:8.0` 报 `Repo not found` 或默认走 RedHat 仓库？

**现象**

- 执行 `docker run mysql:8.0` 或 `docker pull mysql:8.0` 时出现多个选项：
  - `registry.access.redhat.com/mysql:8.0`
  - `registry.redhat.io/mysql:8.0`
  - `docker.io/library/mysql:8.0`
- 选择前两个会出现 `Repo not found`。

**原因**  
Alibaba Cloud Linux 默认优先使用 RedHat 相关 registry，而官方 MySQL 镜像在 Docker Hub（`docker.io`）上。

**解决办法**

明确指定从 Docker Hub 拉取：

```bash
docker pull docker.io/library/mysql:8.0

docker run --name game-2048-mysql \
  -e MYSQL_ROOT_PASSWORD=StrongPass123! \
  -e MYSQL_DATABASE=game_2048 \
  -v /opt/mysql-game-2048-data:/var/lib/mysql \
  -p 3306:3306 \
  -d docker.io/library/mysql:8.0
```

---

### Q4：`docker pull mysql:8.0` 报超时：`registry-1.docker.io ... i/o timeout`？

**原因**  
ECS 访问 Docker Hub（`registry-1.docker.io`）的网络质量差或被限制，导致拉镜像超时。

**解决思路**

- 方案 A（更简单稳定）：改用 ECS 原生 MariaDB/MySQL 服务（本项目最终使用的是 Docker MySQL 方案，只需注意网络环境）。
- 方案 B：在阿里云配置 Docker 镜像加速器，再拉取 `mysql:8.0`（需要配置 `/etc/docker/daemon.json`，步骤更复杂）。

对于当前项目，最终成功路径是：**配置 Docker 使用 Docker Hub 镜像，并在容器内创建应用专用数据库用户**。

---

## 3. MySQL 权限 & 连接问题

### Q5：接口返回 `{"error":"Access denied for user 'root'@'172.17.0.1' (using password: YES)"}`？

**原因**

- Node.js 在 ECS 主机上运行；
- MySQL 在 Docker 容器中运行；
- 宿主机访问容器内 MySQL 时，对 MySQL 来说来源 IP 是 `172.17.0.1`；
- 官方 MySQL Docker 镜像默认只允许 `root@localhost`，不允许 root 从其他 IP 登录。

**解决方案：创建应用专用数据库用户**

1. 使用 root 登录容器内 MySQL：

```bash
docker exec -it game-2048-mysql mysql -uroot -p
```

2. 创建新用户并授权（示例）：

```sql
USE game_2048;

CREATE USER 'game2048'@'%' IDENTIFIED BY 'Game2048StrongPass!';
GRANT ALL PRIVILEGES ON game_2048.* TO 'game2048'@'%';
FLUSH PRIVILEGES;
```

3. 在 `.env` 中使用新用户：

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=game2048
DB_PASSWORD=Game2048StrongPass!
DB_NAME=game_2048
```

4. 重启 Node.js 服务（`npm start` 或 pm2），接口即可正常访问。

---

### Q6：在 ECS 宿主机执行 `mysql -h127.0.0.1 ...` 报 `-bash: mysql: command not found`？

**原因**  
宿主机上没有安装 mysql 客户端，这不影响容器内 MySQL 服务。

**解决办法**

管理数据库时继续使用容器内 mysql 命令：

```bash
docker exec -it game-2048-mysql mysql -uroot -p
docker exec -it game-2048-mysql mysql -ugame2048 -p -D game_2048
```

无需在宿主机单独安装 mysql 客户端。

---

## 4. 本机访问正常，公网访问不通

### Q7：ECS 本机 `curl http://127.0.0.1:3000/api/...` 正常，但本地电脑访问 `http://ECS_IP:3000/...` 超时或连接被重置？

**原因**  
应用本身无问题（本机访问 OK），公网访问不通通常是：

- 阿里云安全组未放行端口 3000；
- ECS 内部防火墙（firewalld/iptables）未放行端口 3000。

**排查步骤**

1. 确认 Node 服务在 ECS 上已启动：

```bash
cd /opt/game-2048-bff
npm start
# 看到：Server listening on port 3000
```

2. 配置阿里云安全组（入方向规则）：

- 登录阿里云控制台 → ECS → 实例 → 安全组；
- 在 **入方向** 增加一条规则：
  - 协议：TCP
  - 端口范围：`3000/3000`
  - 授权对象：`0.0.0.0/0`（开发阶段可先放开）。

3. 检查并配置 ECS 防火墙（如 firewalld）：

```bash
firewall-cmd --state 2>/dev/null || echo "firewalld not running"
```

- 若为 `running`，放行 3000 端口：

```bash
firewall-cmd --add-port=3000/tcp --permanent
firewall-cmd --reload
```

4. 再次从本地电脑访问：

```bash
curl -X POST http://<ECS_IP>:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"cloudtest@example.com","password":"123456"}'
```

若返回与 ECS 本机 curl 一致，则公网访问已打通。

---

## 5. GitHub 相关问题

### Q8：在 ECS 上 `git clone` GitHub 仓库时提示输入 Username/Password，该怎么填？

**情况一：仓库是 Public**

直接使用 HTTPS 地址克隆即可，无需密码：

```bash
cd /opt
git clone https://github.com/<username>/game-2048-bff.git
```

**情况二：仓库是 Private**

需要使用 Personal Access Token（PAT）：

1. 在 GitHub 中生成 PAT（Settings → Developer settings → Personal access tokens），勾选 `repo` 权限。
2. 在 ECS 上 clone 时：
   - Username：GitHub 用户名（如 `Nicolaschinc`）
   - Password：刚生成的 PAT（不是 GitHub 登录密码）。

**备选方案：不用 git，直接上传代码**

在本地打包并通过 scp 上传：

```bash
cd /Users/nicolas/Projects_app
tar czf game-2048-bff.tar.gz game-2048-bff
scp game-2048-bff.tar.gz root@<ECS_IP>:/opt
```

在 ECS 上：

```bash
cd /opt
tar xzf game-2048-bff.tar.gz
cd game-2048-bff
npm install
```

---

### Q9：如何将 GitHub 仓库从 Private 改为 Public？

在 GitHub 仓库页面操作：

1. 打开仓库 → 顶部 `Settings`。
2. 滚动到页面底部 **Danger Zone** 区域。
3. 找到 `Change repository visibility` → 点击 `Change visibility`。
4. 选择 `Public`，按提示输入仓库名确认。
5. 仓库变为 Public 后，可直接通过 HTTPS 匿名 clone：

```bash
git clone https://github.com/<username>/game-2048-bff.git
```

---

## 6. 开发 & 部署建议

### Q10：本地开发时，前端需要放进 Docker 吗？

**不需要。** 推荐本地开发模式：

- MySQL：使用 Docker 容器；
- 后端（本项目）：直接在宿主机运行 `npm start`；
- 前端：独立 dev server（如 `npm run dev`），通过 `http://localhost:3000/api/...` 调用后端。

线上部署时：

- 后端：在 ECS 上使用 Node.js 进程（可用 pm2 守护）；
- 数据库：可用 Docker MySQL 或 ECS 系统 MySQL/MariaDB；
- 若有前端项目，可后续通过 Nginx 托管静态资源并反向代理 API。

---

本文件用于记录在阿里云 ECS 上部署与运维 `game-2048-bff` 过程中遇到的典型问题和解决方案，后续可根据新问题持续补充。

