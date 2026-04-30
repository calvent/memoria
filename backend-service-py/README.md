# Memoria Backend Service

基于 FastAPI 的后端服务。

## 快速开始

### 前置要求
- Python 3.13+ (conda base 环境)
- uv 包管理器

### 安装与启动

```bash
# 1. 激活 conda base 环境
conda activate base

# 2. 进入项目目录
cd backend-service-py

# 3. 同步依赖
uv sync

# 4. 启动服务
./start.sh
# 或
uv run uvicorn app.main:app --reload --port 8999
```

## API 文档

启动后访问：
- Swagger UI: http://localhost:8999/docs
- ReDoc: http://localhost:8999/redoc

## 技术栈

| 组件 | 技术 |
|------|------|
| 框架 | FastAPI |
| ORM | SQLAlchemy 2.0 |
| 数据库 | PostgreSQL + asyncpg |
| 缓存 | Redis |
| 存储 | MinIO |
| 认证 | python-jose + passlib |
| 包管理 | uv |

## 项目结构

```
app/
├── main.py              # 应用入口
├── config.py            # 配置
├── core/               # 核心功能（db, cache, storage, security）
├── models/             # 数据库模型
├── schemas/            # Pydantic Schemas
├── api/                # API 路由
├── services/           # 业务逻辑
└── utils/              # 工具函数
```

## 常用命令

```bash
# 添加依赖
uv add package-name

# 移除依赖
uv remove package-name

# 运行脚本
uv run python script.py

# 数据库迁移
alembic revision --autogenerate -m "message"
alembic upgrade head
```

## 环境变量

复制 `.env.example` 为 `.env` 并配置：

```bash
cp .env.example .env
# 编辑 .env 配置数据库、Redis、MinIO 等
```

## 开发原则

1. **做减法**：不引入不必要的抽象
2. **职责单一**：路由、服务、模型各司其职
3. **类型安全**：使用 Pydantic 验证所有输入输出
