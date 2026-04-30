
import { PlazaMemoir } from '@/types/models';

const CURRENT_TIMESTAMP = new Date().toISOString();
const PAST_TIMESTAMP = (daysAgo: number) => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString();
};

export const SAMPLE_PUBLIC_MEMOIRS: PlazaMemoir[] = [
    {
        id: "memoir-2",
        userId: "user-2",
        elderId: "user-2",
        status: "completed",
        title: "我的教师生涯",
        description:
            "从1970年开始，我在乡村小学当了四十年的老师。这里记录了我和学生们的点点滴滴，以及那些年教育事业的变迁。",
        coverImage:
            "https://images.unsplash.com/photo-1764173039543-8d98b17c6c35?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGRlcmx5JTIwcGVvcGxlJTIwcmVhZGluZ3xlbnwxfHx8fDE3NjgyMDgxMzF8MA&ixlib=rb-4.1.0&q=80&w=1080",
        isPublic: true,
        createdAt: PAST_TIMESTAMP(10), // Date.now() - 10000000 approx 10 days? 10000000ms is ~3 hours. Wait. 10,000,000 ms = 2.7 hours. Maybe the original meant longer. I'll just use days.
        updatedAt: PAST_TIMESTAMP(1),
        author: {
            id: "user-2",
            name: "李老师",
            bio: "乡村教师，教龄40年",
        },
        chapterCount: 5,
        memoryCount: 23,
    },
    {
        id: "memoir-3",
        userId: "user-3",
        elderId: "user-3",
        status: "completed",
        title: "医者仁心：我的从医回忆",
        description:
            "1975年进入医学院，1980年成为一名内科医生。这些年来，我见证了无数生命的诞生与离去，也见证了中国医疗事业的发展。",
        coverImage:
            "https://images.unsplash.com/photo-1625246433906-6cfa33544b31?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21tdW5pdHklMjBnYXRoZXJpbmd8ZW58MXx8fHwxNzY4MTYwMDA4fDA&ixlib=rb-4.1.0&q=80&w=1080",
        isPublic: true,
        createdAt: PAST_TIMESTAMP(20),
        updatedAt: PAST_TIMESTAMP(3),
        author: {
            id: "user-3",
            name: "王医生",
            bio: "退休内科主任医师",
        },
        chapterCount: 7,
        memoryCount: 35,
    },
    {
        id: "memoir-4",
        userId: "user-4",
        elderId: "user-4",
        status: "completed",
        title: "工厂岁月",
        description:
            "在钢铁厂工作了35年，从学徒工到高级技师。那些年的艰苦奋斗、工友情谊，都是我最宝贵的财富。",
        coverImage:
            "https://images.unsplash.com/photo-1647054894739-e77b1fd21343?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aW50YWdlJTIwY2FtZXJhJTIwbWVtb2lyfGVufDF8fHx8MTc2ODIwNzE3N3ww&ixlib=rb-4.1.0&q=80&w=1080",
        isPublic: true,
        createdAt: PAST_TIMESTAMP(25),
        updatedAt: PAST_TIMESTAMP(2),
        author: {
            id: "user-4",
            name: "刘师傅",
            bio: "退休钢铁工人",
            avatar:
                "https://images.unsplash.com/photo-1496203695688-3b8985780d6a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aW50YWdlJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzY4MTQwNTY0fDA&ixlib=rb-4.1.0&q=80&w=1080",
        },
        chapterCount: 4,
        memoryCount: 18,
    },
];
