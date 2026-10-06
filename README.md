# CourseSchedCenter

课表小程序的公告、反馈与管理台服务。后端使用 Nitro v3 + h3，管理台使用 React 19 + Vite，数据通过 Node.js 内置 SQLite 持久化。

## 目录结构

```text
CourseSchedCenter/
├── app/                 管理台页面、SSR 与浏览器入口
├── components/          通用 UI 组件
├── hooks/               前端 Hooks
├── lib/                 公共工具
├── server/
│   ├── routes/          公开接口与管理接口
│   ├── features/        认证、公告、反馈的业务逻辑与数据访问
│   ├── middleware/      管理接口认证
│   ├── plugins/         启动初始化
│   ├── tasks/           数据库迁移任务
│   └── utils/           响应封装与微信客户端
├── migrations/          数据库迁移 SQL
├── public/              静态资源
├── types/               类型声明
├── nitro.config.ts      服务端与数据库配置
├── vite.config.ts       前端构建配置
├── Dockerfile           生产镜像构建
├── docker-compose.yml   容器编排与数据持久化
└── .env.example         环境变量模板
```

## 环境变量

复制 `.env.example` 为 `.env` 后填写配置。正常使用管理台和微信反馈功能需要前五项；Docker Compose 会检查这些必填项。

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `KB_TOTP_SECRET` | 无 | 管理台登录使用的 Base32 TOTP 密钥 |
| `KB_JWT_SECRET` | 无 | JWT 签名密钥，建议使用至少 32 字节的随机值 |
| `KB_WCMP_APPID` | 无 | 微信小程序 AppID |
| `KB_WCMP_SECRET` | 无 | 微信小程序 AppSecret |
| `KB_WCMP_TEMPLATE_ID` | 无 | 反馈回复使用的微信订阅消息模板 ID |
| `KB_FEEDBACK_HOOK` | 空 | 可选的反馈通知 Webhook 模板，支持 `<contact>`、`<content>` 占位符 |
| `PORT` | `3000` | Compose 的宿主机映射端口；直接运行生产服务时为监听端口 |
| `HOST` | `0.0.0.0` | 直接运行生产服务时的监听地址 |

业务配置使用 `KB_` 前缀。开发模式自动读取 `.env` / `.env.local`；生产运行使用环境变量，或通过 Node 的 `--env-file=.env` 显式加载。

数据库路径固定为启动工作目录下的 `.data/main.sqlite`，启动时自动执行尚未应用的迁移，无需手动建表。

## 使用方式

### Docker 部署

需要 Docker 和 Docker Compose。在项目根目录执行：

```sh
# 首次配置时复制；已有 .env 时直接编辑现有文件。
cp .env.example .env
# 填写 .env 中的必填项。
docker compose up -d --build
```

默认访问 `http://localhost:3000`，部署在服务器上时将 `localhost` 换为服务器地址。容器内监听端口固定为 `3000`，可通过 `.env` 中的 `PORT` 调整宿主机端口。

SQLite 数据保存在命名卷 `csc-data`，挂载到容器的 `/app/.data`。更新源码后重新执行 `docker compose up -d --build`，数据卷会保留。

```sh
# 查看运行日志。
docker compose logs -f course-sched-center

# 查看服务状态。
docker compose ps

# 停止服务并保留数据卷。
docker compose down
```

### 源码运行

需要 Node.js 22.13+ 和 npm，建议使用最新的 Node.js 22 LTS。以下命令均在项目根目录执行。

```sh
npm ci
# 首次配置时复制，并填写必填项。
cp .env.example .env
```

开发调试：

```sh
npm run dev -- --port 3000
```

访问 `http://localhost:3000`，支持热更新。需要通过其他设备访问时，追加 `--host 0.0.0.0`；端口被占用时以终端输出的地址为准。

生产运行：

```sh
npm run build
node --env-file=.env .output/server/index.mjs
```

构建产物位于 `.output/`，运行时仍需保留其完整目录结构。源码运行的数据保存在本地 `.data/main.sqlite`，与 Docker 命名卷中的数据库各自独立。
