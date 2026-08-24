import { useMutation, useQueryClient } from '@tanstack/react-query';
import { BadgeDollarSign, Save } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { ApiError, createPlan, Plan, PlanInput, updatePlan } from '../../api/client';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/FormControl';

const durations = [1, 3, 6, 12] as const;
const durationLabels = { 1: 'شهر واحد', 3: '3 أشهر', 6: '6 أشهر', 12: '12 شهراً' };

function minorToEgp(value: number) {
  return value % 100 === 0 ? String(value / 100) : (value / 100).toFixed(2);
}

function egpToMinor(value: string) {
  const normalized = value.trim();
  if (!/^\d+(\.\d{0,2})?$/.test(normalized)) return null;
  const [whole, fraction = ''] = normalized.split('.');
  const result = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  return Number.isSafeInteger(result) ? result : null;
}

export function PlanFormModal({
  isOpen,
  onClose,
  plan,
}: {
  isOpen: boolean;
  onClose: () => void;
  plan?: Plan | undefined;
}) {
  const client = useQueryClient();
  const [name, setName] = useState('');
  const [prices, setPrices] = useState<Record<number, string>>({ 1: '', 3: '', 6: '', 12: '' });
  const [error, setError] = useState('');
  useEffect(() => {
    if (!isOpen) return;
    setName(plan?.name ?? '');
    setPrices(
      Object.fromEntries(
        durations.map((duration) => [
          duration,
          plan
            ? minorToEgp(
                plan.prices.find((price) => price.durationMonths === duration)?.priceMinor ?? 0,
              )
            : '',
        ]),
      ),
    );
    setError('');
  }, [isOpen, plan]);
  const mutation = useMutation({
    mutationFn: (input: PlanInput) => (plan ? updatePlan(plan.id, input) : createPlan(input)),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ['plans'] }),
        client.invalidateQueries({ queryKey: ['audit-logs'] }),
      ]);
      onClose();
    },
    onError: (value) =>
      setError(
        value instanceof ApiError && value.code === 'PLAN_NAME_ALREADY_EXISTS'
          ? 'يوجد خطة أخرى بهذا الاسم.'
          : 'تعذر حفظ الخطة. راجع البيانات وحاول مرة أخرى.',
      ),
  });
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const mapped = durations.map((duration) => ({
      durationMonths: duration,
      priceMinor: egpToMinor(prices[duration] ?? ''),
    }));
    if (mapped.some((price) => price.priceMinor === null)) {
      setError('أدخل سعراً صحيحاً بالجنيه، بحد أقصى رقمين بعد العلامة العشرية.');
      return;
    }
    mutation.mutate({ name: name.trim(), prices: mapped as PlanInput['prices'] });
  };
  return (
    <Modal
      isOpen={isOpen}
      onClose={mutation.isPending ? () => undefined : onClose}
      size="lg"
      title={plan ? 'تعديل الخطة' : 'إضافة خطة جديدة'}
    >
      <form onSubmit={submit}>
        <div className="rounded-xl bg-[#eef3ee] p-4">
          <div className="flex items-center gap-2 font-semibold text-[var(--primary)]">
            <BadgeDollarSign size={19} />
            الأسعار بالجنيه المصري
          </div>
          <p className="mt-1 text-sm text-[#68736b]">
            حدد سعر كل مدة. يُسمح بالسعر صفر للخطط المجانية.
          </p>
        </div>
        <label className="mt-5 block">
          <span className="font-medium">اسم الخطة</span>
          <Input
            autoFocus
            className="mt-1"
            maxLength={100}
            minLength={2}
            onChange={(event) => setName(event.target.value)}
            required
            value={name}
          />
        </label>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {durations.map((duration) => (
            <label htmlFor={`plan-price-${duration}`} key={duration}>
              <span className="font-medium">{durationLabels[duration]}</span>
              <div className="relative mt-1">
                <Input
                  aria-label={durationLabels[duration]}
                  id={`plan-price-${duration}`}
                  className="pr-3 pl-14 text-left"
                  dir="ltr"
                  inputMode="decimal"
                  onChange={(event) =>
                    setPrices((current) => ({ ...current, [duration]: event.target.value }))
                  }
                  placeholder="0.00"
                  required
                  value={prices[duration]}
                />
                <span className="pointer-events-none absolute left-3 top-3 text-sm text-[#68736b]">
                  ج.م
                </span>
              </div>
            </label>
          ))}
        </div>
        {error && (
          <div
            className="mt-5 rounded-lg border border-[#e6b7ae] bg-[#fff2ef] p-3 text-sm text-[#8b382c]"
            role="alert"
          >
            {error}
          </div>
        )}
        <div className="mt-6 flex flex-col-reverse gap-3 border-t border-[#e8e2d7] pt-5 sm:flex-row">
          <Button variant="outline" disabled={mutation.isPending} onClick={onClose} type="button">
            إلغاء
          </Button>
          <Button disabled={mutation.isPending} type="submit">
            <Save size={18} />
            {mutation.isPending ? 'جارٍ الحفظ...' : 'حفظ الخطة'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
