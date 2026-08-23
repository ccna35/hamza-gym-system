import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './app';

const api = vi.hoisted(() => ({
  ApiError: class ApiError extends Error {
    status = 0;
    code?: string;
  },
  changePassword: vi.fn(),
  getCurrentOwner: vi.fn(),
  getHealth: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  uploadMemberPhoto: vi.fn(),
  getPlans: vi.fn(),
  createPlan: vi.fn(),
  updatePlan: vi.fn(),
  enablePlan: vi.fn(),
  disablePlan: vi.fn(),
}));

vi.mock('./api/client', () => api);

describe('authentication experience', () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    window.history.pushState({}, '', '/login');
    api.login.mockReset();
    api.getCurrentOwner.mockReset();
    api.getHealth.mockReset().mockResolvedValue({ status: 'ok', database: 'ok' });
  });

  it('shows the Arabic login error for invalid credentials', async () => {
    api.login.mockRejectedValue(new Error('invalid'));
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByLabelText('اسم المستخدم'), 'owner');
    await user.type(screen.getByLabelText('كلمة المرور'), 'wrong');
    await user.click(screen.getByRole('button', { name: 'تسجيل الدخول' }));
    expect(await screen.findByText('بيانات الدخول غير صحيحة')).toBeInTheDocument();
  });

  it('navigates to the authenticated shell after successful login', async () => {
    api.login.mockResolvedValue({
      owner: { id: '1', username: 'owner', mustChangePassword: false },
    });
    api.getCurrentOwner.mockResolvedValue({
      owner: { id: '1', username: 'owner', mustChangePassword: false },
    });
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByLabelText('اسم المستخدم'), 'owner');
    await user.type(screen.getByLabelText('كلمة المرور'), 'valid-password');
    await user.click(screen.getByRole('button', { name: 'تسجيل الدخول' }));
    expect(await screen.findByRole('heading', { name: 'لوحة التحكم' })).toBeInTheDocument();
  });

  it('shows the temporary-password warning without blocking the shell', async () => {
    window.history.pushState({}, '', '/');
    api.getCurrentOwner.mockResolvedValue({
      owner: { id: '1', username: 'owner', mustChangePassword: true },
    });
    render(<App />);
    expect(await screen.findByText('يرجى تغيير كلمة المرور المؤقتة.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'لوحة التحكم' })).toBeInTheDocument();
  });
});
