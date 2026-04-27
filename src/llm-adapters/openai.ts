/**
 * OpenAI-Compatible LLM Adapter
 *
 * Works with: OpenAI, Azure OpenAI, Groq, Together AI, Ollama, and any
 * provider implementing the OpenAI chat completions API.
 *
 * Set OPENAI_BASE_URL to override the endpoint (Groq, Ollama, etc.)
 */

import type { LLMAdapter, LLMMessage, LLMResponse } from './types.js';

export class OpenAIAdapter implements LLMAdapter {
  private model: string;
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY ?? '';
    this.model = process.env.LLM_MODEL ?? 'gpt-4o';
    this.baseUrl = process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1';

    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY not set. Add it to your .env file.');
    }
  }

  async complete(
    systemPrompt: string,
    messages: LLMMessage[],
    tools?: unknown[]
  ): Promise<LLMResponse> {
    const body: Record<string, unknown> = {
      model: this.model,
      max_tokens: 2048,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
    };

    if (tools && tools.length > 0) {
      body.tools = tools;
      body.tool_choice = 'auto';
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error ${response.status}: ${error}`);
    }

    const data = await response.json() as {
      choices: Array<{
        message: { content: string; tool_calls?: Array<{ id: string; function: { name: string; arguments: string } }> };
        finish_reason: string;
      }>;
    };

    const choice = data.choices[0];
    const toolCalls = choice.message.tool_calls?.map(tc => ({
      id: tc.id,
      name: tc.function.name,
      arguments: JSON.parse(tc.function.arguments) as Record<string, unknown>,
    }));

    return {
      content: choice.message.content ?? '',
      toolCalls,
      finishReason: choice.finish_reason === 'tool_calls' ? 'tool_use' : 'stop',
    };
  }
}
