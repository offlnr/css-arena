import React from 'react';
import styles from './Input.module.css';
import { cn } from '../utils/cn';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', error, label, ...props }, ref) => (
    <div className={styles.inputWrapper}>
      {label && (
        <label className={styles.label}>
          {label}
        </label>
      )}
      <input
        type={type}
        className={cn(
          styles.input,
          error && styles.error,
          className
        )}
        ref={ref}
        {...props}
      />
      {error && (
        <p className={styles.error}>{error}</p>
      )}
    </div>
  )
);
Input.displayName = 'Input';

export { Input };
