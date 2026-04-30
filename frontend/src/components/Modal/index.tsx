/**
 * Modal 组件
 *
 * 支持多种内容的模态框组件
 * 专为老年用户优化：清晰的视觉层次、易关闭
 */

import { FC, ReactNode, useEffect } from 'react';
import { View, Text } from '@tarojs/components';
import classNames from 'classnames';
import styles from './index.module.scss';

// ============================================
// 类型定义
// ============================================

export interface ModalProps {
  /** 是否显示 */
  visible: boolean;
  /** 标题 */
  title?: string;
  /** 内容 */
  children: ReactNode;
  /** 底部操作区 */
  footer?: ReactNode;
  /** 关闭事件 */
  onClose?: () => void;
  /** 点击遮罩是否关闭 */
  closeOnMaskClick?: boolean;
  /** 显示关闭按钮 */
  showCloseButton?: boolean;
  /** 自定义类名 */
  className?: string;
}

// ============================================
// 组件实现
// ============================================

export const Modal: FC<ModalProps> = ({
  visible,
  title,
  children,
  footer,
  onClose,
  closeOnMaskClick = true,
  showCloseButton = true,
  className,
}) => {
  // 禁止背景滚动
  useEffect(() => {
    if (visible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [visible]);

  if (!visible) {
    return null;
  }

  const handleMaskClick = () => {
    if (closeOnMaskClick) {
      onClose?.();
    }
  };

  return (
    <View className={styles.mask} onClick={handleMaskClick}>
      <View
        className={classNames(styles.modal, className)}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        {(title || showCloseButton) && (
          <View className={styles.header}>
            {title && <Text className={styles.title}>{title}</Text>}
            {showCloseButton && (
              <View className={styles.closeButton} onClick={() => onClose?.()}>
                <Text className={styles.closeIcon}>✕</Text>
              </View>
            )}
          </View>
        )}

        {/* 内容 */}
        <View className={styles.content}>{children}</View>

        {/* 底部 */}
        {footer && <View className={styles.footer}>{footer}</View>}
      </View>
    </View>
  );
};

export default Modal;
