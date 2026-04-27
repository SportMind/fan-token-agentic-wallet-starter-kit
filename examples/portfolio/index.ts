/**
 * Example: Fan Token Portfolio Rebalancing
 * ─────────────────────────────────────────────────────────────────────────────
 * WHO THIS IS FOR: Developers building portfolio management tools or agents
 * that hold multiple fan tokens and want CHI-driven rebalancing.
 *
 * WHAT IT DEMONSTRATES:
 *   - How to load SportMind signals for multiple tokens simultaneously
 *   - How CHI scores drive relative portfolio weighting
 *   - How the macro layer gates all rebalancing decisions
 *   - How AFS and lifecycle phase refine allocation decisions
 *
 * THE CORE INSIGHT:
 *   A portfolio agent that rebalances on price alone misses the structural
 *   signal. CHI above 70 means holders are not leaving — that conviction
 *   is not priced into short-term charts. SportMind makes it visible.
 *
 * PRODUCTION WIRING NEEDED:
 *   - Replace mock signals with live SportMind data per token
 *   - Wire rebalance execution to Chiliz DEX swap router
 *   - Add slippage tolerance and maximum rebalance frequency
 *   - Consider gas costs on Chiliz Chain in position sizing
 *
 * RUN: npm run example:portfolio
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { loadSportMindSignal } from '../../src/sportmind/layer-loader.js';
import { parseSignalToDecision } from '../../src/sportmind/signal-parser.js';
import { PolicyEngine } from '../../src/guardrails/policy.js';
import type { SportMindSignal } from '../../src/sportmind/types.js';

// The portfolio tokens this agent manages
const PORTFOLIO_TOKENS = ['AFC', 'BAR', 'PSG'];

// Simulated current portfolio (replace with real wallet balance query)
const CURRENT_PORTFOLIO: Record<string, number> = {
  AFC:  120,  // CHZ value
  BAR:  100,
  PSG:   80,
};

interface PortfolioPosition {
  token: string;
  club: string;
  currentValueChz: number;
  currentWeightPct: number;
  chi: number;
  afs: number;
  signal: SportMindSignal;
  targetWeightPct: number;
  action: 'INCREASE' | 'DECREASE' | 'HOLD';
  deltaChz: number;
}

async function runPortfolioExample(): Promise<void> {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  SportMind — Fan Token Portfolio Rebalancer');
  console.log(`  Portfolio: ${PORTFOLIO_TOKENS.join(', ')}`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Check macro gate first — don't load token signals if macro blocks
  const macroSignal = await loadSportMindSignal({
    token: PORTFOLIO_TOKENS[0],
    includeMatch: false,
    includeAthlete: false,
    mockMode: true,
  });

  if (macroSignal.macro.macroOverrideActive ||
      macroSignal.macro.regulatoryPosture === 'HOSTILE') {
    console.log('  ✗ MACRO GATE ACTIVE — No rebalancing today');
    console.log(`  Regulatory posture: ${macroSignal.macro.regulatoryPosture}`);
    console.log(`  Crypto market phase: ${macroSignal.macro.cryptoMarketPhase}`);
    console.log('  Rebalancing blocked by SportMind macro layer.\n');
    return;
  }

  console.log(`  ✓ Macro gate clear — ${macroSignal.macro.regulatoryPosture} regulatory posture`);
  console.log(`  Crypto phase: ${macroSignal.macro.cryptoMarketPhase}`);
  console.log(`  Macro modifier: ${macroSignal.macro.macroModifier}×\n`);

  // Load signals for all tokens
  console.log('  Loading SportMind signals for all portfolio tokens...\n');
  const signals = await Promise.all(
    PORTFOLIO_TOKENS.map(token =>
      loadSportMindSignal({ token, includeMatch: false, includeAthlete: false, mockMode: true })
    )
  );

  // Build portfolio analysis
  const totalCurrentValue = Object.values(CURRENT_PORTFOLIO).reduce((a, b) => a + b, 0);
  const positions = buildPortfolioPositions(signals, totalCurrentValue);

  // Display current state
  displayPortfolioTable(positions, totalCurrentValue);

  // Generate rebalance recommendations
  const rebalanceActions = positions.filter(p => p.action !== 'HOLD');

  if (rebalanceActions.length === 0) {
    console.log('  Portfolio is well-balanced. No rebalancing needed today.\n');
  } else {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  REBALANCE RECOMMENDATIONS');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const policy = new PolicyEngine();

    rebalanceActions.forEach(pos => {
      const decision = parseSignalToDecision(pos.signal);
      const guardrail = policy.evaluate(decision);

      console.log(`  ${pos.token} (${pos.club})`);
      console.log(`  Action: ${pos.action} | Delta: ${pos.deltaChz > 0 ? '+' : ''}${pos.deltaChz.toFixed(1)} CHZ`);
      console.log(`  Target weight: ${pos.targetWeightPct.toFixed(1)}% (current: ${pos.currentWeightPct.toFixed(1)}%)`);
      console.log(`  CHI: ${pos.chi} | AFS: ${pos.afs}`);
      console.log(`  Guardrail: ${guardrail.allowed ? 'ALLOWED' : 'BLOCKED'}`);
      if (!guardrail.allowed) console.log(`  Reason: ${guardrail.blockedReason}`);
      console.log('');
    });
  }

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  PRODUCTION WIRING NOTES');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  console.log('  1. Replace CURRENT_PORTFOLIO with live wallet balance:');
  console.log('     - Query Chiliz Chain via viem (src/wallet/client.ts)');
  console.log('     - Fetch ERC-20 balances for each fan token contract');
  console.log('');
  console.log('  2. Wire rebalance execution:');
  console.log('     - Chiliz DEX swap router for token-to-token swaps');
  console.log('     - Add maximum slippage tolerance (e.g. 1%)');
  console.log('     - Enforce minimum rebalance threshold (e.g. > 5% drift)');
  console.log('');
  console.log('  3. CHI update frequency:');
  console.log('     - CHI is a slow-moving signal — daily refresh is sufficient');
  console.log('     - FTP PATH_2 events can cause rapid CHI shifts post-match');
  console.log('');
}

function buildPortfolioPositions(
  signals: SportMindSignal[],
  totalCurrentValue: number
): PortfolioPosition[] {
  // Calculate CHI-weighted target allocations
  const totalChi = signals.reduce((sum, s) => sum + s.fanToken.chi, 0);

  return signals.map(signal => {
    const token = signal.fanToken.token;
    const currentValueChz = CURRENT_PORTFOLIO[token] ?? 0;
    const currentWeightPct = (currentValueChz / totalCurrentValue) * 100;
    const targetWeightPct = (signal.fanToken.chi / totalChi) * 100;
    const targetValueChz = (targetWeightPct / 100) * totalCurrentValue;
    const deltaChz = targetValueChz - currentValueChz;

    // Apply macro modifier to all weights
    const adjustedTarget = targetWeightPct * signal.macro.macroModifier;

    const action: 'INCREASE' | 'DECREASE' | 'HOLD' =
      Math.abs(deltaChz) < 5 ? 'HOLD' :
      deltaChz > 0 ? 'INCREASE' : 'DECREASE';

    return {
      token,
      club: signal.fanToken.club,
      currentValueChz,
      currentWeightPct,
      chi: signal.fanToken.chi,
      afs: signal.fanToken.afs,
      signal,
      targetWeightPct: adjustedTarget,
      action,
      deltaChz,
    };
  });
}

function displayPortfolioTable(positions: PortfolioPosition[], total: number): void {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  CURRENT PORTFOLIO ANALYSIS');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('  Token  Club                  CHZ     Weight   CHI   AFS   Action');
  console.log('  ─────  ────────────────────  ──────  ───────  ───   ───   ──────');

  positions.forEach(pos => {
    const token    = pos.token.padEnd(6);
    const club     = pos.club.substring(0, 20).padEnd(20);
    const chz      = pos.currentValueChz.toString().padStart(6);
    const weight   = `${pos.currentWeightPct.toFixed(1)}%`.padStart(7);
    const chi      = pos.chi.toString().padStart(3);
    const afs      = pos.afs.toString().padStart(3);
    const action   = pos.action;
    console.log(`  ${token} ${club}  ${chz}  ${weight}  ${chi}   ${afs}   ${action}`);
  });

  console.log(`  ${'─'.repeat(62)}`);
  console.log(`  Total portfolio: ${total} CHZ\n`);
}

runPortfolioExample().catch(err => {
  console.error('Portfolio example error:', err);
  process.exit(1);
});
