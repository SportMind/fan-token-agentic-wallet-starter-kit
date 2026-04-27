# Contributing

All contributions welcome. This is developer tooling — we prioritise clarity over cleverness.

## Adding a Fan Token

1. Add the token to `src/config/tokens.ts`
2. Add mock signal data to `src/sportmind/layer-loader.ts` (the mock resolvers)
3. Note which SportMind layers have data for the token
4. Verify FTP PATH_2 status from SportMind fan-token/ documentation
5. Submit PR with token name in the title

## Adding an Example

Each example should:
- Demonstrate a distinct SportMind intelligence pattern
- Run on mock data with `npm run example:yourexample`
- Include a full header comment explaining who it's for and what production wiring is needed
- Declare which SportMind layers it uses

## Implementing a Production Data Source

If you've wired a real data source to replace one of the mock resolvers:

1. Create a new file in `src/sportmind/sources/`
2. Implement the same return type as the mock resolver
3. Add it as an option in `layer-loader.ts`
4. Document the data source and any API keys required
5. Submit PR — this is highly valuable to the community

## Adding an LLM Adapter

Implement the `LLMAdapter` interface in `src/llm-adapters/types.ts`. See `claude.ts` or `openai.ts` for reference implementations.

## Bug Reports

Open an issue with:
- Which example failed
- The SportMind signal that produced the unexpected behaviour
- Expected vs actual wallet decision

## Built Something With This?

Open a PR to add yourself to `WHO-BUILDS-WITH-THIS.md`. We want to know what people are building.
