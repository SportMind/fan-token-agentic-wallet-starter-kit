/**
 * Example: FTP PATH_2 Supply Event Detection
 * ─────────────────────────────────────────────────────────────────────────────
 * WHO THIS IS FOR: Developers building fan token trading tools, portfolio agents,
 * or any application where supply mechanics affect position sizing.
 *
 * WHAT IT DEMONSTRATES:
 *   - How SportMind's FTP PATH_2 signal works in practice
 *   - How to detect an imminent supply event (CHZ_BURN or CHZ_MINT)
 *   - How to position ahead of the supply change
 *   - Why this signal is invisible to standard models
 *
 * THE CORE INSIGHT:
 *   With gamified fan token tokenomics, a WIN prediction is simultaneously
 *   a SUPPLY REDUCTION event. Tokens burn on wins, mint on losses.
 *   Standard models see a match result. SportMind sees a supply mechanics event.
 *   The wallet acts on the latter.
 *
 * PRODUCTION WIRING NEEDED:
 *   - Replace mock FTP data with live Socios/Chiliz on-chain mechanics feed
 *   - Wire swap execution to a live DEX router (Chiliz DEX)
 *   - Add webhook trigger: match result confirmed → execute supply event response
 *
 * RUN: npm run example:ftp-path2
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { loadSportMindSignal } from '../../src/sportmind/layer-loader.js';
import { parseSignalToDecision } from '../../src/sportmind/signal-parser.js';
import { PolicyEngine } from '../../src/guardrails/policy.js';
import type { FTPPath2Signal, SportMindSignal } from '../../src/sportmind/types.js';

async function runFTPPath2Example(): Promise<void> {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  SportMind — FTP PATH_2 Supply Event Detection');
  console.log('  Arsenal FC ($AFC) — Premier League Match Imminent');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Load SportMind signal for AFC
  // Layer loading order: macro → fan-token (FTP PATH_2) → sports → athlete
  const signal = await loadSportMindSignal({
    token: 'AFC',
    includeMatch: true,
    includeAthlete: true,
    mockMode: true,
  });

  // Analyse the FTP PATH_2 signal
  analyseFTPSignal(signal);

  // Parse to wallet decision
  const decision = parseSignalToDecision(signal);

  // Evaluate against guardrails
  const policy = new PolicyEngine();
  const guardrailResult = policy.evaluate(decision);

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  WALLET AGENT DECISION');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log(`  Action:        ${decision.action}`);
  console.log(`  Confidence:    ${decision.confidenceScore}/100`);
  console.log(`  CHZ estimate:  ${decision.estimatedChzAmount ?? 'N/A'} CHZ`);
  console.log(`  Guardrail:     ${guardrailResult.allowed ? 'ALLOWED' : 'BLOCKED'}`);

  if (!guardrailResult.allowed) {
    console.log(`  Blocked reason: ${guardrailResult.blockedReason}`);
  } else if (guardrailResult.requiresApproval) {
    console.log(`  Status:        Awaiting user approval`);
    // NOTE (production): Trigger approval flow here
    // Could be: CLI prompt, webhook, UI confirmation, multi-sig, etc.
    await simulateApprovalFlow(decision.estimatedChzAmount ?? 0);
  }

  console.log('\n  ── SPORTMIND RATIONALE ──────────────────────────────────────');
  console.log(`  ${decision.rationale}\n`);

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  PRODUCTION WIRING NOTES');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  console.log('  1. Replace mock FTP data in layer-loader.ts with:');
  console.log('     - Live Chiliz Chain on-chain supply mechanics data');
  console.log('     - Socios platform match result webhooks');
  console.log('     - SportMind fan-token/ FTP PATH_2 documentation');
  console.log('');
  console.log('  2. Wire proposal_buy_fan_token to a real DEX router:');
  console.log('     - Chiliz DEX swap contract');
  console.log('     - Add slippage tolerance + deadline parameters');
  console.log('');
  console.log('  3. Add post-match response:');
  console.log('     - WIN confirmed → monitor burn transaction');
  console.log('     - LOSS confirmed → reassess position');
  console.log('     - Update SportMind signal after result');
  console.log('');
}

function analyseFTPSignal(signal: SportMindSignal): void {
  const ftp: FTPPath2Signal = signal.fanToken.ftpPath2;

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  FTP PATH_2 SIGNAL ANALYSIS');
  console.log('═══════════════════════════════════════════════════════════════\n');

  if (!ftp.active) {
    console.log('  FTP PATH_2: Not active for this token. No supply event.\n');
    return;
  }

  console.log(`  FTP PATH_2 Status:    ACTIVE`);
  console.log(`  Match scheduled:      ${ftp.matchScheduled ? 'YES' : 'NO'}`);

  if (ftp.matchScheduled) {
    const kickoff = ftp.matchkickoffUtc
      ? new Date(ftp.matchkickoffUtc)
      : null;
    const hoursUntilKickoff = kickoff
      ? Math.round((kickoff.getTime() - Date.now()) / (1000 * 60 * 60))
      : null;

    console.log(`  Opponent:             ${ftp.opponent}`);
    console.log(`  Competition:          ${ftp.competition}`);
    console.log(`  Kickoff:              ${kickoff?.toUTCString() ?? 'Unknown'}`);
    console.log(`  Hours until kickoff:  ${hoursUntilKickoff ?? 'N/A'}h`);
    console.log('');
    console.log(`  ── SUPPLY MECHANICS ───────────────────────────────────────`);
    console.log(`  Anticipated result:   ${ftp.anticipatedResult}`);
    console.log(`  Supply event:         ${ftp.supplyEvent}`);

    if (ftp.supplyEvent === 'CHZ_BURN') {
      console.log(`  Burn magnitude:       ${ftp.burnMagnitude?.toLocaleString()} CHZ`);
      console.log('');
      console.log('  → A WIN triggers token burn. Supply decreases.');
      console.log('    Positioning BEFORE the match captures the supply reduction.');
      console.log('    This is the signal standard models cannot see.');
      console.log('    SportMind FTP PATH_2 makes it visible.');
    } else if (ftp.supplyEvent === 'CHZ_MINT') {
      console.log(`  Mint magnitude:       ${ftp.mintMagnitude?.toLocaleString()} CHZ`);
      console.log('');
      console.log('  → A LOSS triggers token mint. Supply increases.');
      console.log('    Reduce exposure before match to avoid dilution.');
    }

    console.log('');
    console.log(`  FTP confidence:       ${ftp.ftpConfidence}%`);
    console.log(`  CHI (holder conviction): ${signal.fanToken.chi}/100`);
    console.log('');

    if ((ftp.ftpConfidence ?? 0) >= 60 && signal.fanToken.chi >= 70) {
      console.log('  ✓ Signal meets action threshold:');
      console.log('    FTP confidence ≥ 60% AND CHI ≥ 70 (structural demand)');
      console.log('    Agent will propose anticipatory position.');
    } else {
      console.log('  ✗ Signal below action threshold. Agent will hold.');
      console.log(`    FTP confidence: ${ftp.ftpConfidence}% (need ≥ 60%)`);
      console.log(`    CHI: ${signal.fanToken.chi} (need ≥ 70 for structural demand)`);
    }
  }
  console.log('');
}

async function simulateApprovalFlow(amountChz: number): Promise<void> {
  // NOTE (production): Replace this with your actual approval mechanism.
  // Options: CLI readline prompt, webhook to external system,
  // multi-sig wallet requirement, UI confirmation dialog, etc.
  console.log(`\n  [APPROVAL REQUIRED] Propose buying ~${amountChz} CHZ of AFC`);
  console.log('  [MOCK] Auto-approving in demo mode...');
  await new Promise(resolve => setTimeout(resolve, 500));
  console.log('  [MOCK] Approved. In production, execute swap here.\n');
}

runFTPPath2Example().catch(err => {
  console.error('FTP PATH_2 example error:', err);
  process.exit(1);
});
