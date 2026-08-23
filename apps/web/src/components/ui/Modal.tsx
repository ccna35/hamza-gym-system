import { X } from 'lucide-react';
import { PropsWithChildren, useEffect } from 'react';

interface ModalProps extends PropsWithChildren {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  size?: 'sm' | 'lg';
}

export function Modal({ title, isOpen, onClose, children, size = 'sm' }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      aria-labelledby="modal-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#17221d]/45 p-0 sm:items-center sm:p-4"
      role="dialog"
    >
      <button
        aria-label="إغلاق النافذة"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        type="button"
      />
      <section
        className={`relative z-10 max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-[#d9d2c4] bg-[#fffdf8] p-5 shadow-2xl sm:rounded-2xl sm:p-6 ${size === 'lg' ? 'sm:max-w-3xl' : 'sm:max-w-lg'}`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#e4ded2] pb-4">
          <h2 className="text-lg font-semibold" id="modal-title">
            {title}
          </h2>
          <button
            aria-label="إغلاق النافذة"
            className="rounded-lg p-2 text-[#59665d] hover:bg-[#f1ede5]"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={20} />
          </button>
        </div>
        <div className="pt-5">{children}</div>
      </section>
    </div>
  );
}
