import React from 'react';
import styles from './Button.module.css';
import { cn } from '../utils/cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', fullWidth = false, ...props }, ref) => {
    const variantClass = styles[`button--${variant}`];
    const sizeClass = styles[`button--${size}`];
    const fullWidthClass = fullWidth ? styles['button--w-full'] : '';

    return (
      <button
        className={cn(
          styles.button,
          variantClass,
          sizeClass,
          fullWidthClass,
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };
