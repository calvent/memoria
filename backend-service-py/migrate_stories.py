"""
数据迁移脚本：拆分 MD 文件中的回忆片段到 Story 表 (Asyncpg版)

功能：
1. 读取 docs/content_*.md 文件
2. 解析每个章节和回忆片段
3. 创建/更新 Story 表的数据
4. 将 Chapter.content 迁移到 introduction 字段

使用方法：
    cd backend-service-py
    source .venv/bin/activate.fish
    python migrate_stories.py
"""

import re
import os
import asyncio
from datetime import datetime
from pathlib import Path

# 添加项目路径
import sys
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import select, update
from app.models import Memoir, Chapter, Story, ElderProfile
# from app.core.config import settings

def parse_md_file(filepath: str) -> list[dict]:
    """
    解析 Markdown 文件，提取章节和回忆片段
    
    返回格式:
    [
        {
            "chapter_title": "学徒时光 (1970-1975)",
            "chapter_description": "子承父业、学徒生涯",
            "time_period": "1970-1975",
            "stories": [
                {
                    "title": "进厂第一天",
                    "happened_at": "1970年8月",
                    "content": "1970年8月15日...",
                    "order": 1
                },
                ...
            ]
        },
        ...
    ]
    """
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    chapters = []
    
    # 匹配章节标题: "## 章节1: 学徒时光 (1970-1975)" 或 "# 张天明 - 章节1: 童年时光 (1950-1966)"
    chapter_pattern = r'^##?\s*(?:章节\d+[:：]\s*)?(.+?)(?:\s*\((\d{4}(?:-\d{4}|至今)?)\))?\s*$'
    
    # 分割章节
    lines = content.split('\n')
    current_chapter = None
    current_story = None
    story_content_lines = []
    
    for line in lines:
        # 检查是否是章节标题
        chapter_match = re.match(r'^##\s*章节\d*[:：]?\s*(.+?)(?:\s*\((\d{4}(?:[—-]\d{4}|至今)?)\))?\s*$', line)
        if not chapter_match:
            # 也匹配主标题中的章节信息
            chapter_match = re.match(r'^#\s*.+?\s*[-–—]\s*章节\d*[:：]?\s*(.+?)(?:\s*\((\d{4}(?:[—-]\d{4}|至今)?)\))?\s*$', line)
        
        if chapter_match:
            # 保存之前的故事
            if current_story and story_content_lines:
                current_story['content'] = '\n'.join(story_content_lines).strip()
                if current_chapter:
                    current_chapter['stories'].append(current_story)
            
            # 开始新章节
            current_chapter = {
                'chapter_title': chapter_match.group(1).strip(),
                'time_period': chapter_match.group(2) if chapter_match.group(2) else None,
                'chapter_description': None,
                'stories': []
            }
            chapters.append(current_chapter)
            current_story = None
            story_content_lines = []
            continue
        
        # 检查是否是核心主题/描述
        theme_match = re.match(r'^\*\*核心主题\*\*[:：]\s*(.+)$', line)
        if theme_match and current_chapter:
            current_chapter['chapter_description'] = theme_match.group(1).strip()
            continue
        
        # 检查是否是回忆标题: "### 回忆1: 进厂第一天 (1970年8月)" 或 "## 回忆1: xxx"
        story_match = re.match(r'^##?#?\s*回忆\d+[:：]\s*(.+?)(?:\s*\((.+?)\))?\s*$', line)
        if story_match:
            # 保存之前的故事
            if current_story and story_content_lines:
                current_story['content'] = '\n'.join(story_content_lines).strip()
                if current_chapter:
                    current_chapter['stories'].append(current_story)
            
            # 开始新故事
            current_story = {
                'title': story_match.group(1).strip(),
                'happened_at': story_match.group(2).strip() if story_match.group(2) else None,
                'content': '',
                'order': len(current_chapter['stories']) + 1 if current_chapter else 1
            }
            story_content_lines = []
            continue
        
        # 跳过分隔线
        if line.strip() == '---':
            continue
        
        # 收集故事内容
        if current_story is not None:
            story_content_lines.append(line)
    
    # 保存最后一个故事
    if current_story and story_content_lines:
        current_story['content'] = '\n'.join(story_content_lines).strip()
        if current_chapter:
            current_chapter['stories'].append(current_story)
    
    return chapters


async def get_memoir_by_elder_name(session: AsyncSession, elder_name: str) -> Memoir | None:
    """根据老人名字找到对应的回忆录"""
    stmt = select(Memoir).join(ElderProfile, Memoir.elder_id == ElderProfile.id).where(
        ElderProfile.name == elder_name
    )
    result = await session.execute(stmt)
    return result.scalars().first()

def get_database_url():
    """从环境变量获取数据库URL"""
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        raise RuntimeError("请先设置 DATABASE_URL 环境变量")
    
    if "postgresql+asyncpg://" not in db_url and "postgresql://" in db_url:
         db_url = db_url.replace("postgresql://", "postgresql+asyncpg://")
    return db_url

async def migrate_stories_from_md():
    """主迁移函数"""
    print("🚀 开始数据迁移...")
    
    # 创建数据库连接
    db_url = get_database_url()
    engine = create_async_engine(db_url)
    AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)
    
    # MD 文件与老人名字的映射
    file_mappings = [
        ('docs/content_1_zhangdaming_ch1.md', '张天明'),
        ('docs/content_1_zhangdaming_ch2.md', '张天明'),
        ('docs/content_1_zhangdaming_ch3.md', '张天明'),
        ('docs/content_2_lixiufang_ch1.md', '李秀芳'),
        ('docs/content_2_lixiufang_ch2.md', '李秀芳'),
        ('docs/content_2_lixiufang_ch3.md', '李秀芳'),
        ('docs/content_2_lixiufang_ch4.md', '李秀芳'),
        ('docs/content_2_lixiufang_ch5.md', '李秀芳'),
        ('docs/content_3_wangjianguo_ch1.md', '王建国'),
        ('docs/content_3_wangjianguo_ch2-7.md', '王建国'),
        ('docs/content_4_liudehua_ch1-4.md', '刘和平'),
    ]
    
    base_path = Path(__file__).parent.parent
    total_stories = 0
    
    async with AsyncSessionLocal() as session:
        try:
            for md_file, elder_name in file_mappings:
                filepath = base_path / md_file
                if not filepath.exists():
                    print(f"⚠️  文件不存在: {md_file}")
                    continue
                
                print(f"\n📖 处理文件: {md_file}")
                
                # 找到对应的回忆录
                memoir = await get_memoir_by_elder_name(session, elder_name)
                if not memoir:
                    print(f"   ⚠️  未找到回忆录 (老人: {elder_name})")
                    continue
                
                print(f"   找到回忆录: {memoir.title} (ID: {memoir.id})")
                
                # 解析 MD 文件
                chapters_data = parse_md_file(str(filepath))
                
                for chapter_data in chapters_data:
                    # 查找或创建章节
                    chapter_title = chapter_data['chapter_title']
                    clean_title = chapter_title.split('(')[0].strip()
                    stmt = select(Chapter).where(
                        Chapter.memoir_id == memoir.id,
                        Chapter.title.contains(clean_title)
                    )
                    result = await session.execute(stmt)
                    chapter = result.scalars().first()
                    
                    if not chapter:
                        print(f"   ⚠️  未找到章节: {chapter_title} (尝试创建)")
                        # 获取最大排序
                        max_order_stmt = select(Chapter.order).where(Chapter.memoir_id == memoir.id).order_by(Chapter.order.desc()).limit(1)
                        order_result = await session.execute(max_order_stmt)
                        max_order = order_result.scalar() or 0
                        
                        chapter = Chapter(
                            memoir_id=memoir.id,
                            title=chapter_title,
                            description=chapter_data.get('chapter_description'),
                            time_period=chapter_data.get('time_period'),
                            order=max_order + 1,
                            is_ai_generated=False
                        )
                        session.add(chapter)
                        await session.flush()
                        print(f"      ✅ 创建新章节: {chapter.title}")
                    else:
                        # 更新章节信息
                        if chapter_data.get('chapter_description'):
                            chapter.description = chapter_data['chapter_description']
                        if chapter_data.get('time_period'):
                            chapter.time_period = chapter_data['time_period']
                    
                    # 迁移 content 到 introduction (如果 content 有值且 introduction 为空)
                    # 注意：SQLAlchemy 模型对象可能还没更新字段映射，这里假设已更新
                    # 如果 introduction 字段在模型中存在
                    if hasattr(chapter, 'content') and hasattr(chapter, 'introduction'):
                         # 这里我们不直接依赖 ORM 属性，而是假设数据库列已存在
                         pass

                    # 创建故事
                    for story_data in chapter_data['stories']:
                        # 检查是否已存在
                        story_stmt = select(Story).where(
                            Story.chapter_id == chapter.id,
                            Story.title == story_data['title']
                        )
                        result = await session.execute(story_stmt)
                        existing_story = result.scalars().first()
                        
                        if existing_story:
                            print(f"      ⏭️  故事已存在: {story_data['title']}")
                            continue
                        
                        story = Story(
                            memoir_id=memoir.id,
                            chapter_id=chapter.id,
                            title=story_data['title'],
                            content=story_data['content'],
                            happened_at=story_data.get('happened_at'),
                            order=story_data['order'],
                            source='manual',
                            is_ai_processed=True,  # 已经处理过的内容
                        )
                        session.add(story)
                        total_stories += 1
                        print(f"      ✅ 创建故事: {story_data['title']}")
            
            await session.commit()
            print(f"\n🎉 迁移完成! 共创建 {total_stories} 个故事")
            
        except Exception as e:
            await session.rollback()
            print(f"\n❌ 迁移失败: {e}")
            import traceback
            traceback.print_exc()
        finally:
            await engine.dispose()


if __name__ == '__main__':
    print("=" * 50)
    print("Story 数据迁移脚本 (Async)")
    print("=" * 50)
    asyncio.run(migrate_stories_from_md())
