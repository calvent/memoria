import { useState, useEffect } from "react";
import { Search, TrendingUp, Clock, BookOpen } from "lucide-react";
import { Input } from "./ui/input";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { MemoirCard } from "./MemoirCard";
import { PublicMemoir } from "../types";

interface SquarePageProps {
  memoirs: PublicMemoir[];
  onViewMemoir: (memoir: PublicMemoir) => void;
}

type SortType = "latest" | "popular";

export function SquarePage({ memoirs, onViewMemoir }: SquarePageProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortType, setSortType] = useState<SortType>("latest");
  const [isScrolled, setIsScrolled] = useState(false);

  // 监听滚动事件
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 过滤和排序
  const filteredMemoirs = memoirs
    .filter(
      (memoir) =>
        memoir.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        memoir.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        memoir.author.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortType === "latest") {
        return b.updatedAt - a.updatedAt;
      } else {
        // 按回忆数量排序
        return b.memoryCount - a.memoryCount;
      }
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50">
      {/* 头部 */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-blue-200 sticky top-0 z-10 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 标题区域 - 滚动时收起 */}
          <div
            className={`overflow-hidden transition-all duration-300 ${isScrolled ? "max-h-0 opacity-0" : "max-h-24 opacity-100 py-6"
              }`}
          >
            <div className="flex items-center gap-4">
              <BookOpen className="size-10 text-blue-700" />
              <div>
                <h1 className="text-4xl text-blue-900">回忆录广场</h1>
                <p className="text-lg text-blue-700 mt-1">
                  探索和分享生命的故事
                </p>
              </div>
            </div>
          </div>

          {/* 搜索栏 - 始终可见 */}
          <div className={`relative ${isScrolled ? "py-4" : "pb-6"} transition-all duration-300`}>
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 size-6 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索回忆录、作者..."
              className="pl-14 text-lg p-6"
            />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 排序选项 */}
        <div className="flex items-center justify-between mb-6">
          <Tabs
            value={sortType}
            onValueChange={(value) => setSortType(value as SortType)}
          >
            <TabsList className="bg-white">
              <TabsTrigger value="latest" className="text-lg px-6 py-3">
                <Clock className="size-5 mr-2" />
                最新更新
              </TabsTrigger>
              <TabsTrigger value="popular" className="text-lg px-6 py-3">
                <TrendingUp className="size-5 mr-2" />
                最受欢迎
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <p className="text-xl text-blue-800">
            共 <span className="font-bold text-2xl">{filteredMemoirs.length}</span>{" "}
            部回忆录
          </p>
        </div>

        {/* 回忆录列表 */}
        {filteredMemoirs.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="size-20 mx-auto text-blue-400 mb-4" />
            <p className="text-2xl text-blue-700 mb-4">
              {searchTerm ? "没有找到匹配的回忆录" : "广场上还没有公开的回忆录"}
            </p>
            <p className="text-lg text-blue-600">
              {searchTerm
                ? "试试其他搜索关键词"
                : "快去创建并分享你的回忆录吧"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMemoirs.map((memoir) => (
              <MemoirCard
                key={memoir.id}
                memoir={memoir}
                onView={onViewMemoir}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
