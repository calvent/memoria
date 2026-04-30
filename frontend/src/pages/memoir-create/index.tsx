/**
 * 新建回忆录页面
 *
 * "禅意手记 (Zen Journal)" 风格重构版
 * - 保留了自定义语音极速转写功能，但以文本模式作为默认进入状态
 * - 默认唤起系统键盘，引导用户随性输入或使用内置语音
 */

import { useState, useRef, useEffect, useMemo } from 'react';
import { View, Text, Textarea, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { Mic, Keyboard, Activity, Check, ChevronLeft } from 'lucide-react';
import { createMemoir } from '@/services/memoir';
import { useRealtimeASR } from '@/pages/recording/hooks/useRealtimeASR';
import { cn } from '@/utils/cn';

type InputMode = 'text' | 'voice';

export default function MemoirCreatePage() {
  // 状态管理
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  // 核心设计：默认进入 text 文本模式，优先系统唤起键盘
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [isSaving, setIsSaving] = useState(false);
  const [statusBarHeight, setStatusBarHeight] = useState(20);
  const [isFocused, setIsFocused] = useState(false);

  // 录音相关 Ref
  const baseContentRef = useRef('');

  const {
    isRecording,
    currentTranscript,
    startRecording,
    stopRecording,
    clearTranscript,
  } = useRealtimeASR({
    onError: (err) => {
      Taro.showToast({ title: err.message, icon: 'none' });
    },
  });

  // 获取系统状态栏高度，用于避让
  useEffect(() => {
    const info = Taro.getSystemInfoSync();
    setStatusBarHeight(info.statusBarHeight || 20);
  }, []);

  // 隐藏 TabBar
  useDidShow(() => {
    if (typeof (Taro.getCurrentInstance().page as any)?.getTabBar === 'function') {
      (Taro.getCurrentInstance().page as any).getTabBar()?.setData?.({
        selected: -1
      });
    }
  });

  // 动态设置标题为空，因为我们自己渲染
  useEffect(() => {
    Taro.setNavigationBarTitle({ title: '' });
  }, []);

  // 切换回文本模式时，自动弹出系统键盘
  useEffect(() => {
    if (inputMode === 'text') {
      const timer = setTimeout(() => {
        setIsFocused(true);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setIsFocused(false);
    }
  }, [inputMode]);

  // 实时同步录音内容
  useEffect(() => {
    if (isRecording && currentTranscript) {
      const separator = baseContentRef.current ? '\n' : '';
      setContent(baseContentRef.current + separator + currentTranscript);
    }
  }, [isRecording, currentTranscript]);

  // 生成默认标题
  const defaultTitle = useMemo(() => {
    const now = new Date();
    const hour = now.getHours();
    const period = hour < 12 ? '上午' : (hour < 18 ? '下午' : '夜晚');
    return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${period}随想`;
  }, []);

  // 日期格式化: 2026 / 02 / 02
  const dateStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()} / ${String(now.getMonth() + 1).padStart(2, '0')} / ${String(now.getDate()).padStart(2, '0')}`;
  }, []);

  // 录音交互
  const handleVoiceTouchStart = async () => {
    try {
      baseContentRef.current = content;
      await startRecording();
    } catch (error) {
      console.error('启动录音失败', error);
    }
  };

  const handleVoiceTouchEnd = async () => {
    await stopRecording();
    clearTranscript();
  };

  // 保存逻辑
  const handleSave = async () => {
    if (!content.trim()) {
      Taro.showToast({ title: '记录一点内容吧', icon: 'none' });
      return;
    }

    try {
      setIsSaving(true);
      const finalTitle = title.trim() || defaultTitle;

      // @ts-ignore
      const memoir = await createMemoir({
        title: finalTitle,
        content: content.trim(),
      });

      Taro.showToast({ title: '保存成功', icon: 'success' });
      setTimeout(() => {
        Taro.redirectTo({ url: `/pages/memoir-detail/index?id=${memoir.id}` });
      }, 500);
    } catch (error) {
      console.error('创建失败', error);
      Taro.showToast({ title: '保存失败', icon: 'none' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleGoBack = () => {
    if (content.trim().length > 0) {
      Taro.showModal({
        title: '保存草稿？',
        content: '确认放弃当前记录吗？',
        confirmText: '放弃',
        confirmColor: '#FF0000',
        success: (res) => res.confirm && Taro.navigateBack(),
      });
    } else {
      Taro.navigateBack();
    }
  };

  return (
    <View
      className="h-screen flex flex-col bg-[#FDFBF7] relative overflow-hidden"
      style={{
        backgroundImage: 'radial-gradient(#E7E5E4 1px, transparent 1px)',
        backgroundSize: '24px 24px'
      }}
    >
      {/* 1. 顶部自定义导航栏 */}
      <View
        className="fixed top-0 left-0 right-0 z-50 flex flex-row items-center justify-between px-4 bg-[#FDFBF7]/80 backdrop-blur-md"
        style={{
          paddingTop: `${statusBarHeight}px`,
          height: `${statusBarHeight + 44}px`
        }}
      >
        <View
          className="w-10 h-10 -ml-2 flex items-center justify-center rounded-full active:bg-stone-200/50 transition-colors"
          onClick={handleGoBack}
        >
          <ChevronLeft size={28} className="text-stone-800" />
        </View>

        {/* 右上角保存按钮 */}
        <View
          className={cn(
            "px-4 py-1.5 rounded-full flex flex-row items-center gap-1.5 transition-all duration-300 shadow-sm",
            content.trim()
              ? "bg-stone-900 text-amber-50 shadow-stone-300"
              : "bg-stone-200/50 text-stone-400"
          )}
          onClick={!isSaving && content.trim() ? handleSave : undefined}
        >
          <Check size={14} strokeWidth={3} />
          <Text className="text-sm font-bold tracking-wide">完成</Text>
        </View>
      </View>

      {/* 2. 主内容滚动区 */}
      <ScrollView
        scrollY
        className="flex-1 w-full"
        style={{ paddingTop: `${statusBarHeight + 44}px` }}
      >
        <View className="px-8 pb-40">
          {/* 日期 Header */}
          <View className="flex flex-col items-center justify-center py-8 opacity-80">
            <Text className="text-xs font-serif tracking-[0.2em] text-stone-500 uppercase">
              {dateStr}
            </Text>
            <View className="w-6 h-0.5 bg-amber-300 mt-3 rounded-full" />
          </View>

          {/* 大标题 */}
          <View className="mb-6">
            <Textarea
              className="w-full text-[28px] font-bold text-stone-900 leading-tight bg-transparent min-h-[44px]"
              value={title}
              onInput={(e) => setTitle(e.detail.value)}
              placeholder={defaultTitle}
              placeholderClass="text-stone-300"
              autoHeight
              maxlength={30}
              showConfirmBar={false}
              disableDefaultPadding={true}
            />
          </View>

          {/* 正文区域 */}
          <View className="relative min-h-[50vh]">
            {/* 语音模式下，如果没内容，给个空状态提示 */}
            {inputMode === 'voice' && !content && (
              <View className="absolute top-0 left-0 right-0 pt-10 flex flex-col items-center justify-center pointer-events-none opacity-40">
                <Mic size={32} className="text-stone-300 mb-4" />
                <Text className="text-stone-400 text-lg font-serif">点击下方，记录人生</Text>
              </View>
            )}

            <Textarea
              className="w-full text-lg leading-[1.8] text-stone-800 bg-transparent caret-amber-600 h-full min-h-[400px]"
              value={content}
              onInput={(e) => setContent(e.detail.value)}
              placeholder={inputMode === 'text' ? "点击此处开始书写...\n可使用自带的语音输入法" : ""}
              placeholderClass="text-stone-300/80 font-serif leading-[1.8]"
              maxlength={-1}
              focus={isFocused}
              disabled={isRecording}
              showConfirmBar={true}
              disableDefaultPadding={true}
            />

            {/* 实时转写流 */}
            {isRecording && currentTranscript && (
              <View className="mt-2 text-lg leading-[1.8] text-amber-700 font-medium animate-pulse">
                {currentTranscript}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* 3. 底部悬浮操作区（只在底部保留小红点/小操作入口） */}
      <View
        className="absolute bottom-0 left-0 right-0 z-20 pb-safe-area"
      >
        <View className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#FDFBF7] via-[#FDFBF7] to-transparent -z-10" />

        {inputMode === 'voice' ? (
          <View className="flex flex-col items-center justify-end pb-12">
            {/* 切换回键盘模式 */}
            <View
              className="mb-8 p-3 rounded-full bg-white/80 backdrop-blur-sm shadow-sm border border-stone-100/50 active:scale-95 transition-transform"
              onClick={() => setInputMode('text')}
            >
              <Keyboard size={20} className="text-stone-400" />
            </View>

            {/* 录音主按钮 */}
            <View
              className={cn(
                "relative w-24 h-24 flex items-center justify-center transition-all duration-300",
                isRecording ? "scale-110" : "scale-100 hover:scale-105"
              )}
              onTouchStart={handleVoiceTouchStart}
              onTouchEnd={handleVoiceTouchEnd}
            >
              {isRecording && (
                <View className="absolute inset-0 rounded-full bg-amber-500/20 animate-ping" />
              )}
              {isRecording && (
                <View className="absolute -inset-4 rounded-full border border-amber-500/30 animate-pulse" />
              )}

              <View className={cn(
                "w-24 h-24 rounded-full shadow-xl flex items-center justify-center transition-colors shadow-amber-500/20",
                isRecording
                  ? "bg-amber-600 shadow-amber-600/40"
                  : "bg-amber-500 shadow-amber-500/30"
              )}>
                {isRecording ? (
                  <Activity size={36} className="text-white animate-bounce" />
                ) : (
                  <Mic size={32} className="text-white" />
                )}
              </View>
            </View>

            <Text className="mt-4 text-base text-stone-600 font-medium tracking-wide">
              {isRecording ? '松开结束' : '按住说话'}
            </Text>
          </View>
        ) : (
          <View className="flex flex-col items-center pb-6">
            {/* 文本模式下，底部放一个小巧的语音入口 */}
            <View
              className="px-5 py-3 rounded-full bg-white shadow-sm border border-stone-100 flex flex-row items-center gap-2 active:scale-95 transition-transform"
              onClick={() => setInputMode('voice')}
            >
              <View className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                <Mic size={16} className="text-amber-600" />
              </View>
              <Text className="text-stone-500 text-sm font-medium">应用内转写</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}
