# AI老年回忆录 MVP 总体技术方案

## 排障：小程序自定义 TabBar

### 主要问题
- 自定义 TabBar 不显示或切换后消失
- `dist/app.json` 的 `lazyCodeLoading` 报错
- 运行时报 `Cannot read property 'mount' of null`
- SVG 图标在微信小程序端模板缺失（`tmpl_0_path` 等）

### 解决方法
- 使用本地 PNG 图标（`frontend/src/assets/icons`），避免 SVG；`tabBar.list` 与 `custom-tab-bar` 中图标保持一致
- `custom-tab-bar` 使用 `View/Image/Text` 渲染，并在 `frontend/src/custom-tab-bar/index.config.ts` 设置 `component: true`、`styleIsolation: 'shared'`
- `frontend/src/app.config.ts` 不设置 `lazyCodeLoading`，由 Taro/开发者工具默认处理
- `frontend/config/index.ts` 增加 `mini.addChunkPages`，保证 `custom-tab-bar/index` 先加载 `runtime/taro/vendors/common`
- H5 侧在 `frontend/src/app.ts` 动态加载自定义 TabBar，避免小程序端重复注册

### 图标更新建议
- 通过改文件名（如 `*-v2.png`）避免微信缓存旧图
- 更新后清理 `frontend/dist` 并重新 `npm run dev:weapp`

## 系统架构

### 架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                          客户端层                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Taro+React    │  │  H5/Web端    │  │  管理后台     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        API 网关层                              │
│                   (Nginx/Traefik)                             │
│       [HTTPS终止 | 静态转发 | 基础路由 | 简单限流]              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│               业务服务层 (Python FastAPI)                      │
│                                                               │
│  - 用户服务 (认证、授权、用户管理)                              │
│  - 回忆录服务 (回忆录CRUD、章节管理)                            │
│  - 媒体服务 (录音、照片上传)                                    │
│  - AI服务 (语音识别、文本生成、图片处理)                         │
│  - 通知服务 (消息推送、任务通知)                                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        数据存储层                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  PostgreSQL  │  │    Redis     │  │    MinIO     │      │
│  │  (主数据库)   │  │ (缓存/队列)   │  │ (对象存储)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### 技术栈选型说明

**前端层：**
- 微信小程序：使用 Taro + React (统一使用React技术栈)
- H5/Web：使用 React + Vite
- 管理后台：使用 React + Ant Design

**后端层：**
- 业务服务：Python FastAPI（类型安全、高性能、AI生态完善）
- ORM：SQLAlchemy 2.0（异步支持、类型提示）
- 数据库：PostgreSQL（可靠的关系型数据库）
- 缓存/队列：Redis（高性能）
- 对象存储：MinIO（开源S3兼容，部署简单）
- AI 服务：阿里云 Qwen3（ASR 语音识别 ✅ | TTS 语音合成 ⏸️待迭代）

---

## 服务模块

### 业务服务层（Python FastAPI）

#### 模块结构
```
backend-service-py/
├── app/
│   ├── main.py                 # FastAPI 应用入口
│   ├── config.py               # 配置管理
│   │
│   ├── core/                   # 核心功能
│   │   ├── db.py              # 数据库连接
│   │   ├── cache.py           # Redis 客户端
│   │   ├── storage.py         # MinIO 客户端
│   │   └── security.py        # JWT/加密工具
│   │
│   ├── models/                 # SQLAlchemy Models
│   │   └── __init__.py        # 所有数据库模型
│   │
│   ├── schemas/                # Pydantic Schemas
│   │   ├── auth.py
│   │   ├── memoir.py
│   │   ├── recording.py
│   │   └── media.py
│   │
│   ├── api/                    # API 路由
│   │   ├── deps.py            # 依赖注入
│   │   └── v1/
│   │       ├── auth.py        # 认证路由
│   │       ├── memoir.py      # 回忆录路由
│   │       ├── recording.py   # 录音路由
│   │       ├── media.py       # 媒体路由
│   │       └── speech.py      # WebSocket 实时语音识别
│   │
│   ├── services/               # 业务逻辑
│   │   ├── auth.py
│   │   ├── memoir.py
│   │   ├── recording.py
│   │   ├── media.py
│   │   ├── asr.py             # 语音识别服务
│   │   └── text_gen.py        # 文本生成服务
│   │
│   └── utils/                  # 工具函数
│       └── response.py        # 统一响应格式
│
├── migrations/                 # Alembic 迁移
│   └── versions/
│
├── tests/                      # 测试
├── requirements.txt
└── alembic.ini
```

#### 核心模块职责

**1. 认证授权模块 (auth)**
- 用户注册/登录
- 微信授权登录
- JWT token 生成和验证
- 权限控制

**2. 用户模块 (user)**
- 用户信息管理
- 老人档案管理（姓名、年龄、方言等）

**3. 回忆录模块 (memoir)**
- 回忆录创建、编辑、删除
- 回忆录状态管理（草稿、生成中、已完成）
- 回忆录元信息（标题、封面、主题等）
- 章节管理

**4. 录音管理模块 (recording)**
- 录音上传管理
- 录音元数据存储
- 实时语音识别（WebSocket）
- 转写结果管理

**5. 媒体资源模块 (media)**
- 图片上传（老照片）
- 图片管理和预览
- 文件上传下载
- 媒体资源与章节关联

**6. AI服务模块 (ai)**
- 语音识别（ASR）
- 文本生成
- 图片处理
- 语音合成（TTS）

**7. 通知模块 (notification)**
- 消息推送（微信模板消息）
- 任务状态通知
- 系统公告

---

## 数据模型

### 核心实体关系

```
用户表 (users)
    └── 老人档案表 (elder_profiles)

回忆录表 (memoirs)
    ├── 章节表 (chapters)
    │   └── 包含章节内容 (content)
    │
    └── 录音表 (recordings)
        └── 包含转写结果 (transcription_text)

媒体资源表 (media_files)
    └── 统一存储 (类型: image/audio/video)

系统表
    ├── AI任务表 (ai_tasks)
    ├── 通知表 (notifications)
    └── 审核记录表 (audit_logs)
```

### 关键实体说明

**用户相关实体：**
- `users`: 基础用户信息（手机号、微信openid、角色等）
- `elder_profiles`: 老人详细档案（姓名、出生年月、籍贯、方言、健康状况等）

**回忆录相关实体：**
- `memoirs`: 回忆录主表（标题、状态、创建时间、老人ID等）
- `chapters`: 章节信息及内容（标题、排序、内容TEXT、类型等）
- `recordings`: 录音文件及转写结果（文件路径、时长、方言、转写文本、转写状态）
- `media_files`: 统一媒体资源表（类型、路径、关联实体ID）

**任务相关实体：**
- `ai_tasks`: AI任务队列表（任务类型、状态、参数、结果）

---

## API 设计规范

### RESTful API 设计原则

**URL 结构：**
```
# 认证相关
/api/v1/auth/wechat_login     - 微信登录
/api/v1/auth/refresh_token    - 刷新token
/api/v1/auth/logout           - 登出

# 回忆录管理
/api/v1/memoir/list           - 回忆录列表
/api/v1/memoir/create         - 创建回忆录
/api/v1/memoir/detail         - 回忆录详情
/api/v1/memoir/update         - 更新回忆录
/api/v1/memoir/delete         - 删除回忆录

# 录音管理
/api/v1/recording/upload      - 上传录音
/api/v1/recording/detail      - 录音详情
/api/v1/recording/delete      - 删除录音

# 媒体资源
/api/v1/media/upload          - 上传媒体
/api/v1/media/detail          - 媒体详情
/api/v1/media/delete          - 删除媒体

# WebSocket 实时语音识别
ws://api/v1/speech/realtime   - WebSocket连接
```

**统一响应格式：**
```json
// 成功响应
{
  "code": 200,
  "message": "success",
  "data": {
    // 业务数据
  },
  "timestamp": 1234567890
}

// 错误响应
{
  "code": 400,
  "message": "参数错误",
  "data": null,
  "timestamp": 1234567890
}

// 分页响应
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [...],
    "total": 100,
    "page": 1,
    "page_size": 20
  },
  "timestamp": 1234567890
}
```

---

## 业务流程

### 核心业务流程

#### 流程1: 微信登录与档案创建
```
1. 微信授权 -> 自动登录 -> 进入首页
   （首页展示：回忆录列表、快速录音入口）

2. 首次录音引导
   ├─> 点击【开始新录音】
   ├─> 弹窗询问老人姓名（可跳过）
   └─> 自动创建老人档案
```

#### 流程2: 实时语音采集与识别
```
1. 建立连接
   ├─> 前端建立 WebSocket 连接
   └─> JWT Token 认证

2. 实时流式传输
   ├─> 用户说话 -> 前端发送音频流
   ├─> 后端实时识别
   └─> 返回文字流 -> 前端逐字展示

3. 会话结束与保存
   ├─> 用户停止录音
   ├─> 保存完整音频到 MinIO
   ├─> 保存转写结果到数据库
   └─> 返回 recordingId
```

#### 流程3: AI生成章节内容
```
1. 准备生成素材
   ├─> 获取章节关联的所有录音转写文本
   ├─> 获取章节主题和用户偏好
   └─> 获取老人基本信息

2. 创建生成任务
   ├─> 构建prompt模板
   ├─> 调用大语言模型API
   └─> 流式生成文本内容

3. 内容审核与编辑
   ├─> 用户预览和修改
   └─> 确认保存到章节
```

#### 流程4: 回忆录生成与导出
```
1. 回忆录编排
   ├─> 用户选择章节
   ├─> 调整章节顺序
   ├─> 添加照片和媒体
   └─> 设置封面和标题

2. 预览回忆录
   ├─> 生成临时预览版本
   └─> H5/Web 展示

3. 导出电子版
   ├─> 选择导出格式（PDF/EPUB）
   ├─> 生成文件
   ├─> 上传到MinIO
   └─> 返回下载链接
```

---

## 数据存储

### PostgreSQL 数据库设计

#### 数据分层
```
业务数据层
├── 用户域（users, elder_profiles）
├── 内容域（memoirs, chapters）
├── 媒体域（media_files, recordings）
└── 系统域（ai_tasks, notifications, audit_logs）
```

#### 索引策略
- 主键索引：所有表的 `id` 字段
- 外键索引：关联字段自动创建
- 查询索引：高频查询字段（user_id, memoir_id, status, created_at）
- 复合索引：多条件查询（user_id + status）

### Redis 使用方案

#### 缓存策略
```
# 用户会话缓存
session:{userId}                 # 用户会话信息，TTL: 7天
user:profile:{userId}            # 用户信息缓存，TTL: 1小时

# 业务数据缓存
memoir:{memoirId}                # 回忆录信息，TTL: 30分钟
chapter:{chapterId}              # 章节信息，TTL: 30分钟
```

### MinIO 对象存储方案

#### 存储桶设计
```
bucket: memoir-private           # 私有数据
  ├── recordings/{userId}/{recordingId}.wav
  ├── photos/{userId}/{imageId}.jpg
  └── exports/{memoirId}/{version}.pdf

bucket: memoir-temp              # 临时数据
  └── tasks/{taskId}/temp_files/
```

#### 访问控制
- **私有文件**：所有文件访问通过预签名 URL，有效期15分钟
- **对象键名**：使用 UUID，不暴露业务含义

---

## 安全与权限

### 认证机制

#### JWT Token 设计
```python
# Access Token Payload
{
  "user_id": 12345,
  "role": "user",              # user | admin
  "type": "access",
  "exp": 1234567890,           # 过期时间（2小时）
  "iat": 1234567890
}

# Refresh Token Payload
{
  "user_id": 12345,
  "type": "refresh",
  "exp": 1234567890,           # 过期时间（7天）
  "iat": 1234567890
}
```

### 数据安全
- 所有敏感数据加密存储
- 传输层使用 HTTPS
- 数据库访问通过连接池
- 对象存储使用预签名 URL

---

## 部署方案

### Docker 部署

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8999

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8999"]
```

### 环境配置

```bash
# .env
PORT=8999
DATABASE_URL=postgresql://user:pass@localhost:5432/memoria
REDIS_HOST=localhost
REDIS_PORT=6379
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
JWT_SECRET=your-secret-key
WECHAT_APPID=your-appid
WECHAT_SECRET=your-secret
```

---

## 性能优化

### 数据库优化
- 使用 asyncpg 异步数据库驱动
- 合理使用索引
- 批量操作优化
- 连接池配置

### 缓存优化
- Redis 缓存热点数据
- 合理设置 TTL
- 缓存穿透保护
- 缓存更新策略

### WebSocket 优化
- 使用 uvicorn 的 uvloop
- 会话状态管理
- 心跳检测
- 自动重连机制

---

## 监控与日志

### 日志系统
- 结构化日志（JSON格式）
- 分级日志（DEBUG/INFO/WARNING/ERROR）
- 日志轮转
- 敏感数据脱敏

### 监控指标
- API 响应时间
- 错误率统计
- 数据库连接数
- Redis 命中率
- WebSocket 连接数
