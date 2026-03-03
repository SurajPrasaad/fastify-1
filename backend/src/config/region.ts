/**
 * Region Configuration & Constants
 * Multi-region active-active deployment config
 * Provides geo-to-region mapping, TURN domain resolution,
 * and region affinity determination.
 */

export const LOCAL_REGION = process.env.REGION || 'us-east';
export const POD_ID = process.env.HOSTNAME || `pod-${process.pid}`;

export const REGIONS = ['us-east', 'eu-west', 'ap-south', 'ap-east'] as const;
export type Region = (typeof REGIONS)[number];

export const REGION_TURN_MAP: Record<string, string> = {
  'us-east': process.env.TURN_DOMAIN_US || 'turn-use.platform.com',
  'eu-west': process.env.TURN_DOMAIN_EU || 'turn-euw.platform.com',
  'ap-south': process.env.TURN_DOMAIN_AP_SOUTH || 'turn-aps.platform.com',
  'ap-east': process.env.TURN_DOMAIN_AP_EAST || 'turn-ape.platform.com',
};

export const GEO_TO_REGION_MAP: Record<string, Region> = {
  'NA': 'us-east',
  'SA': 'us-east',
  'EU': 'eu-west',
  'AF': 'eu-west',
  'AS': 'ap-south',
  'OC': 'ap-east',
};

/** Region adjacency map for TURN spillover */
export const ADJACENT_REGIONS: Record<Region, Region[]> = {
  'us-east': ['eu-west', 'ap-east'],
  'eu-west': ['us-east', 'ap-south'],
  'ap-south': ['eu-west', 'ap-east'],
  'ap-east': ['ap-south', 'us-east'],
};

export const TURN_SECRET = process.env.COTURN_STATIC_AUTH_SECRET || 'default-turn-secret-change-me';
export const TURN_CREDENTIAL_TTL = Number(process.env.TURN_CREDENTIAL_TTL) || 86400; // 24h

/** Determines user's home region */
export function determineHomeRegion(regionAffinity?: string | null): Region {
  if (regionAffinity && REGIONS.includes(regionAffinity as Region)) {
    return regionAffinity as Region;
  }
  return 'us-east'; // Default fallback
}

/** Get adjacent regions for failover/spillover */
export function getAdjacentRegions(region: Region): Region[] {
  return ADJACENT_REGIONS[region] || [];
}
