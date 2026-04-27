/**
 * Anthropic Claude LLM Adapter
 *
 * Recommended provider for SportMind wallet agents.
 * Claude's extended context window handles full SportMind layer loading well.
 */

import type { LLMAdapter, LLMMessage, LLMResponse } from './types.js';

export class ClaudeAdapter implements LLMAdapter {
  private model: string;
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY ?? '';
    this.model = process.env.LLM_MODEL ?? 'claude-sonnet-4-5';

    if (!this.apiKey) {
      throw new Error(
        'ANTHROPIC_API_KEY not set. Add it to your .env file.\n' +
        'Get your key at: https://console.anthropic.com'
      );
    }
  }

  async complete(
    systemPrompt: string,
    messages: LLMMessage[],
    tools?: unknown[]
  ): Promise<LLMResponse> {
    // NOTE (production): This is a minimal implementation.
    // For production use, add: retry logic, rate limiting, token counting,
    // streaming support, and error classification.

    const body: Record<string, unknown> = {
      model: this.model,
      max_tokens: 2048,
      system: systemPrompt,
      messages,
    };

    if (tools && tools.length > 0) {
      body.tools = tools;
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude API error ${response.status}: ${error}`);
    }

    const data = await response.json() as {
      content: Array<{ type: string; text?: string; id?: string; name?: string; input?: Record<string, unknown> }>;
      stop_reason: string;
    };

    const textBlock = data.content.find(b => b.type === 'text');
    const toolUseBlocks = data.content.filter(b => b.type === 'tool_use');

    return {
      content: textBlock?.text ?? '',
      toolCalls: toolUseBlocks.map(b => ({
        id: b.id ?? '',
        name: b.name ?? '',
        arguments: b.input ?? {},
      })),
      finishReason: data.stop_reason === 'tool_use' ? 'tool_use' : 'stop',
    };
  }
}
