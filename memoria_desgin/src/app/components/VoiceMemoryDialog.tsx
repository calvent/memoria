import { useState, useEffect, useRef } from "react";
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
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Keyboard,
  Wand2
} from "lucide-react";
import { Card } from "./ui/card";
import { toast } from "sonner";

interface VoiceMemoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (memory: Omit<Memory, "id" | "createdAt">) => void;
  editingMemory?: Memory | null;
  chapterId: string;
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

// 语音识别类型声明
interface SpeechRecognitionEvent extends Event {
  results: {
    [key: number]: {
      [key: number]: {
        transcript: string;
      };
      isFinal: boolean;
    };
    length: number;
  };
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => ISpeechRecognition;
    webkitSpeechRecognition: new () => ISpeechRecognition;
  }
}

export function VoiceMemoryDialog({
  open,
  onOpenChange,
  onSave,
  editingMemory,
  chapterId,
}: VoiceMemoryDialogProps) {
  const [inputMode, setInputMode] = useState<"voice" | "keyboard">("voice");
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [date, setDate] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  
  const [currentField, setCurrentField] = useState<"title" | "content" | "location">("content");
  
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const synthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

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

  // 初始化语音识别
  useEffect(() => {
    if (!open) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "zh-CN";

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.results.length - 1; i >= 0; i--) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript = transcript;
          } else {
            interimTranscript = transcript;
          }
        }

        const newText = finalTranscript || interimTranscript;
        
        if (currentField === "title") {
          setTitle(prev => prev + finalTranscript);
        } else if (currentField === "content") {
          setContent(prev => prev + finalTranscript);
        } else if (currentField === "location") {
          setLocation(prev => prev + finalTranscript);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("语音识别错误:", event.error);
        setIsRecording(false);
        if (event.error === "no-speech") {
          toast.error("没有检测到语音，请重试");
        } else if (event.error === "not-allowed") {
          toast.error("请允许使用麦克风");
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    } else {
      toast.error("您的浏览器不支持语音识别");
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [open, currentField]);

  // 开始/停止录音
  const toggleRecording = () => {
    if (!recognitionRef.current) {
      toast.error("语音识别不可用");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
      toast.success("开始录音...");
    }
  };

  // 朗读文字
  const speakText = (text: string) => {
    if (!text) {
      toast.error("没有内容可以朗读");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "zh-CN";
    utterance.rate = 0.8; // 稍慢一点，方便老人听清
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => {
      setIsSpeaking(false);
      toast.error("朗读失败");
    };

    synthesisRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const handleSave = () => {
    if (!title || !content || !date || !category) {
      toast.error("请填写必填项");
      speakText("请填写标题、内容、日期和分类");
      return;
    }

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
    toast.success("保存成功");
  };

  // AI 优化内容（模拟）
  const optimizeWithAI = () => {
    if (!content) {
      toast.error("请先录入内容");
      return;
    }
    
    toast.success("AI 正在优化内容...");
    // 这里可以接入真实的 AI API
    // 目前只是模拟优化（添加一些标点符号）
    setTimeout(() => {
      const optimized = content
        .replace(/\s+/g, "")
        .replace(/([。！？])/g, "$1\n")
        .trim();
      setContent(optimized);
      toast.success("内容已优化");
    }, 1000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-3xl flex items-center gap-4">
            {editingMemory ? "编辑回忆" : "记录新回忆"}
            <div className="flex gap-3">
              <Button
                variant={inputMode === "voice" ? "default" : "outline"}
                onClick={() => setInputMode("voice")}
                className="text-lg px-6 py-3"
              >
                <Mic className="size-5 mr-2" />
                语音模式
              </Button>
              <Button
                variant={inputMode === "keyboard" ? "default" : "outline"}
                onClick={() => setInputMode("keyboard")}
                className="text-lg px-6 py-3"
              >
                <Keyboard className="size-5 mr-2" />
                键盘模式
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {inputMode === "voice" ? (
            /* 语音模式 */
            <div className="space-y-6">
              {/* 语音控制区 */}
              <Card className="p-8 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
                <div className="flex flex-col items-center gap-6">
                  <div className="text-center">
                    <p className="text-3xl font-medium mb-2">
                      正在录入：
                      {currentField === "title" && "标题"}
                      {currentField === "content" && "回忆内容"}
                      {currentField === "location" && "地点"}
                    </p>
                    <p className="text-xl text-gray-600">
                      {isRecording ? "请开始说话..." : "点击麦克风开始录音"}
                    </p>
                  </div>

                  {/* 大号麦克风按钮 */}
                  <Button
                    onClick={toggleRecording}
                    size="lg"
                    className={`size-32 rounded-full text-2xl ${
                      isRecording
                        ? "bg-red-500 hover:bg-red-600 animate-pulse"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {isRecording ? (
                      <MicOff className="size-16" />
                    ) : (
                      <Mic className="size-16" />
                    )}
                  </Button>

                  {/* 字段切换 */}
                  <div className="flex gap-4">
                    <Button
                      variant={currentField === "title" ? "default" : "outline"}
                      onClick={() => setCurrentField("title")}
                      className="text-xl px-8 py-6"
                    >
                      录入标题
                    </Button>
                    <Button
                      variant={currentField === "content" ? "default" : "outline"}
                      onClick={() => setCurrentField("content")}
                      className="text-xl px-8 py-6"
                    >
                      录入内容
                    </Button>
                    <Button
                      variant={currentField === "location" ? "default" : "outline"}
                      onClick={() => setCurrentField("location")}
                      className="text-xl px-8 py-6"
                    >
                      录入地点
                    </Button>
                  </div>
                </div>
              </Card>

              {/* 显示录入的内容 */}
              <div className="space-y-4">
                {/* 标题 */}
                <Card className="p-6 bg-white">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <Label className="text-2xl mb-3 block">标题 *</Label>
                      <p className="text-2xl min-h-[3rem] p-4 bg-gray-50 rounded border-2 border-gray-200">
                        {title || "（未录入）"}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => speakText(title)}
                      disabled={!title}
                      className="shrink-0 size-16"
                    >
                      {isSpeaking ? (
                        <VolumeX className="size-8" />
                      ) : (
                        <Volume2 className="size-8" />
                      )}
                    </Button>
                  </div>
                </Card>

                {/* 内容 */}
                <Card className="p-6 bg-white">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-3">
                        <Label className="text-2xl">回忆内容 *</Label>
                        <Button
                          variant="outline"
                          onClick={optimizeWithAI}
                          disabled={!content}
                          className="text-lg px-6 py-3"
                        >
                          <Wand2 className="size-5 mr-2" />
                          AI 优化
                        </Button>
                      </div>
                      <p className="text-2xl leading-relaxed min-h-[12rem] p-6 bg-gray-50 rounded border-2 border-gray-200 whitespace-pre-wrap">
                        {content || "（未录入）"}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => speakText(content)}
                      disabled={!content}
                      className="shrink-0 size-16"
                    >
                      {isSpeaking ? (
                        <VolumeX className="size-8" />
                      ) : (
                        <Volume2 className="size-8" />
                      )}
                    </Button>
                  </div>
                </Card>

                {/* 地点 */}
                <Card className="p-6 bg-white">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <Label className="text-2xl mb-3 block">地点</Label>
                      <p className="text-2xl min-h-[3rem] p-4 bg-gray-50 rounded border-2 border-gray-200">
                        {location || "（未录入）"}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => speakText(location)}
                      disabled={!location}
                      className="shrink-0 size-16"
                    >
                      {isSpeaking ? (
                        <VolumeX className="size-8" />
                      ) : (
                        <Volume2 className="size-8" />
                      )}
                    </Button>
                  </div>
                </Card>
              </div>

              {/* 其他信息 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="date" className="text-2xl">
                    日期 *
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="text-2xl p-8 h-auto"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="category" className="text-2xl">
                    分类 *
                  </Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="text-2xl p-8 h-auto">
                      <SelectValue placeholder="选择分类" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat} className="text-2xl py-4">
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ) : (
            /* 键盘模式 */
            <div className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="title" className="text-2xl">
                  标题 *
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="这段回忆的标题..."
                  className="text-2xl p-8 h-auto"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="content" className="text-2xl">
                  内容 *
                </Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="记录您珍贵的回忆..."
                  className="min-h-[16rem] text-2xl p-8 leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="date-kb" className="text-2xl">
                    日期 *
                  </Label>
                  <Input
                    id="date-kb"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="text-2xl p-8 h-auto"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="category-kb" className="text-2xl">
                    分类 *
                  </Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="text-2xl p-8 h-auto">
                      <SelectValue placeholder="选择分类" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat} className="text-2xl py-4">
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="location-kb" className="text-2xl">
                  地点
                </Label>
                <Input
                  id="location-kb"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="这件事发生在哪里？"
                  className="text-2xl p-8 h-auto"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="imageUrl" className="text-2xl">
                  图片链接
                </Label>
                <Input
                  id="imageUrl"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="添加一张照片的链接（可选）"
                  className="text-2xl p-8 h-auto"
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="text-2xl px-12 py-8"
          >
            取消
          </Button>
          <Button
            onClick={handleSave}
            disabled={!title || !content || !date || !category}
            className="text-2xl px-12 py-8 bg-amber-600 hover:bg-amber-700"
          >
            {editingMemory ? "保存修改" : "保存回忆"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
