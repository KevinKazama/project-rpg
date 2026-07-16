import { Character, Combatant, Move } from './Character';
import { Monster } from './Monster';
import { getRandomMonster } from './Bestiary';
import { getRandomEquipmentLoot } from './Stuff';
import { StoryManager } from './StoryManager';

export class CombatEngine {
  player: Character;
  enemy: Monster;
  onLogCallback: (message: string) => void;
  onUpdateUICallback: () => void;
  private storyManager: StoryManager | null = null;

  constructor(player: Character, enemy: Monster, onLog: (msg: string) => void, onUpdateUI: () => void) {
    this.player = player;
    this.enemy = enemy;
    this.onLogCallback = onLog;
    this.onUpdateUICallback = onUpdateUI;
  }

  setStoryManager(storyManager: StoryManager) {
    this.storyManager = storyManager;
  }

  // Déclenche un round complet après le choix du joueur
  executeRound(playerMove: Move) {
// 1. L'ennemi choisit une action au hasard
    const enemyMove = this.enemy.moves[Math.floor(Math.random() * this.enemy.moves.length)];

    // 2. Déterminer l'ordre d'action basé sur la vitesse
    if (this.player.speed >= this.enemy.speed) {
      this.executeMove(this.player, this.enemy, playerMove);
      if (this.enemy.isAlive()) {
        this.executeMove(this.enemy, this.player, enemyMove);
      }
    } else {
      this.executeMove(this.enemy, this.player, enemyMove);
      if (this.player.isAlive()) {
        this.executeMove(this.player, this.enemy, playerMove);
      }
    }

    // 3. Vérifier la fin de partie
    this.checkBattleStatus();
    this.onUpdateUICallback();
  }

  private executeMove(attacker: Combatant, defender: Combatant, move: Move) {
    // Calcul de la précision
    const roll = Math.random() * 100;
    if (roll > move.accuracy) {
      this.onLogCallback(`${attacker.name} rate son attaque : ${move.name} !`);
      return;
    }

    if (move.type === 'attack') {
      // Formule de dégâts basique : dégâts de la capacité + modificateur d'attaque du perso
      const baseDamage = move.damage + Math.floor(attacker.attackPower * 0.5);
      // Ajout d'un petit facteur aléatoire (+/- 10%) pour le style RPG
      const randomFactor = 0.9 + Math.random() * 0.2;
      const finalDamage = Math.floor(baseDamage * randomFactor);

      // Coup critique (10% de chance)
      const isCritical = Math.random() < 0.1;
      const criticalDamage = isCritical ? Math.floor(finalDamage * 1.5) : finalDamage;

      defender.takeDamage(criticalDamage);
      this.onLogCallback(`${attacker.name} utilise **${move.name}** ! ${isCritical ? '⚡ COUP CRITIQUE ! ' : ''}${defender.name} perd ${criticalDamage} PV.`);
    } 
    
    else if (move.type === 'heal') {
      attacker.heal(move.damage);
      this.onLogCallback(`${attacker.name} utilise **${move.name}** et récupère ${move.damage} PV !`);
    }
  }

  isChoosingBonus: boolean = false;

  private checkBattleStatus() {
    if (!this.player.isAlive()) {
      this.onLogCallback(`❌ **K.O.** ! ${this.player.name} a perdu le combat...`);
      
      // Si on est en mode histoire, notifier le StoryManager
      if (this.storyManager) {
        this.storyManager.onCombatDefeat();
      }
    } else if (!this.enemy.isAlive()) {
      this.onLogCallback(`🏆 **VICTOIRE** ! ${this.enemy.name} a mordu la poussière !`);
     
      if (Math.random() < 0.30) {
        const newPotion = getRandomEquipmentLoot(this.enemy.level);
        if (newPotion && newPotion.type === 'potion') {
          this.player.addItemToInventory(newPotion);
          this.onLogCallback(`🧪 Trouvé ! ${this.enemy.name} a laissé tomber une **Potion** !`);
          localStorage.setItem('rpg_player_bag', JSON.stringify(this.player.inventory.items));
        }
      }

      if (Math.random() < 0.95) {
        // Appellera notre nouvelle fonction générique (pense à l'importer en haut si besoin)
        const newLoot = getRandomEquipmentLoot(this.enemy.level); 

        if (newLoot) {
          const addedSuccessfully = this.player.addItemToInventory(newLoot);
          
          if (addedSuccessfully) {
            const rarityStars = newLoot.rarity === 'legendary' ? '✨✨' : '';
            const typeLabel = newLoot.type === 'weapon' ? 'ARME' : 'ARMURE';
            
            this.onLogCallback(`\n🎒 **BUTIN AJOUTÉ AU SAC (${newLoot.rarity.toUpperCase()})** ${rarityStars}`);
            this.onLogCallback(` Vous avez trouvé une ${typeLabel} : **${newLoot.name}** !`);
            this.onLogCallback(` *"${newLoot.description}"* \n`);
            
            localStorage.setItem('rpg_player_bag', JSON.stringify(this.player.inventory.items));
          } else {
            this.onLogCallback(`\n⚠️ **SAC PLEIN !** Tu as trouvé **${newLoot.name}** mais ton sac à dos est plein.`);
          }

          if (this.onUpdateUICallback) {
            this.onUpdateUICallback();
          }
        }
      }

      const xpGained = this.enemy.level * 50;
      const xpResult = this.player.gainXp(xpGained);
      xpResult.logs.forEach(log => this.onLogCallback(log));

      if (xpResult.leveledUp) {
        this.isChoosingBonus = true;
        this.onLogCallback(`🎁 Choisissez une récompense de niveau !`);
      }

      // Sauvegarde immédiate du niveau et de l'XP
      localStorage.setItem('rpg_player_level', this.player.level.toString());
      localStorage.setItem('rpg_player_xp', this.player.xp.toString());
      // On sauvegarde aussi les stats de base qui ont pu changer via les bonus précédents
      localStorage.setItem('rpg_player_base_hp', this.player.baseMaxHp.toString());
      localStorage.setItem('rpg_player_base_atk', this.player.baseAttack.toString());
      
      // Si on est en mode histoire, notifier le StoryManager
      if (this.storyManager) {
        this.storyManager.onCombatVictory();
      }
    }
  }

  startNewCombat() {
    // 1. On recrée ou met à jour l'ennemi au niveau actuel du joueur pour garder du défi
    this.enemy = getRandomMonster(this.player.level);

    // 2. On déclenche les rafraîchissements visuels
    this.onLogCallback(`--- ⚔️ UN NOUVEL ADVERSAIRE APPROCHE : ${this.enemy.name} (Niv. ${this.enemy.level}) ---`);
    this.onUpdateUICallback();
  }

  executePotionTurn() {
    if (this.player.usePotion()) {
      this.onLogCallback(`🧪 ${this.player.name} boit une Potion et récupère des PV !`);
      
      // Sauvegarde le sac mis à jour
      localStorage.setItem('rpg_player_bag', JSON.stringify(this.player.inventory.items));

      this.onUpdateUICallback();
    } else {
      this.onLogCallback(`⚠️ Impossible d'utiliser une potion (Sac vide ou PV déjà au max).`);
    }
  }
}
