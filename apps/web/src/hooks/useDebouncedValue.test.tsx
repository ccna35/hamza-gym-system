import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useDebouncedValue } from './useDebouncedValue';

describe('useDebouncedValue', () => {
  afterEach(() => vi.useRealTimers());

  it('publishes only the latest value after the delay', () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: '' },
    });

    rerender({ value: 'a' });
    act(() => vi.advanceTimersByTime(200));
    rerender({ value: 'ahmed' });
    act(() => vi.advanceTimersByTime(299));

    expect(result.current).toBe('');

    act(() => vi.advanceTimersByTime(1));

    expect(result.current).toBe('ahmed');
  });
});
