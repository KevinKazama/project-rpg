import { Character } from './Character';
import { Scenario, Choice, ScenarioConsequence } from './Scenario';
import { STORY_DATABASE } from './StoryDatabase';
import { getRandomMonster, getMonsterByType } from './Bestiary';
import { Monster } from './Monster';
import { getEquipmentLoot } from './Stuff';
import { Equipment } from './Stuff';

export class StoryManager {
  private currentScenarioId: string;
  private pendingScenarioId: string | null = null; // Scénario suivant après combat
  private player: Character;
  private onScenarioChange: (scenario: Scenario) => void;
  private onLog: (message: string) => void;
  private onCombatStart: (enemy: Monster) => void;

  constructor(
    player: Character,
    onScenarioChange: (scenario: Scenario) => void,
    onLog: (message: string) => void,
    onCombatStart: (enemy: Monster) => void
  ) {
    this.player = player;
    this.onScenarioChange = onScenarioChange;
    this.onLog = onLog;
    this.onCombatStart = onCombatStart;
    this.currentScenarioId = 'intro';
  }

  getCurrentScenario(): Scenario {
    return STORY_DATABASE[this.currentScenarioId];
  }

  makeChoice(choiceId: string): void {
    const scenario = this.getCurrentScenario();
    const choice = scenario.choices.find(c => c.id === choiceId);
    
    if (!choice) {
      console.error(`Choice ${choiceId} not found in scenario ${scenario.id}`);
      return;
    }

    const consequence = choice.consequence;
    if (!consequence) return;

    // 🎒 Gestion simplifiée grâce à la fonction centralisée
    if (consequence.type === 'reward' && consequence.itemReward) {
      const player = this.player;
      
      // On demande un loot ciblé sur l'ID de la récompense
      const uniqueItem = getEquipmentLoot(player.level, consequence.itemReward);

      if (uniqueItem) {
        const added = player.addItemToInventory(uniqueItem);

        if (added) {
          localStorage.setItem('rpg_player_bag', JSON.stringify(player.inventory.items));
          this.onLog(`🎁 **Butin obtenu** : Vous avez reçu **${uniqueItem.name}** !`);
        } else {
          this.onLog(`⚠️ **Sac plein !** Vous avez trouvé **${uniqueItem.name}** mais votre inventaire est complet.`);
        }
      }
    }

    // Vérifier si le choix est disponible (offrande avec objet requis)
    if (choice.consequence.type === 'offer' && !this.canMakeChoice(choice)) {
      this.onLog(`⚠️ **Impossible** : Vous n'avez pas l'objet requis.`);
      return;
    }

    this.applyConsequence(consequence);
  }

  canMakeChoice(choice: Choice): boolean {
    const consequence = choice.consequence;
    
    if (consequence.type === 'offer' && consequence.requiredItemType) {
      return this.hasRequiredItem(consequence.requiredItemType, consequence.requiredItemRarity);
    }
    
    return true;
  }

  private hasRequiredItem(itemType: string, rarity?: string): boolean {
    if (itemType === 'potion') {
      return this.player.inventory.items.some(item => item.type === 'potion');
    }
    
    if (itemType === 'weapon' || itemType === 'armor' || itemType === 'any') {
      const items = this.player.inventory.items;
      if (items.length === 0) return false;
      
      if (!rarity) return items.length > 0;
      
      return items.some(item => 
        (itemType === 'any' || item.type === itemType) && 
        item.rarity === rarity
      );
    }
    
    return false;
  }

  private consumeRequiredItem(itemType: string, rarity?: string): void {
    if (itemType === 'potion') {
      const potionIndex = this.player.inventory.items.findIndex(item => item.type === 'potion');
      if (potionIndex !== -1) {
        this.player.inventory.items.splice(potionIndex, 1);
        this.onLog(`🧪 **Offrande** : -1 Potion`);
      }
      return;
    }
    
    if (itemType === 'weapon' || itemType === 'armor' || itemType === 'any') {
      const items = this.player.inventory.items;
      const itemIndex = items.findIndex(item => 
        (itemType === 'any' || item.type === itemType) && 
        (!rarity || item.rarity === rarity)
      );
      
      if (itemIndex !== -1) {
        const removedItem = items.splice(itemIndex, 1)[0];
        this.onLog(`🎁 **Offrande** : ${removedItem.name} sacrifié.`);
      }
    }
  }

  private applyConsequence(consequence: ScenarioConsequence): void {
    switch (consequence.type) {
      case 'combat':
        this.handleCombat(consequence);
        break;
      case 'reward':
        this.handleReward(consequence);
        break;
      case 'damage':
        this.handleDamage(consequence);
        break;
      case 'heal':
        this.handleHeal(consequence);
        break;
      case 'story':
        this.handleStory(consequence);
        break;
      case 'death':
        this.handleDeath(consequence);
        break;
      case 'offer':
        this.handleOffer(consequence);
        break;
    }
  }

  private handleCombat(consequence: ScenarioConsequence): void {
    const enemyLevel = consequence.enemyLevel || 1;
    let enemy: Monster;
    
    if (consequence.enemyType) {
      enemy = getMonsterByType(consequence.enemyType, enemyLevel);
    } else {
      enemy = getRandomMonster(enemyLevel);
    }
    
    this.onLog(`⚔️ **COMBAT** : ${consequence.description}`);
    
    // Stocker le scénario suivant pour après le combat
    this.pendingScenarioId = consequence.nextScenarioId || 'intro';
    
    this.onCombatStart(enemy);
  }

  private handleReward(consequence: ScenarioConsequence): void {
    if (consequence.value) {
      this.player.xp += consequence.value;
      this.onLog(`✨ **Récompense** : +${consequence.value} XP`);
    }
    
    if (consequence.itemReward) {
      const loot = getEquipmentLoot(this.player.level);
      if (loot) {
        this.player.addItemToInventory(loot);
        this.onLog(`🎒 **Objet trouvé** : ${loot.name}`);
      }
    }
    
    if (consequence.description) {
      this.onLog(`📖 ${consequence.description}`);
    }
    
    this.transitionToNextScenario(consequence.nextScenarioId);
  }

  private handleDamage(consequence: ScenarioConsequence): void {
    const damage = consequence.value || 10;
    this.player.takeDamage(damage);
    this.onLog(`💔 **Dégâts** : -${damage} PV`);
    
    if (!this.player.isAlive()) {
      this.handleDeath(consequence);
      return;
    }
    
    if (consequence.description) {
      this.onLog(`📖 ${consequence.description}`);
    }
    
    this.transitionToNextScenario(consequence.nextScenarioId);
  }

  private handleHeal(consequence: ScenarioConsequence): void {
    const healAmount = consequence.value || 20;
    this.player.heal(healAmount);
    this.onLog(`💚 **Soin** : +${healAmount} PV`);
    
    if (consequence.description) {
      this.onLog(`📖 ${consequence.description}`);
    }
    
    this.transitionToNextScenario(consequence.nextScenarioId);
  }

  private handleStory(consequence: ScenarioConsequence): void {
    if (consequence.description) {
      this.onLog(`📖 ${consequence.description}`);
    }
    
    this.transitionToNextScenario(consequence.nextScenarioId);
  }

  private handleDeath(consequence: ScenarioConsequence): void {
    this.onLog(`💀 **MORT** : ${consequence.description || 'Votre voyage s\'arrête ici.'}`);
    this.triggerPermadeath();
  }

  private handleOffer(consequence: ScenarioConsequence): void {
    const itemType = consequence.requiredItemType || 'any';
    const rarity = consequence.requiredItemRarity;
    
    this.consumeRequiredItem(itemType, rarity);
    
    if (consequence.description) {
      this.onLog(`📖 ${consequence.description}`);
    }
    
    this.transitionToNextScenario(consequence.nextScenarioId);
  }

  private transitionToNextScenario(nextScenarioId?: string): void {
    if (nextScenarioId) {
      this.currentScenarioId = nextScenarioId;
      const nextScenario = this.getCurrentScenario();
      this.onScenarioChange(nextScenario);
    }
  }

  private triggerPermadeath(): void {
    // Réinitialisation complète du personnage
    localStorage.clear();
    this.player.resetCharacter();
    
    // Revenir au scénario d'introduction
    this.currentScenarioId = 'intro';
    setTimeout(() => {
      this.onScenarioChange(this.getCurrentScenario());
    }, 2000);
  }

  onCombatVictory(): void {
    console.log('[StoryManager] onCombatVictory appelé');
    
    // Utiliser le scénario suivant stocké
    if (this.pendingScenarioId) {
      console.log('[StoryManager] Passage au scénario suivant:', this.pendingScenarioId);
      this.currentScenarioId = this.pendingScenarioId;
      this.pendingScenarioId = null;
    }
    
    const scenario = this.getCurrentScenario();
    const currentChoice = scenario.choices.find(c => c.consequence.type === 'combat');
    
    if (currentChoice && currentChoice.consequence.xpReward) {
      this.player.xp += currentChoice.consequence.xpReward;
      this.onLog(`✨ **Victoire** : +${currentChoice.consequence.xpReward} XP`);
    }
    
    // Vérifier level up
    const xpResult = this.player.gainXp(0); // XP déjà ajouté
    if (xpResult.leveledUp) {
      this.onLog(`🆙 **LEVEL UP !** Niveau ${this.player.level} !`);
    }
    
    // Afficher le scénario suivant
    this.onScenarioChange(this.getCurrentScenario());
    console.log('[StoryManager] Scénario suivant affiché');
  }

  onCombatDefeat(): void {
    console.log('[StoryManager] onCombatDefeat appelé');
    this.currentScenarioId = 'death_combat';
    this.onScenarioChange(this.getCurrentScenario());
  }

  resetStory(): void {
    this.currentScenarioId = 'intro';
    this.onScenarioChange(this.getCurrentScenario());
  }

  usePotion(): boolean {
  const used = this.player.usePotion();
    if (used) {
      // Sauvegarder l'état du sac après utilisation
      localStorage.setItem('rpg_player_bag', JSON.stringify(this.player.inventory.items));
    }
    return used;
  }
}
