import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ApiError, uploadMemberPhoto } from '../../api/client';
import { Modal } from '../ui/Modal';
import { PhotoCapture } from './PhotoCapture';

export function PhotoUploadModal({
  memberId,
  isOpen,
  onClose,
}: {
  memberId: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const client = useQueryClient();
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    if (isOpen) {
      setPhoto(null);
      setError('');
    }
  }, [isOpen]);
  const mutation = useMutation({
    mutationFn: (value: Blob) => uploadMemberPhoto(memberId, value),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ['member', memberId] }),
        client.invalidateQueries({ queryKey: ['members'] }),
        client.invalidateQueries({ queryKey: ['member-audit', memberId] }),
      ]);
      onClose();
    },
    onError: (value) =>
      setError(
        value instanceof ApiError && value.code === 'PHOTO_TOO_LARGE'
          ? 'حجم الصورة يتجاوز 5 ميجابايت.'
          : value instanceof ApiError && value.code === 'INVALID_MEMBER_PHOTO'
            ? 'تعذر قراءة الصورة. التقط صورة جديدة أو اختر ملف JPEG أو PNG أو WebP.'
            : 'تعذر رفع الصورة. حاول مرة أخرى.',
      ),
  });
  return (
    <Modal
      isOpen={isOpen}
      onClose={mutation.isPending ? () => undefined : onClose}
      size="lg"
      title="صورة العضو"
    >
      <PhotoCapture onChange={setPhoto} value={photo} />
      {error && (
        <div
          className="mt-4 rounded-lg border border-[#e6b7ae] bg-[#fff2ef] p-3 text-sm text-[#8b382c]"
          role="alert"
        >
          {error}
        </div>
      )}
      <div className="mt-6 flex flex-col-reverse gap-3 border-t border-[#e8e2d7] pt-5 sm:flex-row">
        <button
          className="min-h-11 rounded-lg border border-[#c7bfb1] px-5 font-semibold"
          disabled={mutation.isPending}
          onClick={onClose}
          type="button"
        >
          إلغاء
        </button>
        <button
          className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#315c45] px-5 font-semibold text-white disabled:opacity-50"
          disabled={!photo || mutation.isPending}
          onClick={() => photo && mutation.mutate(photo)}
          type="button"
        >
          <Upload size={18} />
          {mutation.isPending ? 'جارٍ رفع الصورة...' : 'رفع الصورة'}
        </button>
      </div>
    </Modal>
  );
}
