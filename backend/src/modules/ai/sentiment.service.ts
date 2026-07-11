import type { Sentiment } from '@prisma/client';

interface SentimentResult {
  sentiment: Sentiment;
  score: number;
  tags: string[];
  urgencyBoost: boolean;
}

const URGENT_KEYWORDS = ['urgent', 'asap', 'immediately', 'critical', 'emergency', 'down', 'broken', 'not working', 'refund now'];
const NEGATIVE_KEYWORDS = ['frustrated', 'disappointed', 'angry', 'terrible', 'awful', 'unacceptable', 'worst', 'cancel', 'churn', 'competitor', 'switching'];
const POSITIVE_KEYWORDS = ['thank', 'great', 'excellent', 'love', 'appreciate', 'helpful', 'amazing', 'perfect', 'wonderful'];

export class SentimentService {
  analyze(text: string): SentimentResult {
    const lower = text.toLowerCase();
    const words = lower.split(/\s+/);

    let score = 0;
    const tags: string[] = [];

    for (const kw of URGENT_KEYWORDS) {
      if (lower.includes(kw)) {
        score -= 0.4;
        tags.push('urgent');
        break;
      }
    }

    let negativeCount = 0;
    for (const kw of NEGATIVE_KEYWORDS) {
      if (lower.includes(kw)) {
        negativeCount++;
        score -= 0.25;
      }
    }
    if (negativeCount > 0) tags.push('negative-tone');

    let positiveCount = 0;
    for (const kw of POSITIVE_KEYWORDS) {
      if (lower.includes(kw)) {
        positiveCount++;
        score += 0.2;
      }
    }
    if (positiveCount > 0) tags.push('positive-tone');

    if (lower.includes('competitor') || lower.includes('switching to')) {
      tags.push('churn-risk');
      score -= 0.5;
    }

    if (lower.includes('upgrade') || lower.includes('more licenses') || lower.includes('expand')) {
      tags.push('upsell-opportunity');
      score += 0.3;
    }

    if (lower.includes('bug') || lower.includes('error') || lower.includes('crash')) {
      tags.push('technical-issue');
    }

    if (lower.includes('billing') || lower.includes('invoice') || lower.includes('payment')) {
      tags.push('billing');
    }

    const exclamationCount = (text.match(/!/g) ?? []).length;
    if (exclamationCount >= 2) {
      score -= 0.15 * Math.min(exclamationCount, 5);
    }

    if (words.some((w) => w === w.toUpperCase() && w.length > 3)) {
      score -= 0.2;
      tags.push('caps-emphasis');
    }

    score = Math.max(-1, Math.min(1, score));

    let sentiment: Sentiment;
    const urgencyBoost = tags.includes('urgent') || (score <= -0.6);

    if (urgencyBoost && score <= -0.3) {
      sentiment = 'URGENT';
    } else if (score <= -0.25) {
      sentiment = 'NEGATIVE';
    } else if (score >= 0.25) {
      sentiment = 'POSITIVE';
    } else {
      sentiment = 'NEUTRAL';
    }

    return { sentiment, score, tags: [...new Set(tags)], urgencyBoost };
  }
}

export const sentimentService = new SentimentService();
