import { Clock, MapPin, Tag, Edit2, Trash2, Volume2 } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Memory } from "../types";

interface MemoryCardProps {
  memory: Memory;
  onEdit: (memory: Memory) => void;
  onDelete: (id: string) => void;
  showActions?: boolean; // 控制是否显示编辑/删除按钮
}

export function MemoryCard({ memory, onEdit, onDelete, showActions = true }: MemoryCardProps) {
  const speakMemory = () => {
    const text = `${memory.title}。${memory.content}`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "zh-CN";
    utterance.rate = 0.75;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {memory.imageUrl && (
        <div className="w-full h-48 overflow-hidden">
          <img
            src={memory.imageUrl}
            alt={memory.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-6">
        <div className="flex items-start justify-between gap-4 mb-3">
          <h3 className="text-2xl flex-1">{memory.title}</h3>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={speakMemory}
              className="shrink-0"
              title="朗读"
            >
              <Volume2 className="size-5" />
            </Button>
            {showActions && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(memory)}
                  className="shrink-0"
                >
                  <Edit2 className="size-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(memory.id)}
                  className="shrink-0 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="size-5" />
                </Button>
              </>
            )}
          </div>
        </div>
        
        <p className="text-lg text-gray-700 mb-4 line-clamp-3">{memory.content}</p>
        
        <div className="flex flex-wrap gap-4 text-base text-gray-600">
          <div className="flex items-center gap-2">
            <Clock className="size-5" />
            <span>{memory.date}</span>
          </div>
          <div className="flex items-center gap-2">
            <Tag className="size-5" />
            <span>{memory.category}</span>
          </div>
          {memory.location && (
            <div className="flex items-center gap-2">
              <MapPin className="size-5" />
              <span>{memory.location}</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}