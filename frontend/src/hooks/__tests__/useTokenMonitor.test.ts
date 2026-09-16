import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTokenMonitor } from '../useTokenMonitor';

// Mock do store
vi.mock('../../store/conversationStore', () => ({
  useConversationStore: () => ({
    messages: [],
  }),
}));

describe('useTokenMonitor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns default values when no messages', () => {
    const { result } = renderHook(() => useTokenMonitor());
    
    expect(result.current.tokenUsage).toBe(0);
    expect(result.current.warningLevel).toBe('none');
  });

  it('calculates usage percentage correctly', () => {
    const { result } = renderHook(() => useTokenMonitor());
    
    expect(result.current.usagePercentage).toBeDefined();
    expect(Number(result.current.usagePercentage)).toBeGreaterThanOrEqual(0);
  });
});