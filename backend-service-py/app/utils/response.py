"""统一响应格式"""
from typing import TypeVar, Generic, Any
from pydantic import BaseModel


T = TypeVar("T")


class Response(BaseModel, Generic[T]):
    """标准响应格式"""
    code: int = 0
    message: str = "success"
    data: T | None = None
    timestamp: int


class PaginatedData(BaseModel, Generic[T]):
    """分页数据"""
    items: list[T]
    pagination: dict


def success_response(data: Any = None, message: str = "success") -> dict:
    """成功响应"""
    from time import time
    return {
        "code": 0,
        "message": message,
        "data": data,
        "timestamp": int(time() * 1000),
    }


def error_response(message: str, code: int = 40000, error: Any | None = None) -> dict:
    """错误响应"""
    from time import time
    return {
        "code": code,
        "message": message,
        "error": error,
        "timestamp": int(time() * 1000),
    }


def paginated_response(items: list, total: int, page: int, page_size: int) -> dict:
    """分页响应"""
    total_pages = (total + page_size - 1) // page_size if page_size else 0
    return success_response({
        "items": items,
        "pagination": {
            "page": page,
            "pageSize": page_size,
            "total": total,
            "totalPages": total_pages,
        },
    })
