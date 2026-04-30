#!/usr/bin/env python3
"""
排查回忆录数据问题的脚本
检查用户、回忆录的对应关系
"""
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import select
from app.core.db import AsyncSessionLocal
from app.models import User, ElderProfile, Memoir


async def debug():
    """排查数据"""
    async with AsyncSessionLocal() as session:
        print("\n" + "="*60)
        print("  数据库用户与回忆录对应关系")
        print("="*60)

        # 查询所有用户
        users = (await session.execute(select(User))).scalars().all()

        print(f"\n共 {len(users)} 个用户:\n")

        for user in users:
            print(f"【用户 ID: {user.id}】")
            print(f"  手机号: {user.phone}")
            print(f"  微信OpenID: {user.wechat_openid}")

            # 查询该用户的老人档案
            elder_query = select(ElderProfile).where(ElderProfile.user_id == user.id)
            elders = (await session.execute(elder_query)).scalars().all()

            for elder in elders:
                print(f"  老人档案 ID: {elder.id}, 姓名: {elder.name}, 昵称: {elder.nickname}")

            # 查询该用户的回忆录
            memoir_query = select(Memoir).where(Memoir.user_id == user.id)
            memoirs = (await session.execute(memoir_query)).scalars().all()

            if memoirs:
                for memoir in memoirs:
                    print(f"  📕 回忆录 ID: {memoir.id}, 标题: {memoir.title}")
                    print(f"     状态: {memoir.status}, elder_id: {memoir.elder_id}")
            else:
                print(f"  ❌ 该用户没有回忆录")

            print()

        print("="*60)
        print("  所有回忆录列表 (按ID排序)")
        print("="*60 + "\n")

        all_memoirs = (await session.execute(
            select(Memoir).order_by(Memoir.id)
        )).scalars().all()

        for m in all_memoirs:
            user = await session.get(User, m.user_id)
            elder = await session.get(ElderProfile, m.elder_id) if m.elder_id else None
            print(f"ID: {m.id} | user_id: {m.user_id} | elder: {elder.name if elder else 'N/A'} | 标题: {m.title}")


if __name__ == "__main__":
    asyncio.run(debug())
