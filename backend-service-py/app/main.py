"""FastAPI 主应用入口"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import settings
from app.core.cache import redis_client
from app.core.storage import minio_client
from app.api.v1 import auth, memoir, recording, media, chapter, speech, story
from app.utils.response import error_response


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 启动时
    print("\n┌─────────────────────────────────────────┐")
    print("│  🚀 Memoria Backend Service (Python)   │")
    print("├─────────────────────────────────────────┤")
    print(f"│  📡 HTTP: http://localhost:{settings.port}        │")
    print(f"│  🌍 Environment: {settings.node_env.ljust(21)}│")
    print("└─────────────────────────────────────────┘\n")
    
    # 初始化 Redis
    await redis_client.connect()
    print("✅ Redis 连接成功")
    
    # 初始化 MinIO
    try:
        minio_client.init_buckets()
    except Exception as e:
        print(f"❌ MinIO 初始化失败: {e}")
    
    yield
    
    # 关闭时
    await redis_client.close()
    print("✅ Redis 连接已关闭")


# 创建 FastAPI 应用
app = FastAPI(
    title="Memoria Backend API",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS 中间件
app.add_middleware( 
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境应该限制
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 健康检查
@app.get("/health")
async def health_check():
    """健康检查"""
    from time import time
    return {
        "status": "ok",
        "timestamp": int(time() * 1000),
        "env": settings.node_env,
    }


# 根路由
@app.get("/")
async def root():
    """API 根路由"""
    return {
        "name": "Memoria Backend API (Python)",
        "version": "0.1.0",
        "env": settings.node_env,
        "endpoints": {
            "auth": "/api/v1/auth",
            "memoir": "/api/v1/memoir",
            "recording": "/api/v1/recording",
            "media": "/api/v1/media",
            "chapter": "/api/v1/chapter",
            "websocket": {
                "realtimeASR": f"ws://localhost:{settings.port}/api/v1/speech/realtime?token=<JWT>",
            },
        },
    }


# 注册路由
app.include_router(auth.router, prefix="/api/v1/auth", tags=["认证"])
app.include_router(memoir.router, prefix="/api/v1/memoir", tags=["回忆录"])
app.include_router(recording.router, prefix="/api/v1/recording", tags=["录音"])
app.include_router(media.router, prefix="/api/v1/media", tags=["媒体"])
app.include_router(chapter.router, prefix="/api/v1/chapter", tags=["章节"])
app.include_router(story.router, prefix="/api/v1/story", tags=["故事"])
app.include_router(speech.router, prefix="/api/v1", tags=["语音"])


# HTTP 异常处理
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """HTTP 异常处理"""
    return JSONResponse(
        status_code=exc.status_code,
        content=error_response(str(exc.detail), code=exc.status_code),
    )


# 全局异常处理
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """全局异常处理"""
    from time import time
    print(f"❌ 全局错误: {exc}")
    return JSONResponse(
        status_code=500,
        content=error_response(str(exc), code=500),
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=settings.port,
        reload=settings.node_env == "development",
    )
