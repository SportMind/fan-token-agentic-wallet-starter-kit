# SportMind Integration Guide

How to connect SportMind intelligence to your own application using this kit as a reference.

## The Pattern

Every SportMind-powered application follows the same three-step pattern:

```
1. Declare layers  →  2. Load signal  →  3. Act on signal
```

This is not optional structure. It is how SportMind works.

---

## Step 1: Declare Your Layers

Before loading anything, declare which SportMind layers your application depends on and which version it was built against. See `src/sportmind/layer-loader.ts`:

```typescript
export const SPORTMIND_LAYER_DECLARATION: LayerDeclaration = {
  version: 'v3.63',
  layers: ['macro', 'fan-token', 'sports', 'athlete'],
  loadedAt: new Date(),
};
```

This declaration is the equivalent of a `package.json` dependency. When SportMind releases a new version, you update this and review the changelog for signal changes.

---

## Step 2: Load in Order

**Macro first. Always.**

```
macro → fan-token → sports → athlete
```

The order is not arbitrary:

- **Macro** sets the environment gate. If macro override is active, subsequent layers still load but execution is blocked. No macro gate = no protection against hostile regulatory environments.
- **Fan token** provides the core commercial signal (CHI, AFS, TAI, FTP PATH_2). This is always required for wallet applications.
- **Sports** provides the match signal (SMS, direction). Only meaningful when a match is within 48 hours. Optional.
- **Athlete** refines the match signal. Star departure risk and availability affect fan token sentiment. Optional, only useful when sports layer is also loaded.

---

## Step 3: Parse to Action

`src/sportmind/signal-parser.ts` contains the full decision tree. The priority order is:

1. **Macro gate** — blocks everything if active
2. **FTP PATH_2 supply event** — highest priority actionable signal
3. **Match-day SMS** — gated by CHI (must be ≥ 70)
4. **Governance** — gated by TAI (≥ 60) and AFS (≥ 55)
5. **Portfolio CHI** — structural rebalance signal
6. **Hold** — no clear signal

---

## Key Metrics Reference

| Metric | Full name | Range | Threshold |
|--------|-----------|-------|-----------|
| CHI | Club Holder Index | 0–100 | ≥ 70 = structural demand |
| AFS | Active Fan Score | 0–100 | ≥ 55 = engaged base |
| TAI | Token Activity Index | 0–100 | ≥ 60 = real traction |
| SMS | Sentiment Momentum Score | 0–100 | ≥ 65 = strong signal |
| FTP confidence | FTP PATH_2 signal confidence | 0–100% | ≥ 60% = act |

---

## FTP PATH_2 — The Signal That Makes This Different

FTP PATH_2 is Arsenal FC's confirmed real-world supply mechanism. A WIN prediction is simultaneously a SUPPLY REDUCTION event. Tokens burn on wins, mint on losses.

Standard models see a match result. SportMind sees a supply mechanics event.

When FTP PATH_2 is active in your signal:

```typescript
if (
  ftp.active &&
  ftp.matchScheduled &&
  ftp.supplyEvent === 'CHZ_BURN' &&
  ftp.ftpConfidence >= 60
) {
  // Act before the match — supply reduction is coming
}
```

---

## Production Wiring Checklist

When you move from mock data to production:

- [ ] Replace `resolveMacroLayer` with real macro data source
- [ ] Replace `resolveFanTokenLayer` with live Chiliz Chain + Socios data
- [ ] Replace `resolveMatchLayer` with live fixture + odds API
- [ ] Replace `resolveAthleteLayer` with live squad/injury feed
- [ ] Add wallet client (`src/wallet/client.ts`) with real private key management
- [ ] Wire tool executor (`src/mcp-tools/executor.ts`) to real DEX + governance contracts
- [ ] Verify all contract addresses on `scan.chiliz.com` before mainnet
- [ ] Start on Spicy testnet (`CHILIZ_NETWORK=testnet`)
- [ ] Run with `EXECUTION_MODE=confirm` until fully tested

---

## SportMind Version Compatibility

This kit is built against **SportMind v3.63+**.

Check `CHANGELOG.md` in the SportMind repository for signal changes between versions. Breaking changes to signal shape or metric thresholds will be marked clearly.

When updating SportMind version:
1. Update `SPORTMIND_LAYER_DECLARATION.version` in `layer-loader.ts`
2. Review changelog for threshold or signal shape changes
3. Update `signal-parser.ts` if thresholds have changed
4. Run all examples to verify signal flow

---

## Further Reading

- [SportMind repository](https://github.com/SportMind/SportMind)
- [Fan token commercial layer](https://github.com/SportMind/SportMind/tree/main/fan-token)
- [FTP PATH_2 documentation](https://github.com/SportMind/SportMind/tree/main/fan-token)
- [Calibration records](https://github.com/SportMind/SportMind/tree/main/calibration)
