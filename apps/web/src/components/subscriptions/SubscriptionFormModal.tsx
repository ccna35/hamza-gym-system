import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FormEvent, useMemo, useState } from 'react';
import { ApiError, createSubscription, getPlans, renewSubscription } from '../../api/client';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input, Select } from '../ui/FormControl';

type Props = { memberId: string; renewal: boolean; isOpen: boolean; onClose: () => void };
const durations = [1, 3, 6, 12] as const;

export function SubscriptionFormModal({ memberId, renewal, isOpen, onClose }: Props) {
  const client = useQueryClient();
  const plans = useQuery({
    queryKey: ['plans', 'enabled'],
    queryFn: () => getPlans({ enabled: true, limit: 100 }),
    enabled: isOpen,
  });
  const [planId, setPlanId] = useState('');
  const [durationMonths, setDuration] = useState<(typeof durations)[number]>(1);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [agreedPriceMinor, setPrice] = useState(0);
  const [initialPaymentEgp, setInitialPaymentEgp] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const selected = useMemo(
    () => plans.data?.items.find((plan) => plan.id === planId),
    [plans.data, planId],
  );
  const mutation = useMutation({
    mutationFn: () => {
      const initialPayment =
        Number(initialPaymentEgp) > 0
          ? { amountMinor: Math.round(Number(initialPaymentEgp) * 100), paymentDate }
          : undefined;
      const paymentData = initialPayment ? { initialPayment } : {};
      return renewal
        ? renewSubscription(memberId, { planId, durationMonths, agreedPriceMinor, ...paymentData })
        : createSubscription(memberId, {
            planId,
            durationMonths,
            startDate,
            agreedPriceMinor,
            ...paymentData,
          });
    },
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ['member', memberId] }),
        client.invalidateQueries({ queryKey: ['subscriptions', memberId] }),
        client.invalidateQueries({ queryKey: ['payments', memberId] }),
        client.invalidateQueries({ queryKey: ['members'] }),
      ]);
      onClose();
    },
  });
  const choosePlan = (id: string) => {
    setPlanId(id);
    const plan = plans.data?.items.find((item) => item.id === id);
    setPrice(
      plan?.prices.find((price) => price.durationMonths === durationMonths)?.priceMinor ?? 0,
    );
  };
  const chooseDuration = (value: number) => {
    const duration = value as (typeof durations)[number];
    setDuration(duration);
    setPrice(selected?.prices.find((price) => price.durationMonths === duration)?.priceMinor ?? 0);
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    mutation.mutate();
  };
  const error =
    mutation.error instanceof ApiError
      ? mutation.error.message
      : mutation.isError
        ? 'تعذر حفظ الاشتراك'
        : null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={renewal ? 'تجديد الاشتراك' : 'إضافة اشتراك'}>
      <form className="space-y-4" onSubmit={submit}>
        <label className="block text-sm font-semibold">
          الخطة
          <Select
            className="mt-1"
            required
            value={planId}
            onChange={(e) => choosePlan(e.target.value)}
          >
            <option value="">اختر الخطة</option>
            {plans.data?.items.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name}
              </option>
            ))}
          </Select>
        </label>
        <label className="block text-sm font-semibold">
          المدة
          <Select
            className="mt-1"
            value={durationMonths}
            onChange={(e) => chooseDuration(Number(e.target.value))}
          >
            {durations.map((value) => (
              <option key={value} value={value}>
                {value} {value === 1 ? 'شهر' : 'أشهر'}
              </option>
            ))}
          </Select>
        </label>
        {!renewal && (
          <label className="block text-sm font-semibold">
            تاريخ البداية
            <Input
              className="mt-1"
              required
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </label>
        )}
        {renewal && (
          <p className="rounded-lg bg-[var(--primary-soft)] p-3 text-sm text-[var(--primary)]">
            سيبدأ التجديد تلقائياً بعد نهاية آخر اشتراك حالي أو مجدول.
          </p>
        )}
        <label className="block text-sm font-semibold">
          السعر المتفق عليه (قرش)
          <Input
            className="mt-1"
            min="0"
            required
            type="number"
            value={agreedPriceMinor}
            onChange={(e) => setPrice(Number(e.target.value))}
          />
        </label>
        {selected && (
          <p className="text-sm text-[#68736b]">
            السعر المعلن:{' '}
            {(selected.prices.find((price) => price.durationMonths === durationMonths)
              ?.priceMinor ?? 0) / 100}{' '}
            ج.م
          </p>
        )}
        <fieldset className="rounded-lg border border-[#d9d2c4] p-3">
          <legend className="px-1 text-sm font-semibold">دفعة أولى اختيارية</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-semibold">
              المبلغ (جنيه)
              <Input
                className="mt-1"
                min="0"
                step="0.01"
                type="number"
                value={initialPaymentEgp}
                onChange={(event) => setInitialPaymentEgp(event.target.value)}
              />
            </label>
            <label className="block text-sm font-semibold">
              تاريخ الدفع
              <Input
                className="mt-1"
                max={new Date().toISOString().slice(0, 10)}
                required={Number(initialPaymentEgp) > 0}
                type="date"
                value={paymentDate}
                onChange={(event) => setPaymentDate(event.target.value)}
              />
            </label>
          </div>
        </fieldset>
        {error && <p className="rounded-lg bg-[#f7e3df] p-3 text-sm text-[#8b382c]">{error}</p>}
        <div className="flex gap-2">
          <Button className="flex-1" disabled={mutation.isPending || plans.isPending} type="submit">
            {mutation.isPending ? 'جارٍ الحفظ…' : 'حفظ الاشتراك'}
          </Button>
          <Button variant="outline" onClick={onClose} type="button">
            إلغاء
          </Button>
        </div>
      </form>
    </Modal>
  );
}
