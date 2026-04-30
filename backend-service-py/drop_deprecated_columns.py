"""
数据库迁移脚本：删除 chapters 表中的废弃字段

删除字段：
- content (已被 introduction 替代)
- recording_ids (现在通过 Story.recording_id 关联)
- media_ids (应该关联到 Story)

运行方式:
    cd backend-service-py
    source .venv/bin/activate.fish
    python drop_deprecated_columns.py
"""

import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text


def get_database_url():
    """从环境变量获取数据库URL"""
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        raise RuntimeError("请先设置 DATABASE_URL 环境变量")
    
    if "postgresql+asyncpg://" not in db_url and "postgresql://" in db_url:
         db_url = db_url.replace("postgresql://", "postgresql+asyncpg://")
    return db_url


async def drop_deprecated_columns():
    """删除废弃的列"""
    db_url = get_database_url()
    print("🔗 连接数据库...")
    engine = create_async_engine(db_url)

    async with engine.begin() as conn:
        print("\n📦 开始删除 chapters 表的废弃列...")
        
        # 删除 content 列
        try:
            await conn.execute(text("ALTER TABLE chapters DROP COLUMN IF EXISTS content"))
            print("   ✅ 已删除 content 列")
        except Exception as e:
            print(f"   ⚠️  删除 content 列失败: {e}")
        
        # 删除 recording_ids 列
        try:
            await conn.execute(text("ALTER TABLE chapters DROP COLUMN IF EXISTS recording_ids"))
            print("   ✅ 已删除 recording_ids 列")
        except Exception as e:
            print(f"   ⚠️  删除 recording_ids 列失败: {e}")
        
        # 删除 media_ids 列
        try:
            await conn.execute(text("ALTER TABLE chapters DROP COLUMN IF EXISTS media_ids"))
            print("   ✅ 已删除 media_ids 列")
        except Exception as e:
            print(f"   ⚠️  删除 media_ids 列失败: {e}")
        
        print("\n🎉 废弃列删除完成!")
        
        # 验证删除结果
        print("\n📋 验证当前列结构:")
        result = await conn.execute(text("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'chapters'
            ORDER BY ordinal_position
        """))
        
        columns = result.fetchall()
        for col in columns:
            print(f"   - {col[0]}")
    
    await engine.dispose()


if __name__ == '__main__':
    print("=" * 60)
    print("删除 chapters 表废弃列")
    print("=" * 60)
    
    # 确认操作
    print("\n⚠️  即将删除以下列:")
    print("   - content")
    print("   - recording_ids")
    print("   - media_ids")
    print("\n这个操作不可逆！")
    
    confirm = input("\n是否继续？(yes/no): ").strip().lower()
    
    if confirm == 'yes':
        asyncio.run(drop_deprecated_columns())
    else:
        print("\n❌ 操作已取消")
