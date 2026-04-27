/**
 * SportMind Layer Loader
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * START HERE. This is the canonical pattern for loading SportMind into any
 * application. Every example in this kit uses this loader.
 *
 * The loader does three things:
 *   1. Declares which SportMind layers this application depends on
 *   2. Loads them in the correct order (macro → fan-token → sports → athlete)
 *   3. Returns a consolidated SportMindSignal the agent can reason from
 *
 * In production: replace the mock resolvers below with real data sources.
 * The layer loading order and signal structure must not change.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * SportMind version: v3.63+
 * Layers declared: macro, fan-token, sports, athlete
 *
 * Reference: https://github.com/SportMind/SportMind
 */

import type {
  SportMindSignal,
  LayerDeclaration,
  MacroSignal,
  FanTokenSignal,
  MatchSignal,
  AthleteSignal,
  FTPPath2Signal,
} from './types.js';

// ── LAYER DECLARATION ─────────────────────────────────────────────────────────
//
// This declaration is the equivalent of a package.json dependency —
// it states which SportMind layers this application loads and which
// version it was built against. Update when SportMind releases new versions.

export const SPORTMIND_LAYER_DECLARATION: LayerDeclaration = {
  version: 'v3.63',
  layers: ['macro', 'fan-token', 'sports', 'athlete'],
  loadedAt: new Date(),
};

// ── LAYER LOADER OPTIONS ──────────────────────────────────────────────────────

export interface LayerLoaderOptions {
  token: string;             // Fan token symbol, e.g. 'AFC'
  includeMatch?: boolean;    // Load sports layer (match signal)
  includeAthlete?: boolean;  // Load athlete layer
  mockMode?: boolean;        // Use mock data (no external calls)
}

// ── MAIN LOADER ───────────────────────────────────────────────────────────────

/**
 * loadSportMindSignal
 *
 * Loads all four SportMind layers in order and returns a consolidated signal.
 *
 * Layer loading order is deliberate:
 *   Layer 1 — MACRO: Sets the environment. If macro override is active,
 *             subsequent layers still load but execution is blocked.
 *   Layer 2 — FAN TOKEN: Core commercial intelligence. CHI, AFS, TAI,
 *             FTP PATH_2 supply mechanics.
 *   Layer 3 — SPORTS (optional): Match signal. Only meaningful when a
 *             match is imminent (within 48h).
 *   Layer 4 — ATHLETE (optional): Refines the sports signal. Star
 *             departure risk and availability affect fan token sentiment.
 *
 * @param options - Token and layer configuration
 * @returns Consolidated SportMindSignal
 */
export async function loadSportMindSignal(
  options: LayerLoaderOptions
): Promise<SportMindSignal> {
  const {
    token,
    includeMatch = true,
    includeAthlete = true,
    mockMode = true,
  } = options;

  console.log(`\n[SportMind] Loading layers for ${token}...`);
  console.log(`[SportMind] Version: ${SPORTMIND_LAYER_DECLARATION.version}`);
  console.log(`[SportMind] Layers: ${SPORTMIND_LAYER_DECLARATION.layers.join(' → ')}\n`);

  // Layer 1: Macro — always load first
  // NOTE (production): Replace with real macro data source.
  // SportMind macro/ directory contains regulatory frameworks, crypto cycle
  // analysis, and geopolitical risk signals.
  console.log('[SportMind] Layer 1/4 — Macro intelligence...');
  const macro = await resolveMacroLayer(mockMode);
  console.log(`[SportMind]   Regulatory posture: ${macro.regulatoryPosture}`);
  console.log(`[SportMind]   Crypto market phase: ${macro.cryptoMarketPhase}`);
  console.log(`[SportMind]   Macro override: ${macro.macroOverrideActive ? 'ACTIVE ⚠️' : 'inactive'}`);

  // Layer 2: Fan token commercial — always load
  // NOTE (production): Replace with real Chiliz Chain data + Socios API.
  // SportMind fan-token/ directory contains lifecycle phases, CHI, AFS, TAI,
  // FTP PATH_2 mechanics, and governance signal patterns.
  console.log(`\n[SportMind] Layer 2/4 — Fan token commercial (${token})...`);
  const fanToken = await resolveFanTokenLayer(token, mockMode);
  console.log(`[SportMind]   CHI:  ${fanToken.chi} ${chiInterpretation(fanToken.chi)}`);
  console.log(`[SportMind]   AFS:  ${fanToken.afs}`);
  console.log(`[SportMind]   TAI:  ${fanToken.tai}`);
  console.log(`[SportMind]   FTP PATH_2: ${fanToken.ftpPath2.active ? `ACTIVE — ${fanToken.ftpPath2.supplyEvent}` : 'inactive'}`);

  // Layer 3: Sports / match signal — load when match is imminent
  let match: MatchSignal | undefined;
  if (includeMatch) {
    console.log(`\n[SportMind] Layer 3/4 — Sports / match signal...`);
    match = await resolveMatchLayer(token, mockMode);
    if (match) {
      console.log(`[SportMind]   Direction: ${match.direction}`);
      console.log(`[SportMind]   SMS: ${match.sms}`);
      console.log(`[SportMind]   Recommended action: ${match.recommendedAction}`);
    } else {
      console.log(`[SportMind]   No imminent match — sports layer not applicable`);
    }
  }

  // Layer 4: Athlete — refines match + fan token signal
  let athlete: AthleteSignal[] | undefined;
  if (includeAthlete && match) {
    console.log(`\n[SportMind] Layer 4/4 — Athlete intelligence...`);
    athlete = await resolveAthleteLayer(token, mockMode);
    athlete.forEach(a => {
      console.log(`[SportMind]   ${a.name}: form modifier ${a.formModifier}× | availability: ${a.availability}`);
    });
  }

  console.log(`\n[SportMind] All layers loaded. Signal ready.\n`);

  return {
    layerDeclaration: {
      ...SPORTMIND_LAYER_DECLARATION,
      loadedAt: new Date(),
    },
    macro,
    fanToken,
    match,
    athlete,
    generatedAt: new Date(),
    signalVersion: SPORTMIND_LAYER_DECLARATION.version,
  };
}

// ── MOCK LAYER RESOLVERS ──────────────────────────────────────────────────────
//
// These mock resolvers return realistic SportMind signal shapes.
// In production, replace each with the appropriate data source.
// The return types must remain unchanged — the agent depends on this shape.

async function resolveMacroLayer(_mockMode: boolean): Promise<MacroSignal> {
  // NOTE (production): Load from SportMind macro/ directory.
  // Combine with live data: crypto market APIs, regulatory news feeds,
  // Chiliz Chain on-chain metrics.
  return {
    cryptoMarketPhase: 'MID_BULL',
    regulatoryPosture: 'NEUTRAL',
    micaPhase: 'TRANSITION',
    secCftcPosture: 'CAUTIOUS',
    geopoliticalRisk: 22,
    macroOverrideActive: false,
    macroModifier: 0.95,
  };
}

async function resolveFanTokenLayer(
  token: string,
  _mockMode: boolean
): Promise<FanTokenSignal> {
  // NOTE (production): Load from SportMind fan-token/ directory.
  // Combine with live data: Chiliz Chain on-chain holder data,
  // Socios platform engagement metrics, DEX liquidity data.
  const mockData: Record<string, Partial<FanTokenSignal>> = {
    AFC: {
      club: 'Arsenal FC',
      chi: 78,
      afs: 71,
      tai: 64,
      lifecyclePhase: 'PHASE_3_MATURITY',
      holderSentiment: 'BULLISH',
      ftpPath2: {
        active: true,
        matchScheduled: true,
        matchkickoffUtc: new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString(),
        opponent: 'Manchester City',
        competition: 'Premier League',
        anticipatedResult: 'WIN',
        supplyEvent: 'CHZ_BURN',
        burnMagnitude: 45000,
        ftpConfidence: 72,
      },
      governanceProposalActive: true,
      rewardClaimAvailable: false,
      fanTokenModifier: 1.12,
    },
    BAR: {
      club: 'FC Barcelona',
      chi: 82,
      afs: 79,
      tai: 71,
      lifecyclePhase: 'PHASE_4_EXPANSION',
      holderSentiment: 'BULLISH',
      ftpPath2: {
        active: true,
        matchScheduled: false,
        supplyEvent: 'PENDING',
        ftpConfidence: 45,
      },
      governanceProposalActive: false,
      rewardClaimAvailable: true,
      fanTokenModifier: 1.18,
    },
    PSG: {
      club: 'Paris Saint-Germain',
      chi: 65,
      afs: 60,
      tai: 82,
      lifecyclePhase: 'PHASE_3_MATURITY',
      holderSentiment: 'NEUTRAL',
      ftpPath2: {
        active: true,
        matchScheduled: true,
        matchkickoffUtc: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
        opponent: 'Lyon',
        competition: 'Ligue 1',
        anticipatedResult: 'WIN',
        supplyEvent: 'CHZ_BURN',
        burnMagnitude: 28000,
        ftpConfidence: 65,
      },
      governanceProposalActive: false,
      rewardClaimAvailable: false,
      fanTokenModifier: 0.98,
    },
  };

  const data = mockData[token] ?? mockData['AFC'];

  return {
    token,
    club: data.club ?? token,
    chi: data.chi ?? 50,
    afs: data.afs ?? 50,
    tai: data.tai ?? 50,
    lifecyclePhase: data.lifecyclePhase ?? 'PHASE_2_GROWTH',
    holderSentiment: data.holderSentiment ?? 'NEUTRAL',
    ftpPath2: data.ftpPath2 ?? { active: false, matchScheduled: false },
    governanceProposalActive: data.governanceProposalActive ?? false,
    rewardClaimAvailable: data.rewardClaimAvailable ?? false,
    fanTokenModifier: data.fanTokenModifier ?? 1.00,
  };
}

async function resolveMatchLayer(
  token: string,
  _mockMode: boolean
): Promise<MatchSignal | undefined> {
  // NOTE (production): Load from SportMind sports/ directory.
  // Combine with live data: fixture APIs, odds feeds, lineup confirmations.
  // Only return a signal when match is within 48 hours.
  const matchData: Record<string, MatchSignal> = {
    AFC: {
      direction: 'HOME',
      sms: 74,
      adjustedScore: 71.2,
      recommendedAction: 'ENTER',
      compositeModifier: 1.10,
      lineupUnconfirmed: false,
      macroOverrideActive: false,
      homeTeam: 'Arsenal FC',
      awayTeam: 'Manchester City',
      competition: 'Premier League',
      venue: 'Emirates Stadium',
      kickoffUtc: new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString(),
    },
  };
  return matchData[token];
}

async function resolveAthleteLayer(
  token: string,
  _mockMode: boolean
): Promise<AthleteSignal[]> {
  // NOTE (production): Load from SportMind athlete/ directory.
  // Combine with live data: injury feeds, transfer news, squad confirmation APIs.
  // Focus on players whose availability materially affects fan token sentiment.
  const athleteData: Record<string, AthleteSignal[]> = {
    AFC: [
      {
        playerId: 'bukayo-saka',
        name: 'Bukayo Saka',
        team: 'Arsenal FC',
        formModifier: 1.15,
        availability: 'CONFIRMED',
        injuryFlag: false,
        transferRumourActive: false,
        starDepartureRisk: 12,
      },
      {
        playerId: 'martin-odegaard',
        name: 'Martin Ødegaard',
        team: 'Arsenal FC',
        formModifier: 1.10,
        availability: 'DOUBT',
        injuryFlag: true,
        transferRumourActive: false,
        starDepartureRisk: 8,
      },
    ],
  };
  return athleteData[token] ?? [];
}

// ── HELPERS ───────────────────────────────────────────────────────────────────

function chiInterpretation(chi: number): string {
  if (chi >= 70) return '(structural demand ✓)';
  if (chi >= 50) return '(moderate conviction)';
  if (chi >= 40) return '(weak — monitor)';
  return '(speculative churn ⚠️)';
}
