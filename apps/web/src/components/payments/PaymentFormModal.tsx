import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FormEvent, useState } from 'react';
import { ApiError, createPayment } from '../../api/client';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/FormControl';

export function PaymentFormModal({
  memberId,
  balanceMinor,
  isOpen,
  onClose,
}: {
  memberId: string;
  balanceMinor: number;
  isOpen: boolean;
  onClose: () => void;
}) {
  const client = useQueryClient();
  const [amountEgp, setAmountEgp] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const mutation = useMutation({
    mutationFn: () =>
      createPayment(memberId, { amountMinor: Math.round(Number(amountEgp) * 100), paymentDate }),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ['member', memberId] }),
        client.invalidateQueries({ queryKey: ['payments', memberId] }),
        client.invalidateQueries({ queryKey: ['members'] }),
      ]);
      setAmountEgp('');
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
        ? 'تعذر تسجيل الدفعة'
        : null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="تسجيل دفعة نقدية">
      <form className="space-y-4" onSubmit={submit}>
        <p className="rounded-lg bg-[var(--primary-soft)] p-3 text-sm text-[var(--primary)]">
          الرصيد المستحق: {(balanceMinor / 100).toFixed(2)} ج.م — الدفع نقدي
        </p>
        <label className="block text-sm font-semibold">
          المبلغ (جنيه)
          <Input
            className="mt-1"
            max={balanceMinor / 100}
            min="0.01"
            required
            step="0.01"
            type="number"
            value={amountEgp}
            onChange={(event) => setAmountEgp(event.target.value)}
          />
        </label>
        <label className="block text-sm font-semibold">
          تاريخ الدفع
          <Input
            className="mt-1"
            max={new Date().toISOString().slice(0, 10)}
            required
            type="date"
            value={paymentDate}
            onChange={(event) => setPaymentDate(event.target.value)}
          />
        </label>
        {error && <p className="rounded-lg bg-[#f7e3df] p-3 text-sm text-[#8b382c]">{error}</p>}
        <div className="flex gap-2">
          <Button
            className="flex-1"
            disabled={mutation.isPending || balanceMinor <= 0}
            type="submit"
          >
            {mutation.isPending ? 'جارٍ التسجيل…' : 'تسجيل الدفعة'}
          </Button>
          <Button variant="outline" onClick={onClose} type="button">
            إلغاء
          </Button>
        </div>
      </form>
    </Modal>
  );
}
