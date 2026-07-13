import { Monster } from './Monster';
import { Move } from './Character';

// 1. Liste de toutes les attaques possibles pour les monstres
const monsterMoves: Record<string, Move[]> = {
  goblin: [
    { name: '🔪 Coup de Dague', damage: 10, type: 'attack', accuracy: 95 },
    { name: '💨 Jet de Sable', damage: 5, type: 'attack', accuracy: 100 },
    { name: '🧪 Potion Volée', damage: 15, type: 'heal', accuracy: 100 }
  ],
  orc: [
    { name: '🪓 Coup de Hache', damage: 25, type: 'attack', accuracy: 70 },
    { name: '💥 Fracas', damage: 16, type: 'attack', accuracy: 90 }
  ],
  ghost: [
    { name: '👻 Hantise', damage: 14, type: 'attack', accuracy: 95 },
    { name: '🔮 Vol de Vie', damage: 12, type: 'attack', accuracy: 85 },
    { name: '🌌 Brume Spectrale', damage: 20, type: 'heal', accuracy: 100 }
  ],
  dragon: [
    { name: '🔥 Souffle Ardent', damage: 35, type: 'attack', accuracy: 75 },
    { name: '🐾 Écrasement', damage: 20, type: 'attack', accuracy: 90 }
  ]
};

// 2. Définition des fiches de statistiques de base des monstres (Niveau 1)
interface MonsterTemplate {
  name: string;
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  moves: Move[];
}

const templates: MonsterTemplate[] = [
  { name: 'Gobelin Chapardeur', hp: 70, attack: 7, defense: 5, speed: 18, moves: monsterMoves.goblin },
  { name: 'Orque Enragé', hp: 140, attack: 12, defense: 5, speed: 7, moves: monsterMoves.orc },
  { name: 'Spectre Errant', hp: 90, attack: 9, defense: 4, speed: 12, moves: monsterMoves.ghost },
  { name: 'Jeune Dragonnet', hp: 180, attack: 15, defense: 8, speed: 11, moves: monsterMoves.dragon }
];

// 3. Fonction pour générer un monstre aléatoire mis à l'échelle du niveau du joueur
export function getRandomMonster(playerLevel: number): Monster {
  const randomIndex = Math.floor(Math.random() * templates.length);
  const template = templates[randomIndex];

  // On crée une vraie instance de Monster basée sur le modèle pioché
  return new Monster(
    template.name,
    template.hp,
    template.attack,
    template.defense || 5,
    template.speed,
    template.moves,
    playerLevel // Le monstre s'adapte direct au niveau du joueur !
  );
}

// 4. Fonction pour générer un monstre spécifique par type
export function getMonsterByType(enemyType: 'goblin' | 'orc' | 'ghost' | 'dragon', playerLevel: number): Monster {
  const typeIndex: Record<string, number> = {
    'goblin': 0,
    'orc': 1,
    'ghost': 2,
    'dragon': 3
  };

  const template = templates[typeIndex[enemyType]];

  return new Monster(
    template.name,
    template.hp,
    template.attack,
    template.defense || 5,
    template.speed,
    template.moves,
    playerLevel
  );
}