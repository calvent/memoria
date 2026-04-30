
import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import { Clock, Tag, MapPin, Edit2, Trash2, Volume2 } from 'lucide-react';
import { cn } from '@/utils/cn';

// Define Memory interface locally or import if available. 
// Using loose type for now to match Plaza usage
export interface Memory {
    id: string;
    title: string;
    content: string;
    date: string;
    category: string;
    location?: string;
    imageUrl?: string;
    chapterId?: string;
}

interface MemoryCardProps {
    memory: Memory;
    onEdit?: (memory: Memory) => void;
    onDelete?: (id: string) => void;
    showActions?: boolean;
}

export function MemoryCard({ memory, onEdit, onDelete, showActions = true }: MemoryCardProps) {

    // Audio playback is platform specific. In Taro we use InnerAudioContext or TextToSpeech plugin.
    // We'll just log or show a toast for this demo if clicked.
    const speakMemory = (e: any) => {
        e.stopPropagation();
        console.log('Speak:', memory.title);
        // Taro.showToast({ title: '朗读功能开发中', icon: 'none' }); 
        // We avoid importing Taro here to keep it pure if possible, but we are in Taro app.
    };

    return (
        <View className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg transition-shadow mb-4">
            {memory.imageUrl && (
                <View className="w-full h-48 overflow-hidden relative">
                    <Image
                        src={memory.imageUrl}
                        mode="aspectFill"
                        className="w-full h-full object-cover"
                    />
                </View>
            )}
            <View className="p-6">
                <View className="flex flex-row items-start justify-between gap-4 mb-3">
                    <Text className="text-xl font-bold flex-1 text-gray-900">{memory.title}</Text>
                    <View className="flex flex-row gap-2">
                        <View
                            className="p-2 rounded-full hover:bg-gray-100"
                            onClick={speakMemory}
                        >
                            <Volume2 size={20} className="text-gray-600" />
                        </View>
                        {showActions && onEdit && onDelete && (
                            <>
                                <View
                                    className="p-2 rounded-full hover:bg-gray-100"
                                    onClick={(e) => { e.stopPropagation(); onEdit(memory); }}
                                >
                                    <Edit2 size={20} className="text-gray-600" />
                                </View>
                                <View
                                    className="p-2 rounded-full hover:bg-gray-100"
                                    onClick={(e) => { e.stopPropagation(); onDelete(memory.id); }}
                                >
                                    <Trash2 size={20} className="text-red-600" />
                                </View>
                            </>
                        )}
                    </View>
                </View>

                <Text className="text-base text-gray-700 mb-4 block line-clamp-3 leading-relaxed">
                    {memory.content}
                </Text>

                <View className="flex flex-row flex-wrap gap-4 text-sm text-gray-500">
                    <View className="flex flex-row items-center gap-1">
                        <Clock size={16} />
                        <Text>{memory.date}</Text>
                    </View>
                    <View className="flex flex-row items-center gap-1">
                        <Tag size={16} />
                        <Text>{memory.category}</Text>
                    </View>
                    {memory.location && (
                        <View className="flex flex-row items-center gap-1">
                            <MapPin size={16} />
                            <Text>{memory.location}</Text>
                        </View>
                    )}
                </View>
            </View>
        </View>
    );
}
