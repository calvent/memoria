import { BookOpen, Calendar, User as UserIcon } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { PublicMemoir } from "../types";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface MemoirCardProps {
  memoir: PublicMemoir;
  onView: (memoir: PublicMemoir) => void;
}

export function MemoirCard({ memoir, onView }: MemoirCardProps) {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-shadow cursor-pointer">
      {memoir.coverImage ? (
        <div className="w-full h-56 overflow-hidden">
          <ImageWithFallback
            src={memoir.coverImage}
            alt={memoir.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
      ) : (
        <div className="w-full h-56 bg-gradient-to-br from-amber-200 to-orange-200 flex items-center justify-center">
          <BookOpen className="size-20 text-amber-600" />
        </div>
      )}
      
      <div className="p-6">
        <h3 className="text-2xl mb-3 line-clamp-2">{memoir.title}</h3>
        <p className="text-lg text-gray-700 mb-4 line-clamp-3">
          {memoir.description}
        </p>

        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
          {memoir.author.avatar ? (
            <img
              src={memoir.author.avatar}
              alt={memoir.author.name}
              className="size-10 rounded-full object-cover"
            />
          ) : (
            <div className="size-10 rounded-full bg-amber-200 flex items-center justify-center">
              <UserIcon className="size-6 text-amber-700" />
            </div>
          )}
          <div>
            <p className="text-base font-medium">{memoir.author.name}</p>
            {memoir.author.bio && (
              <p className="text-sm text-gray-600 line-clamp-1">
                {memoir.author.bio}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-base text-gray-600 mb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="size-5" />
            <span>{memoir.chapterCount} 章节</span>
          </div>
          <div className="flex items-center gap-2">
            <span>{memoir.memoryCount} 条回忆</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <Calendar className="size-4" />
          <span>更新于 {formatDate(memoir.updatedAt)}</span>
        </div>

        <Button
          onClick={() => onView(memoir)}
          className="w-full text-lg py-6"
        >
          阅读回忆录
        </Button>
      </div>
    </Card>
  );
}
