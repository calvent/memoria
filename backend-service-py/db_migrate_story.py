"""
数据库迁移脚本：创建 Story 表，更新 Chapter 表结构 (Asyncpg版)

运行方式:
    cd backend-service-py
    source .venv/bin/activate.fish
    python db_migrate_story.py
"""

import sys
import os
import asyncio
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

async def run_migration():
    """执行数据库迁移"""
    db_url = get_database_url()
    print("🔗 连接数据库...")
    engine = create_async_engine(db_url)

    async with engine.begin() as conn:
        print("📦 检查并创建 stories 表...")
        # Creation
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS stories (
                id BIGSERIAL PRIMARY KEY,
                memoir_id BIGINT NOT NULL REFERENCES memoirs(id) ON DELETE CASCADE,
                chapter_id BIGINT REFERENCES chapters(id) ON DELETE SET NULL,
                title VARCHAR(200) NOT NULL,
                content TEXT NOT NULL,
                happened_at VARCHAR(100),
                location VARCHAR(200),
                keywords TEXT,
                "order" INTEGER DEFAULT 0,
                source VARCHAR(20) DEFAULT 'manual',
                is_ai_processed BOOLEAN DEFAULT FALSE,
                recording_id BIGINT REFERENCES recordings(id) ON DELETE SET NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
        await conn.execute(text("CREATE INDEX IF NOT EXISTS idx_stories_memoir_id ON stories(memoir_id)"))
        await conn.execute(text("CREATE INDEX IF NOT EXISTS idx_stories_chapter_id ON stories(chapter_id)"))
        print("   ✅ stories 表检查/创建完成")

        # 更新 chapters 表
        print("📦 更新 chapters 表结构...")
        await conn.execute(text("ALTER TABLE chapters ADD COLUMN IF NOT EXISTS description TEXT"))
        await conn.execute(text("ALTER TABLE chapters ADD COLUMN IF NOT EXISTS time_period VARCHAR(100)"))
        await conn.execute(text("ALTER TABLE chapters ADD COLUMN IF NOT EXISTS introduction TEXT"))
        print("   ✅ 新增列添加完成")

        # 迁移 content
        # 检查 content 列是否存在
        result = await conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='chapters' AND column_name='content'"))
        if result.scalar():
            print("📦 迁移 chapters.content 到 introduction...")
            await conn.execute(text("""
                UPDATE chapters 
                SET introduction = content 
                WHERE content IS NOT NULL AND introduction IS NULL
            """))
            print("   ✅ 内容迁移完成")
        else:
            print("   ⏭️  content 列不存在，跳过迁移")

    await engine.dispose()
    print("\n🎉 数据库迁移完成!")

if __name__ == '__main__':
    print("=" * 50)
    print("数据库迁移: Story 表 & Chapter 表更新")
    print("=" * 50)
    try:
        asyncio.run(run_migration())
    except Exception as e:
        print(f"\n❌ 迁移失败: {e}")
        # 打印更多错误信息
        import traceback
        traceback.print_exc()
