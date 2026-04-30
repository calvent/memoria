# AI 老年回忆录 - 业务服务层技术文档

> 基于 Python FastAPI 的高性能业务服务层

---

## 一、技术选型

### 1.1 核心技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| **Python** | 3.11+ | 编程语言 |
| **FastAPI** | 0.109+ | Web 框架 |
| **SQLAlchemy** | 2.0+ | 异步 ORM |
| **asyncpg** | 0.29+ | PostgreSQL 异步驱动 |
| **PostgreSQL** | 15+ | 主数据库 |
| **Redis** | 7+ | 缓存/队列 |
| **MinIO SDK** | 7.2+ | 对象存储客户端 |
| **Pydantic** | 2.5+ | 数据验证 |
| **Uvicorn** | 0.27+ | ASGI 服务器 |

### 1.2 为什么选择 FastAPI？

**FastAPI 优势：**
- 🚀 高性能（与 Node.js 和 Go 相当）
- ⚡ 基于 Pydantic 的自动数据验证
- � 自动生成 OpenAPI 文档
- 🔒 类型安全（Python 3.10+ 类型提示）
- � 原生异步支持
- 🎯 依赖注入系统
- 🧪 易于测试

---

## 二、项目结构

```
backend-service-py/
├── app/
│   ├── main.py                 # FastAPI 应用入口
│   ├── config.py               # 配置管理（Pydantic Settings）
│   │
│   ├── core/                   # 核心功能
│   │   ├── db.py              # 数据库连接和会话管理
│   │   ├── cache.py           # Redis 客户端
│   │   ├── storage.py         # MinIO 客户端
│   │   └── security.py        # JWT/加密工具
│   │
│   ├── models/                 # SQLAlchemy ORM Models
│   │   └── __init__.py        # 所有数据库模型
│   │
│   ├── schemas/                # Pydantic Schemas
│   │   ├── auth.py
│   │   ├── memoir.py
│   │   ├── recording.py
│   │   └── media.py
│   │
│   ├── api/                    # API 路由
│   │   ├── deps.py            # 依赖注入（认证等）
│   │   └── v1/
│   │       ├── auth.py        # 认证接口
│   │       ├── memoir.py      # 回忆录接口
│   │       ├── recording.py   # 录音接口
│   │       ├── media.py       # 媒体接口
│   │       └── speech.py      # WebSocket 实时ASR
│   │
│   ├── services/               # 业务逻辑层
│   │   ├── auth.py
│   │   ├── memoir.py
│   │   ├── recording.py
│   │   └── asr.py
│   │
│   └── utils/                  # 工具函数
│       └── response.py        # 统一响应格式
│
├── migrations/                 # Alembic 数据库迁移
│   └── versions/
│
├── tests/                      # 测试
├── requirements.txt
├── alembic.ini
└── start.sh                    # 启动脚本
```

---

## 三、模块设计规范

### 3.1 标准模块结构

FastAPI 采用以下分层结构：

```
┌─────────────────────────────────────────┐
│  API Router (路由层)                     │  定义 HTTP 路由和依赖注入
├─────────────────────────────────────────┤
│  Pydantic Schema (验证层)                │  请求/响应数据验证
├─────────────────────────────────────────┤
│  Service (业务逻辑层)                     │  核心业务逻辑
├─────────────────────────────────────────┤
│  SQLAlchemy Model (数据层)               │  数据库模型和ORM操作
├─────────────────────────────────────────┤
│  Database / Cache / Storage              │  基础设施层
└─────────────────────────────────────────┘
```

### 3.2 代码示例

**Route 层 (`api/v1/memoir.py`)**
```python
from fastapi import APIRouter, Depends, Query
from app.api.deps import get_current_user
from app.models import User
from app.schemas.memoir import MemoirCreate, MemoirResponse
from app.services import memoir as memoir_service
from app.utils.response import success_response

router = APIRouter()

@router.post("/create")
async def create_memoir(
    body: MemoirCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """创建回忆录"""
    memoir = await memoir_service.create_memoir(db, user.id, body)
    return success_response(MemoirResponse.model_validate(memoir).model_dump())
```

**Service 层 (`services/memoir.py`)**
```python
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import Memoir
from app.schemas.memoir import MemoirCreate

async def create_memoir(
    db: AsyncSession,
    user_id: int,
    data: MemoirCreate
) -> Memoir:
    """创建回忆录业务逻辑"""
    memoir = Memoir(
        user_id=user_id,
        title=data.title,
        cover_image=data.cover_image,
        description=data.description,
        status="draft",
    )
    
    db.add(memoir)
    await db.flush()
    
    return memoir
```

**Schema 层 (`schemas/memoir.py`)**
```python
from pydantic import BaseModel
from datetime import datetime

class MemoirCreate(BaseModel):
    """创建回忆录请求"""
    title: str
    cover_image: str | None = None
    description: str | None = None
    elder_id: int | None = None

class MemoirResponse(BaseModel):
    """回忆录响应"""
    id: int
    user_id: int
    title: str
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True
```

**Model 层 (`models/__init__.py`)**
```python
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime

class Memoir(Base):
    """回忆录表"""
    __tablename__ = "memoirs"
    
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"))
    title: Mapped[str] = mapped_column(String(200))
    status: Mapped[str] = mapped_column(String(20), default="draft")
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    
    # 关系
    user: Mapped["User"] = relationship(back_populates="memoirs")
    chapters: Mapped[list["Chapter"]] = relationship(back_populates="memoir")
```

---

## 四、数据库设计

### 4.1 使用 SQLAlchemy 2.0

**配置数据库连接 (`core/db.py`)**
```python
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.config import settings

# 创建异步引擎
engine = create_async_engine(
    settings.database_url.replace("postgresql://", "postgresql+asyncpg://"),
    echo=settings.node_env == "development",
)

# 会话工厂
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

async def get_db() -> AsyncSession:
    """依赖注入：获取数据库会话"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
```

### 4.2 数据库迁移

使用 Alembic 管理数据库迁移：

```bash
# 生成迁移文件
alembic revision --autogenerate -m "create tables"

# 执行迁移
alembic upgrade head

# 回滚迁移
alembic downgrade -1
```

---

## 五、API 设计规范

### 5.1 统一响应格式

```python
# utils/response.py
from time import time

def success_response(data: any = None, message: str = "success") -> dict:
    """成功响应"""
    return {
        "code": 200,
        "message": message,
        "data": data,
        "timestamp": int(time() * 1000),
    }

def error_response(message: str, code: int = 500) -> dict:
    """错误响应"""
    return {
        "code": code,
        "message": message,
        "data": None,
        "timestamp": int(time() * 1000),
    }

def paginated_response(items: list, total: int, page: int, page_size: int) -> dict:
    """分页响应"""
    return {
        "code": 200,
        "message": "success",
        "data": {
            "items": items,
            "total": total,
            "page": page,
            "page_size": page_size,
        },
        "timestamp": int(time() * 1000),
    }
```

### 5.2 API 路由规范

```python
# 回忆录模块路由示例
GET  /api/v1/memoir/list             # 列表（支持分页和筛选）
POST /api/v1/memoir/create           # 创建
GET  /api/v1/memoir/detail?id=xxx    # 详情
POST /api/v1/memoir/update           # 更新
POST /api/v1/memoir/delete           # 删除
POST /api/v1/memoir/publish          # 发布
```

---

## 六、认证与授权

### 6.1 JWT 认证依赖注入

```python
# api/deps.py
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.db import get_db
from app.core.security import verify_token
from app.models import User

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    """获取当前登录用户"""
    token = credentials.credentials
    payload = verify_token(token)
    user_id = payload.get("user_id")
    
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="用户不存在")
    
    return user
```

### 6.2 JWT 工具函数

```python
# core/security.py
import jwt
from datetime import datetime, timedelta
from app.config import settings

def create_access_token(data: dict) -> str:
    """创建访问 Token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(seconds=settings.jwt_access_expires_in)
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.jwt_secret, algorithm="HS256")

def verify_token(token: str) -> dict:
    """验证 Token"""
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise ValueError("Token 已过期")
    except jwt.InvalidTokenError:
        raise ValueError("无效的 Token")
```

---

## 七、缓存策略

### 7.1 Redis 缓存封装

```python
# core/cache.py
import redis.asyncio as aioredis
from app.config import settings

class RedisClient:
    """Redis 客户端封装"""
    
    def __init__(self):
        self.client = None
    
    async def connect(self):
        """连接 Redis"""
        self.client = await aioredis.from_url(
            f"redis://{settings.redis_host}:{settings.redis_port}",
            encoding="utf-8",
            decode_responses=True
        )
    
    async def get(self, key: str) -> str | None:
        """获取值"""
        return await self.client.get(key)
    
    async def set(self, key: str, value: str, ex: int | None = None) -> bool:
        """设置值"""
        return await self.client.set(key, value, ex=ex)

# 全局 Redis 客户端
redis_client = RedisClient()
```

### 7.2 缓存键定义

```python
# 用户缓存
user:profile:{user_id}            # TTL: 1小时

# 回忆录缓存
memoir:{memoir_id}                # TTL: 30分钟
memoir:list:{user_id}:{page}      # TTL: 10分钟
```

---

## 八、MinIO 存储集成

### 8.1 MinIO 客户端

```python
# core/storage.py
from minio import Minio
from minio.error import S3Error
from app.config import settings

class MinioClient:
    """MinIO 客户端封装"""
    
    def __init__(self):
        self.client = Minio(
            f"{settings.minio_endpoint}:{settings.minio_port}",
            access_key=settings.minio_access_key,
            secret_key=settings.minio_secret_key,
            secure=settings.minio_use_ssl,
        )
    
    def upload_file(self, bucket: str, object_name: str, data: bytes, content_type: str) -> str:
        """上传文件"""
        self.client.put_object(
            bucket,
            object_name,
            BytesIO(data),
            length=len(data),
            content_type=content_type,
        )
        return f"/{bucket}/{object_name}"
    
    def get_presigned_url(self, bucket: str, object_name: str, expires: int = 3600) -> str:
        """获取预签名 URL"""
        return self.client.presigned_get_object(bucket, object_name, expires=expires)
```

---

## 九、WebSocket 实时语音识别

### 9.1 WebSocket 路由

```python
# api/v1/speech.py
from fastapi import WebSocket, WebSocketDisconnect, Query

@router.websocket("/realtime")
async def realtime_asr(
    websocket: WebSocket,
    token: str = Query(...),
    memoir_id: str | None = Query(None)
):
    """WebSocket 实时语音识别"""
    # 验证 token
    user = await verify_ws_token(token)
    await websocket.accept()
    
    # 创建会话
    session = await create_asr_session(user.id, memoir_id)
    
    try:
        async for message in websocket.iter_bytes():
            # 处理音频数据
            await handle_audio_chunk(session, message)
    except WebSocketDisconnect:
        await cleanup_session(session.id)
```

---

## 十、环境配置

### 10.1 环境变量

```bash
# .env
PORT=8999
NODE_ENV=development

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/memoria

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_USE_SSL=false

# JWT
JWT_SECRET=your-secret-key
JWT_ACCESS_EXPIRES_IN=7200

# WeChat
WECHAT_APPID=your-appid
WECHAT_SECRET=your-secret
```

### 10.2 配置管理

```python
# config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """应用配置"""
    port: int = 8999
    node_env: str = "development"
    database_url: str
    redis_host: str = "localhost"
    redis_port: int = 6379
    jwt_secret: str
    
    class Config:
        env_file = ".env"

settings = Settings()
```

---

## 十一、部署

### 11.1 Docker 部署

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8999

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8999"]
```

### 11.2 启动脚本

```bash
#!/bin/bash
# start.sh

# 激活虚拟环境
source venv/bin/activate

# 启动服务
uvicorn app.main:app --host 0.0.0.0 --port 8999 --reload
```

---

## 十二、测试

### 12.1 单元测试

```python
# tests/test_memoir.py
import pytest
from app.services import memoir

@pytest.mark.asyncio
async def test_create_memoir(db_session, test_user):
    """测试创建回忆录"""
    data = MemoirCreate(title="测试回忆录")
    memoir = await memoir.create_memoir(db_session, test_user.id, data)
    
    assert memoir.title == "测试回忆录"
    assert memoir.status == "draft"
```

---

## 十三、性能优化

### 13.1 异步性能优化
- 使用 `asyncpg` 异步数据库驱动
- 使用 `uvloop` 提升事件循环性能
- 合理使用数据库连接池
- 避免阻塞操作

### 13.2 缓存优化
- Redis 缓存热点数据
- 合理设置 TTL
- 缓存预热
- 缓存更新策略

---

## 十四、监控与日志

### 14.1 结构化日志

```python
import logging
import json

logger = logging.getLogger(__name__)

def log_info(event: str, **kwargs):
    """结构化日志"""
    logger.info(json.dumps({
        "event": event,
        "timestamp": time.time(),
        **kwargs
    }))
```

### 14.2 性能监控

- API 响应时间统计
- 数据库查询性能
- Redis 命中率
- WebSocket 连接数
