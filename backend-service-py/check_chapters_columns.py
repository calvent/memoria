"""
检查数据库中章节表的实际列结构

运行方式:
    cd backend-service-py
    source .venv/bin/activate.fish
    python check_chapters_columns.py
"""

import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text, inspect


def get_database_url():
    """从环境变量获取数据库URL"""
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        raise RuntimeError("请先设置 DATABASE_URL 环境变量")
    
    if "postgresql+asyncpg://" not in db_url and "postgresql://" in db_url:
         db_url = db_url.replace("postgresql://", "postgresql+asyncpg://")
    return db_url


async def check_chapters_structure():
    """检查 chapters 表的列结构"""
    db_url = get_database_url()
    engine = create_async_engine(db_url)

    async with engine.begin() as conn:
        # 查询 chapters 表的所有列
        result = await conn.execute(text("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'chapters'
            ORDER BY ordinal_position
        """))
        
        columns = result.fetchall()
        
        print("\n" + "=" * 60)
        print("chapters 表的当前列结构:")
        print("=" * 60)
        print(f"{'列名':<30} {'类型':<20} {'可为空'}")
        print("-" * 60)
        
        for col in columns:
            print(f"{col[0]:<30} {col[1]:<20} {col[2]}")
        
        print("=" * 60)
        
        # 标记废弃的列
        deprecated_columns = ['content', 'recording_ids', 'media_ids']
        existing_deprecated = [col[0] for col in columns if col[0] in deprecated_columns]
        
        if existing_deprecated:
            print("\n⚠️  以下列已废弃，可以删除:")
            for col_name in existing_deprecated:
                print(f"   - {col_name}")
        else:
            print("\n✅ 没有发现需要删除的废弃列")
    
    await engine.dispose()


if __name__ == '__main__':
    print("\n检查 chapters 表结构...")
    asyncio.run(check_chapters_structure())
