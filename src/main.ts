import { Character, Move } from './Character';
import { Monster } from './Monster';
import { CombatEngine } from './CombatEngine';
import { UIManager } from './UIManager';
import { Weapon, Armor, Equipment } from './Stuff';
import { StoryManager } from './StoryManager';

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

// 2. Récupération des données sauvegardées
const savedLevel = localStorage.getItem('rpg_player_level');
const savedXp = localStorage.getItem('rpg_player_xp');
const savedBaseHp = localStorage.getItem('rpg_player_base_hp');
const savedBaseAtk = localStorage.getItem('rpg_player_base_atk');
const savedBaseDef = localStorage.getItem('rpg_player_base_def');
const savedMoves = localStorage.getItem('rpg_player_moves');
const savedWeapon = localStorage.getItem('rpg_player_weapon');
const savedArmor = localStorage.getItem('rpg_player_armor');
const savedBag = localStorage.getItem('rpg_player_bag');

const initialLevel = savedLevel ? parseInt(savedLevel) : 1;
const initialXp = savedXp ? parseInt(savedXp) : 0;
const initialHp = savedBaseHp ? parseInt(savedBaseHp) : 100;   
const initialAtk = savedBaseAtk ? parseInt(savedBaseAtk) : 10; 
const initialDef = savedBaseDef ? parseInt(savedBaseDef) : 5;  
const initialMoves: Move[] = savedMoves ? JSON.parse(savedMoves) : defaultPlayerMoves;

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

let initialBag: Equipment[] = [];
if (savedBag) {
  try {
    initialBag = JSON.parse(savedBag) as Equipment[];
  } catch (e) {
    console.error("Erreur lors du chargement du sac :", e);
    initialBag = [];
  }
}

// 3. Création des combattants
const hero = new Character(
    'Kevin', 
    initialHp, 
    initialAtk, 
    initialDef,
    15, 
    initialMoves,  
    initialWeapon,
    initialArmor,
    initialBag,
    initialLevel
);
hero.xp = initialXp;

const enemy = new Monster('Brute Ennemie', 120, 8, 1, 10, enemyMoves);

// 4. Déclaration et instanciation sans conflit
const ui = new UIManager();

// Déclarer les variables let afin qu'elles soient disponibles dans la portée de la closure
let storyManager: StoryManager;
let engine: CombatEngine;

// Instanciation de StoryManager (qui capture par référence la variable let "engine")
storyManager = new StoryManager(
  hero,
  (scenario) => ui.showScenario(scenario),
  (msg) => ui.addLog(msg),
  (newEnemy) => {
    // "engine" est désormais bien défini lorsque cet événement de combat survient
    engine.enemy = newEnemy;
    // S'assurer que l'ennemi a ses PV max
    engine.enemy.hp = engine.enemy.maxHp;
    ui.hideScenario();
    ui.addLog(`⚔️ Combat contre ${newEnemy.name} (Niv. ${newEnemy.level}) lancé !`);
    ui.updateUI();
  }
);

// Instanciation de CombatEngine
engine = new CombatEngine(
  hero,
  enemy,
  (msg) => ui.addLog(msg),    
  () => ui.updateUI()         
);

// Connexion réciproque du StoryManager au CombatEngine
engine.setStoryManager(storyManager);

// 5. Lancement de l'UI et du jeu
ui.init(engine, (selectedMove) => {
  engine.executeRound(selectedMove);
}, storyManager);