import { useState, useEffect } from "react";
import { BookOpen, Users, Home } from "lucide-react";
import { Toaster } from "./components/ui/sonner";
import { MyMemoirPage } from "./components/MyMemoirPage";
import { SquarePage } from "./components/SquarePage";
import { MemoirViewPage } from "./components/MemoirViewPage";
import { Tabs, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Memory, Chapter, Memoir, PublicMemoir, User } from "./types";

const STORAGE_KEYS = {
  memoir: "memoria_memoir",
  chapters: "memoria_chapters",
  memories: "memoria_memories",
  currentUser: "memoria_current_user",
};

// 当前用户
const CURRENT_USER: User = {
  id: "user-1",
  name: "张天明",
  bio: "一个热爱生活的退休工人",
};

// 模拟其他用户的回忆录数据
const SAMPLE_PUBLIC_MEMOIRS: PublicMemoir[] = [
  {
    id: "memoir-2",
    userId: "user-2",
    title: "我的教师生涯",
    description:
      "从1970年开始，我在乡村小学当了四十年的老师。这里记录了我和学生们的点点滴滴，以及那些年教育事业的变迁。",
    coverImage:
      "https://images.unsplash.com/photo-1764173039543-8d98b17c6c35?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGRlcmx5JTIwcGVvcGxlJTIwcmVhZGluZ3xlbnwxfHx8fDE3NjgyMDgxMzF8MA&ixlib=rb-4.1.0&q=80&w=1080",
    isPublic: true,
    createdAt: Date.now() - 10000000,
    updatedAt: Date.now() - 5000000,
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
    title: "医者仁心：我的从医回忆",
    description:
      "1975年进入医学院，1980年成为一名内科医生。这些年来，我见证了无数生命的诞生与离去，也见证了中国医疗事业的发展。",
    coverImage:
      "https://images.unsplash.com/photo-1625246433906-6cfa33544b31?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21tdW5pdHklMjBnYXRoZXJpbmd8ZW58MXx8fHwxNzY4MTYwMDA4fDA&ixlib=rb-4.1.0&q=80&w=1080",
    isPublic: true,
    createdAt: Date.now() - 20000000,
    updatedAt: Date.now() - 3000000,
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
    title: "工厂岁月",
    description:
      "在钢铁厂工作了35年，从学徒工到高级技师。那些年的艰苦奋斗、工友情谊，都是我最宝贵的财富。",
    coverImage:
      "https://images.unsplash.com/photo-1647054894739-e77b1fd21343?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aW50YWdlJTIwY2FtZXJhJTIwbWVtb2lyfGVufDF8fHx8MTc2ODIwNzE3N3ww&ixlib=rb-4.1.0&q=80&w=1080",
    isPublic: true,
    createdAt: Date.now() - 15000000,
    updatedAt: Date.now() - 2000000,
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

// 示例章节和回忆
const SAMPLE_CHAPTERS: Chapter[] = [
  {
    id: "chapter-1",
    title: "童年时光",
    description: "在农村长大的日子，那些无忧无虑的童年回忆",
    order: 1,
    createdAt: Date.now() - 5000000,
  },
  {
    id: "chapter-2",
    title: "工作生涯",
    description: "在工厂工作的35年，从学徒到退休",
    order: 2,
    createdAt: Date.now() - 4000000,
  },
  {
    id: "chapter-3",
    title: "家庭生活",
    description: "成家立业，养育子女的美好时光",
    order: 3,
    createdAt: Date.now() - 3000000,
  },
];

const SAMPLE_MEMORIES: Memory[] = [
  {
    id: "1",
    title: "第一次去北京",
    content:
      "1978年的夏天，我第一次坐火车去北京。那时候火车很慢，要坐两天两夜。记得在天安门广场看升旗的时候，心里特别激动。那是我第一次离开家乡，看到这么大的城市。",
    date: "1978-07-15",
    category: "旅行",
    location: "北京",
    imageUrl:
      "https://images.unsplash.com/photo-1760348462684-f988e6bc95c1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGRlcmx5JTIwbWVtb3JpZXMlMjB2aW50YWdlfGVufDF8fHx8MTc2ODIwNzE3Nnww&ixlib=rb-4.1.0&q=80&w=1080",
    createdAt: Date.now() - 1000000,
    chapterId: "chapter-1",
  },
  {
    id: "2",
    title: "儿子出生的那天",
    content:
      "1985年3月20日，春天的早晨，我的儿子出生了。那是我人生中最幸福的一天。抱着襁褓中的他，看着他小小的脸蛋，我暗暗发誓要做一个好父亲。",
    date: "1985-03-20",
    category: "家庭",
    location: "上海市第一人民医院",
    imageUrl:
      "https://images.unsplash.com/photo-1582140110185-b920b4d175f4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvbGQlMjBwaG90b2dyYXBocyUyMGZhbWlseXxlbnwxfHx8fDE3NjgyMDcxNzZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    createdAt: Date.now() - 2000000,
    chapterId: "chapter-3",
  },
  {
    id: "3",
    title: "退休那天",
    content:
      "2010年12月31日，在工厂工作了35年后，我终于退休了。同事们给我办了一个小型欢送会，大家一起回忆了很多往事。离开工厂的时候，心里既轻松又有些不舍。",
    date: "2010-12-31",
    category: "工作",
    location: "上海",
    imageUrl:
      "https://images.unsplash.com/photo-1647054894739-e77b1fd21343?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aW50YWdlJTIwY2FtZXJhJTIwbWVtb2lyfGVufDF8fHx8MTc2ODIwNzE3N3ww&ixlib=rb-4.1.0&q=80&w=1080",
    createdAt: Date.now() - 3000000,
    chapterId: "chapter-2",
  },
  {
    id: "4",
    title: "放牛的日子",
    content:
      "小时候在农村，每天放学后都要去放牛。和小伙伴们一起在田野里玩耍，在河里抓鱼，那是最快乐的时光。现在回想起来，那种纯真的快乐再也找不回来了。",
    date: "1965-06-10",
    category: "童年",
    location: "家乡",
    createdAt: Date.now() - 4000000,
    chapterId: "chapter-1",
  },
];

export default function App() {
  // 页面状态
  const [currentPage, setCurrentPage] = useState<"my-memoir" | "square">(
    "my-memoir"
  );
  const [viewingMemoir, setViewingMemoir] = useState<PublicMemoir | null>(null);

  // 数据状态
  const [memoir, setMemoir] = useState<Memoir>({
    id: "memoir-1",
    userId: CURRENT_USER.id,
    title: "我的人生回忆录",
    description: "记录我这一生的点点滴滴",
    isPublic: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);

  // 初始化数据
  useEffect(() => {
    const storedMemoir = localStorage.getItem(STORAGE_KEYS.memoir);
    const storedChapters = localStorage.getItem(STORAGE_KEYS.chapters);
    const storedMemories = localStorage.getItem(STORAGE_KEYS.memories);

    if (storedMemoir) {
      setMemoir(JSON.parse(storedMemoir));
    }

    if (storedChapters) {
      setChapters(JSON.parse(storedChapters));
    } else {
      setChapters(SAMPLE_CHAPTERS);
      localStorage.setItem(STORAGE_KEYS.chapters, JSON.stringify(SAMPLE_CHAPTERS));
    }

    if (storedMemories) {
      setMemories(JSON.parse(storedMemories));
    } else {
      setMemories(SAMPLE_MEMORIES);
      localStorage.setItem(STORAGE_KEYS.memories, JSON.stringify(SAMPLE_MEMORIES));
    }
  }, []);

  // 保存回忆录
  const saveMemoir = (updatedMemoir: Memoir) => {
    const updated = { ...updatedMemoir, updatedAt: Date.now() };
    setMemoir(updated);
    localStorage.setItem(STORAGE_KEYS.memoir, JSON.stringify(updated));
  };

  // 保存章节
  const saveChapters = (updatedChapters: Chapter[]) => {
    setChapters(updatedChapters);
    localStorage.setItem(STORAGE_KEYS.chapters, JSON.stringify(updatedChapters));
    saveMemoir({ ...memoir, updatedAt: Date.now() });
  };

  // 保存回忆
  const saveMemories = (updatedMemories: Memory[]) => {
    setMemories(updatedMemories);
    localStorage.setItem(STORAGE_KEYS.memories, JSON.stringify(updatedMemories));
    saveMemoir({ ...memoir, updatedAt: Date.now() });
  };

  // 章节操作
  const handleSaveChapter = (chapterData: Omit<Chapter, "id" | "createdAt" | "order">) => {
    const newChapter: Chapter = {
      ...chapterData,
      id: Date.now().toString(),
      order: chapters.length + 1,
      createdAt: Date.now(),
    };
    saveChapters([...chapters, newChapter]);
  };

  const handleUpdateChapter = (updatedChapter: Chapter) => {
    saveChapters(chapters.map((c) => (c.id === updatedChapter.id ? updatedChapter : c)));
  };

  const handleDeleteChapter = (id: string) => {
    saveChapters(chapters.filter((c) => c.id !== id));
    // 同时删除该章节的所有回忆
    saveMemories(memories.filter((m) => m.chapterId !== id));
  };

  // 回忆操作
  const handleSaveMemory = (memoryData: Omit<Memory, "id" | "createdAt">) => {
    const newMemory: Memory = {
      ...memoryData,
      id: Date.now().toString(),
      createdAt: Date.now(),
    };
    saveMemories([newMemory, ...memories]);
  };

  const handleUpdateMemory = (updatedMemory: Memory) => {
    saveMemories(memories.map((m) => (m.id === updatedMemory.id ? updatedMemory : m)));
  };

  const handleDeleteMemory = (id: string) => {
    saveMemories(memories.filter((m) => m.id !== id));
  };

  // 获取广场上的所有回忆录（包括自己的公开回忆录）
  const getPublicMemoirs = (): PublicMemoir[] => {
    const publicMemoirs = [...SAMPLE_PUBLIC_MEMOIRS];

    // 如果自己的回忆录是公开的，也加入列表
    if (memoir.isPublic) {
      publicMemoirs.unshift({
        ...memoir,
        author: CURRENT_USER,
        chapterCount: chapters.length,
        memoryCount: memories.length,
      });
    }

    return publicMemoirs;
  };

  // 查看某个回忆录
  const handleViewMemoir = (publicMemoir: PublicMemoir) => {
    setViewingMemoir(publicMemoir);
  };

  const handleBackToSquare = () => {
    setViewingMemoir(null);
  };

  // 如果正在查看某个回忆录
  if (viewingMemoir) {
    // 如果是自己的回忆录，显示实际数据
    if (viewingMemoir.id === memoir.id) {
      return (
        <>
          <Toaster position="top-center" />
          <MemoirViewPage
            memoir={viewingMemoir}
            chapters={chapters}
            memories={memories}
            onBack={handleBackToSquare}
          />
        </>
      );
    }

    // 否则显示示例数据
    return (
      <>
        <Toaster position="top-center" />
        <MemoirViewPage
          memoir={viewingMemoir}
          chapters={[]}
          memories={[]}
          onBack={handleBackToSquare}
        />
      </>
    );
  }

  return (
    <>
      <Toaster position="top-center" />

      {/* 全局导航 */}
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
        <Tabs
          value={currentPage}
          onValueChange={(value) => setCurrentPage(value as "my-memoir" | "square")}
        >
          <TabsList className="bg-white/90 backdrop-blur-sm shadow-lg border border-gray-200">
            <TabsTrigger value="my-memoir" className="text-lg px-8 py-4">
              <Home className="size-5 mr-2" />
              我的回忆录
            </TabsTrigger>
            <TabsTrigger value="square" className="text-lg px-8 py-4">
              <Users className="size-5 mr-2" />
              广场
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* 页面内容 */}
      {currentPage === "my-memoir" ? (
        <MyMemoirPage
          memoir={memoir}
          chapters={chapters}
          memories={memories}
          onUpdateMemoir={saveMemoir}
          onSaveChapter={handleSaveChapter}
          onUpdateChapter={handleUpdateChapter}
          onDeleteChapter={handleDeleteChapter}
          onSaveMemory={handleSaveMemory}
          onUpdateMemory={handleUpdateMemory}
          onDeleteMemory={handleDeleteMemory}
        />
      ) : (
        <SquarePage memoirs={getPublicMemoirs()} onViewMemoir={handleViewMemoir} />
      )}
    </>
  );
}
