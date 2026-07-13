import { Character } from './Character';
import { Scenario, Choice, ScenarioConsequence } from './Scenario';
import { STORY_DATABASE } from './StoryDatabase';
import { getRandomMonster, getMonsterByType } from './Bestiary';
import { Monster } from './Monster';
import { getRandomEquipmentLoot } from './Stuff';

export class StoryManager {
  private currentScenarioId: string;
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

    this.applyConsequence(choice.consequence);
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
    this.onCombatStart(enemy);
    
    // Note: Le scénario suivant sera déterminé après le combat
    this.currentScenarioId = consequence.nextScenarioId || 'intro';
  }

  private handleReward(consequence: ScenarioConsequence): void {
    if (consequence.value) {
      this.player.xp += consequence.value;
      this.onLog(`✨ **Récompense** : +${consequence.value} XP`);
    }
    
    if (consequence.itemReward) {
      const loot = getRandomEquipmentLoot(this.player.level);
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
    
    // Transition au scénario suivant
    this.transitionToNextScenario(currentChoice?.consequence.nextScenarioId);
  }

  onCombatDefeat(): void {
    this.currentScenarioId = 'death_combat';
    this.onScenarioChange(this.getCurrentScenario());
  }

  resetStory(): void {
    this.currentScenarioId = 'intro';
    this.onScenarioChange(this.getCurrentScenario());
  }
}
