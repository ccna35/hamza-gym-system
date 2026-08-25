import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FormEvent, useState } from 'react';
import { ApiError, Payment, voidPayment } from '../../api/client';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/FormControl';

export function VoidPaymentModal({
  payment,
  memberId,
  isOpen,
  onClose,
}: {
  payment: Payment | null;
  memberId: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const client = useQueryClient();
  const [reason, setReason] = useState('');
  const mutation = useMutation({
    mutationFn: () => voidPayment(payment!.id, reason),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ['member', memberId] }),
        client.invalidateQueries({ queryKey: ['payments', memberId] }),
        client.invalidateQueries({ queryKey: ['members'] }),
      ]);
      setReason('');
      onClose();
    },
  });
  const submit = (event: FormEvent) => {
    event.preventDefault();
    mutation.mutate();
  };
  const error =
    mutation.error instanceof ApiError
      ? mutation.error.message
      : mutation.isError
        ? 'تعذر إلغاء الدفعة'
        : null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="إلغاء دفعة مسجلة">
      <form className="space-y-4" onSubmit={submit}>
        <p className="rounded-lg bg-[#f7e3df] p-3 text-sm text-[#8b382c]">
          الإلغاء لا يحذف الدفعة أو الإيصال، وسيعيد مبلغها إلى الرصيد المستحق.
        </p>
        {payment && (
          <p className="text-sm">
            الإيصال:{' '}
            <span className="font-mono" dir="ltr">
              {payment.receiptNumber}
            </span>
          </p>
        )}
        <label className="block text-sm font-semibold">
          سبب الإلغاء
          <Textarea
            className="mt-1 min-h-24"
            maxLength={500}
            minLength={3}
            required
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </label>
        {error && <p className="rounded-lg bg-[#f7e3df] p-3 text-sm text-[#8b382c]">{error}</p>}
        <div className="flex gap-2">
          <Button
            className="flex-1"
            variant="destructive"
            disabled={mutation.isPending}
            type="submit"
          >
            {mutation.isPending ? 'جارٍ الإلغاء…' : 'تأكيد إلغاء الدفعة'}
          </Button>
          <Button variant="outline" onClick={onClose} type="button">
            رجوع
          </Button>
        </div>
      </form>
    </Modal>
  );
}
