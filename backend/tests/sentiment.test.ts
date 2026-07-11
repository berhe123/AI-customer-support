import { describe, it, expect } from 'vitest';
import { sentimentService } from '../src/modules/ai/sentiment.service.js';

describe('SentimentService', () => {
  it('detects urgent sentiment', () => {
    const result = sentimentService.analyze('URGENT: Our server is down! This is critical!');
    expect(result.sentiment).toBe('URGENT');
    expect(result.tags).toContain('urgent');
  });

  it('detects negative sentiment', () => {
    const result = sentimentService.analyze('I am very frustrated and disappointed with this service');
    expect(result.sentiment).toBe('NEGATIVE');
    expect(result.tags).toContain('negative-tone');
  });

  it('detects positive sentiment', () => {
    const result = sentimentService.analyze('Thank you so much! This is excellent and amazing work!');
    expect(result.sentiment).toBe('POSITIVE');
    expect(result.tags).toContain('positive-tone');
  });

  it('detects churn risk', () => {
    const result = sentimentService.analyze('We are considering switching to a competitor');
    expect(result.tags).toContain('churn-risk');
  });

  it('detects upsell opportunity', () => {
    const result = sentimentService.analyze('We want to upgrade and expand our licenses');
    expect(result.tags).toContain('upsell-opportunity');
  });

  it('returns neutral for generic messages', () => {
    const result = sentimentService.analyze('Can you help me with my account settings?');
    expect(result.sentiment).toBe('NEUTRAL');
  });
});
