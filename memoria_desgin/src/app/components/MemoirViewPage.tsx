import { ArrowLeft, BookOpen, User as UserIcon, Calendar } from "lucide-react";
import { Button } from "./ui/button";
import { PublicMemoir, Memory, Chapter } from "../types";
import { Card } from "./ui/card";
import { MemoryCard } from "./MemoryCard";

interface MemoirViewPageProps {
  memoir: PublicMemoir;
  chapters: Chapter[];
  memories: Memory[];
  onBack: () => void;
}

export function MemoirViewPage({
  memoir,
  chapters,
  memories,
  onBack,
}: MemoirViewPageProps) {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getChapterMemories = (chapterId: string) => {
    return memories.filter((m) => m.chapterId === chapterId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50">
      {/* 头部 */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-blue-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Button
            variant="ghost"
            onClick={onBack}
            className="text-lg px-4 py-6 mb-4"
          >
            <ArrowLeft className="size-6 mr-2" />
            返回广场
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 回忆录信息 */}
        <Card className="mb-8 overflow-hidden">
          {memoir.coverImage && (
            <div className="w-full h-80 overflow-hidden">
              <img
                src={memoir.coverImage}
                alt={memoir.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="p-8">
            <h1 className="text-5xl mb-4">{memoir.title}</h1>
            <p className="text-xl text-gray-700 mb-6">{memoir.description}</p>

            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
              {memoir.author.avatar ? (
                <img
                  src={memoir.author.avatar}
                  alt={memoir.author.name}
                  className="size-16 rounded-full object-cover"
                />
              ) : (
                <div className="size-16 rounded-full bg-blue-200 flex items-center justify-center">
                  <UserIcon className="size-8 text-blue-700" />
                </div>
              )}
              <div>
                <p className="text-xl font-medium">{memoir.author.name}</p>
                {memoir.author.bio && (
                  <p className="text-base text-gray-600">{memoir.author.bio}</p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-6 text-lg text-gray-600">
              <div className="flex items-center gap-2">
                <BookOpen className="size-6" />
                <span>{memoir.chapterCount} 个章节</span>
              </div>
              <div className="flex items-center gap-2">
                <span>{memoir.memoryCount} 条回忆</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="size-6" />
                <span>创建于 {formatDate(memoir.createdAt)}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* 章节列表 */}
        <div className="space-y-6">
          {chapters.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-2xl text-gray-600">这部回忆录还没有章节</p>
            </Card>
          ) : (
            chapters.map((chapter, index) => {
              const chapterMemories = getChapterMemories(chapter.id);
              return (
                <Card key={chapter.id} className="overflow-hidden">
                  <div className="bg-blue-100 border-b border-blue-200 p-6">
                    <div className="flex items-center gap-4">
                      <div className="size-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h2 className="text-3xl text-blue-900">
                          {chapter.title}
                        </h2>
                        {chapter.description && (
                          <p className="text-lg text-blue-800 mt-2">
                            {chapter.description}
                          </p>
                        )}
                      </div>
                      <span className="text-lg text-blue-700 bg-blue-200 px-4 py-2 rounded-full">
                        {chapterMemories.length} 条回忆
                      </span>
                    </div>
                  </div>

                  <div className="p-6">
                    {chapterMemories.length === 0 ? (
                      <p className="text-xl text-gray-600 text-center py-8">
                        这个章节还没有回忆
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {chapterMemories.map((memory) => (
                          <MemoryCard
                            key={memory.id}
                            memory={memory}
                            onEdit={() => {}}
                            onDelete={() => {}}
                            showActions={false}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}