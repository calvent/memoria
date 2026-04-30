"""认证服务"""
import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.config import settings
from app.core.security import create_access_token, create_refresh_token, verify_token
from app.models import User


async def wechat_login(db: AsyncSession, code: str) -> dict:
    """微信登录"""
    # 开发环境支持 mock 登录
    if settings.node_env == "development" and code in {"dev", "test"}:
        openid = "dev-mock-openid"
    else:
        # 调用微信 API 获取 openid
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.weixin.qq.com/sns/jscode2session",
                params={
                    "appid": settings.wechat_appid,
                    "secret": settings.wechat_secret,
                    "js_code": code,
                    "grant_type": "authorization_code",
                }
            )
            data = response.json()

        if "errcode" in data:
            raise ValueError(f"微信登录失败: {data.get('errmsg')}")

        if "openid" not in data:
            raise ValueError("未获取到 openid")

        openid = data["openid"]
    
    # 查找或创建用户
    stmt = select(User).where(User.wechat_openid == openid)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if not user:
        user = User(wechat_openid=openid, role="user")
        db.add(user)
        await db.flush()
    
    # 生成 Token
    access_token = create_access_token({"user_id": user.id, "role": user.role})
    refresh_token = create_refresh_token({"user_id": user.id, "role": user.role})
    
    return {
        "token": access_token,
        "refreshToken": refresh_token,
        "user": {
            "id": str(user.id),
            "role": user.role,
        }
    }


async def refresh_access_token(refresh_token: str) -> dict:
    """刷新访问 Token"""
    payload = verify_token(refresh_token)
    
    if payload.get("type") != "refresh":
        raise ValueError("无效的刷新 Token")
    
    user_id = payload.get("user_id") or payload.get("userId")
    role = payload.get("role", "user")
    if not user_id:
        raise ValueError("无效的刷新 Token")
    
    # 生成新的访问 Token
    new_access_token = create_access_token({"user_id": user_id, "role": role})
    
    return {
        "token": new_access_token,
    }


async def phone_login(db: AsyncSession, phone: str) -> dict:
    """手机号登录(仅用于开发测试)"""
    if settings.node_env != "development":
        raise ValueError("此接口仅在开发环境可用")
    
    # 查找用户
    stmt = select(User).where(User.phone == phone)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if not user:
        raise ValueError(f"未找到手机号为 {phone} 的用户")
    
    # 生成 Token
    access_token = create_access_token({"user_id": user.id, "role": user.role})
    refresh_token = create_refresh_token({"user_id": user.id, "role": user.role})
    
    return {
        "token": access_token,
        "refreshToken": refresh_token,
        "user": {
            "id": str(user.id),
            "role": user.role,
        }
    }
