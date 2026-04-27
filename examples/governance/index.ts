/**
 * Example: Governance Voting Agent
 * ─────────────────────────────────────────────────────────────────────────────
 * WHO THIS IS FOR: Developers building governance participation tools or agents
 * that vote on fan token proposals based on holder intelligence.
 *
 * WHAT IT DEMONSTRATES:
 *   - How TAI (Token Activity Index) determines if a proposal has real traction
 *   - How AFS (Active Fan Score) determines if the fan base is genuinely engaged
 *   - How macro regulatory posture affects governance participation
 *   - Why voting without SportMind intelligence often means voting on proposals
 *     that don't have the holder engagement to matter
 *
 * THE CORE INSIGHT:
 *   A governance proposal with TAI 45 means the on-chain activity doesn't
 *   support meaningful participation — it's noise. TAI above 60 + AFS above 55
 *   means real holders are paying attention. SportMind tells you which is which.
 *
 * PRODUCTION WIRING NEEDED:
 *   - Replace mock proposal data with live Socios governance API
 *   - Wire vote execution to the fan token governance contract
 *   - Add proposal deadline monitoring
 *   - Consider delegation patterns for large holder portfolios
 *
 * RUN: npm run example:governance
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { loadSportMindSignal } from '../../src/sportmind/layer-loader.js';
import { parseSignalToDecision } from '../../src/sportmind/signal-parser.js';
import { PolicyEngine } from '../../src/guardrails/policy.js';

interface GovernanceProposal {
  id: string;
  title: string;
  description: string;
  deadlineUtc: string;
  type: 'KIT_DESIGN' | 'CHARITY_PARTNER' | 'PLAYER_TRIBUTE' | 'STADIUM_EXPERIENCE' | 'OTHER';
}

// Mock governance proposals (replace with live Socios governance API)
const MOCK_PROPOSALS: Record<string, GovernanceProposal[]> = {
  AFC: [
    {
      id: 'afc-gov-2026-047',
      title: 'Away kit colour vote — 2026/27 season',
      description: 'Vote on the primary colour for Arsenal\'s away kit next season.',
      deadlineUtc: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
      type: 'KIT_DESIGN',
    },
  ],
  BAR: [],
  PSG: [],
};

async function runGovernanceExample(): Promise<void> {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  SportMind — Governance Voting Agent');
  console.log('  Scanning fan token governance proposals...');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const tokensToCheck = ['AFC', 'BAR', 'PSG'];

  for (const token of tokensToCheck) {
    await analyseGovernanceForToken(token);
  }
}

async function analyseGovernanceForToken(token: string): Promise<void> {
  console.log(`─────────────────────────────────────────────────────────────`);
  console.log(`  ${token} — Governance Analysis`);
  console.log(`─────────────────────────────────────────────────────────────\n`);

  const signal = await loadSportMindSignal({
    token,
    includeMatch: false,
    includeAthlete: false,
    mockMode: true,
  });

  const proposals = MOCK_PROPOSALS[token] ?? [];

  if (proposals.length === 0) {
    console.log(`  No active proposals for ${token}.\n`);
    return;
  }

  // Governance signal analysis
  console.log('  ── SPORTMIND GOVERNANCE SIGNALS ─────────────────────────────');
  console.log(`  TAI (Token Activity Index): ${signal.fanToken.tai}/100`);
  console.log(`  AFS (Active Fan Score):     ${signal.fanToken.afs}/100`);
  console.log(`  Regulatory posture:         ${signal.macro.regulatoryPosture}`);
  console.log(`  Lifecycle phase:            ${signal.fanToken.lifecyclePhase}`);
  console.log('');

  // TAI/AFS gate
  const taiSufficient = signal.fanToken.tai >= 60;
  const afsSufficient = signal.fanToken.afs >= 55;

  if (!taiSufficient) {
    console.log(`  ✗ TAI ${signal.fanToken.tai} < 60 threshold`);
    console.log(`    On-chain activity is low. Proposal may not have real traction.`);
  } else {
    console.log(`  ✓ TAI ${signal.fanToken.tai} ≥ 60 — on-chain activity confirms engagement`);
  }

  if (!afsSufficient) {
    console.log(`  ✗ AFS ${signal.fanToken.afs} < 55 threshold`);
    console.log(`    Fan base engagement is low. Vote outcome may not reflect holders.`);
  } else {
    console.log(`  ✓ AFS ${signal.fanToken.afs} ≥ 55 — fan base is genuinely engaged`);
  }
  console.log('');

  // Evaluate each proposal
  for (const proposal of proposals) {
    await evaluateProposal(proposal, signal, taiSufficient && afsSufficient);
  }
}

async function evaluateProposal(
  proposal: GovernanceProposal,
  signal: Awaited<ReturnType<typeof loadSportMindSignal>>,
  signalSufficient: boolean
): Promise<void> {
  console.log(`  ── PROPOSAL: ${proposal.id} ──────────────────────────────────`);
  console.log(`  Title:    ${proposal.title}`);
  console.log(`  Type:     ${proposal.type}`);
  console.log(`  Deadline: ${new Date(proposal.deadlineUtc).toUTCString()}`);
  console.log('');

  if (!signalSufficient) {
    console.log(`  ✗ SportMind signal insufficient for confident vote.`);
    console.log(`    Recommend: ABSTAIN or await stronger engagement signal.\n`);
    return;
  }

  const decision = parseSignalToDecision(signal);
  const policy = new PolicyEngine();
  const guardrail = policy.evaluate(decision);

  if (!guardrail.allowed) {
    console.log(`  ✗ Guardrail blocked: ${guardrail.blockedReason}\n`);
    return;
  }

  // NOTE (production): Replace this with actual governance contract integration.
  // The vote direction should be determined by:
  //   - Holder preference data (if available from Socios platform)
  //   - Pre-configured voting policy (e.g. always FOR fan engagement proposals)
  //   - Agent reasoning from LLM with proposal context injected
  console.log(`  ✓ Signal sufficient — governance vote warranted`);
  console.log(`  Confidence: ${decision.confidenceScore}/100`);
  console.log(`  Proposed vote: FOR`);
  console.log(`  Rationale: TAI and AFS both confirm this proposal has real`);
  console.log(`    holder engagement. Participating strengthens community signal.`);
  console.log('');
  console.log(`  NOTE (production): Wire to governance contract:`);
  console.log(`    - Contract: [fan token governance contract address]`);
  console.log(`    - Method: castVote(proposalId, voteType)`);
  console.log(`    - Gas: estimate before execution on Spicy testnet first`);
  console.log('');
}

runGovernanceExample().catch(err => {
  console.error('Governance example error:', err);
  process.exit(1);
});
