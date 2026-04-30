"""JWT 和安全工具"""
from jose import jwt, JWTError
from datetime import datetime, timedelta
from passlib.context import CryptContext
from app.config import settings


# 密码加密上下文
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT 算法
ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    """哈希密码"""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """验证密码"""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict) -> str:
    """创建访问 Token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(seconds=settings.jwt_access_expires_in)
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.jwt_secret, algorithm=ALGORITHM)


def create_refresh_token(data: dict) -> str:
    """创建刷新 Token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(seconds=settings.jwt_refresh_expires_in)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, settings.jwt_secret, algorithm=ALGORITHM)


def verify_token(token: str) -> dict:
    """验证 Token"""
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[ALGORITHM])
        return payload
    except JWTError as e:
        # 统一处理所有 JWT 错误
        error_msg = str(e).lower()
        if "expired" in error_msg:
            raise ValueError("Token 已过期")
        else:
            raise ValueError("无效的 Token")
