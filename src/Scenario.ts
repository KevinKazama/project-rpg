export interface Choice {
  id: string;
  text: string;
  consequence: ScenarioConsequence;
}

export interface ScenarioConsequence {
  type: 'combat' | 'reward' | 'damage' | 'heal' | 'story' | 'death' | 'offer';
  value?: number;
  nextScenarioId?: string;
  description?: string;
  enemyLevel?: number;
  enemyType?: 'goblin' | 'orc' | 'ghost' | 'dragon';
  xpReward?: number;
  itemReward?: string;
  requiredItemType?: 'potion' | 'weapon' | 'armor' | 'any';
  requiredItemRarity?: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface Scenario {
  id: string;
  title: string;
  description: string;
  choices: Choice[];
  isCombat?: boolean;
  enemyLevel?: number;
}

export type ScenarioMap = Record<string, Scenario>;
