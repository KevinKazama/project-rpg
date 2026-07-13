
import { Weapon, Armor, Equipment } from './Stuff';

export interface Move {
  name: string;
  damage: number;
  type: 'attack' | 'heal';
  accuracy: number;
}

export interface Combatant {
  name: string;
  moves: Move[];
  attackPower: number;
  hp: number;
  maxHp: number;
  level: number;
  isAlive(): boolean;
  takeDamage(amount: number): void;
  heal(amount: number): void;
}

export interface Inventory {
  potions: number;
  items: Equipment[]

}

export class Character implements Combatant {
  name: string;
  baseMaxHp: number;    // Stocke les PV de base au niveau 1
  baseAttack: number;   // Stocke l'attaque de base au niveau 1
  baseDefense: number;  // Stocke la défense de base au niveau 1
  speed: number;
  moves: Move[];
  inventory: Inventory;
  equippedWeapon: Weapon | null;
  equippedArmor: Armor | null;

  // Nouvelles variables pour le RPG
  level: number;
  xp: number;
  hp: number;

  readonly MAX_BAG_SLOTS = 5;

  constructor(
    name: string, 
    maxHp: number, 
    attackPower: number, 
    defensePower: number,
    speed: number, 
    moves: Move[], 
    potionsCount: number = 2, 
    equippedWeapon: Weapon | null = null,
    equippedArmor: Armor | null = null,
    itemsInBag: Equipment[] = [],
    level: number = 1
  ) {
    this.name = name;
    this.baseMaxHp = maxHp;
    this.baseAttack = attackPower;
    this.baseDefense = defensePower;
    this.speed = speed;
    this.moves = moves;
    this.inventory = { 
        potions: potionsCount,
        items: itemsInBag
    };
    this.equippedWeapon = equippedWeapon; 
    this.equippedArmor = equippedArmor;

    this.level = level;
    this.xp = 0;
    this.hp = this.maxHp; // Utilise le getter maxHp calculé selon le niveau

  }

  addItemToInventory(item: Equipment): boolean {
    if (!this.inventory.items) {
      this.inventory.items = [];
    }
    
    // Si on a atteint la limite, on refuse l'ajout
    if (this.inventory.items.length >= this.MAX_BAG_SLOTS) {
      return false; 
    }

    this.inventory.items.push(item);
    return true;
  }

  // 🗑️ Nouvelle méthode : Permet de jeter un objet du sac à dos
  removeItemFromBag(itemId: string): boolean {
    const itemIndex = this.inventory.items.findIndex(i => i.id === itemId);
    if (itemIndex === -1) return false;

    this.inventory.items.splice(itemIndex, 1);
    return true;
  }

  // ⚔️ Méthode pour équiper une arme depuis le sac à dos
  equipWeaponFromBag(weaponId: string): boolean {
    const itemIndex = this.inventory.items.findIndex(i => i.id === weaponId);
    if (itemIndex === -1) return false;

    const item = this.inventory.items[itemIndex];
    if (item.type !== 'weapon') return false;

    // Si on a déjà une arme, on la remet d'abord dans le sac !
    if (this.equippedWeapon) {
      this.inventory.items.push(this.equippedWeapon);
    }

    // On équipe la nouvelle et on la retire du sac
    this.equippedWeapon = item as Weapon;
    this.inventory.items.splice(itemIndex, 1);
    return true;
  }

  equipArmorFromBag(armorId: string): boolean {
    // 1. On cherche l'objet dans le sac
    const itemIndex = this.inventory.items.findIndex(i => i.id === armorId);
    if (itemIndex === -1) return false;

    const item = this.inventory.items[itemIndex];
    // Sécurité : on vérifie que c'est bien une armure
    if (item.type !== 'armor') return false;

    // 2. Si le joueur porte déjà une armure, on la remet dans le sac
    if (this.equippedArmor) {
      this.inventory.items.push(this.equippedArmor);
    }

    // 3. On équipe la nouvelle armure et on la retire du sac
    this.equippedArmor = item as Armor;
    this.inventory.items.splice(itemIndex, 1);
    return true;
  }

  // GETTERS : Ces valeurs se mettent à jour automatiquement selon le niveau !
  get maxHp(): number {
    // Formule simple : +15 PV max par niveau gagné
    return this.baseMaxHp + (this.level - 1) * 15;
  }

  get attackPower(): number {
    // Formule simple : +3 d'attaque par niveau gagné
    const weaponBonus = this.equippedWeapon ? this.equippedWeapon.bonusAtk : 0;
    return this.baseAttack + (this.level - 1) * 3 + weaponBonus;
  }

  get defense(): number {
    // Formule simple : +2 de défense par niveau gagné
    const armorBonus = this.equippedArmor ? this.equippedArmor.bonusDef : 0;
    return this.baseDefense + (this.level - 1) * 2 + armorBonus;
  }

  // Calcul du seuil d'XP requis pour le prochain niveau (style Pokémon)
  getXpNeededForNextLevel(): number {
    return this.level * 100; // Niveau 1 = 100 XP, Niveau 2 = 200 XP, etc.
  }

  isAlive(): boolean {
    return this.hp > 0;
  }

  takeDamage(amount: number) {
    this.hp = Math.max(0, this.hp - amount);
  }

  heal(amount: number) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  // Fonction pour ajouter de l'XP et gérer le Level Up
  gainXp(amount: number): { logs: string[], leveledUp: boolean } {
    let leveledUp = false;
    const logs: string[] = [];
    this.xp += amount;
    logs.push(`✨ ${this.name} gagne **${amount} points d'expérience** !`);

    // Vérifie le passage de niveau
    while (this.xp >= this.getXpNeededForNextLevel()) {
      this.xp -= this.getXpNeededForNextLevel();
      this.level++;
      leveledUp = true;
      
      // On soigne entièrement les PV à la montée de niveau
      this.hp = this.maxHp; 
      logs.push(`🆙 **LEVEL UP !** ${this.name} passe au **Niveau ${this.level}** !`);
    }

    return { logs, leveledUp };
  }

  // Fonctions pour appliquer le bonus choisi par le joueur
  applyHpBonus() {
    this.baseMaxHp += 25; // Gros bonus de PV Max
    this.hp = this.maxHp; // Soigne le bonus
  }

  applyAttackBonus() {
    this.baseAttack += 5; // Gros bonus d'Attaque
  }

  learnMove(move: Move) {
    // Évite les doublons au cas où
    if (!this.moves.some(m => m.name === move.name)) {
      this.moves.push(move);
    }
  }

  usePotion(): boolean {
    if (this.inventory.potions > 0 && this.hp < this.maxHp) {
      this.inventory.potions--;
      this.heal(40); // Soigne 40 PV fixes par exemple
      return true;
    }
    return false; // Impossible si sac vide ou PV déjà max
  }

}
