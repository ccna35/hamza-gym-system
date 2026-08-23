import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Save } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { ApiError, createMember, MemberDetail, MemberInput, updateMember } from '../../api/client';
import { Modal } from '../ui/Modal';

const today = new Date().toISOString().slice(0, 10);
const empty: MemberInput = {
  name: '',
  phone: '',
  gender: 'MALE',
  dateOfBirth: '',
  heightCm: null,
  weightKg: null,
  joinDate: today,
};
const inputClass =
  'mt-1 min-h-11 w-full rounded-lg border border-[#c7bfb1] bg-white px-3 outline-none focus:border-[#315c45] focus:ring-2 focus:ring-[#315c45]/20';

export function MemberFormModal({
  isOpen,
  onClose,
  member,
}: {
  isOpen: boolean;
  onClose: () => void;
  member?: MemberDetail;
}) {
  const client = useQueryClient();
  const [form, setForm] = useState<MemberInput>(empty);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!isOpen) return;
    setForm(
      member
        ? {
            name: member.name,
            phone: member.phone,
            gender: member.gender,
            dateOfBirth: member.dateOfBirth,
            heightCm: member.heightCm,
            weightKg: member.weightKg,
            joinDate: member.joinDate,
          }
        : empty,
    );
    setError('');
  }, [isOpen, member]);
  const mutation = useMutation({
    mutationFn: (input: MemberInput) =>
      member ? updateMember(member.id, input) : createMember(input),
    onSuccess: async (saved) => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ['members'] }),
        client.invalidateQueries({ queryKey: ['member', saved.id] }),
        client.invalidateQueries({ queryKey: ['member-audit', saved.id] }),
      ]);
      onClose();
    },
    onError: (value) =>
      setError(
        value instanceof ApiError && value.code === 'MEMBER_PHONE_ALREADY_EXISTS'
          ? 'رقم الهاتف مسجل لعضو آخر.'
          : value instanceof ApiError && value.code === 'PHOTO_TOO_LARGE'
            ? 'حجم الصورة يتجاوز 5 ميجابايت.'
            : value instanceof ApiError && value.code === 'INVALID_MEMBER_PHOTO'
              ? 'الصورة غير صالحة. اختر JPEG أو PNG أو WebP.'
              : 'تعذر حفظ بيانات العضو. راجع الحقول وحاول مرة أخرى.',
      ),
  });
  const set = <K extends keyof MemberInput>(key: K, value: MemberInput[K]) =>
    setForm((current) => ({ ...current, [key]: value }));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    setError('');
    mutation.mutate(form);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={mutation.isPending ? () => undefined : onClose}
      size="lg"
      title={member ? 'تعديل بيانات العضو' : 'إضافة عضو جديد'}
    >
      <form onSubmit={submit}>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className="font-medium">اسم العضو</span>
            <input
              autoFocus
              className={inputClass}
              maxLength={150}
              minLength={2}
              onChange={(e) => set('name', e.target.value)}
              required
              value={form.name}
            />
          </label>
          <label>
            <span className="font-medium">رقم الهاتف</span>
            <input
              className={inputClass}
              dir="ltr"
              inputMode="tel"
              maxLength={20}
              onChange={(e) => set('phone', e.target.value)}
              required
              value={form.phone}
            />
          </label>
          <label>
            <span className="font-medium">النوع</span>
            <select
              className={inputClass}
              onChange={(e) => set('gender', e.target.value as MemberInput['gender'])}
              value={form.gender}
            >
              <option value="MALE">ذكر</option>
              <option value="FEMALE">أنثى</option>
            </select>
          </label>
          <label>
            <span className="font-medium">تاريخ الميلاد</span>
            <input
              className={inputClass}
              max={today}
              onChange={(e) => set('dateOfBirth', e.target.value)}
              required
              type="date"
              value={form.dateOfBirth}
            />
          </label>
          <label>
            <span className="font-medium">تاريخ الانضمام</span>
            <input
              className={inputClass}
              onChange={(e) => set('joinDate', e.target.value)}
              required
              type="date"
              value={form.joinDate}
            />
          </label>
          <label>
            <span className="font-medium">
              الطول (سم) <small className="text-[#68736b]">اختياري</small>
            </span>
            <input
              className={inputClass}
              max="300"
              min="0.01"
              onChange={(e) => set('heightCm', e.target.value ? Number(e.target.value) : null)}
              step="0.01"
              type="number"
              value={form.heightCm ?? ''}
            />
          </label>
          <label>
            <span className="font-medium">
              الوزن (كجم) <small className="text-[#68736b]">اختياري</small>
            </span>
            <input
              className={inputClass}
              max="500"
              min="0.01"
              onChange={(e) => set('weightKg', e.target.value ? Number(e.target.value) : null)}
              step="0.01"
              type="number"
              value={form.weightKg ?? ''}
            />
          </label>
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
          <button
            className="min-h-11 rounded-lg border border-[#c7bfb1] px-5 font-semibold"
            disabled={mutation.isPending}
            onClick={onClose}
            type="button"
          >
            إلغاء
          </button>
          <button
            className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#315c45] px-5 font-semibold text-white disabled:opacity-60"
            disabled={mutation.isPending}
          >
            <Save size={18} />
            {mutation.isPending ? 'جارٍ الحفظ...' : 'حفظ البيانات'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
