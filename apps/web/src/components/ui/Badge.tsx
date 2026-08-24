import { HTMLAttributes } from 'react';

export function Badge({
  variant = 'primary',
  className = '',
  ...props
}: HTMLAttributes<HTMLSpanElement> & {
  variant?: 'primary' | 'secondary' | 'success' | 'destructive';
}) {
  return <span className={`ui-badge ui-badge-${variant} ${className}`} {...props} />;
}
