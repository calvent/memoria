
import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import { BookOpen, Calendar, User as UserIcon } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { PlazaMemoir } from '@/types/models';

// Utility for merging tailwind classes
function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface MemoirCardProps {
    memoir: PlazaMemoir;
    onClick: (memoir: PlazaMemoir) => void;
}

export function MemoirCard({ memoir, onClick }: MemoirCardProps) {
    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("zh-CN", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    return (
        <View
            className={cn(
                "bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-xl transition-shadow cursor-pointer mb-6"
            )}
            onClick={() => onClick(memoir)}
        >
            {/* Cover Image */}
            {memoir.coverImage ? (
                <View className="w-full h-56 overflow-hidden relative">
                    <Image
                        src={memoir.coverImage}
                        mode="aspectFill"
                        className="w-full h-full object-cover transition-transform duration-300"
                    />
                </View>
            ) : (
                <View className="w-full h-56 bg-gradient-to-br from-amber-200 to-orange-200 flex items-center justify-center">
                    <BookOpen size={48} color="#d97706" /> {/* amber-600 */}
                </View>
            )}

            <View className="p-6">
                <Text className="text-2xl font-bold mb-3 block text-gray-900 line-clamp-2">
                    {memoir.title}
                </Text>
                <Text className="text-lg text-gray-700 mb-4 block line-clamp-3 leading-relaxed">
                    {memoir.description}
                </Text>

                <View className="flex flex-row items-center gap-3 mb-4 pb-4 border-b border-gray-200">
                    {memoir.author.avatar ? (
                        <Image
                            src={memoir.author.avatar}
                            className="w-10 h-10 rounded-full object-cover"
                        />
                    ) : (
                        <View className="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center">
                            <UserIcon size={24} color="#b45309" /> {/* amber-700 */}
                        </View>
                    )}
                    <View>
                        <Text className="text-base font-medium text-gray-900 block">
                            {memoir.author.name}
                        </Text>
                        {memoir.author.bio && (
                            <Text className="text-sm text-gray-600 block line-clamp-1">
                                {memoir.author.bio}
                            </Text>
                        )}
                    </View>
                </View>

                <View className="flex flex-row items-center justify-between text-base text-gray-600 mb-4">
                    <View className="flex flex-row items-center gap-2">
                        <BookOpen size={20} />
                        <Text>{memoir.chapterCount} 章节</Text>
                    </View>
                    <View className="flex flex-row items-center gap-2">
                        <Text>{memoir.memoryCount} 条回忆</Text>
                    </View>
                </View>

                <View className="flex flex-row items-center gap-2 text-sm text-gray-500 mb-4">
                    <Calendar size={16} />
                    <Text>更新于 {formatDate(memoir.updatedAt)}</Text>
                </View>

                <View
                    className="w-full py-4 bg-amber-600 rounded-lg flex items-center justify-center active:bg-amber-700 transition-colors shadow-xs hover:shadow-sm"
                    onClick={(e) => {
                        e.stopPropagation();
                        onClick(memoir);
                    }}
                >
                    <Text className="text-white text-lg font-medium">阅读回忆录</Text>
                </View>
            </View>
        </View>
    );
}
