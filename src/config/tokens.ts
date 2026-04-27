/**
 * Fan Token Registry
 *
 * Tokens supported by this kit, with their SportMind layer declarations.
 * AFC is included with FTP PATH_2 active — the confirmed real-world signal.
 *
 * To add a token: see CONTRIBUTING.md
 */

export interface FanToken {
  symbol: string;
  club: string;
  league: string;
  leagueCountry: string;
  ftpPath2Active: boolean;         // Has live FTP PATH_2 supply mechanics
  sportmindLayers: string[];       // Which SportMind layers have data for this token
  mainnetAddress?: string;         // NOTE: verify on scan.chiliz.com before use
  testnetAddress?: string;
}

export const FAN_TOKEN_REGISTRY: Record<string, FanToken> = {
  AFC: {
    symbol: 'AFC',
    club: 'Arsenal FC',
    league: 'Premier League',
    leagueCountry: 'England',
    ftpPath2Active: true,
    sportmindLayers: ['fan-token', 'sports', 'athlete', 'market'],
    // NOTE (production): Add verified contract addresses
  },
  BAR: {
    symbol: 'BAR',
    club: 'FC Barcelona',
    league: 'La Liga',
    leagueCountry: 'Spain',
    ftpPath2Active: true,
    sportmindLayers: ['fan-token', 'sports', 'athlete', 'market'],
  },
  CITY: {
    symbol: 'CITY',
    club: 'Manchester City',
    league: 'Premier League',
    leagueCountry: 'England',
    ftpPath2Active: true,
    sportmindLayers: ['fan-token', 'sports', 'athlete', 'market'],
  },
  PSG: {
    symbol: 'PSG',
    club: 'Paris Saint-Germain',
    league: 'Ligue 1',
    leagueCountry: 'France',
    ftpPath2Active: true,
    sportmindLayers: ['fan-token', 'sports', 'athlete', 'market'],
  },
  JUV: {
    symbol: 'JUV',
    club: 'Juventus',
    league: 'Serie A',
    leagueCountry: 'Italy',
    ftpPath2Active: true,
    sportmindLayers: ['fan-token', 'sports', 'market'],
  },
  ACM: {
    symbol: 'ACM',
    club: 'AC Milan',
    league: 'Serie A',
    leagueCountry: 'Italy',
    ftpPath2Active: true,
    sportmindLayers: ['fan-token', 'sports', 'market'],
  },
};

export function getToken(symbol: string): FanToken {
  const token = FAN_TOKEN_REGISTRY[symbol.toUpperCase()];
  if (!token) {
    throw new Error(
      `Unknown fan token: ${symbol}. ` +
      `Supported tokens: ${Object.keys(FAN_TOKEN_REGISTRY).join(', ')}. ` +
      `To add a token, see CONTRIBUTING.md`
    );
  }
  return token;
}

export function getTokensWithFTPPath2(): FanToken[] {
  return Object.values(FAN_TOKEN_REGISTRY).filter(t => t.ftpPath2Active);
}
