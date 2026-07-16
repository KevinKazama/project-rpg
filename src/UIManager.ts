import { CombatEngine } from './CombatEngine';
import { Move } from './Character';
import { getSkillForLevel } from './Skills';
import { Weapon } from './Stuff';
import { Scenario, Choice } from './Scenario';
import { StoryManager } from './StoryManager';

export class UIManager {
  private engine!: CombatEngine;
  private storyManager!: StoryManager;
  private currentScenario: Scenario | null = null;
  private isStoryMode: boolean = false;
  // 📚 Variable pour stocker l'historique complet des logs de la session active
  private logHistory: string[] = ["Le combat commence ! Choisissez une action."];

  init(engine: CombatEngine, onActionSelected: (move: Move) => void, storyManager: StoryManager) {
    this.engine = engine;
    this.storyManager = storyManager;
    
    // 1. On injecte la structure de base
    this.setupHTMLStructure();
    
    // 2. On configure les bonus
    this.setupBonusEvents();
    
    // 3. On démarre directement en mode histoire
    this.isStoryMode = true;
    this.currentScenario = storyManager.getCurrentScenario();
    
    // 4. On affiche le scénario et rafraîchit l'UI
    this.showScenario(this.currentScenario);
    this.updateUI();
  }

  private setupHTMLStructure() {
    const app = document.getElementById('app');
    if (!app) return;

    app.innerHTML = `
      <div style="font-family: sans-serif; max-width: 500px; margin: 20px auto; border: 2px solid #333; padding: 20px; border-radius: 8px; background: #f9f9f9; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
        <!-- Zone Infos Joueur -->
        <div style="margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #ddd; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <strong id="p-level" style="color: #2196F3; font-size: 16px;">Niveau 1</strong>
            <div id="p-stats" style="font-size: 11px; color: #555; margin-top: 2px;">
              <span id="player-display-atk">ATK: 10</span> | <span id="player-display-def">DEF: 0</span>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 12px; color: #666;">XP:</span>
            <div style="width: 120px; background: #eee; height: 8px; border-radius: 4px; overflow: hidden; border: 1px solid #ccc;">
              <div id="p-xp-bar" style="width: 0%; background: #2196F3; height: 100%; transition: width 0.3s;"></div>
            </div>
            <span id="p-xp-text" style="font-size: 12px; color: #666; min-width: 50px;">0/100</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 2px; text-align: right;">
            <div>
              <span id="player-weapon" style="font-size: 12px; color: #666; cursor: help;">⚔️ À mains nues</span>
            </div>
            <div>
              <span id="player-armor" style="font-size: 12px; color: #666; cursor: help;">🛡️ Vêtements de civil</span>
            </div>
          </div>
        </div> 

        <!-- ================= Espace de travail central (Combat ou Scénario) ================= -->
        <div id="game-workspace"></div>

        <!-- Sac à dos (Toujours visible) -->
        <div id="bag-container" style="margin-top: 15px; background: #ECEFF1; border: 1px solid #B0BEC5; padding: 12px; border-radius: 6px;">
          <h4 style="margin: 0 0 8px 0; color: #37474F; display: flex; justify-content: space-between;">
            <span>🎒 Contenu du Sac à dos</span>
            <span id="bag-slots" style="font-size: 11px; color: #78909C;">0 objet</span>
          </h4>
          <div id="bag-items-list" style="max-height: 150px; overflow-y: auto; display: flex; flex-direction: column; gap: 6px;">
            <span style="font-size: 12px; color: #90A4AE; font-style: italic;">Votre sac est vide d'équipements...</span>
          </div>
        </div>
        
        <!-- Outils Dev / Reset -->
        <button id="reset-btn" style="margin-top: 25px; width: 100%; background: transparent; border: 1px dashed #aaa; color: #888; padding: 5px; cursor: pointer; font-size: 11px;">
          🔄 Réinitialiser la sauvegarde (Niv. 1)
        </button>
      </div>
    `;

    // Reset du LocalStorage
    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
      resetBtn.onclick = () => {
        localStorage.clear();
        localStorage.setItem('rpg_player_level', '1');
        localStorage.setItem('rpg_player_xp', '0');
        localStorage.setItem('rpg_player_base_hp', '100');
        localStorage.setItem('rpg_player_base_atk', '10');
        localStorage.removeItem('rpg_player_weapon');
        localStorage.removeItem('rpg_player_armor');
        localStorage.removeItem('rpg_player_moves');
        localStorage.removeItem('rpg_player_bag');
        window.location.reload();
      };
    }
  }

  private setupBonusEvents() {
    const hpBtn = document.getElementById('bonus-hp-btn');
    const atkBtn = document.getElementById('bonus-atk-btn');
    const skillBtn = document.getElementById('bonus-skill-btn');

    if (hpBtn) {
      hpBtn.onclick = () => {
        this.engine.player.applyHpBonus();
        this.selectBonusFinished("En route pour la vitalité ! +25 PV Max.");
      };
    }

    if (atkBtn) {
      atkBtn.onclick = () => {
        this.engine.player.applyAttackBonus();
        this.selectBonusFinished("La force brute augmente ! +5 Attaque.");
      };
    }

    if (skillBtn) {
      skillBtn.onclick = () => {
        const nextSkill = getSkillForLevel(this.engine.player.level);
        if (nextSkill) {
          this.engine.player.learnMove(nextSkill);
          localStorage.setItem('rpg_player_moves', JSON.stringify(this.engine.player.moves));
          this.renderButtons((move) => this.engine.executeRound(move));
          this.selectBonusFinished(`Nouveau sort appris : ${nextSkill.name} !`);
        }
      };
    }
  }

  private selectBonusFinished(logMessage: string) {
    this.engine.isChoosingBonus = false;
    this.addLog(`✨ **Bonus choisi** : ${logMessage}`);
    
    localStorage.setItem('rpg_player_base_hp', this.engine.player.baseMaxHp.toString());
    localStorage.setItem('rpg_player_base_atk', this.engine.player.baseAttack.toString());

    this.updateUI();
  }

  renderButtons(onActionSelected: (move: Move) => void) {
    const container = document.getElementById('actions-container');
    if (!container) return;

    container.innerHTML = '';
    this.engine.player.moves.forEach(move => {
      const btn = document.createElement('button');
      btn.textContent = move.name;
      btn.style.padding = '12px';
      btn.style.cursor = 'pointer';
      btn.style.fontWeight = 'bold';
      container.appendChild(btn);
      btn.onclick = () => onActionSelected(move);
    });
  }

  updateUI() {
    const workspace = document.getElementById('game-workspace');
    if (!workspace) return;

    // Si on est en mode histoire, on bloque l'affichage de combat et on s'assure que l'histoire est là
    if (this.isStoryMode) {
      this.updateBagUI();
      if (this.currentScenario && !document.getElementById('scenario-panel')) {
        this.showScenario(this.currentScenario);
      }
      return;
    }

    // 1. Injection de la scène de combat si absente du DOM
    if (!document.getElementById('p-bar')) {
      workspace.innerHTML = `
        <!-- Zone Combat -->
        <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
          <div>
            <h3 id="p-name" style="margin: 0 0 5px 0;">Joueur</h3>
            <div style="width: 150px; background: #ddd; height: 15px; border-radius: 10px; overflow: hidden;">
              <div id="p-bar" style="width: 100%; background: #4CAF50; height: 100%; transition: width 0.3s;"></div>
            </div>
            <span id="p-hp">100/100 PV</span>
          </div>
          <div style="text-align: right;">
            <h3 id="e-name" style="margin: 0 0 5px 0;">Adversaire</h3>
            <span style="font-size: 12px; color: #f44336; font-weight: bold;">Niv. <span id="e-level">1</span></span>
            <div style="width: 150px; background: #ddd; height: 15px; border-radius: 10px; overflow: hidden; margin-top: 5px;">
              <div id="e-bar" style="width: 100%; background: #4CAF50; height: 100%; transition: width 0.3s;"></div>
            </div>
            <span id="e-hp">100/100 PV</span>
          </div>
        </div>

        <!-- Journal de combat (Restauré à partir de l'historique) -->
        <div id="journal" style="height: 120px; overflow-y: auto; background: #222; color: #fff; padding: 10px; font-size: 14px; border-radius: 4px; margin-bottom: 20px; line-height: 1.4;">
          ${this.logHistory.join('<br>')}
        </div>

        <!-- Panneau d'actions de Combat -->
        <div id="actions-container" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;"></div>
        
        <!-- Panneau Choix de Bonus -->
        <div id="bonus-container" style="display: none; background: #FFF3E0; border: 1px solid #FFB74D; padding: 15px; border-radius: 6px; text-align: center; margin-top: 10px;">
          <h4 style="margin: 0 0 10px 0; color: #E65100;">🎉 BONUS DE LEVEL UP ! 🎉</h4>
          <p style="font-size: 13px; margin: 0 0 15px 0; color: #555;">Choisissez une amélioration permanente :</p>
          <div style="display: flex; gap: 10px;">
            <button id="bonus-hp-btn" style="flex: 1; padding: 10px; background: #E65100; color: white; border: none; border-radius: 4px; font-weight: bold; cursor: pointer;">❤️ Vitalité (+25 PV Max)</button>
            <button id="bonus-atk-btn" style="flex: 1; padding: 10px; background: #E65100; color: white; border: none; border-radius: 4px; font-weight: bold; cursor: pointer;">⚔️ Force (+5 Attaque)</button>
          </div>
          <button id="bonus-skill-btn" style="display: none; padding: 12px; background: #2196F3; color: white; border: none; border-radius: 4px; font-weight: bold; cursor: pointer; font-size: 14px; margin-top: 10px; width: 100%;">📖 Apprendre un nouveau sort</button>
        </div>

        <!-- Bouton Prochain Match -->
        <button id="next-combat-btn" style="display: none; width: 100%; padding: 15px; background: #4CAF50; color: white; border: none; border-radius: 4px; font-weight: bold; font-size: 16px; cursor: pointer; margin-top: 10px;">
          ⚔️ Commencer un Nouveau Combat
        </button>
      `;

      // Liaison des événements
      this.setupBonusEvents();
      
      const nextBtn = document.getElementById('next-combat-btn');
      if (nextBtn) {
        nextBtn.onclick = () => this.engine.startNewCombat();
      }
      
      this.renderButtons((move) => this.engine.executeRound(move));

      // Auto-scroll du journal vers le bas à l'apparition de l'UI de combat
      const journal = document.getElementById('journal');
      if (journal) journal.scrollTop = journal.scrollHeight;
    }

    // --- MISE À JOUR DES VALEURS DU COMBAT ---
    const pBar = document.getElementById('p-bar') as HTMLElement;
    const eBar = document.getElementById('e-bar') as HTMLElement;
    const pHp = document.getElementById('p-hp') as HTMLElement;
    const eHp = document.getElementById('e-hp') as HTMLElement;
    const pLevel = document.getElementById('p-level') as HTMLElement;
    const eLevel = document.getElementById('e-level') as HTMLElement;
    const pXpBar = document.getElementById('p-xp-bar') as HTMLElement;
    const pXpText = document.getElementById('p-xp-text') as HTMLElement;
    const pStatsText = document.getElementById('p-stats') as HTMLElement;
    
    const nextCombatBtn = document.getElementById('next-combat-btn') as HTMLElement;
    const actionsContainer = document.getElementById('actions-container') as HTMLElement;
    const bonusContainer = document.getElementById('bonus-container') as HTMLElement;

    const baseAtk = this.engine.player.baseAttack;
    const baseDef = this.engine.player.baseDefense;
    const weaponBonus = this.engine.player.equippedWeapon ? this.engine.player.equippedWeapon.bonusAtk : 0;
    const defenseBonus = this.engine.player.equippedArmor ? this.engine.player.equippedArmor.bonusDef : 0;

    document.getElementById('p-name')!.textContent = this.engine.player.name;
    document.getElementById('e-name')!.textContent = this.engine.enemy.name;
    pLevel.textContent = `⭐ Niveau ${this.engine.player.level}`;
    pStatsText.textContent = `ATK: ${baseAtk + weaponBonus} | DEF: ${baseDef + defenseBonus} | PV Max: ${this.engine.player.maxHp}`;

    const pWeaponText = document.getElementById('player-weapon')!;
    if (this.engine.player.equippedWeapon) {
      const weapon = this.engine.player.equippedWeapon;
      pWeaponText.textContent = `⚔️ ${weapon.name} [${weapon.rarity.toUpperCase()}]`;
      pWeaponText.title = weapon.description;
    } else { 
      pWeaponText.textContent = `✋ À mains nues`; 
    }

    const pArmorText = document.getElementById('player-armor')!;
    if (this.engine.player.equippedArmor) {
      const armor = this.engine.player.equippedArmor;
      pArmorText.textContent = `🛡️ ${armor.name} [${armor.rarity.toUpperCase()}]`;
      pArmorText.title = armor.description;
    } else { 
      pArmorText.textContent = `🛡️ Vêtements de civil`; 
    }

    eLevel.textContent = this.engine.enemy.level.toString();

    const xpNeeded = this.engine.player.getXpNeededForNextLevel();
    pXpBar.style.width = `${(this.engine.player.xp / xpNeeded) * 100}%`;
    pXpText.textContent = `${this.engine.player.xp}/${xpNeeded}`;

    const pPct = (this.engine.player.hp / this.engine.player.maxHp) * 100;
    const ePct = (this.engine.enemy.hp / this.engine.enemy.maxHp) * 100;
    pBar.style.width = `${pPct}%`;
    eBar.style.width = `${ePct}%`;
    
    pHp.textContent = `${this.engine.player.hp}/${this.engine.player.maxHp} PV`;
    eHp.textContent = `${this.engine.enemy.hp}/${this.engine.enemy.maxHp} PV`;

// --- GESTION DES PANNEAUX ET DES BOUTONS DE TRANSITION ---
    if (this.engine.player.isAlive() && this.engine.enemy.isAlive()) {
      // Le combat est en cours : on affiche les actions de combat standard
      actionsContainer.style.display = 'grid';
      bonusContainer.style.display = 'none';
      nextCombatBtn.style.display = 'none';
    } else {
      // LE COMBAT EST TERMINÉ
      actionsContainer.style.display = 'none';
      
      if (this.engine.isChoosingBonus) {
        // Option A : Le joueur vient de monter de niveau et doit choisir un bonus
        bonusContainer.style.display = 'block';
        nextCombatBtn.style.display = 'none';
        const availableSkill = getSkillForLevel(this.engine.player.level);
        const skillBtn = document.getElementById('bonus-skill-btn') as HTMLElement;
        if (availableSkill) {
          skillBtn.style.display = 'block';
          skillBtn.textContent = `📖 Apprendre ${availableSkill.name} (Dégâts: ${availableSkill.damage})`;
        } else {
          skillBtn.style.display = 'none';
        }
      } else {
        // Option B : Écran intermédiaire de fin de combat (Victoire ou Défaite)
        bonusContainer.style.display = 'none';
        nextCombatBtn.style.display = 'block';
        
        if (this.engine.player.isAlive()) {
          // Cas de Victoire : On affiche un écran de transition propre
          nextCombatBtn.textContent = "➡️ Continuer l'aventure";
          nextCombatBtn.style.background = "#2196F3"; // Bleu d'aventure
          
          // On modifie temporairement le titre ou le journal pour marquer la transition
          const journal = document.getElementById('journal');
          if (journal && !journal.innerHTML.includes("🎉 VICTOIRE")) {
            this.addLog(`🎉 **VICTOIRE !** Vous avez vaincu ${this.engine.enemy.name}.`);
            this.addLog(`⭐ Niveau actuel : **Niv. ${this.engine.player.level}** (${this.engine.player.xp}/${xpNeeded} XP)`);
          }

          nextCombatBtn.onclick = () => {
            // C'est seulement au clic sur "Continuer" qu'on passe à l'histoire suivante
            const nextScenario = this.storyManager.getCurrentScenario();
            this.showScenario(nextScenario);
            this.updateUI();
          };
        } else {
          // Cas de Défaite
          nextCombatBtn.textContent = "💀 Recommencer (Retour au dernier point)";
          nextCombatBtn.style.background = "#F44336"; // Rouge défaite
          nextCombatBtn.onclick = () => {
            // Logique de défaite / reset de combat
            this.engine.startNewCombat();
          };
        }
      }
    }

    this.updateBagUI();
  }

  private updateBagUI() {
    const bagSlots = document.getElementById('bag-slots')!;
    const bagItemsList = document.getElementById('bag-items-list')!;
    if (!bagSlots || !bagItemsList) return;

    const player = this.engine.player;
    const items = player.inventory.items;

    bagSlots.textContent = `${items.length} / ${player.MAX_BAG_SLOTS} objet${items.length > 1 ? 's' : ''}`;
    if (items.length >= player.MAX_BAG_SLOTS) {
      bagSlots.style.color = '#D32F2F';
      bagSlots.style.fontWeight = 'bold';
    } else {
      bagSlots.style.color = '#78909C';
      bagSlots.style.fontWeight = 'normal';
    }

    if (items.length === 0) {
      bagItemsList.innerHTML = `<span style="font-size: 12px; color: #90A4AE; font-style: italic; text-align: center; padding: 5px;">Votre sac est vide d'équipements...</span>`;
    } else {
      bagItemsList.innerHTML = ''; 
      items.forEach((item) => {
        const itemDiv = document.createElement('div');
        itemDiv.style.cssText = "display: flex; justify-content: space-between; align-items: center; background: white; padding: 6px 10px; border-radius: 4px; border-left: 4px solid #888; font-size: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);";
        
        if (item.rarity === 'rare') itemDiv.style.borderLeftColor = '#2196F3';
        if (item.rarity === 'epic') itemDiv.style.borderLeftColor = '#9C27B0';
        if (item.rarity === 'legendary') itemDiv.style.borderLeftColor = '#FF9800';

        let bonusText = '';
        if (item.type === 'weapon') bonusText = `+${item.bonusAtk} ATK`;
        else if (item.type === 'armor') bonusText = `+${item.bonusDef} DEF`;
        else if (item.type === 'potion') bonusText = `+${item.healAmount} PV`;

        const infoSpan = document.createElement('span');
        infoSpan.innerHTML = `<strong>${item.name}</strong> <span style="color:#666; font-size:10px;">(${bonusText})</span>`;
        infoSpan.title = item.description;
        itemDiv.appendChild(infoSpan);

        const actionGroup = document.createElement('div');
        actionGroup.style.cssText = "display: flex; gap: 4px;";

        const mainActionBtn = document.createElement('button');
        mainActionBtn.style.cssText = "padding: 3px 8px; color: white; border: none; border-radius: 3px; font-size: 11px; cursor: pointer; font-weight: bold;";

        if (item.type === 'potion') {
          mainActionBtn.textContent = "Boire";
          mainActionBtn.style.background = "#9C27B0";
          mainActionBtn.onclick = () => {
            if (this.isStoryMode) {
              if (this.storyManager.usePotion()) {
                this.addLog(`🧪 Vous buvez **${item.name}** depuis votre sac et récupérez des PV !`);
                this.updateUI();
                if (this.currentScenario) this.showScenario(this.currentScenario);
              } else {
                this.addLog(`⚠️ Impossible d'utiliser la potion (PV déjà au max).`);
              }
            } else {
              if (player.isAlive() && this.engine.enemy.isAlive()) {
                this.engine.executePotionTurn();
              } else {
                if (player.usePotion()) {
                  localStorage.setItem('rpg_player_bag', JSON.stringify(player.inventory.items));
                  this.engine.onLogCallback(`🧪 Vous buvez **${item.name}** depuis votre sac et récupérez des PV !`);
                  this.updateUI();
                } else {
                  this.engine.onLogCallback(`⚠️ Impossible de boire la potion (PV déjà au max).`);
                }
              }
            }
          };
        } else {
          mainActionBtn.textContent = "Équiper";
          mainActionBtn.style.background = "#37474F";
          mainActionBtn.onclick = () => {
            if (item.type === 'weapon') {
              player.equipWeaponFromBag(item.id);
              localStorage.setItem('rpg_player_weapon', JSON.stringify(player.equippedWeapon));
            } else if (item.type === 'armor') {
              player.equipArmorFromBag(item.id);
              localStorage.setItem('rpg_player_armor', JSON.stringify(player.equippedArmor));
            }
            localStorage.setItem('rpg_player_bag', JSON.stringify(player.inventory.items));
            this.engine.onLogCallback(`🔧 Vous avez équipé : **${item.name}**`);
            this.updateUI();
          };
        }

        actionGroup.appendChild(mainActionBtn);

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = "🗑️";
        deleteBtn.style.cssText = "padding: 3px 6px; background: #EF5350; color: white; border: none; border-radius: 3px; font-size: 11px; cursor: pointer;";
        deleteBtn.onclick = () => {
          if (confirm(`Voulez-vous vraiment jeter votre "${item.name}" ?`)) {
            player.removeItemFromBag(item.id);
            localStorage.setItem('rpg_player_bag', JSON.stringify(player.inventory.items));
            this.engine.onLogCallback(`🗑️ Objet détruit : **${item.name}**`);
            this.updateUI();
          }
        };
        actionGroup.appendChild(deleteBtn);

        itemDiv.appendChild(actionGroup);
        bagItemsList.appendChild(itemDiv);
      });
    }
  }

  addLog(message: string) {
    // 💾 On pousse le log dans notre tableau historique
    this.logHistory.push(message);

    const journal = document.getElementById('journal');
    if (!journal) return;
    journal.innerHTML += `<br>${message}`;
    journal.scrollTop = journal.scrollHeight;
  }

  showScenario(scenario: Scenario) {
    this.currentScenario = scenario;
    this.isStoryMode = true;
    
    const workspace = document.getElementById('game-workspace');
    if (!workspace) return;
    
    const isDeathScenario = scenario.id.includes('death') || scenario.title.includes('💀');
    //const hasPotion = this.engine.player.inventory.items.some(item => item.type === 'potion');
    
    workspace.innerHTML = `
      <div id="scenario-panel" style="${isDeathScenario ? 'background: #FFEBEE; border: 2px solid #D32F2F;' : 'background: #E3F2FD; border: 2px solid #2196F3;'} padding: 15px; border-radius: 8px; margin-bottom: 15px;">
        <h3 style="margin: 0 0 10px 0; color: ${isDeathScenario ? '#D32F2F' : '#1565C0'};">📖 ${scenario.title}</h3>
        <p style="margin: 0 0 15px 0; color: #424242; line-height: 1.5; font-size: 14px;">${scenario.description}</p>
        
        <div id="scenario-choices" style="display: flex; flex-direction: column; gap: 8px;"></div>
      </div>
    `;

const choicesContainer = document.getElementById('scenario-choices')!;
    scenario.choices.forEach(choice => {
      const choiceBtn = document.createElement('button');
      choiceBtn.textContent = choice.text;
      const canMakeChoice = this.storyManager.canMakeChoice(choice);
      
      if (isDeathScenario) {
        choiceBtn.style.cssText = 'padding: 12px; background: #D32F2F; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 14px;';
        choiceBtn.onmouseover = () => choiceBtn.style.background = '#B71C1C';
        choiceBtn.onmouseout = () => choiceBtn.style.background = '#D32F2F';
      } else {
        if (!canMakeChoice) {
          choiceBtn.style.cssText = 'padding: 10px; background: #E0E0E0; color: #9E9E9E; border: 1px dashed #BDBDBD; border-radius: 4px; font-weight: bold; cursor: not-allowed; text-align: left;';
        } else {
          choiceBtn.style.cssText = 'padding: 10px; background: #2196F3; color: white; border: none; border-radius: 4px; font-weight: bold; cursor: pointer; text-align: left; transition: 0.2s;';
          choiceBtn.onmouseover = () => choiceBtn.style.background = '#1976D2';
          choiceBtn.onmouseout = () => choiceBtn.style.background = '#2196F3';
        }
      }
      
      if (canMakeChoice) {
        // --- MODIFICATION ICI ---
        choiceBtn.onclick = () => {
          // 1. On applique le choix (ce qui distribue le loot dans StoryManager)
          this.storyManager.makeChoice(choice.id);
          
          // 2. On récupère le nouveau scénario généré
          const nextScenario = this.storyManager.getCurrentScenario();
          
          // 3. On l'affiche à l'écran
          this.showScenario(nextScenario);
          
          // 4. On rafraîchit toute l'interface (ce qui met à jour le sac à dos visuellement)
          this.updateUI();
        };
      }
      choicesContainer.appendChild(choiceBtn);
    });
    
    this.addLog(`📖 **${scenario.title}** : ${scenario.description}`);
  }

  hideScenario() {
    this.isStoryMode = false;
    // ⚡ On force un rafraîchissement immédiat de l'UI pour ré-injecter la scène de combat
    this.updateUI();
  }
}