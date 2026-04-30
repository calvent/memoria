"""认证相关 Schemas"""
from app.schemas.base import APIModel


class WechatLoginRequest(APIModel):
    """微信登录请求"""
    code: str


class RefreshTokenRequest(APIModel):
    """刷新 Token 请求"""
    refresh_token: str | None = None


class PhoneLoginRequest(APIModel):
    """手机号登录请求(测试用)"""
    phone: str
