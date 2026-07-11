import { describe, it, expect } from 'vitest';
import { sentimentColors } from './theme';

describe('Theme config', () => {
  it('has sentiment colors defined', () => {
    expect(sentimentColors.POSITIVE).toBe('#10B981');
    expect(sentimentColors.URGENT).toBe('#EF4444');
  });
});
