/**
 * Example: Match-Day Wallet
 * ─────────────────────────────────────────────────────────────────────────────
 * WHO THIS IS FOR: Developers building match-day trading tools or agents that
 * respond to live football events with wallet actions.
 *
 * WHAT IT DEMONSTRATES:
 *   - How SportMind's SMS (Sentiment Momentum Score) drives entry/exit timing
 *   - How the athlete layer refines the match signal
 *   - Why CHI must confirm structural demand before acting on SMS
 *   - How athlete availability affects wallet decision confidence
 *
 * THE CORE INSIGHT:
 *   SMS alone is not enough. An SMS of 74 on a token with CHI of 35 means
 *   speculators are excited, not holders. SportMind makes this distinction.
 *   The wallet only acts when CHI confirms the SMS has structural backing.
 *
 * PRODUCTION WIRING NEEDED:
 *   - Replace mock match data with live fixture + odds APIs
 *   - Replace mock athlete data with live squad/injury feeds
 *   - Wire buy/sell execution to Chiliz DEX router
 *   - Add lineup confirmation webhook (2h before kickoff)
 *
 * RUN: npm run example:matchday
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { loadSportMindSignal } from '../../src/sportmind/layer-loader.js';
import { parseSignalToDecision } from '../../src/sportmind/signal-parser.js';
import { PolicyEngine } from '../../src/guardrails/policy.js';

async function runMatchDayExample(): Promise<void> {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  SportMind — Match-Day Wallet Agent');
  console.log('  Arsenal FC ($AFC) vs Manchester City — Premier League');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Load signal with all layers — athlete layer is critical for match-day
  const signal = await loadSportMindSignal({
    token: 'AFC',
    includeMatch: true,
    includeAthlete: true,
    mockMode: true,
  });

  if (!signal.match) {
    console.log('No imminent match detected. Wallet agent is standing by.\n');
    return;
  }

  const match = signal.match;

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  MATCH SIGNAL BREAKDOWN');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log(`  Match:      ${match.homeTeam} vs ${match.awayTeam}`);
  console.log(`  Competition: ${match.competition} | ${match.venue}`);
  console.log(`  Kickoff:    ${new Date(match.kickoffUtc).toUTCString()}\n`);

  console.log(`  SMS (Sentiment Momentum Score): ${match.sms}/100`);
  console.log(`  Direction:   ${match.direction}`);
  console.log(`  Adj. score:  ${match.adjustedScore}`);
  console.log(`  Recommended: ${match.recommendedAction}`);
  console.log(`  Lineup confirmed: ${!match.lineupUnconfirmed ? 'YES ✓' : 'NO ⚠️'}\n`);

  // The CHI gate — this is what separates SportMind from a generic signal
  console.log('  ── CHI GATE (structural demand check) ──────────────────────');
  const chi = signal.fanToken.chi;
  console.log(`  CHI: ${chi}/100`);
  if (chi >= 70) {
    console.log(`  ✓ CHI above 70 — structural holder conviction confirmed`);
    console.log(`    SMS signal has real money behind it, not just speculation`);
  } else if (chi >= 50) {
    console.log(`  ~ CHI 50–70 — moderate conviction. Reduce position size.`);
  } else {
    console.log(`  ✗ CHI below 50 — speculative churn. SMS signal unreliable.`);
    console.log(`    Agent will HOLD despite strong SMS.`);
  }
  console.log('');

  // Athlete layer breakdown
  if (signal.athlete && signal.athlete.length > 0) {
    console.log('  ── ATHLETE LAYER ────────────────────────────────────────────');
    signal.athlete.forEach(a => {
      const status = a.availability === 'CONFIRMED' ? '✓' :
                     a.availability === 'DOUBT' ? '⚠️' : '✗';
      console.log(`  ${status} ${a.name.padEnd(20)} Form: ${a.formModifier}× | ${a.availability}`);
      if (a.injuryFlag) console.log(`    ⚠️  Injury flag active — monitoring`);
      if (a.starDepartureRisk > 50) {
        console.log(`    🔄 Star departure risk: ${a.starDepartureRisk}/100 — affects CHI long-term`);
      }
    });
    console.log('');
  }

  // Parse to decision
  const decision = parseSignalToDecision(signal);
  const policy = new PolicyEngine();
  const guardrailResult = policy.evaluate(decision);

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  WALLET DECISION');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log(`  Action:       ${decision.action}`);
  console.log(`  Confidence:   ${decision.confidenceScore}/100`);
  console.log(`  CHZ estimate: ${decision.estimatedChzAmount ?? 'N/A'} CHZ`);
  console.log(`  Guardrail:    ${guardrailResult.allowed ? 'ALLOWED' : 'BLOCKED'}`);

  if (!guardrailResult.allowed) {
    console.log(`  Blocked:      ${guardrailResult.blockedReason}`);
  }

  console.log(`\n  Rationale: ${decision.rationale}\n`);

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  PRODUCTION WIRING NOTES');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  console.log('  1. Lineup confirmation trigger (2h before kickoff):');
  console.log('     - Webhook from fixture data provider');
  console.log('     - Re-run loadSportMindSignal with updated athlete data');
  console.log('     - If key player out: re-evaluate decision');
  console.log('');
  console.log('  2. SMS data sources to wire:');
  console.log('     - Betting odds APIs (implied probability)');
  console.log('     - Social sentiment feeds');
  console.log('     - SportMind sports/ layer calibration records');
  console.log('');
  console.log('  3. Post-match actions:');
  console.log('     - Check FTP PATH_2 burn/mint confirmation on-chain');
  console.log('     - Update CHI model with post-match holder behaviour');
  console.log('');
}

runMatchDayExample().catch(err => {
  console.error('Match-day example error:', err);
  process.exit(1);
});
