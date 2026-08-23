import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ApiError, login } from '../../api/client';

export function LoginForm() {
  const navigate = useNavigate();
  const mutation = useMutation({
    mutationFn: ({ username, password }: { username: string; password: string }) =>
      login(username, password),
    onSuccess: () => navigate('/'),
  });
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  return (
    <form
      className="mt-8"
      onSubmit={(event) => {
        event.preventDefault();
        mutation.mutate({ username, password });
      }}
    >
      <label className="block font-medium" htmlFor="username">
        اسم المستخدم
      </label>
      <input
        autoComplete="username"
        className="mt-2 min-h-11 w-full rounded-lg border border-[#b9b2a6] bg-white px-3 outline-none focus:border-[#315c45] focus:ring-2 focus:ring-[#dce9df]"
        id="username"
        onChange={(event) => setUsername(event.target.value)}
        required
        value={username}
      />
      <label className="mt-5 block font-medium" htmlFor="password">
        كلمة المرور
      </label>
      <input
        autoComplete="current-password"
        className="mt-2 min-h-11 w-full rounded-lg border border-[#b9b2a6] bg-white px-3 outline-none focus:border-[#315c45] focus:ring-2 focus:ring-[#dce9df]"
        id="password"
        onChange={(event) => setPassword(event.target.value)}
        required
        type="password"
        value={password}
      />
      {mutation.isError && (
        <p className="mt-4 rounded-lg bg-[#f9e9e5] p-3 text-sm text-[#9b3d2e]">
          {mutation.error instanceof ApiError && mutation.error.code === 'TOO_MANY_LOGIN_ATTEMPTS'
            ? 'محاولات الدخول كثيرة، حاول لاحقاً'
            : 'بيانات الدخول غير صحيحة'}
        </p>
      )}
      <button
        className="mt-6 min-h-11 w-full rounded-lg bg-[#315c45] px-4 font-semibold text-white transition-colors hover:bg-[#234633] disabled:cursor-wait disabled:opacity-60"
        disabled={mutation.isPending}
        type="submit"
      >
        {mutation.isPending ? 'جارٍ تسجيل الدخول...' : 'تسجيل الدخول'}
      </button>
    </form>
  );
}
