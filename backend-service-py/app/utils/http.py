"""HTTP 异常辅助方法"""
from typing import Awaitable, Callable, TypeVar
from fastapi import HTTPException


T = TypeVar("T")


async def handle_value_error(
    func: Callable[[], Awaitable[T]],
    status_code: int = 400,
) -> T:
    """捕获 ValueError 并转换为 HTTPException"""
    try:
        return await func()
    except ValueError as exc:
        raise HTTPException(status_code=status_code, detail=str(exc))
