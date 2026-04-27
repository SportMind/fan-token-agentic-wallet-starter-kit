# SportMind Fan Token Agentic Wallet Starter Kit

**Build AI-powered wallets for Fan Tokens on Chiliz Chain — powered by SportMind intelligence.**  
Open source · TypeScript · Any LLM · MIT License · SportMind v3.63+

---

## What is this?

A reference implementation for developers building **agentic wallets** — AI agents that autonomously manage Fan Token payments, governance, rewards, and trading on Chiliz Chain — using [SportMind](https://github.com/SportMind/SportMind) as the intelligence layer.

This is **developer tooling, not a finished product**. Fork it, wire in your own integrations, and build your use case on a foundation that has SportMind's intelligence embedded from the start.

The key difference from a generic wallet kit: every agent decision in this kit is driven by SportMind's structured intelligence — CHI scores, FTP PATH_2 supply signals, match-day SMS output, macro regulatory context. The agent doesn't guess. It reasons from the same intelligence layer the library ships with.

---

## Why SportMind?

A standard agentic wallet knows how to move tokens. It doesn't know that:

- A **WIN prediction** on a gamified fan token is simultaneously a **SUPPLY REDUCTION event** — tokens burn on wins, mint on losses. A wallet acting without this knowledge sees half the signal.
- **FTP PATH_2** links on-pitch performance directly to token supply mechanics. An Arsenal win isn't just a match result — it's a `CHZ_BURN` event your agent can anticipate and act on.
- A **CHI score above 75** signals sustained holder conviction, not just price momentum. The wallet can distinguish between hype and structural demand.
- **Macro regulatory context** (MiCA phase, SEC/CFTC posture) should gate certain wallet actions entirely.

SportMind teaches the agent all of this. The wallet acts on it.

---

## SportMind Layers Loaded

This kit loads SportMind layers in the correct order — macro first, action last:

| Order | Layer | Key signals used | Why |
|-------|-------|-----------------|-----|
| 1 | `macro/` | Regulatory posture, crypto cycle phase | Gate all actions — no execution in hostile macro |
| 2 | `fan-token/` | CHI, AFS, TAI, FTP PATH_2 | Core token intelligence |
| 3 | `sports/` | SMS, match direction, event type | Match-day signal layer |
| 4 | `athlete/` | Form modifier, availability | Refine signal on key player events |

See [`src/sportmind/layer-loader.ts`](src/sportmind/layer-loader.ts) — the canonical pattern for loading SportMind into any application.

---

## Quick Start

```bash
# 1. Clone
git clone https://github.com/SportMind/fan-token-agentic-wallet-starter-kit
cd fan-token-agentic-wallet-starter-kit

# 2. Install
npm install

# 3. Configure
cp .env.example .env
# Set: LLM_PROVIDER, ANTHROPIC_API_KEY (or OPENAI_API_KEY), WALLET_PRIVATE_KEY

# 4. Run the SportMind layer loader demo first — understand how intelligence flows
npm run demo:sportmind

# 5. Run interactive agent
npm run dev

# 6. Run a use case example
npm run example:matchday
npm run example:ftp-path2
npm run example:portfolio
npm run example:governance
```

Runs on **mock data out of the box** — no API keys or wallet required to explore.

---

## Examples

| Example | SportMind layers used | Key intelligence signal | Run |
|---------|----------------------|------------------------|-----|
| **SportMind Layer Demo** | All four | Full signal pipeline | `npm run demo:sportmind` |
| **Match-Day Wallet** | sports, athlete, fan-token | SMS + athlete modifier | `npm run example:matchday` |
| **FTP PATH_2 Detection** | fan-token, sports | Supply event anticipation | `npm run example:ftp-path2` |
| **Fan Token Portfolio** | fan-token, macro | CHI + AFS + macro gate | `npm run example:portfolio` |
| **Governance Agent** | fan-token, macro | TAI + regulatory posture | `npm run example:governance` |

---

## Architecture

```
src/
├── sportmind/
│   ├── layer-loader.ts      ← Load SportMind layers in order (START HERE)
│   ├── signal-parser.ts     ← Parse SportMind structured output
│   ├── metrics.ts           ← CHI, AFS, TAI, SMS composite metric types
│   └── types.ts             ← SportMind signal + layer types
├── llm-adapters/
│   ├── types.ts             ← LLMAdapter interface
│   ├── claude.ts            ← Anthropic Claude adapter
│   └── openai.ts            ← OpenAI-compatible adapter
├── agent/
│   ├── agent-loop.ts        ← Multi-turn agent loop (LLM-agnostic)
│   └── system-prompt.ts     ← SportMind-aware system prompt builder
├── mcp-tools/
│   ├── definitions.ts       ← Tool schemas (payments, swaps, votes)
│   └── executor.ts          ← Tool execution + guardrail enforcement
├── wallet/
│   └── client.ts            ← Chiliz Chain wallet client (viem)
├── guardrails/
│   └── policy.ts            ← Spend policy engine (enforced at execution)
└── config/
    ├── chain.ts             ← Chiliz Chain mainnet + Spicy testnet
    └── tokens.ts            ← Fan Token registry (BAR, CITY, PSG, JUV, ACM, AFC)

examples/
├── 00-sportmind-demo/       ← How SportMind intelligence flows into wallet decisions
├── match-day/               ← Match-day wallet actions from SMS signal
├── ftp-path2/               ← FTP PATH_2 supply event detection + response
├── portfolio/               ← CHI/AFS-driven portfolio rebalancing
└── governance/              ← TAI-informed governance voting

docs/
├── sportmind-integration.md ← How to integrate SportMind into your own application
├── architecture.md          ← Full architecture walkthrough
└── extending.md             ← How to add new SportMind layers, tools, examples
```

---

## Guardrails

Spend limits are **enforced at the execution layer** — the LLM cannot bypass them.

| Setting | Env var | Default |
|---------|---------|---------|
| Daily spend cap | `DAILY_SPEND_CAP_CHZ` | 100 CHZ |
| Approval threshold | `APPROVAL_THRESHOLD_CHZ` | 20 CHZ |
| Execution mode | `EXECUTION_MODE` | `confirm` |
| Macro override | `MACRO_OVERRIDE_BLOCKS` | `true` |

`confirm` = always ask before transacting. `auto` = act within caps.  
`MACRO_OVERRIDE_BLOCKS=true` = SportMind macro layer can block all execution regardless of other signals.

**Start with `confirm`. Switch to `auto` only when fully tested.**

---

## Fan Token Registry

| Token | Club | League | FTP PATH_2 |
|-------|------|--------|-----------|
| AFC | Arsenal FC | Premier League | ✅ Active |
| BAR | FC Barcelona | La Liga | ✅ Active |
| CITY | Manchester City | Premier League | ✅ Active |
| PSG | Paris Saint-Germain | Ligue 1 | ✅ Active |
| JUV | Juventus | Serie A | ✅ Active |
| ACM | AC Milan | Serie A | ✅ Active |

To add a token: see [CONTRIBUTING.md](CONTRIBUTING.md).

---

## Chiliz Chain

| | Mainnet | Spicy Testnet |
|-|---------|---------------|
| Chain ID | 88888 | 88882 |
| RPC | `https://rpc.chiliz.com` | `https://spicy-rpc.chiliz.com` |
| Explorer | [scan.chiliz.com](https://scan.chiliz.com) | [testnet.chiliscan.com](https://testnet.chiliscan.com) |
| Faucet | — | [spicy-faucet.chiliz.com](https://spicy-faucet.chiliz.com) |

---

## Choosing Your LLM

Set `LLM_PROVIDER` in `.env`:

| Provider | `LLM_PROVIDER` | Env var | Default model |
|----------|---------------|---------|---------------|
| Anthropic Claude *(recommended)* | `claude` | `ANTHROPIC_API_KEY` | `claude-sonnet-4-5` |
| OpenAI | `openai` | `OPENAI_API_KEY` | `gpt-4o` |
| Groq / Together / Ollama | `openai` | `OPENAI_API_KEY` + `OPENAI_BASE_URL` | your model |
| Custom | implement `LLMAdapter` | — | — |

---

## Roadmap

- [ ] Live DEX swap integration (Chiliz DEX)
- [ ] Governance contract integration
- [ ] Streaming protocol integration (Superfluid / Sablier)
- [ ] Webhook triggers (SportMind signal → agent action)
- [ ] World Cup 2026 module integration
- [ ] Next.js dashboard example
- [ ] Additional SportMind layer examples (transfer intelligence, VAR officiating)
- [ ] Production wallet adapters (Turnkey, Privy)

---

## SportMind Version

This kit is built against **SportMind v3.63+**.  
Check [`src/sportmind/layer-loader.ts`](src/sportmind/layer-loader.ts) for the declared layer dependencies.

When SportMind releases a new version, update the version declaration in `layer-loader.ts` and review the changelog for signal changes that may affect wallet logic.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). All contributions welcome.  
Built applications using this kit? Open a PR to add yourself to [WHO-BUILDS-WITH-THIS.md](WHO-BUILDS-WITH-THIS.md).

---

## Licence

[MIT](LICENSE) — fork freely, build commercially, give credit.

---

*Part of the [SportMind](https://github.com/SportMind/SportMind) open sports intelligence ecosystem.*  
*Not affiliated with Chiliz, Socios.com, or any football club.*
