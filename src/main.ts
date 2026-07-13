import { Character, Move } from './Character';
import { Monster } from './Monster';
import { CombatEngine } from './CombatEngine';
import { UIManager } from './UIManager';
import { Weapon, Armor, Equipment } from './Stuff';

// 1. Définition des attaques/soins disponibles
const defaultPlayerMoves: Move[] = [
  { name: '👊 Charge', damage: 15, type: 'attack', accuracy: 95 },
  { name: '🩹 Potion de Soin', damage: 30, type: 'heal', accuracy: 100 }
];

const enemyMoves: Move[] = [
  { name: 'Morsure', damage: 12, type: 'attack', accuracy: 95 },
  { name: 'Griffe', damage: 18, type: 'attack', accuracy: 85 },
  { name: 'Régénération', damage: 20, type: 'heal', accuracy: 100 }
];

// 2. Création des combattants (Nom, MaxPV, Attaque, Vitesse, Capacités)
const savedLevel = localStorage.getItem('rpg_player_level');
const savedXp = localStorage.getItem('rpg_player_xp');
const savedBaseHp = localStorage.getItem('rpg_player_base_hp');
const savedBaseAtk = localStorage.getItem('rpg_player_base_atk');
const savedBaseDef = localStorage.getItem('rpg_player_base_def');
const savedMoves = localStorage.getItem('rpg_player_moves'); // NOUVEAU : Charge la liste d'attaques
const savedPotions = localStorage.getItem('rpg_player_potions');
const savedWeapon = localStorage.getItem('rpg_player_weapon');
const savedArmor = localStorage.getItem('rpg_player_armor');
const savedBag = localStorage.getItem('rpg_player_bag');

const initialLevel = savedLevel ? parseInt(savedLevel) : 1;
const initialXp = savedXp ? parseInt(savedXp) : 0;
const initialHp = savedBaseHp ? parseInt(savedBaseHp) : 100;   // 100 par défaut si 1ère partie
const initialAtk = savedBaseAtk ? parseInt(savedBaseAtk) : 10; // 10 par défaut si 1ère partie
const initialDef = savedBaseDef ? parseInt(savedBaseDef) : 5;  // 5 par défaut si 1ère partie
const initialMoves: Move[] = savedMoves ? JSON.parse(savedMoves) : defaultPlayerMoves;
const initialPotions = savedPotions ? parseInt(savedPotions) : 2;

let initialWeapon: Weapon | null = null;
if (savedWeapon) {
  try {
    initialWeapon = JSON.parse(savedWeapon) as Weapon;
  } catch (e) {
    console.error("Erreur lors du chargement de l'arme :", e);
    initialWeapon = null;
  }
}

let initialArmor: Armor | null = null;
if (savedArmor) {
  try {
    initialArmor = JSON.parse(savedArmor) as Armor;
  } catch (e) {
    console.error("Erreur lors du chargement de l'armure :", e);
    initialArmor = null;
  }
}

// Conversion sécurisée du sac à dos JSON
let initialBag: Equipment[] = [];
if (savedBag) {
  try {
    initialBag = JSON.parse(savedBag) as Equipment[];
  } catch (e) {
    console.error("Erreur lors du chargement du sac :", e);
    initialBag = [];
  }
}

// 2. Création des combattants avec les PV et l'ATK exacts issus de ses choix passés
const hero = new Character(
    'Kevin', 
    initialHp, 
    initialAtk, 
    initialDef,
    15, 
    initialMoves,  
    initialPotions,
    initialWeapon,
    initialArmor,
    initialBag,
    initialLevel
);
hero.xp = initialXp;

const enemy = new Monster('Brute Ennemie', 120, 8, 1, 10, enemyMoves);

// 3. Initialisation des gestionnaires
const ui = new UIManager();

const engine = new CombatEngine(
  hero,
  enemy,
  (msg) => ui.addLog(msg),    // Lien pour ajouter les messages
  () => ui.updateUI()         // Lien pour rafraîchir les barres de vie
);

// 4. Lancement du jeu
ui.init(engine, (selectedMove) => {
  engine.executeRound(selectedMove);
});