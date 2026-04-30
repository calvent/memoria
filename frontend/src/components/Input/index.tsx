/**
 * Input 组件
 *
 * 支持多种类型和状态的输入框组件
 * 专为老年用户优化：大字体、清晰的边框、易读的占位符
 */

import { FC, InputHTMLAttributes } from 'react';
import { View, Input as TaroInput, Text } from '@tarojs/components';
import classNames from 'classnames';
import styles from './index.module.scss';

// ============================================
// 类型定义
// ============================================

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** 输入框尺寸 */
  size?: 'sm' | 'md';
  /** 输入框状态 */
  state?: 'default' | 'error' | 'success';
  /** 是否禁用 */
  disabled?: boolean;
  /** 标签 */
  label?: string;
  /** 错误提示 */
  error?: string;
  /** 帮助文本 */
  helperText?: string;
  /** 前置图标 */
  prefixIcon?: React.ReactNode;
  /** 后置图标 */
  suffixIcon?: React.ReactNode;
  /** 值 */
  value?: string;
  /** 变更事件 */
  onChange?: (value: string) => void;
  /** 获得焦点事件 */
  onFocus?: (e: any) => void;
  /** 失去焦点事件 */
  onBlur?: (e: any) => void;
}

// ============================================
// 组件实现
// ============================================

export const Input: FC<InputProps> = ({
  size = 'md',
  state = 'default',
  disabled = false,
  label,
  error,
  helperText,
  prefixIcon,
  suffixIcon,
  value,
  placeholder,
  type = 'text',
  onChange,
  onFocus,
  onBlur,
  className,
  ...rest
}) => {
  // 计算输入框状态
  const inputState = error ? 'error' : state;

  // 输入框容器 className
  const wrapperClass = classNames(styles.wrapper, className);

  // 输入框容器 className
  const containerClass = classNames(
    styles.container,
    styles[`size-${size}`],
    styles[`state-${inputState}`],
    {
      [styles.disabled]: disabled,
      [styles.hasPrefix]: !!prefixIcon,
      [styles.hasSuffix]: !!suffixIcon,
    }
  );

  return (
    <View className={wrapperClass}>
      {label && <Text className={styles.label}>{label}</Text>}

      <View className={containerClass}>
        {prefixIcon && <View className={styles.prefixIcon}>{prefixIcon}</View>}

        <TaroInput
          className={styles.input}
          type={type}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          onInput={(e) => onChange?.(e.detail.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          {...rest}
        />

        {suffixIcon && <View className={styles.suffixIcon}>{suffixIcon}</View>}
      </View>

      {error && <Text className={styles.errorText}>{error}</Text>}
      {helperText && !error && <Text className={styles.helperText}>{helperText}</Text>}
    </View>
  );
};

export default Input;
