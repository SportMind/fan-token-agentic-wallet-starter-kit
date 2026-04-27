/**
 * SportMind Wallet MCP Tool Definitions
 *
 * These tools are exposed to the LLM agent. Every tool maps to a
 * wallet action that can be grounded in a SportMind signal.
 *
 * Tool naming convention: propose_* — all actions require explicit
 * approval or guardrail clearance before execution.
 */

export const WALLET_TOOLS = [
  {
    name: 'propose_buy_fan_token',
    description: 'Propose buying a fan token on Chiliz Chain. Use when SportMind signals structural demand (CHI > 70) or FTP PATH_2 supply reduction event is anticipated.',
    inputSchema: {
      type: 'object',
      properties: {
        token: {
          type: 'string',
          description: 'Fan token symbol (AFC, BAR, PSG, JUV, ACM, CITY)',
        },
        amountChz: {
          type: 'number',
          description: 'Amount in CHZ to spend',
        },
        sportmindRationale: {
          type: 'string',
          description: 'SportMind signals that justify this purchase (CHI score, FTP PATH_2 confidence, SMS, etc.)',
        },
        urgency: {
          type: 'string',
          enum: ['LOW', 'MEDIUM', 'HIGH'],
          description: 'HIGH = FTP PATH_2 supply event imminent. MEDIUM = match-day signal. LOW = CHI-based accumulation.',
        },
      },
      required: ['token', 'amountChz', 'sportmindRationale', 'urgency'],
    },
  },
  {
    name: 'propose_sell_fan_token',
    description: 'Propose selling a fan token. Use when SportMind signals weakening CHI, bearish holder sentiment, or macro deterioration.',
    inputSchema: {
      type: 'object',
      properties: {
        token: { type: 'string' },
        amountChz: { type: 'number', description: 'Amount in CHZ equivalent to sell' },
        sportmindRationale: { type: 'string' },
      },
      required: ['token', 'amountChz', 'sportmindRationale'],
    },
  },
  {
    name: 'propose_governance_vote',
    description: 'Propose submitting a governance vote. Use when SportMind signals active proposal + high TAI (> 60) + high AFS (> 55).',
    inputSchema: {
      type: 'object',
      properties: {
        token: { type: 'string' },
        proposalId: { type: 'string' },
        vote: {
          type: 'string',
          enum: ['FOR', 'AGAINST', 'ABSTAIN'],
        },
        sportmindRationale: { type: 'string' },
      },
      required: ['token', 'proposalId', 'vote', 'sportmindRationale'],
    },
  },
  {
    name: 'propose_portfolio_rebalance',
    description: 'Propose rebalancing the fan token portfolio based on SportMind CHI scores across tokens.',
    inputSchema: {
      type: 'object',
      properties: {
        targets: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              token: { type: 'string' },
              targetWeightPercent: { type: 'number' },
              chiScore: { type: 'number' },
            },
          },
        },
        sportmindRationale: { type: 'string' },
      },
      required: ['targets', 'sportmindRationale'],
    },
  },
  {
    name: 'get_sportmind_signal',
    description: 'Refresh the SportMind signal for a specific fan token. Use when you need updated intelligence before making a decision.',
    inputSchema: {
      type: 'object',
      properties: {
        token: { type: 'string' },
        includeMatch: { type: 'boolean', default: true },
        includeAthlete: { type: 'boolean', default: true },
      },
      required: ['token'],
    },
  },
] as const;

// OpenAI-compatible tool format (used by OpenAI adapter)
export const WALLET_TOOLS_OPENAI = WALLET_TOOLS.map(tool => ({
  type: 'function',
  function: {
    name: tool.name,
    description: tool.description,
    parameters: tool.inputSchema,
  },
}));
