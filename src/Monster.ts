import { Combatant, Move } from './Character';

export class Monster implements Combatant {
  name: string;
  baseMaxHp: number;
  baseAttack: number;
  baseDefense: number;
  speed: number;
  moves: Move[];
  level: number;
  hp: number;

  constructor(
    name: string,
    maxHp: number,
    attackPower: number,
    defensePower: number,
    speed: number,
    moves: Move[],
    level: number = 1
  ) {
    this.name = name;
    this.baseMaxHp = maxHp;
    this.baseAttack = attackPower;
    this.baseDefense = defensePower;
    this.speed = speed;
    this.moves = moves;
    this.level = level;
    this.hp = this.maxHp;
  }

  // GETTERS : Ces valeurs se mettent à jour automatiquement selon le niveau
  get maxHp(): number {
    return this.baseMaxHp + (this.level - 1) * 15;
  }

  get attackPower(): number {
    return this.baseAttack + (this.level - 1) * 3;
  }

  get defense(): number {
    return this.baseDefense + (this.level - 1) * 2;
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
}
