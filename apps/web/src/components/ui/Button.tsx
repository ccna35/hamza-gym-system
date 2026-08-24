import { ButtonHTMLAttributes, forwardRef } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
export type ButtonSize = 'default' | 'sm' | 'icon';

export function buttonClassName({
  variant = 'primary',
  size = 'default',
  className = '',
}: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}) {
  const sizeClass = size === 'icon' ? 'ui-button-icon' : size === 'sm' ? 'min-h-10 px-3' : '';
  return `ui-button ui-button-${variant} ${sizeClass} ${className}`.trim();
}

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize }
>(function Button(
  { className, variant = 'primary', size = 'default', type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={buttonClassName({ variant, size, className: className ?? '' })}
      {...props}
    />
  );
});
