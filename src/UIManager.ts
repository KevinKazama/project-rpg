import { CombatEngine } from './CombatEngine';
import { Move } from './Character';
import { getSkillForLevel } from './Skills';
import { Weapon } from './Stuff';

export class UIManager {
  private engine!: CombatEngine;

  init(engine: CombatEngine, onActionSelected: (move: Move) => void) {
    this.engine = engine;
    this.setupHTMLStructure();
    this.renderButtons(onActionSelected);
    this.setupBonusEvents();
    this.updateUI();
  }

  private setupHTMLStructure() {
    const app = document.getElementById('app');
    if (!app) return;

    app.innerHTML = `
      <div style="font-family: sans-serif; max-width: 500px; margin: 20px auto; border: 2px solid #333; padding: 20px; border-radius: 8px; background: #f9f9f9;">
        <!-- Zone Infos Joueur -->
        <div style="margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #ddd; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <strong id="p-level" style="color: #2196F3; font-size: 16px;">Niveau 1</strong>
            <!-- ⚔️ On garde l'ID existant ou on utilise le nouveau pour ATK + DEF -->
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
          <!-- 🛡️ Zone Équipements (Arme + Armure alignées verticalement) -->
          <div style="display: flex; flex-direction: column; gap: 2px; text-align: right;">
            <div>
              <span id="player-weapon" style="font-size: 12px; color: #666; cursor: help;">⚔️ À mains nues</span>
            </div>
            <div>
              <span id="player-armor" style="font-size: 12px; color: #666; cursor: help;">🛡️ Vêtements de civil</span>
            </div>
          </div>
        </div> 

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

        <!-- Journal de combat -->
        <div id="journal" style="height: 120px; overflow-y: auto; background: #222; color: #fff; padding: 10px; font-size: 14px; border-radius: 4px; margin-bottom: 20px; line-height: 1.4;">
          Le combat commence ! Choisissez une action.
        </div>

        <!-- Panneau 1 : Boutons d'actions classiques -->
        <div id="actions-container" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;"></div>
        <div id="inventory-container" style="margin-top: 10px;">
          <button id="use-potion-btn" style="width: 100%; padding: 10px; background: #9C27B0; color: white; border: none; border-radius: 4px; font-weight: bold; cursor: pointer;">
            🎒 Utiliser Sac : Potion (Stock: <span id="potion-count">0</span>)
          </button>
        </div>
        <div id="bag-container" style="margin-top: 15px; background: #ECEFF1; border: 1px solid #B0BEC5; padding: 12px; border-radius: 6px;">
          <h4 style="margin: 0 0 8px 0; color: #37474F; display: flex; justify-content: space-between;">
            <span>🎒 Contenu du Sac à dos</span>
            <span id="bag-slots" style="font-size: 11px; color: #78909C;">0 objet</span>
          </h4>
          <!-- Liste dynamique des équipements stockés -->
          <div id="bag-items-list" style="max-height: 150px; overflow-y: auto; display: flex; flex-direction: column; gap: 6px;">
            <span style="font-size: 12px; color: #90A4AE; font-style: italic;">Votre sac est vide d'équipements...</span>
          </div>
        </div>
        
        <!-- Panneau 2 : Choix du Bonus (Caché par défaut) -->
        <div id="bonus-container" style="display: none; background: #FFF3E0; border: 1px solid #FFB74D; padding: 15px; border-radius: 6px; text-align: center; margin-top: 10px;">
          <h4 style="margin: 0 0 10px 0; color: #E65100;">🎉 BONUS DE LEVEL UP ! 🎉</h4>
          <p style="font-size: 13px; margin: 0 0 15px 0; color: #555;">Choisissez une amélioration permanente :</p>
          <div style="display: flex; gap: 10px;">
            <button id="bonus-hp-btn" style="flex: 1; padding: 10px; background: #E65100; color: white; border: none; border-radius: 4px; font-weight: bold; cursor: pointer;">❤️ Vitalité (+25 PV Max)</button>
            <button id="bonus-atk-btn" style="flex: 1; padding: 10px; background: #E65100; color: white; border: none; border-radius: 4px; font-weight: bold; cursor: pointer;">⚔️ Force (+5 Attaque)</button>
          </div>
          <button id="bonus-skill-btn" style="display: none; padding: 12px; background: #2196F3; color: white; border: none; border-radius: 4px; font-weight: bold; cursor: pointer; font-size: 14px;">📖 Apprendre un nouveau sort</button>
        </div>
        <!-- Panneau 3 : Bouton Prochain Match -->
        <button id="next-combat-btn" style="display: none; width: 100%; padding: 15px; background: #4CAF50; color: white; border: none; border-radius: 4px; font-weight: bold; font-size: 16px; cursor: pointer; margin-top: 10px;">
          ⚔️ Commencer un Nouveau Combat
        </button>

        <!-- Outils Dev / Reset -->
        <button id="reset-btn" style="margin-top: 25px; width: 100%; background: transparent; border: 1px dashed #aaa; color: #888; padding: 5px; cursor: pointer; font-size: 11px;">
          🔄 Réinitialiser la sauvegarde (Niv. 1)
        </button>
      </div>
    `;

    document.getElementById('reset-btn')!.onclick = () => {
      localStorage.clear();
      localStorage.setItem('rpg_player_level', '1');
      localStorage.setItem('rpg_player_xp', '0');
      localStorage.setItem('rpg_player_potions', '2');
      localStorage.setItem('rpg_player_base_hp', '100');
      localStorage.setItem('rpg_player_base_atk', '10');
      localStorage.removeItem('rpg_player_weapon'); // Supprime l'arme
      localStorage.removeItem('rpg_player_armor'); // Supprime l'armure
      localStorage.removeItem('rpg_player_moves');
      localStorage.removeItem('rpg_player_bag');
      window.location.reload();
    };

    document.getElementById('next-combat-btn')!.onclick = () => {
      this.engine.startNewCombat();
    };

    document.getElementById('use-potion-btn')!.onclick = () => {
      if (this.engine.player.isAlive() && this.engine.enemy.isAlive()) {
        this.engine.executePotionTurn();
      }
    };

  }



  // Connecte les clics des boutons de bonus aux fonctions de statistiques
  private setupBonusEvents() {
    document.getElementById('bonus-hp-btn')!.onclick = () => {
      this.engine.player.applyHpBonus();
      this.selectBonusFinished("En route pour la vitalité ! +25 PV Max.");
    };

    document.getElementById('bonus-atk-btn')!.onclick = () => {
      this.engine.player.applyAttackBonus();
      this.selectBonusFinished("La force brute augmente ! +5 Attaque.");
    };

    const skillBtn = document.getElementById('bonus-skill-btn')!;
    skillBtn.onclick = () => {
      const nextSkill = getSkillForLevel(this.engine.player.level);
      if (nextSkill) {
        this.engine.player.learnMove(nextSkill);

        // Sauvegarde de la nouvelle liste d'attaques sous forme de texte JSON
        localStorage.setItem('rpg_player_moves', JSON.stringify(this.engine.player.moves));

        this.renderButtons((move) => this.engine.executeRound(move)); // Recrée les boutons de combat avec la nouvelle attaque
        this.selectBonusFinished(`Nouveau sort appris : ${nextSkill.name} !`);
      }
    };
  }

  // Clôture le choix de bonus et repasse la main au bouton de combat suivant
  private selectBonusFinished(logMessage: string) {
    this.engine.isChoosingBonus = false;
    this.addLog(`✨ **Bonus choisi** : ${logMessage}`);
    
    // On re-sauvegarde le changement de statistiques
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

    // Mise à jour des textes basiques
    document.getElementById('p-name')!.textContent = this.engine.player.name;
    document.getElementById('e-name')!.textContent = this.engine.enemy.name;
    pLevel.textContent = `⭐ Niveau ${this.engine.player.level}`;
    pStatsText.textContent = `ATK: ${baseAtk + weaponBonus} | DEF: ${baseDef + defenseBonus} | PV Max: ${this.engine.player.maxHp}`;

    const pWeaponText = document.getElementById('p-weapon')!;
    
    if (pWeaponText) {
      if (this.engine.player.equippedWeapon) {
        const weapon = this.engine.player.equippedWeapon;
        pWeaponText.textContent = `⚔️ ${weapon.name} [${weapon.rarity.toUpperCase()}]`;
        pWeaponText.title = weapon.description;
      } else {
        pWeaponText.textContent = `✋ À mains nues`;
        pWeaponText.title = "Vous n'avez pas d'arme équipée.";
      }
    }

    const pArmorText = document.getElementById('player-armor')!;
    
    if (pArmorText) {
      if (this.engine.player.equippedArmor) {
        const armor = this.engine.player.equippedArmor;
        pArmorText.textContent = `🛡️ ${armor.name} [${armor.rarity.toUpperCase()}]`;
        pArmorText.title = armor.description;
      } else {
        pArmorText.textContent = `🛡️ Vêtements de civil`;
        pArmorText.title = "Vous n'avez pas d'armure équipée.";
      }
    }

    eLevel.textContent = this.engine.enemy.level.toString();

    // Calculs de l'XP
    const xpNeeded = this.engine.player.getXpNeededForNextLevel();
    pXpBar.style.width = `${(this.engine.player.xp / xpNeeded) * 100}%`;
    pXpText.textContent = `${this.engine.player.xp}/${xpNeeded}`;

    // Calculs des PV
    const pPct = (this.engine.player.hp / this.engine.player.maxHp) * 100;
    const ePct = (this.engine.enemy.hp / this.engine.enemy.maxHp) * 100;
    pBar.style.width = `${pPct}%`;
    eBar.style.width = `${ePct}%`;
    
    pHp.textContent = `${this.engine.player.hp}/${this.engine.player.maxHp} PV`;
    eHp.textContent = `${this.engine.enemy.hp}/${this.engine.enemy.maxHp} PV`;

    // Met à jour le compteur de potions
    const potionCountSpan = document.getElementById('potion-count')!;
    const invContainer = document.getElementById('inventory-container')!;
    potionCountSpan.textContent = this.engine.player.inventory.potions.toString();


    // 🔀 LOGIQUE D'AFFICHAGE DES PANNEAUX
    if (this.engine.player.isAlive() && this.engine.enemy.isAlive()) {
      // 1. Le combat est en cours
      actionsContainer.style.display = 'grid';
      invContainer.style.display = 'block';
      bonusContainer.style.display = 'none';
      nextCombatBtn.style.display = 'none';
    } else {
      // 2. Quelqu'un est K.O. : on coupe toujours les boutons d'attaques
      actionsContainer.style.display = 'none';
      invContainer.style.display = 'none';

      if (this.engine.isChoosingBonus) {
        // En attente d'un choix de niveau : on affiche uniquement le panneau orange
        bonusContainer.style.display = 'block';
        nextCombatBtn.style.display = 'none';

        // Regarde si le niveau débloque une compétence
        const availableSkill = getSkillForLevel(this.engine.player.level);
        const skillBtn = document.getElementById('bonus-skill-btn') as HTMLElement;
        
        if (availableSkill) {
          skillBtn.style.display = 'block';
          skillBtn.textContent = `📖 Apprendre ${availableSkill.name} (Dégâts: ${availableSkill.damage})`;
        } else {
          skillBtn.style.display = 'none';
        }
      } else {
        // Pas de bonus en attente (ou bonus déjà choisi) : on montre le bouton vert du match suivant !
        bonusContainer.style.display = 'none';
        nextCombatBtn.style.display = 'block';
      }
    }

    // --- GESTION ET RENDU DU SAC À DOS ---
    const bagSlots = document.getElementById('bag-slots')!;
    const bagItemsList = document.getElementById('bag-items-list')!;
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
        if (item.type === 'weapon') {
          bonusText = `+${item.bonusAtk} ATK`;
        } else if (item.type === 'armor') {
          bonusText = `+${item.bonusDef} DEF`;
        }

        const infoSpan = document.createElement('span');
        infoSpan.innerHTML = `<strong>${item.name}</strong> <span style="color:#666; font-size:10px;">(${bonusText})</span>`;
        infoSpan.title = item.description;
        itemDiv.appendChild(infoSpan);

        // Conteneur pour grouper nos deux boutons à droite
        const actionGroup = document.createElement('div');
        actionGroup.style.cssText = "display: flex; gap: 4px;";

        // ⚔️ 1. Bouton Équiper
        const equipBtn = document.createElement('button');
        equipBtn.textContent = "Équiper";
        equipBtn.style.cssText = "padding: 3px 8px; background: #37474F; color: white; border: none; border-radius: 3px; font-size: 11px; cursor: pointer; font-weight: bold;";
        equipBtn.onclick = () => {
          if (item.type === 'weapon') {
            player.equipWeaponFromBag(item.id);
            localStorage.setItem('rpg_player_weapon', JSON.stringify(player.equippedWeapon));
          } else if (item.type === 'armor') {
            player.equipArmorFromBag(item.id);
            localStorage.setItem('rpg_player_armor', JSON.stringify(player.equippedArmor));
          }
          
          // On sauvegarde le sac mis à jour (l'objet équipé en est sorti)
          localStorage.setItem('rpg_player_bag', JSON.stringify(player.inventory.items));
          this.engine.onLogCallback(`🔧 Vous avez équipé : **${item.name}**`);
          this.updateUI();
        };

        actionGroup.appendChild(equipBtn);

        // 🗑️ 2. Bouton Jeter (Le nouveau venu !)
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = "🗑️";
        deleteBtn.style.cssText = "padding: 3px 6px; background: #EF5350; color: white; border: none; border-radius: 3px; font-size: 11px; cursor: pointer;";
        deleteBtn.title = "Détruire définitivement cet objet";
        deleteBtn.onclick = () => {
          // Demande une petite confirmation rapide pour éviter les missclicks dramatiques
          if (confirm(`Voulez-vous vraiment jeter votre "${item.name}" ? Il sera définitivement perdu.`)) {
            player.removeItemFromBag(item.id);
            localStorage.setItem('rpg_player_bag', JSON.stringify(player.inventory.items));
            this.engine.onLogCallback(`🗑️ Objet détruit : **${item.name}** a été retiré de votre sac.`);
            this.updateUI(); // Rafraîchit l'affichage
          }
        };
        actionGroup.appendChild(deleteBtn);

        itemDiv.appendChild(actionGroup);
        bagItemsList.appendChild(itemDiv);
      });
    }
  }

  addLog(message: string) {
    const journal = document.getElementById('journal');
    if (!journal) return;
    journal.innerHTML += `<br>${message}`;
    journal.scrollTop = journal.scrollHeight;
  }
}