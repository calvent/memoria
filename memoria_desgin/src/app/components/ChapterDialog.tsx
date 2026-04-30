import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Chapter } from "../types";

interface ChapterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (chapter: Omit<Chapter, "id" | "createdAt" | "order">) => void;
  editingChapter?: Chapter | null;
}

export function ChapterDialog({
  open,
  onOpenChange,
  onSave,
  editingChapter,
}: ChapterDialogProps) {
  const [title, setTitle] = useState(editingChapter?.title || "");
  const [description, setDescription] = useState(
    editingChapter?.description || ""
  );

  const handleSave = () => {
    if (!title) return;
    onSave({ title, description: description || undefined });
    onOpenChange(false);
    setTitle("");
    setDescription("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {editingChapter ? "编辑章节" : "创建新章节"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="chapter-title" className="text-lg">
              章节标题 *
            </Label>
            <Input
              id="chapter-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：童年时光、求学之路..."
              className="text-lg p-6"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="chapter-description" className="text-lg">
              章节简介
            </Label>
            <Textarea
              id="chapter-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="简单描述这个章节的内容..."
              className="min-h-[100px] text-lg p-6"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="text-lg px-8 py-6"
          >
            取消
          </Button>
          <Button
            onClick={handleSave}
            disabled={!title}
            className="text-lg px-8 py-6"
          >
            {editingChapter ? "保存" : "创建"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
