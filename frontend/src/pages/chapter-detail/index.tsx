/**
 * 章节阅读页 - Story浏览器模式
 * 
 * 支持左右滑动浏览章节中的所有story
 */

import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Swiper, SwiperItem } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { getChapterDetail, getPublicChapterDetail, Chapter } from '@/services/chapter';
import { Story } from '@/services/story';
import { cn } from '@/utils/cn';

export default function ChapterDetailPage() {
    const router = useRouter();
    const chapterId = router.params.id;
    const isPublic = router.params.public === 'true';
    const initialStoryIndex = parseInt(router.params.storyIndex || '0');

    const [chapter, setChapter] = useState<Chapter | null>(null);
    const [currentStoryIndex, setCurrentStoryIndex] = useState(initialStoryIndex);
    const [isLoading, setIsLoading] = useState(true);
    const [showNextHint, setShowNextHint] = useState(false);

    // 加载数据
    const loadData = async () => {
        if (!chapterId) return;

        try {
            setIsLoading(true);
            const api = isPublic ? getPublicChapterDetail : getChapterDetail;
            const data = await api(chapterId);
            setChapter(data);
        } catch (error) {
            console.error('加载章节失败', error);
            Taro.showToast({ title: '加载失败', icon: 'none' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [chapterId]);

    const handleBack = () => {
        Taro.navigateBack();
    };

    const handleSwiperChange = (e: any) => {
        // 仅当用户手动滑动时更新状态，防止点击按钮改变 current 时的状态冲突导致的抖动
        if (e.detail.source === 'touch') {
            setCurrentStoryIndex(e.detail.current);
            setShowNextHint(false);
        }
    };

    const goToNextStory = () => {
        if (chapter?.stories && currentStoryIndex < chapter.stories.length - 1) {
            setCurrentStoryIndex(currentStoryIndex + 1);
            setShowNextHint(false);
        }
    };

    const goToPrevStory = () => {
        if (currentStoryIndex > 0) {
            setCurrentStoryIndex(currentStoryIndex - 1);
            setShowNextHint(false);
        }
    };

    if (isLoading) {
        return (
            <View className="flex-1 bg-gradient-to-br from-amber-50/40 to-orange-50/30 min-h-screen items-center justify-center">
                <Text className="text-gray-500">加载中...</Text>
            </View>
        );
    }

    if (!chapter) {
        return (
            <View className="flex-1 bg-gradient-to-br from-amber-50/40 to-orange-50/30 min-h-screen items-center justify-center">
                <Text className="text-gray-500">章节不存在</Text>
            </View>
        );
    }

    const stories = chapter.stories || [];

    // 确保索引有效（同步检查，不触发重新渲染）
    const safeStoryIndex = Math.max(0, Math.min(currentStoryIndex, stories.length - 1));
    const isFirstStory = safeStoryIndex === 0;
    const isLastStory = safeStoryIndex === stories.length - 1;

    return (
        <View className="flex flex-col h-screen bg-gradient-to-br from-amber-50/40 to-orange-50/30 overflow-hidden box-border">
            {/* 顶部导航栏 */}
            <View className="bg-white/90 backdrop-blur-md border-b border-amber-100 relative z-50 shrink-0">
                <View className="flex flex-col px-4 py-3">
                    <View className="flex flex-row items-center justify-between">
                        <View
                            className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center active:scale-95 transition-transform"
                            onClick={handleBack}
                        >
                            <ArrowLeft size={20} className="text-gray-700" />
                        </View>

                        {/* 进度指示器 */}
                        <View className="flex-1 mx-4 flex flex-col items-center">
                            <Text className="text-sm font-semibold text-gray-800 truncate max-w-full">
                                {chapter.title}
                            </Text>
                            {stories.length > 0 && (
                                <Text className="text-xs text-amber-600 mt-1">
                                    第 {safeStoryIndex + 1} / {stories.length} 个故事
                                </Text>
                            )}
                        </View>

                        <View className="w-10" /> {/* Spacer */}
                    </View>

                    {/* 面包屑导航 */}
                    {chapter.timePeriod && (
                        <Text className="text-xs text-gray-500 mt-2 text-center">
                            {chapter.timePeriod}
                        </Text>
                    )}
                </View>
            </View>

            {stories.length === 0 ? (
                // 无故事时显示章节内容
                <ScrollView scrollY className="flex-1" enableBackToTop>
                    <View className="p-6">
                        <Text className="text-gray-600 leading-relaxed">
                            {chapter.introduction || chapter.content || '这个章节还没有内容'}
                        </Text>
                    </View>
                </ScrollView>
            ) : (
                // Story浏览器模式 - Flex 布局
                <>
                    {/* 中间内容区 - 占据剩余空间 */}
                    <View className="flex-1 min-h-0 w-full relative">
                        <Swiper
                            current={safeStoryIndex}
                            onChange={handleSwiperChange}
                            className="h-full w-full"
                            indicatorDots={false}
                            duration={300}
                        >
                            {stories.map((story: Story, index: number) => (
                                <SwiperItem key={story.id}>
                                    <ScrollView
                                        scrollY
                                        className="h-full w-full"
                                        enableBackToTop
                                        scrollWithAnimation
                                        onScrollToLower={() => {
                                            if (index !== stories.length - 1) {
                                                setShowNextHint(true);
                                            }
                                        }}
                                    >
                                        <View className="p-6 pb-8">
                                            {/* Story标题 */}
                                            <Text className="text-2xl font-bold text-amber-900 mb-4 leading-tight block">
                                                {story.title}
                                            </Text>

                                            {/* Story元数据 */}
                                            <View className="flex flex-row flex-wrap gap-3 mb-6">
                                                {story.happenedAt && (
                                                    <View className="px-3 py-1.5 bg-amber-100 rounded-full">
                                                        <Text className="text-xs text-amber-700 font-medium">
                                                            {story.happenedAt}
                                                        </Text>
                                                    </View>
                                                )}
                                                {story.location && (
                                                    <View className="px-3 py-1.5 bg-blue-100 rounded-full">
                                                        <Text className="text-xs text-blue-700 font-medium">
                                                            📍 {story.location}
                                                        </Text>
                                                    </View>
                                                )}
                                            </View>

                                            {/* Story内容 */}
                                            <View className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-amber-100/50">
                                                <Text className="text-gray-800 text-base leading-relaxed whitespace-pre-wrap block">
                                                    {story.content}
                                                </Text>
                                            </View>

                                            {/* 关键词 */}
                                            {story.keywords && (
                                                <View className="mt-6">
                                                    <Text className="text-sm text-gray-500 mb-2 block">关键词：</Text>
                                                    <View className="flex flex-row flex-wrap gap-2">
                                                        {(() => {
                                                            try {
                                                                const kws = JSON.parse(story.keywords || '[]');
                                                                return Array.isArray(kws) ? kws.map((keyword: string, i: number) => (
                                                                    <View key={i} className="px-3 py-1 bg-white/70 rounded-full border border-amber-200">
                                                                        <Text className="text-xs text-gray-700">{keyword}</Text>
                                                                    </View>
                                                                )) : null;
                                                            } catch (e) {
                                                                return null;
                                                            }
                                                        })()}
                                                    </View>
                                                </View>
                                            )}
                                        </View>
                                    </ScrollView>
                                </SwiperItem>
                            ))}
                        </Swiper>

                        {/* 悬浮提示按钮 - 仅这个保持 absolute (float button) */}
                        {showNextHint && !isLastStory && (
                            <View
                                className="absolute bottom-4 left-1/2 -translate-x-1/2 shadow-lg z-10"
                                onClick={goToNextStory}
                            >
                                <View className="bg-amber-600 px-5 py-3 rounded-full flex flex-row items-center gap-2 active:scale-95 transition-transform">
                                    <Text className="text-white font-bold text-sm">继续下一个故事</Text>
                                    <ChevronRight size={16} className="text-white" />
                                </View>
                            </View>
                        )}
                    </View>

                    {/* 底部导航栏 - 固定在底部，Flex 布局的一部分 */}
                    <View className="bg-white border-t border-amber-100 shrink-0 pb-safe z-50">
                        <View className="px-4 py-4 flex flex-row items-center justify-between gap-4">
                            {/* 上一个按钮 */}
                            <View
                                className={cn(
                                    "flex-1 py-3 px-4 rounded-xl flex flex-row items-center justify-center gap-2 transition-all",
                                    isFirstStory
                                        ? "bg-gray-100"
                                        : "bg-amber-200 active:bg-amber-300 shadow-sm"
                                )}
                                onClick={isFirstStory ? undefined : goToPrevStory}
                            >
                                <ChevronLeft size={18} className={isFirstStory ? "text-gray-400" : "text-amber-900"} />
                                <Text className={cn(
                                    "font-medium text-sm",
                                    isFirstStory ? "text-gray-400" : "text-amber-900"
                                )}>
                                    上一个
                                </Text>
                            </View>

                            {/* 下一个/返回目录按钮 */}
                            <View
                                className={cn(
                                    "flex-1 py-3 px-4 rounded-xl flex flex-row items-center justify-center gap-2 transition-all shadow-sm",
                                    isLastStory
                                        ? "bg-gray-800 active:opacity-90"
                                        : "bg-amber-500 active:opacity-90"
                                )}
                                onClick={isLastStory ? handleBack : goToNextStory}
                            >
                                <Text className="text-white font-medium text-sm">
                                    {isLastStory ? "返回目录" : "下一个"}
                                </Text>
                                {!isLastStory && <ChevronRight size={18} className="text-white" />}
                            </View>
                        </View>
                    </View>
                </>
            )}
        </View>
    );
}
