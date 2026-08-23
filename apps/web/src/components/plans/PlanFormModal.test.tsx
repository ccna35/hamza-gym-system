import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PlanFormModal } from './PlanFormModal';

const api = vi.hoisted(() => ({ createPlan: vi.fn(), updatePlan: vi.fn() }));
vi.mock('../../api/client', async (original) => ({ ...(await original()), ...api }));

describe('PlanFormModal', () => {
  afterEach(() => cleanup());

  it('converts displayed EGP prices to integer minor units', async () => {
    api.createPlan.mockResolvedValue({ id: 'plan-id' });
    const user = userEvent.setup();
    render(
      <QueryClientProvider client={new QueryClient()}>
        <PlanFormModal isOpen onClose={vi.fn()} />
      </QueryClientProvider>,
    );
    await user.type(screen.getByLabelText('اسم الخطة'), 'الخطة الذهبية');
    await user.type(screen.getByLabelText('شهر واحد'), '300');
    await user.type(screen.getByLabelText('3 أشهر'), '800.50');
    await user.type(screen.getByLabelText('6 أشهر'), '1500');
    await user.type(screen.getByLabelText('12 شهراً'), '2800');
    await user.click(screen.getByRole('button', { name: 'حفظ الخطة' }));

    await waitFor(() =>
      expect(api.createPlan).toHaveBeenCalledWith({
        name: 'الخطة الذهبية',
        prices: [
          { durationMonths: 1, priceMinor: 30000 },
          { durationMonths: 3, priceMinor: 80050 },
          { durationMonths: 6, priceMinor: 150000 },
          { durationMonths: 12, priceMinor: 280000 },
        ],
      }),
    );
  });
});
