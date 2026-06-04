import React from 'react';
import styles from './Card.module.css';
import { cn } from '../utils/cn';

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outlined';
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variantClass = variant === 'default' ? styles['card--default'] : styles['card--outlined'];
    return (
      <div
        className={cn(
          styles.card,
          variantClass,
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    className={cn(styles.cardHeader, className)}
    ref={ref}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div className={cn(styles.cardContent, className)} ref={ref} {...props} />
));
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    className={cn(styles.cardFooter, className)}
    ref={ref}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardContent, CardFooter };
