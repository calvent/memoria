
/**
 * 回忆录详情页
 *
 * 展示回忆录的完整信息和章节列表 (Plaza Design Style)
 */

import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { ArrowLeft, BookOpen, User as UserIcon, Calendar, ChevronRight, ChevronDown } from 'lucide-react';
import { getMemoirDetail, getChapterList, getPublicMemoirDetail } from '@/services/memoir';
import { getPublicChapterList } from '@/services/chapter';
import { SAMPLE_PUBLIC_MEMOIRS } from '@/constants/plaza';
import { MemoryCard, Memory } from '@/components/Plaza/MemoryCard';
import { cn } from '@/utils/cn';
import { PlazaMemoir } from '@/types/models';



export default function MemoirDetailPage() {
  const router = useRouter();
  const memoirId = router.params.id;
  const isPublic = router.params.public === 'true'; // 从广场进入时传递public=true

  const [memoir, setMemoir] = useState<PlazaMemoir | null>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]); // We might need to fetch memories if API supports it
  const [isLoading, setIsLoading] = useState(true);

  // Helper to format date
  const formatDate = (dateStr: string | number) => {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? '未知日期' : d.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const loadData = async () => {
    if (!memoirId) return;

    // Check if it's a sample memoir
    const sample = SAMPLE_PUBLIC_MEMOIRS.find(m => m.id === memoirId);
    if (sample) {
      setMemoir(sample);
      // Sample memoirs in Plaza don't have chapters/memories in the provided design code
      setChapters([]);
      setMemories([]);
      setIsLoading(false);
      return;
    }

    // Otherwise fetch from API
    try {
      setIsLoading(true);

      // 根据是否是公开访问选择不同的API
      const memoirPromise = isPublic
        ? getPublicMemoirDetail(memoirId)
        : getMemoirDetail(memoirId);

      const chaptersPromise = isPublic
        ? getPublicChapterList(memoirId)
        : getChapterList(memoirId);

      const [memoirData, chaptersData] = await Promise.all([
        memoirPromise,
        chaptersPromise,
      ]);

      // Adapt API data to PlazaMemoir structure
      const adaptedMemoir: PlazaMemoir = {
        ...memoirData,
        author: {
          id: memoirData.userId,
          // 优先显示昵称，没有则显示真名
          name: (memoirData as any).elderNickname || (memoirData as any).elderName || '未知用户',
        },
        chapterCount: (memoirData as any).chapterCount || chaptersData.items.length,
        memoryCount: ((memoirData as any).chapterCount || chaptersData.items.length) * 4,
        isPublic: true,
      };

      setMemoir(adaptedMemoir);
      setChapters(chaptersData.items);
      // We would also need to fetch memories for each chapter or all memories
      // For now leaving memories empty for API data unless we fetch them
    } catch (error) {
      console.error('加载失败', error);
      Taro.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [memoirId]);


  if (isLoading) {
    return (
      <View className="flex-1 bg-gradient-to-br from-amber-50/40 to-orange-50/30 min-h-screen items-center justify-center">
        <Text className="text-gray-500">加载中...</Text>
      </View>
    );
  }

  if (!memoir) {
    return (
      <View className="flex-1 bg-gradient-to-br from-amber-50/40 to-orange-50/30 min-h-screen items-center justify-center">
        <Text className="text-gray-500">回忆录不存在</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gradient-to-br from-amber-50/40 to-orange-50/30 min-h-screen">
      {/* Header */}
      <View className="bg-white/80 backdrop-blur-md border-b border-amber-100 sticky top-0 z-50">
        <View className="flex flex-row items-center justify-between px-4 h-16">
          <View
            className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center active:scale-95 transition-transform"
            onClick={() => Taro.navigateBack()}
          >
            <ArrowLeft size={24} className="text-gray-700" />
          </View>
          <Text className="text-lg font-semibold text-gray-800 truncate mx-4 flex-1 text-center">
            {memoir.title}
          </Text>
          <View className="w-10" /> {/* Spacer */}
        </View>
      </View>

      <ScrollView
        scrollY
        className="flex-1"
        enableBackToTop
      >
        <View className="p-4 pb-8">
          {/* Cover Image */}
          {memoir.coverImage && (
            <View className="w-full h-48 rounded-2xl overflow-hidden mb-4 shadow-md">
              <Image
                src={memoir.coverImage}
                mode="aspectFill"
                className="w-full h-full"
              />
            </View>
          )}

          {/* Memoir Info Card */}
          <View className="bg-white/90 backdrop-blur-md rounded-2xl p-4 mb-4 shadow-md border border-amber-100">
            <View className="flex flex-col gap-4">
              <Text className="text-2xl font-bold text-amber-900 leading-tight">
                {memoir.title}
              </Text>

              {memoir.description && (
                <Text className="text-gray-600 text-sm leading-relaxed">
                  {memoir.description}
                </Text>
              )}

              <View className="flex flex-row items-center gap-3">
                {memoir.author?.avatar ? (
                  <Image
                    src={memoir.author.avatar}
                    mode="aspectFill"
                    className="w-14 h-14 rounded-full object-cover"
                  />
                ) : (
                  <View className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center">
                    <UserIcon size={28} className="text-amber-600" />
                  </View>
                )}
                <View>
                  <Text className="text-lg font-medium text-gray-900 block">
                    {memoir.author?.name || '匿名作者'}
                  </Text>
                  {memoir.author?.bio && (
                    <Text className="text-sm text-gray-500 block">
                      {memoir.author.bio}
                    </Text>
                  )}
                </View>
              </View>

              <View className="flex flex-row flex-wrap gap-6 text-base text-gray-600">
                <View className="flex flex-row items-center gap-2">
                  <BookOpen size={20} className="text-amber-500" />
                  <Text>{memoir.chapterCount} 个章节</Text>
                </View>
                <View className="flex flex-row items-center gap-2">
                  <Text>{memoir.memoryCount} 条回忆</Text>
                </View>
                <View className="flex flex-row items-center gap-2">
                  <Calendar size={20} className="text-amber-500" />
                  <Text>创建于 {formatDate(memoir.createdAt)}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Chapters List */}
          <View className="mt-6">
            <View className="flex flex-row items-center gap-2 mb-4 px-4">
              <View className="h-4 w-1 bg-amber-500 rounded-full" />
              <Text className="text-base font-bold text-amber-900">人生篇章</Text>
            </View>

            {chapters.length === 0 ? (
              <View className="mx-4 bg-white/60 rounded-xl p-8 flex items-center justify-center border border-amber-100/50 border-dashed">
                <Text className="text-gray-400 text-sm">这部回忆录还没有章节</Text>
              </View>
            ) : (
              <View className="space-y-4">
                {chapters.map((chapter, index) => {
                  const hasStories = chapter.stories && chapter.stories.length > 0;

                  return (
                    <View key={chapter.id} className="bg-white rounded-xl shadow-sm overflow-hidden mx-4">
                      {/* 章节头部 */}
                      <View className="bg-amber-50 px-4 py-3 border-b border-amber-100">
                        <View className="flex flex-row items-start gap-3">
                          {/* 章节序号 */}
                          <View className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0">
                            <Text className="text-white text-sm font-bold">{index + 1}</Text>
                          </View>

                          {/* 章节信息 */}
                          <View className="flex-1">
                            <View className="flex flex-row items-center gap-2 flex-wrap">
                              <Text className="text-base font-bold text-gray-800">
                                {chapter.title}
                              </Text>
                              {chapter.timePeriod && (
                                <Text className="text-xs text-amber-700 font-medium">
                                  ({chapter.timePeriod})
                                </Text>
                              )}
                            </View>

                            <View className="flex flex-row items-center gap-3 mt-1">
                              {chapter.description && (
                                <Text className="text-gray-600 text-xs leading-relaxed flex-1">
                                  {chapter.description}
                                </Text>
                              )}
                              {hasStories && (
                                <Text className="text-amber-600 text-xs font-medium shrink-0">
                                  {chapter.stories.length}个故事
                                </Text>
                              )}
                            </View>
                          </View>
                        </View>
                      </View>

                      {/* 故事列表 */}
                      {hasStories ? (
                        <View>
                          {chapter.stories.map((story: any, storyIndex: number) => (
                            <View
                              key={story.id}
                              className="px-4 py-3 border-b border-gray-100 last:border-b-0 active:bg-amber-50/50 transition-colors"
                              onClick={() => {
                                Taro.navigateTo({
                                  url: `/pages/chapter-detail/index?id=${chapter.id}&storyIndex=${storyIndex}&public=${isPublic}`
                                });
                              }}
                            >
                              <View className="flex flex-row items-center justify-between gap-3">
                                <View className="flex-1">
                                  <Text className="text-sm font-medium text-gray-800 leading-tight">
                                    {story.title}
                                  </Text>
                                  <View className="flex flex-row items-center gap-3 mt-1.5">
                                    {story.happenedAt && (
                                      <Text className="text-xs text-amber-600">
                                        🕒 {story.happenedAt}
                                      </Text>
                                    )}
                                    {story.location && (
                                      <Text className="text-xs text-gray-500">
                                        📍 {story.location}
                                      </Text>
                                    )}
                                  </View>
                                </View>
                                <ChevronRight size={18} className="text-gray-400 shrink-0" />
                              </View>
                            </View>
                          ))}
                        </View>
                      ) : (
                        <View className="px-4 py-6 flex items-center justify-center">
                          <Text className="text-gray-400 text-xs">暂无故事</Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* Memories Section (if any) */}
          {memories.length > 0 && (
            <View className="px-4 mt-6">
              <View className="flex flex-row items-center gap-2 mb-4">
                <View className="h-4 w-1 bg-amber-500 rounded-full" />
                <Text className="text-base font-bold text-amber-900">回忆片段</Text>
              </View>

              {memories.map((memory) => (
                <MemoryCard key={memory.id} data={memory} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
