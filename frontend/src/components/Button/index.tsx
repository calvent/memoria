/**
 * Button 组件
 *
 * 支持多种变体、尺寸和状态的按钮组件
 * 专为老年用户优化：大点击区域、清晰的视觉反馈
 */

import { FC, ButtonHTMLAttributes } from 'react';
import { View } from '@tarojs/components';
import classNames from 'classnames';
import styles from './index.module.scss';

// ============================================
// 类型定义
// ============================================

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** 按钮变体 */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  /** 按钮尺寸 */
  size?: 'sm' | 'md' | 'lg';
  /** 按钮状态 */
  state?: 'default' | 'hover' | 'active' | 'disabled' | 'loading';
  /** 是否为块级按钮（占满容器宽度） */
  block?: boolean;
  /** 图标 */
  icon?: React.ReactNode;
  /** 是否禁用 */
  disabled?: boolean;
  /** 加载中 */
  loading?: boolean;
  /** 子元素 */
  children: React.ReactNode;
  /** 点击事件 */
  onClick?: (e: any) => void;
}

// ============================================
// 组件实现
// ============================================

export const Button: FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  state = 'default',
  block = false,
  icon,
  disabled = false,
  loading = false,
  children,
  className,
  onClick,
  ...rest
}) => {
  // 计算按钮状态
  const buttonState = disabled ? 'disabled' : loading ? 'loading' : state;

  // 组合 className
  const buttonClass = classNames(
    styles.button,
    styles[`variant-${variant}`],
    styles[`size-${size}`],
    styles[`state-${buttonState}`],
    {
      [styles.block]: block,
    },
    className
  );

  return (
    <View
      className={buttonClass}
      onClick={disabled || loading ? undefined : onClick}
      {...rest}
    >
      {loading && <span className={styles.spinner} />}
      {icon && !loading && <span className={styles.icon}>{icon}</span>}
      <span className={styles.content}>{children}</span>
    </View>
  );
};

export default Button;
