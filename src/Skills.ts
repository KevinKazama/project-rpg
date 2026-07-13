import { Move } from './Character';

// Dictionnaire des compétences déblocables selon le niveau du joueur
export const skillCatalog: Record<number, Move> = {
  2: { name: '🔥 Lance-Flamme', damage: 25, type: 'attack', accuracy: 85 },
  3: { name: '🛡️ Peau de Pierre', damage: 35, type: 'heal', accuracy: 100 },
  4: { name: '⚡ Éclair de Foudre', damage: 45, type: 'attack', accuracy: 75 },
  5: { name: '🌟 Jugement Dernier', damage: 60, type: 'attack', accuracy: 90 }
};

// Fonction pour vérifier si une compétence est disponible pour un niveau précis
export function getSkillForLevel(level: number): Move | null {
  return skillCatalog[level] || null;
}