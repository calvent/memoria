import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Memory } from "../types";

interface MemoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (memory: Omit<Memory, "id" | "createdAt">) => void;
  editingMemory?: Memory | null;
  chapterId: string; // 当前章节ID
}

const categories = [
  "家庭",
  "工作",
  "旅行",
  "爱好",
  "朋友",
  "重要时刻",
  "其他",
];

export function MemoryDialog({
  open,
  onOpenChange,
  onSave,
  editingMemory,
  chapterId,
}: MemoryDialogProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [date, setDate] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    if (editingMemory) {
      setTitle(editingMemory.title);
      setContent(editingMemory.content);
      setDate(editingMemory.date);
      setCategory(editingMemory.category);
      setLocation(editingMemory.location || "");
      setImageUrl(editingMemory.imageUrl || "");
    } else {
      setTitle("");
      setContent("");
      setDate("");
      setCategory("");
      setLocation("");
      setImageUrl("");
    }
  }, [editingMemory, open]);

  const handleSave = () => {
    if (!title || !content || !date || !category) return;

    onSave({
      title,
      content,
      date,
      category,
      location: location || undefined,
      imageUrl: imageUrl || undefined,
      chapterId: editingMemory?.chapterId || chapterId,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {editingMemory ? "编辑回忆" : "添加新回忆"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-lg">
              标题 *
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="这段回忆的标题..."
              className="text-lg p-6"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content" className="text-lg">
              内容 *
            </Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="记录您珍贵的回忆..."
              className="min-h-[200px] text-lg p-6"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="text-lg">
                日期 *
              </Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="text-lg p-6"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category" className="text-lg">
                分类 *
              </Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="text-lg p-6">
                  <SelectValue placeholder="选择分类" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat} className="text-lg">
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location" className="text-lg">
              地点
            </Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="这件事发生在哪里？"
              className="text-lg p-6"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUrl" className="text-lg">
              图片链接
            </Label>
            <Input
              id="imageUrl"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="添加一张照片的链接（可选）"
              className="text-lg p-6"
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
            disabled={!title || !content || !date || !category}
            className="text-lg px-8 py-6"
          >
            {editingMemory ? "保存" : "添加"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}