/**
 * LLM Adapter Interface
 *
 * All LLM providers implement this interface.
 * The agent loop is LLM-agnostic — swap providers by changing LLM_PROVIDER in .env.
 */

export interface LLMMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface LLMToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface LLMResponse {
  content: string;
  toolCalls?: LLMToolCall[];
  finishReason: 'stop' | 'tool_use' | 'length' | 'error';
}

export interface LLMAdapter {
  complete(
    systemPrompt: string,
    messages: LLMMessage[],
    tools?: unknown[]
  ): Promise<LLMResponse>;
}
