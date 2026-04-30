import { useState } from "react";
import { Plus, BookOpen, Settings, Share2 } from "lucide-react";
import { Button } from "./ui/button";
import { ChapterSection } from "./ChapterSection";
import { ChapterDialog } from "./ChapterDialog";
import { VoiceMemoryDialog } from "./VoiceMemoryDialog";
import { FilterBar } from "./FilterBar";
import { Card } from "./ui/card";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Chapter, Memory, Memoir } from "../types";
import { toast } from "sonner";

interface MyMemoirPageProps {
  memoir: Memoir;
  chapters: Chapter[];
  memories: Memory[];
  onUpdateMemoir: (memoir: Memoir) => void;
  onSaveChapter: (chapter: Omit<Chapter, "id" | "createdAt" | "order">) => void;
  onUpdateChapter: (chapter: Chapter) => void;
  onDeleteChapter: (id: string) => void;
  onSaveMemory: (memory: Omit<Memory, "id" | "createdAt">) => void;
  onUpdateMemory: (memory: Memory) => void;
  onDeleteMemory: (id: string) => void;
}

export function MyMemoirPage({
  memoir,
  chapters,
  memories,
  onUpdateMemoir,
  onSaveChapter,
  onUpdateChapter,
  onDeleteChapter,
  onSaveMemory,
  onUpdateMemory,
  onDeleteMemory,
}: MyMemoirPageProps) {
  const [chapterDialogOpen, setChapterDialogOpen] = useState(false);
  const [memoryDialogOpen, setMemoryDialogOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);
  const [currentChapterId, setCurrentChapterId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("全部");
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleSaveChapter = (chapterData: Omit<Chapter, "id" | "createdAt" | "order">) => {
    if (editingChapter) {
      onUpdateChapter({ ...editingChapter, ...chapterData });
      toast.success("章节已更新");
    } else {
      onSaveChapter(chapterData);
      toast.success("新章节已创建");
    }
    setEditingChapter(null);
  };

  const handleEditChapter = (chapter: Chapter) => {
    setEditingChapter(chapter);
    setChapterDialogOpen(true);
  };

  const handleDeleteChapter = (id: string) => {
    const chapterMemories = memories.filter((m) => m.chapterId === id);
    if (chapterMemories.length > 0) {
      if (
        !confirm(
          `这个章节有 ${chapterMemories.length} 条回忆，删除章节会同时删除所有回忆。确定要删除吗？`
        )
      ) {
        return;
      }
    }
    onDeleteChapter(id);
    toast.success("章节已删除");
  };

  const handleAddMemory = (chapterId: string) => {
    setCurrentChapterId(chapterId);
    setEditingMemory(null);
    setMemoryDialogOpen(true);
  };

  const handleEditMemory = (memory: Memory) => {
    setEditingMemory(memory);
    setCurrentChapterId(memory.chapterId);
    setMemoryDialogOpen(true);
  };

  const handleSaveMemory = (memoryData: Omit<Memory, "id" | "createdAt">) => {
    if (editingMemory) {
      onUpdateMemory({ ...memoryData, id: editingMemory.id, createdAt: editingMemory.createdAt });
      toast.success("回忆已更新");
    } else {
      onSaveMemory(memoryData);
      toast.success("新回忆已添加");
    }
    setEditingMemory(null);
  };

  const handleDeleteMemory = (id: string) => {
    if (confirm("确定要删除这条回忆吗？")) {
      onDeleteMemory(id);
      toast.success("回忆已删除");
    }
  };

  const togglePublic = () => {
    const updated = { ...memoir, isPublic: !memoir.isPublic };
    onUpdateMemoir(updated);
    toast.success(updated.isPublic ? "回忆录已公开到广场" : "回忆录已设为私密");
  };

  // 过滤回忆
  const filterMemories = (chapterMemories: Memory[]) => {
    return chapterMemories.filter((memory) => {
      const matchesSearch =
        memory.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        memory.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        memory.location?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        selectedCategory === "全部" || memory.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  };

  const getChapterMemories = (chapterId: string) => {
    return filterMemories(memories.filter((m) => m.chapterId === chapterId));
  };

  const totalMemories = memories.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      {/* 头部 */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-amber-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <BookOpen className="size-10 text-amber-700" />
              <div>
                <h1 className="text-4xl text-amber-900">{memoir.title}</h1>
                <p className="text-lg text-amber-700 mt-1">{memoir.description}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setSettingsOpen(!settingsOpen)}
                className="text-lg px-6 py-6"
              >
                <Settings className="size-5 mr-2" />
                设置
              </Button>
              <Button
                onClick={() => setChapterDialogOpen(true)}
                className="text-lg px-6 py-6 bg-amber-600 hover:bg-amber-700"
              >
                <Plus className="size-5 mr-2" />
                新建章节
              </Button>
            </div>
          </div>

          {/* 设置面板 */}
          {settingsOpen && (
            <Card className="p-6 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Share2 className="size-6 text-amber-700" />
                  <div>
                    <Label htmlFor="public-switch" className="text-lg">
                      公开到广场
                    </Label>
                    <p className="text-base text-gray-600">
                      让其他人也能看到您的回忆录
                    </p>
                  </div>
                </div>
                <Switch
                  id="public-switch"
                  checked={memoir.isPublic}
                  onCheckedChange={togglePublic}
                />
              </div>
            </Card>
          )}

          {/* 统计信息 */}
          <div className="flex items-center gap-6 text-lg text-amber-800">
            <span>
              <span className="font-bold text-2xl">{chapters.length}</span> 个章节
            </span>
            <span>
              <span className="font-bold text-2xl">{totalMemories}</span> 条回忆
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 搜索和过滤 */}
        {totalMemories > 0 && (
          <div className="mb-8">
            <FilterBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
            />
          </div>
        )}

        {/* 章节列表 */}
        {chapters.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="size-20 mx-auto text-amber-400 mb-4" />
            <p className="text-2xl text-amber-700 mb-4">还没有创建任何章节</p>
            <p className="text-lg text-amber-600 mb-8">
              创建第一个章节，开始记录您的人生故事
            </p>
            <Button
              onClick={() => setChapterDialogOpen(true)}
              size="lg"
              className="text-lg px-8 py-6 bg-amber-600 hover:bg-amber-700"
            >
              <Plus className="size-6 mr-2" />
              创建第一个章节
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {chapters.map((chapter) => (
              <ChapterSection
                key={chapter.id}
                chapter={chapter}
                memories={getChapterMemories(chapter.id)}
                onAddMemory={handleAddMemory}
                onEditMemory={handleEditMemory}
                onDeleteMemory={handleDeleteMemory}
                onEditChapter={handleEditChapter}
                onDeleteChapter={handleDeleteChapter}
              />
            ))}
          </div>
        )}
      </main>

      {/* 对话框 */}
      <ChapterDialog
        open={chapterDialogOpen}
        onOpenChange={(open) => {
          setChapterDialogOpen(open);
          if (!open) setEditingChapter(null);
        }}
        onSave={handleSaveChapter}
        editingChapter={editingChapter}
      />

      <VoiceMemoryDialog
        open={memoryDialogOpen}
        onOpenChange={(open) => {
          setMemoryDialogOpen(open);
          if (!open) setEditingMemory(null);
        }}
        onSave={handleSaveMemory}
        editingMemory={editingMemory}
        chapterId={currentChapterId}
      />
    </div>
  );
}