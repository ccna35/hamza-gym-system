import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiError, changePassword } from '../../api/client';
import { Modal } from '../ui/Modal';

interface PasswordChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PasswordChangeModal({ isOpen, onClose }: PasswordChangeModalProps) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({
      currentPassword,
      newPassword,
    }: {
      currentPassword: string;
      newPassword: string;
    }) => changePassword(currentPassword, newPassword),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['owner'] });
      onClose();
    },
  });
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="تغيير كلمة المرور">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          mutation.mutate({ currentPassword, newPassword });
        }}
      >
        <label className="block font-medium" htmlFor="current-password">
          كلمة المرور الحالية
        </label>
        <input
          autoComplete="current-password"
          className="mt-2 min-h-11 w-full rounded-lg border border-[#b9b2a6] bg-white px-3 outline-none focus:border-[#315c45] focus:ring-2 focus:ring-[#dce9df]"
          id="current-password"
          onChange={(event) => setCurrentPassword(event.target.value)}
          required
          type="password"
          value={currentPassword}
        />
        <label className="mt-5 block font-medium" htmlFor="new-password">
          كلمة المرور الجديدة
        </label>
        <input
          autoComplete="new-password"
          className="mt-2 min-h-11 w-full rounded-lg border border-[#b9b2a6] bg-white px-3 outline-none focus:border-[#315c45] focus:ring-2 focus:ring-[#dce9df]"
          id="new-password"
          minLength={10}
          onChange={(event) => setNewPassword(event.target.value)}
          required
          type="password"
          value={newPassword}
        />
        {mutation.isError && (
          <p className="mt-4 rounded-lg bg-[#f9e9e5] p-3 text-sm text-[#9b3d2e]">
            {mutation.error instanceof ApiError &&
            mutation.error.code === 'CURRENT_PASSWORD_INCORRECT'
              ? 'كلمة المرور الحالية غير صحيحة.'
              : 'تعذر تغيير كلمة المرور.'}
          </p>
        )}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            className="min-h-11 rounded-lg border border-[#b9b2a6] px-4"
            onClick={onClose}
            type="button"
          >
            إلغاء
          </button>
          <button
            className="min-h-11 rounded-lg bg-[#315c45] px-4 font-semibold text-white disabled:opacity-60"
            disabled={mutation.isPending}
            type="submit"
          >
            {mutation.isPending ? 'جارٍ الحفظ...' : 'حفظ كلمة المرور'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
