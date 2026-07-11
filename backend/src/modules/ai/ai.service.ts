import { env } from '../../config/env.js';
import { sentimentService } from './sentiment.service.js';

export interface AiReplyResult {
  suggestion: string;
  confidence: number;
  tone: string;
  reasoning: string;
}

const MOCK_TEMPLATES: Record<string, string[]> = {
  billing: [
    "Thank you for reaching out about your billing inquiry. I've reviewed your account and can help resolve this right away. Could you please confirm the invoice number or transaction date so I can investigate further?",
    "I understand billing concerns can be frustrating. Let me look into this for you immediately. I'll review your recent charges and get back to you within the hour with a detailed explanation.",
  ],
  technical: [
    "I'm sorry you're experiencing this issue. Let me help troubleshoot this step by step. Could you please share which browser/device you're using and any error messages you've seen?",
    "Thank you for reporting this. I've escalated this to our technical team with high priority. In the meantime, please try clearing your cache and logging in again — this resolves most similar cases.",
  ],
  urgent: [
    "I completely understand the urgency of this situation and I'm treating it as our highest priority. I'm personally looking into this now and will provide an update within 15 minutes.",
    "I apologize for the impact this is having on your business. I've flagged this as critical and our senior team is actively working on a resolution. You have my full attention on this.",
  ],
  positive: [
    "Thank you so much for your kind words! We're thrilled to hear you're having a great experience. Is there anything else I can help you with today?",
    "We really appreciate your feedback! It's customers like you that motivate our team. Please don't hesitate to reach out if you need anything else.",
  ],
  default: [
    "Thank you for contacting us. I've reviewed your message and I'm here to help. Let me look into this and provide you with a solution as quickly as possible.",
    "Hi there! Thanks for reaching out. I understand your concern and want to make sure we resolve this for you. Could you provide a bit more detail so I can assist you better?",
    "Thank you for your patience. I've noted your request and I'm working on finding the best solution. I'll follow up shortly with next steps.",
  ],
  churn: [
    "I truly value your business and I'm sorry to hear you're considering other options. I'd love the opportunity to understand your concerns better and see how we can improve your experience. Could we schedule a brief call to discuss this?",
    "Your satisfaction is our top priority, and I want to make sure we address whatever led to this decision. Before you go, please let me know what's not working — I'll do everything I can to make it right.",
  ],
};

function pickTemplate(category: string): string {
  const templates = MOCK_TEMPLATES[category] ?? MOCK_TEMPLATES.default!;
  const index = Math.floor(Math.random() * templates.length);
  return templates[index]!;
}

function categorizeMessage(_text: string, tags: string[]): string {
  if (tags.includes('churn-risk')) return 'churn';
  if (tags.includes('urgent')) return 'urgent';
  if (tags.includes('billing')) return 'billing';
  if (tags.includes('technical-issue')) return 'technical';
  if (tags.includes('positive-tone')) return 'positive';
  return 'default';
}

async function callOpenAI(ticketContext: string, customerMessage: string): Promise<string | null> {
  if (!env.OPENAI_API_KEY) return null;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are a professional customer support agent. Write concise, empathetic, helpful replies. Keep responses under 150 words. Match the tone to the customer sentiment.',
          },
          {
            role: 'user',
            content: `Ticket: ${ticketContext}\n\nCustomer message:\n${customerMessage}\n\nWrite a professional support reply:`,
          },
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!response.ok) return null;

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    return data.choices?.[0]?.message?.content?.trim() ?? null;
  } catch {
    return null;
  }
}

export class AiService {
  async generateReply(
    subject: string,
    messages: Array<{ content: string; isAgent: boolean }>,
    customerName: string,
  ): Promise<AiReplyResult> {
    const start = Date.now();
    const customerMessages = messages.filter((m) => !m.isAgent);
    const lastCustomerMessage = customerMessages[customerMessages.length - 1]?.content ?? '';
    const fullContext = messages.map((m) => m.content).join('\n');

    const sentiment = sentimentService.analyze(fullContext);
    const category = categorizeMessage(fullContext, sentiment.tags);

    let suggestion = await callOpenAI(subject, lastCustomerMessage);

    if (!suggestion) {
      suggestion = pickTemplate(category);
      if (customerName) {
        suggestion = `Hi ${customerName.split(' ')[0]},\n\n${suggestion}`;
      }
    }

    const confidence = env.OPENAI_API_KEY ? 0.92 : 0.78 + Math.random() * 0.12;

    return {
      suggestion,
      confidence: Math.round(confidence * 100) / 100,
      tone: sentiment.sentiment.toLowerCase(),
      reasoning: `Detected ${sentiment.sentiment.toLowerCase()} sentiment (score: ${sentiment.score.toFixed(2)}). Tags: ${sentiment.tags.join(', ') || 'none'}. Response generated in ${Date.now() - start}ms.`,
    };
  }

  suggestAgent(
    agents: Array<{ id: string; name: string; openTicketCount: number }>,
    sentiment: string,
  ): string | null {
    if (agents.length === 0) return null;

    const sorted = [...agents].sort((a, b) => a.openTicketCount - b.openTicketCount);

    if (sentiment === 'URGENT' || sentiment === 'NEGATIVE') {
      return sorted[0]?.id ?? null;
    }

    return sorted[Math.floor(sorted.length / 2)]?.id ?? sorted[0]?.id ?? null;
  }
}

export const aiService = new AiService();
