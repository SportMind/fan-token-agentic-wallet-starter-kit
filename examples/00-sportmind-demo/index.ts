/**
 * Example 00: SportMind Layer Demo
 * ─────────────────────────────────────────────────────────────────────────────
 * WHO THIS IS FOR: Developers who want to understand how SportMind intelligence
 * flows into wallet decisions before building their own application.
 *
 * WHAT IT DEMONSTRATES:
 *   - How to load all four SportMind layers in order
 *   - How each layer contributes to the final signal
 *   - How the signal parser translates intelligence into a wallet decision
 *   - Why the macro gate matters
 *   - What FTP PATH_2 looks like in practice
 *
 * RUN: npm run demo:sportmind
 *
 * This is the file to read first. Every other example builds on this pattern.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { loadSportMindSignal } from '../../src/sportmind/layer-loader.js';
import { parseSignalToDecision } from '../../src/sportmind/signal-parser.js';
import type { SportMindSignal, WalletDecision } from '../../src/sportmind/types.js';

const DEMO_TOKENS = ['AFC', 'BAR', 'PSG'];

async function runSportMindDemo(): Promise<void> {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  SportMind Fan Token Wallet — Layer Demo');
  console.log('  This demo shows how SportMind intelligence flows into');
  console.log('  wallet decisions. Study this before building your own app.');
  console.log('═══════════════════════════════════════════════════════════════\n');

  for (const token of DEMO_TOKENS) {
    await demoTokenSignal(token);
    console.log('\n');
  }

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  Demo complete. Key patterns demonstrated:');
  console.log('');
  console.log('  1. Layer loading order: macro → fan-token → sports → athlete');
  console.log('  2. Macro gate blocks execution regardless of other signals');
  console.log('  3. FTP PATH_2 is the highest-priority actionable signal');
  console.log('  4. CHI must be above 70 before acting on match-day SMS');
  console.log('  5. Every decision cites the SportMind signals that drove it');
  console.log('');
  console.log('  Next: Run npm run example:ftp-path2 to see FTP PATH_2 in depth.');
  console.log('═══════════════════════════════════════════════════════════════\n');
}

async function demoTokenSignal(token: string): Promise<void> {
  console.log(`───────────────────────────────────────────────────────────────`);
  console.log(`  Token: ${token}`);
  console.log(`───────────────────────────────────────────────────────────────`);

  // Step 1: Load all four SportMind layers
  const signal: SportMindSignal = await loadSportMindSignal({
    token,
    includeMatch: true,
    includeAthlete: true,
    mockMode: true,
  });

  // Step 2: Parse the signal into a wallet decision
  const decision: WalletDecision = parseSignalToDecision(signal);

  // Step 3: Display the decision with full SportMind reasoning
  printDecision(decision, signal);
}

function printDecision(decision: WalletDecision, signal: SportMindSignal): void {
  console.log('\n  ── WALLET DECISION ──────────────────────────────────────────');
  console.log(`  Action:          ${decision.action}`);
  console.log(`  Token:           ${decision.token}`);
  console.log(`  Confidence:      ${decision.confidenceScore}/100`);
  console.log(`  Macro gated:     ${decision.macroGated}`);
  console.log(`  Requires approval: ${decision.requiresApproval}`);

  if (decision.estimatedChzAmount) {
    console.log(`  Est. CHZ amount: ${decision.estimatedChzAmount} CHZ`);
  }

  console.log('\n  ── SPORTMIND SIGNALS USED ───────────────────────────────────');
  decision.sportmindSignalsUsed.forEach(s => console.log(`  · ${s}`));

  console.log('\n  ── RATIONALE ────────────────────────────────────────────────');
  // Word-wrap the rationale for readable console output
  const words = decision.rationale.split(' ');
  let line = '  ';
  words.forEach(word => {
    if (line.length + word.length > 75) {
      console.log(line);
      line = '  ' + word + ' ';
    } else {
      line += word + ' ';
    }
  });
  if (line.trim()) console.log(line);

  // FTP PATH_2 deep dive when active
  if (signal.fanToken.ftpPath2.active && signal.fanToken.ftpPath2.matchScheduled) {
    console.log('\n  ── FTP PATH_2 SIGNAL (what standard models miss) ────────────');
    console.log(`  Match:         ${signal.fanToken.ftpPath2.opponent} (${signal.fanToken.ftpPath2.competition})`);
    console.log(`  Supply event:  ${signal.fanToken.ftpPath2.supplyEvent}`);
    console.log(`  Burn magnitude: ${signal.fanToken.ftpPath2.burnMagnitude?.toLocaleString() ?? 'N/A'} CHZ`);
    console.log(`  FTP confidence: ${signal.fanToken.ftpPath2.ftpConfidence}%`);
    console.log(`  → A WIN is not just a result. It is a supply reduction event.`);
    console.log(`    SportMind sees both. Standard models see one.`);
  }
}

runSportMindDemo().catch(err => {
  console.error('Demo error:', err);
  process.exit(1);
});
