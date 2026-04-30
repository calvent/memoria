import { useState } from "react";
import { Volume2, VolumeX, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Memory } from "../types";

interface ReadingModeCardProps {
  memory: Memory;
}

export function ReadingModeCard({ memory }: ReadingModeCardProps) {
  const [fontSize, setFontSize] = useState<"normal" | "large" | "xlarge">("large");
  const [isSpeaking, setIsSpeaking] = useState(false);

  const fontSizeClasses = {
    normal: "text-xl",
    large: "text-2xl",
    xlarge: "text-3xl",
  };

  const increaseFontSize = () => {
    if (fontSize === "normal") setFontSize("large");
    else if (fontSize === "large") setFontSize("xlarge");
  };

  const decreaseFontSize = () => {
    if (fontSize === "xlarge") setFontSize("large");
    else if (fontSize === "large") setFontSize("normal");
  };

  const speakMemory = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const text = `${memory.title}。${memory.content}。发生在${memory.date}${
      memory.location ? `，地点${memory.location}` : ""
    }。`;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "zh-CN";
    utterance.rate = 0.75; // 更慢的语速
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  return (
    <Card className="p-8 bg-white shadow-lg">
      {/* 控制栏 */}
      <div className="flex items-center justify-between mb-6 pb-6 border-b-2 border-gray-200">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="lg"
            onClick={decreaseFontSize}
            disabled={fontSize === "normal"}
            className="size-14"
          >
            <ZoomOut className="size-6" />
          </Button>
          <span className="text-lg text-gray-600 min-w-[80px] text-center">
            {fontSize === "normal" && "正常"}
            {fontSize === "large" && "较大"}
            {fontSize === "xlarge" && "超大"}
          </span>
          <Button
            variant="outline"
            size="lg"
            onClick={increaseFontSize}
            disabled={fontSize === "xlarge"}
            className="size-14"
          >
            <ZoomIn className="size-6" />
          </Button>
        </div>

        <Button
          variant={isSpeaking ? "destructive" : "default"}
          size="lg"
          onClick={speakMemory}
          className="text-xl px-8 py-6"
        >
          {isSpeaking ? (
            <>
              <VolumeX className="size-6 mr-2" />
              停止朗读
            </>
          ) : (
            <>
              <Volume2 className="size-6 mr-2" />
              朗读回忆
            </>
          )}
        </Button>
      </div>

      {/* 内容 */}
      <div className={fontSizeClasses[fontSize]}>
        {memory.imageUrl && (
          <div className="mb-8 rounded-lg overflow-hidden">
            <img
              src={memory.imageUrl}
              alt={memory.title}
              className="w-full max-h-96 object-cover"
            />
          </div>
        )}

        <h3 className="font-bold mb-6 leading-relaxed">{memory.title}</h3>

        <div className="space-y-4 leading-loose text-gray-800 mb-8">
          {memory.content.split("\n").map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>

        <div className="flex flex-wrap gap-6 text-gray-600 pt-6 border-t-2 border-gray-200">
          <div>
            <span className="font-medium">日期：</span>
            {memory.date}
          </div>
          {memory.location && (
            <div>
              <span className="font-medium">地点：</span>
              {memory.location}
            </div>
          )}
          <div>
            <span className="font-medium">分类：</span>
            {memory.category}
          </div>
        </div>
      </div>
    </Card>
  );
}
