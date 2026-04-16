export interface QidNode {
  qid: string;    // e.g. "Q140"
  label: string;  // e.g. "lion"
  depth: number;  // 0 = direct instance of, 1–3 = ancestor
}

export interface DynamicSynergy {
  qid: string;
  label: string;
  sharedCount: number;
  teamSize: number;
  specificity: number;   // 0–1, higher = more specific type
  statMultiplier: number; // e.g. 1.15 means +15% to all stats
}

export interface TeamSynergyResult {
  synergies: DynamicSynergy[];
  cpMultiplier: number;
  statMultipliers: {
    attack: number;
    health: number;
    speed: number;
  };
}
