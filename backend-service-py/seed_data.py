#!/usr/bin/env python3
"""
数据库数据填充脚本
从md文件读取完整的回忆录内容并导入到PostgreSQL数据库
"""
import asyncio
import sys
import re
from datetime import datetime
from pathlib import Path

# 添加项目根目录到路径
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import select, text
from app.core.db import AsyncSessionLocal, engine
from app.models import User, ElderProfile, Memoir, Chapter


# 获取项目根目录和docs目录
PROJECT_ROOT = Path(__file__).parent.parent
DOCS_DIR = PROJECT_ROOT / "docs"


def read_md_file(filename: str) -> str:
    """读取md文件内容"""
    filepath = DOCS_DIR / filename
    if not filepath.exists():
        print(f"⚠️  文件不存在: {filepath}")
        return ""
    
    with open(filepath, 'r', encoding='utf-8') as f:
        return f.read()


def parse_chapters_from_md(content: str) -> list[dict]:
    """
    从md文件解析章节
    假设格式为: ## 回忆N: 标题
    或者: # 章节标题
    """
    chapters = []
    
    # 使用正则表达式分割章节
    # 匹配 ## 回忆N: 标题 或者 # 标题
    sections = re.split(r'\n(?=##\s+回忆\d+:|##\s+\S)', content)
    
    for section in sections:
        if not section.strip():
            continue
        
        # 提取标题
        lines = section.strip().split('\n')
        if not lines:
            continue
        
        title_line = lines[0]
        # 移除 ## 回忆N: 前缀
        title = re.sub(r'^##\s+回忆\d+:\s*', '', title_line)
        title = re.sub(r'^##\s+', '', title)
        
        if title:
            chapters.append({
                'title': title.strip(),
                'content': section.strip()
            })
    
    return chapters


# 用户和档案数据配置
USERS_CONFIG = [
    {
        "phone": "13800138001",
        "wechat_openid": "wx_zhangdaming_001",
        "elder": {
            "name": "张天明",
            "nickname": "老张",
            "birth_year": 1950,
            "birth_month": 3,
            "gender": "男",
            "hometown": "上海市杨浦区",
            "dialect": "上海话",
        },
        "memoir": {
            "title": "我的人生回忆录",
            "description": "从工人家庭的童年,到知青岁月,再到工厂工作,记录了一个普通上海人的一生",
            "cover_image": "https://images.unsplash.com/photo-1760348462684-f988e6bc95c1",
            "status": "completed",
            "content_files": [
                "content_1_zhangdaming_ch1.md",
                "content_1_zhangdaming_ch2.md",
                "content_1_zhangdaming_ch3.md",
            ],
            "chapter_types": ["childhood", "work", "family"],
        },
    },
    {
        "phone": "13800138002",
        "wechat_openid": "wx_lixiufang_002",
        "elder": {
            "name": "李秀芳",
            "nickname": "芳姐",
            "birth_year": 1952,
            "birth_month": 6,
            "gender": "女",
            "hometown": "江苏苏州农村",
            "dialect": "苏州话",
        },
        "memoir": {
            "title": "我的教师生涯",
            "description": "从1970年开始,在乡村小学当了四十年的老师。这里记录了我和学生们的点点滴滴,以及农村教育事业的变迁",
            "cover_image": "https://images.unsplash.com/photo-1647054894739-e77b1fd21343",
            "status": "completed",
            "content_files": [
                "content_2_lixiufang_ch1.md",
                "content_2_lixiufang_ch2.md",
                "content_2_lixiufang_ch3.md",
                "content_2_lixiufang_ch4.md",
                "content_2_lixiufang_ch5.md",
            ],
            "chapter_types": ["work", "achievement", "reform", "relationship", "retirement"],
        },
    },
    {
        "phone": "13800138003",
        "wechat_openid": "wx_wangjianguo_003",
        "elder": {
            "name": "王建国",
            "nickname": "建国叔",
            "birth_year": 1955,
            "birth_month": 4,
            "gender": "男",
            "hometown": "上海市黄浦区",
            "dialect": "上海话",
        },
        "memoir": {
            "title": "医者仁心:我的从医回忆",
            "description": "1975年进入医学院,1980年成为一名内科医生。这些年来,见证了无数生命的诞生与离去,也见证了中国医疗事业的发展",
            "cover_image": "https://images.unsplash.com/photo-1625246433906-6cfa33544b31",
            "status": "completed",
            "content_files": [
                "content_3_wangjianguo_ch1.md",
                "content_3_wangjianguo_ch2-7.md",  # 第2-7章合并在一个文件
            ],
            "chapter_types": ["education", "career_start", "cases", "relationship", "progress", "colleague", "reflection"],
        },
    },
    {
        "phone": "13800138004",
        "wechat_openid": "wx_liudehua_004",
        "elder": {
            "name": "刘和平",
            "nickname": None,  # 示例：没有昵称的情况
            "birth_year": 1953,
            "birth_month": 8,
            "gender": "男",
            "hometown": "上海市浦东新区",
            "dialect": "上海话",
        },
        "memoir": {
            "title": "工厂岁月",
            "description": "在上钢三厂工作了35年,从学徒工到高级技师。那些年的艰苦奋斗、工友情谊,都是我最宝贵的财富",
            "cover_image": "https://images.unsplash.com/photo-1582140110185-b920b4d175f4",
            "status": "completed",
            "content_files": [
                "content_4_liudehua_ch1-4.md",  # 全部4章合并
            ],
            "chapter_types": ["apprentice", "career", "friendship", "retirement"],
        },
    },
]


async def clear_data(session):
    """清空现有测试数据(可选)"""
    print("⚠️  警告: 此操作将删除数据库中的所有数据!")
    confirm = input("确定要继续吗? (输入 'yes' 确认): ")
    if confirm.lower() != 'yes':
        print("❌ 操作已取消")
        return False

    # 按依赖顺序删除
    await session.execute(text("DELETE FROM chapters"))
    await session.execute(text("DELETE FROM memoirs"))
    await session.execute(text("DELETE FROM elder_profiles"))
    await session.execute(text("DELETE FROM users"))
    await session.commit()
    
    print("✅ 数据已清空")
    return True


async def seed_data():
    """填充数据"""
    async with AsyncSessionLocal() as session:
        try:
            print("\n" + "="*50)
            print("  开始填充回忆录数据到数据库")
            print("  从md文件读取完整内容")
            print("="*50 + "\n")

            total_chapters = 0

            for idx, user_config in enumerate(USERS_CONFIG, 1):
                print(f"\n[{idx}/4] 正在创建用户: {user_config['elder']['name']}")
                
                # 创建用户
                user = User(
                    phone=user_config["phone"],
                    wechat_openid=user_config["wechat_openid"],
                    role="user",
                )
                session.add(user)
                await session.flush()
                print(f"  ✓ 用户创建成功 (ID: {user.id})")

                # 创建老人档案
                elder = ElderProfile(
                    user_id=user.id,
                    **user_config["elder"]
                )
                session.add(elder)
                await session.flush()
                print(f"  ✓ 老人档案创建成功 (ID: {elder.id})")

                # 创建回忆录
                memoir_config = user_config["memoir"]
                memoir = Memoir(
                    user_id=user.id,
                    elder_id=elder.id,
                    title=memoir_config["title"],
                    description=memoir_config["description"],
                    cover_image=memoir_config["cover_image"],
                    status=memoir_config["status"],
                )
                session.add(memoir)
                await session.flush()
                print(f"  ✓ 回忆录创建成功 (ID: {memoir.id}) - {memoir.title}")

                # 读取并创建章节
                print(f"  📖 开始读取章节内容...")
                
                all_chapters = []
                for md_file in memoir_config["content_files"]:
                    print(f"    ├─ 读取文件: {md_file}")
                    content = read_md_file(md_file)
                    
                    if not content:
                        continue
                    
                    # 解析章节
                    if "ch1-4" in md_file or "ch2-7" in md_file:
                        # 多章节合并文件,按 ## 章节N: 标题 格式分割
                        sections = re.split(r'\n(?=##\s+章节\d+:)', content)
                        for section in sections:
                            if section.strip():
                                # 提取章节标题
                                first_line = section.strip().split('\n')[0]
                                title_match = re.search(r'##\s+章节\d+:\s+(.+)', first_line)
                                if title_match:
                                    all_chapters.append({
                                        'title': title_match.group(1).strip(),
                                        'content': section.strip()
                                    })
                    else:
                        # 单章节文件
                        # 格式: # 张天明 - 章节1: 童年时光 (1950-1966)
                        # 或者: # 李秀芳 - 章节1: 初为人师 (1970-1980)
                        lines = content.strip().split('\n')
                        title = ''
                        content_start_idx = 0
                        
                        for idx, line in enumerate(lines):
                            if line.startswith('# '):
                                # 提取 "章节X: 标题" 部分
                                match = re.search(r'章节\d+:\s*(.+?)(?:\s*\(|$)', line)
                                if match:
                                    title = match.group(1).strip()
                                else:
                                    # 如果没有章节X:格式，尝试提取 - 后面的部分
                                    parts = line[2:].split('-')
                                    if len(parts) > 1:
                                        # 取最后一部分,去掉括号内容
                                        title = parts[-1].split('(')[0].strip()
                                    else:
                                        title = parts[0].strip()
                                content_start_idx = idx + 1
                                break
                        
                        if not title:
                            # 如果还是没找到,用文件名
                            title = md_file.replace('.md', '').split('_')[-1]
                        
                        # 跳过元数据部分 (编写状态、时间跨度、核心主题等)
                        while content_start_idx < len(lines):
                            line = lines[content_start_idx].strip()
                            # 跳过空行、**开头的元数据行、---分隔线
                            if not line or line.startswith('**') or line == '---':
                                content_start_idx += 1
                            else:
                                break
                        
                        # 提取实际内容(从第一个##开始)
                        actual_content = '\n'.join(lines[content_start_idx:]).strip()
                        
                        all_chapters.append({
                            'title': title,
                            'content': actual_content
                        })

                # 创建章节记录
                chapter_types = memoir_config.get("chapter_types", [])
                for order, chapter_data in enumerate(all_chapters, 1):
                    chapter_type = chapter_types[order - 1] if order - 1 < len(chapter_types) else "general"
                    
                    chapter = Chapter(
                        memoir_id=memoir.id,
                        title=chapter_data["title"],
                        content=chapter_data["content"],
                        order=order,
                        type=chapter_type,
                        is_ai_generated=False,
                    )
                    session.add(chapter)
                    
                    # 显示内容长度
                    content_len = len(chapter_data["content"])
                    print(f"    └─ 章节{order}: {chapter_data['title']} ({content_len:,} 字符)")

                await session.flush()
                chapters_count = len(all_chapters)
                total_chapters += chapters_count
                print(f"  ✓ 所有章节创建完成 ({chapters_count}个)")

            # 提交所有更改
            await session.commit()
            
            print("\n" + "="*50)
            print("  ✅ 数据填充完成!")
            print("="*50)
            print(f"\n📊 统计:")
            print(f"  • 用户数: 4")
            print(f"  • 老人档案: 4")
            print(f"  • 回忆录: 4")
            print(f"  • 章节总数: {total_chapters}")
            print(f"    - 张天明: 3章")
            print(f"    - 李秀芳: 5章")
            print(f"    - 王建国: 7章")
            print(f"    - 刘和平: 4章")
            print()
            
        except Exception as e:
            await session.rollback()
            print(f"\n❌ 错误: {e}")
            import traceback
            traceback.print_exc()
            raise


async def verify_data():
    """验证数据"""
    async with AsyncSessionLocal() as session:
        # 查询统计
        users_count = (await session.execute(select(User))).scalars().all()
        memoirs_count = (await session.execute(select(Memoir))).scalars().all()
        chapters_count = (await session.execute(select(Chapter))).scalars().all()
        
        print("\n" + "="*50)
        print("  数据验证")
        print("="*50)
        print(f"\n实际数据:")
        print(f"  • 用户: {len(users_count)}个")
        print(f"  • 回忆录: {len(memoirs_count)}个")
        print(f"  • 章节: {len(chapters_count)}个")
        
        # 显示每个回忆录的详情
        print(f"\n回忆录列表:")
        for memoir in memoirs_count:
            elder = await session.get(ElderProfile, memoir.elder_id)
            chapters = (await session.execute(
                select(Chapter).where(Chapter.memoir_id == memoir.id).order_by(Chapter.order)
            )).scalars().all()
            print(f"\n  📕 {memoir.title} ({elder.name}) - {len(chapters)}个章节")
            for ch in chapters:
                content_len = len(ch.content) if ch.content else 0
                print(f"      {ch.order}. {ch.title} ({content_len:,} 字符)")


async def main():
    """主函数"""
    import argparse
    
    parser = argparse.ArgumentParser(description='回忆录数据库数据填充脚本 - 从md文件读取')
    parser.add_argument('--clean', action='store_true', help='清空现有数据后再填充')
    parser.add_argument('--verify', action='store_true', help='仅验证数据,不填充')
    
    args = parser.parse_args()
    
    if args.verify:
        await verify_data()
        return
    
    if args.clean:
        async with AsyncSessionLocal() as session:
            cleared = await clear_data(session)
            if not cleared:
                return
    
    await seed_data()
    await verify_data()
    
    print("\n✨ 完成! 现在可以通过API查看数据了")
    print(f"   例如: curl http://localhost:8999/api/v1/memoir/list\n")


if __name__ == "__main__":
    asyncio.run(main())
