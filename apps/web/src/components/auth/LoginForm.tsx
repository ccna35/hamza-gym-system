import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ApiError, login } from '../../api/client';
import { Button } from '../ui/Button';
import { Input } from '../ui/FormControl';

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
      <Input
        autoComplete="username"
        className="mt-2"
        id="username"
        onChange={(event) => setUsername(event.target.value)}
        required
        value={username}
      />
      <label className="mt-5 block font-medium" htmlFor="password">
        كلمة المرور
      </label>
      <Input
        autoComplete="current-password"
        className="mt-2"
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
      <Button
        className="mt-6 w-full disabled:cursor-wait"
        disabled={mutation.isPending}
        type="submit"
      >
        {mutation.isPending ? 'جارٍ تسجيل الدخول...' : 'تسجيل الدخول'}
      </Button>
    </form>
  );
}
