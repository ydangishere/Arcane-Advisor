
export interface GameAnalysis {
  shopUnits: Unit[];
  boardUnits: Unit[];
  coins: number;
  recommendation: string;
  synergies: string[];
  suggestedAction: 'BUY' | 'UPGRADE' | 'REFRESH' | 'FREEZE';
}

export interface Unit {
  name: string;
  attack: number;
  health: number;
  ability?: string;
  type?: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  image?: string;
}
