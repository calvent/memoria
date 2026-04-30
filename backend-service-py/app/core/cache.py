"""Redis 缓存客户端"""
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
    
    async def close(self):
        """关闭连接"""
        if self.client:
            await self.client.close()
    
    async def get(self, key: str) -> str | None:
        """获取值"""
        return await self.client.get(key)
    
    async def set(self, key: str, value: str, ex: int | None = None) -> bool:
        """设置值"""
        return await self.client.set(key, value, ex=ex)
    
    async def delete(self, key: str) -> int:
        """删除键"""
        return await self.client.delete(key)
    
    async def exists(self, key: str) -> bool:
        """检查键是否存在"""
        return await self.client.exists(key) > 0


# 全局 Redis 客户端
redis_client = RedisClient()


async def get_redis() -> RedisClient:
    """依赖注入：获取 Redis 客户端"""
    return redis_client
