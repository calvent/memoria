import { useState } from "react";
import { ChevronDown, ChevronUp, Edit2, Trash2, Plus } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Chapter, Memory } from "../types";
import { MemoryCard } from "./MemoryCard";

interface ChapterSectionProps {
  chapter: Chapter;
  memories: Memory[];
  onAddMemory: (chapterId: string) => void;
  onEditMemory: (memory: Memory) => void;
  onDeleteMemory: (id: string) => void;
  onEditChapter: (chapter: Chapter) => void;
  onDeleteChapter: (id: string) => void;
}

export function ChapterSection({
  chapter,
  memories,
  onAddMemory,
  onEditMemory,
  onDeleteMemory,
  onEditChapter,
  onDeleteChapter,
}: ChapterSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="mb-6">
      <Card className="overflow-hidden">
        <div className="bg-amber-100 border-b border-amber-200">
          <div className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-3xl text-amber-900">{chapter.title}</h2>
                  <span className="text-lg text-amber-700 bg-amber-200 px-3 py-1 rounded-full">
                    {memories.length} 条回忆
                  </span>
                </div>
                {chapter.description && (
                  <p className="text-lg text-amber-800 mt-2">
                    {chapter.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEditChapter(chapter)}
                >
                  <Edit2 className="size-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDeleteChapter(chapter.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="size-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  {isExpanded ? (
                    <ChevronUp className="size-6" />
                  ) : (
                    <ChevronDown className="size-6" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="p-6">
            {memories.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-xl text-gray-600 mb-4">
                  这个章节还没有回忆
                </p>
                <Button
                  onClick={() => onAddMemory(chapter.id)}
                  className="text-lg px-6 py-6"
                >
                  <Plus className="size-5 mr-2" />
                  添加第一条回忆
                </Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                  {memories.map((memory) => (
                    <MemoryCard
                      key={memory.id}
                      memory={memory}
                      onEdit={onEditMemory}
                      onDelete={onDeleteMemory}
                    />
                  ))}
                </div>
                <div className="text-center">
                  <Button
                    onClick={() => onAddMemory(chapter.id)}
                    variant="outline"
                    className="text-lg px-6 py-6"
                  >
                    <Plus className="size-5 mr-2" />
                    添加更多回忆
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
