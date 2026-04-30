/**
 * Avatar 组件
 *
 * 用户头像组件，支持图片、文字和加载状态
 */

import { FC } from 'react';
import { View, Text, Image } from '@tarojs/components';
import classNames from 'classnames';
import styles from './index.module.scss';

// ============================================
// 类型定义
// ============================================

export interface AvatarProps {
  /** 头像尺寸 */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** 头像形状 */
  shape?: 'circle' | 'square';
  /** 图片 URL */
  src?: string;
  /** 文字（无图片时显示） */
  text?: string;
  /** 背景色 */
  backgroundColor?: string;
  /** 文字颜色 */
  textColor?: string;
  /** 加载状态 */
  loading?: boolean;
  /** 点击事件 */
  onClick?: () => void;
  /** 自定义类名 */
  className?: string;
}

// ============================================
// 组件实现
// ============================================

export const Avatar: FC<AvatarProps> = ({
  size = 'md',
  shape = 'circle',
  src,
  text,
  backgroundColor = 'var(--color-primary)',
  textColor = 'var(--color-primary-foreground)',
  loading = false,
  onClick,
  className,
}) => {
  const avatarClass = classNames(
    styles.avatar,
    styles[`size-${size}`],
    styles[`shape-${shape}`],
    {
      [styles.clickable]: !!onClick,
      [styles.loading]: loading,
    },
    className
  );

  // 显示文字
  const displayText = text?.substring(0, 2).toUpperCase();

  return (
    <View
      className={avatarClass}
      onClick={onClick}
      style={
        !src && !loading
          ? { backgroundColor, color: textColor }
          : undefined
      }
    >
      {loading ? (
        <View className={styles.skeleton} />
      ) : src ? (
        <Image
          src={src}
          className={styles.image}
          mode="aspectFill"
          lazyLoad
        />
      ) : (
        <Text className={styles.text}>{displayText}</Text>
      )}
    </View>
  );
};

export default Avatar;
