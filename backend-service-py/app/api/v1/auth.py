"""认证路由"""
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.db import get_db
from app.schemas.auth import WechatLoginRequest, RefreshTokenRequest, PhoneLoginRequest
from app.services import auth as auth_service
from app.utils.response import success_response
from app.utils.http import handle_value_error


router = APIRouter()


@router.post("/wechat_login")
async def wechat_login(
    body: WechatLoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """微信登录"""
    result = await handle_value_error(
        lambda: auth_service.wechat_login(db, body.code),
        status_code=400,
    )
    return success_response(result)


@router.post("/refresh_token")
async def refresh_token(
    body: RefreshTokenRequest,
    authorization: str | None = Header(default=None, alias="Authorization")
):
    """刷新 Token"""
    refresh_token_value = body.refresh_token
    if not refresh_token_value and authorization:
        if authorization.startswith("Bearer "):
            refresh_token_value = authorization.replace("Bearer ", "")

    if not refresh_token_value:
        raise HTTPException(status_code=400, detail="缺少 refresh token")

    result = await handle_value_error(
        lambda: auth_service.refresh_access_token(refresh_token_value),
        status_code=400,
    )
    return success_response(result)


@router.post("/phone_login")
async def phone_login(
    body: "PhoneLoginRequest",
    db: AsyncSession = Depends(get_db)
):
    """手机号登录(仅用于开发测试)"""
    result = await handle_value_error(
        lambda: auth_service.phone_login(db, body.phone),
        status_code=400,
    )
    return success_response(result)


@router.post("/logout")
async def logout():
    """登出"""
    return success_response({"message": "登出成功"})
