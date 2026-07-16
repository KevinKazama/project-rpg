import { Scenario, ScenarioMap } from './Scenario';

export const STORY_DATABASE: ScenarioMap = {
  // === INTRODUCTION ===
  'intro': {
    id: 'intro',
    title: 'Le Réveil',
    description: 'Vous vous réveillez dans une forêt sombre, votre mémoire est floue. Vous ne vous souvenez que de votre nom : Kevin. À vos pieds, une épée rouillée gît dans la boue.',
    choices: [
      {
        id: 'take_sword',
        text: '🗡️ Ramasser l\'épée et explorer la forêt',
        consequence: {
          type: 'reward',
          itemReward: 'w_rust_dagger',
          description: 'Vous trouvez une dague rouillée dans vos poches.',
          nextScenarioId: 'forest_path'
        }
      },
      {
        id: 'ignore_sword',
        text: '🚶 Ignorer l\'épée et marcher vers la clairière',
        consequence: {
          type: 'story',
          description: 'Vous décidez de vous fier à vos poings. La forêt semble vous observer.',
          nextScenarioId: 'forest_clearing'
        }
      }
    ]
  },

  // === FORÊT ===
  'forest_path': {
    id: 'forest_path',
    title: 'Le Sentier Obscur',
    description: 'Le sentier s\'enfonce dans les bois. Vous entendez des bruits étranges. Soudain, un gobelin surgit des buissons !',
    choices: [
      {
        id: 'fight_goblin',
        text: '⚔️ Combattre le gobelin',
        consequence: {
          type: 'combat',
          enemyLevel: 1,
          enemyType: 'goblin',
          description: 'Un gobelin chapardeur vous attaque !',
          xpReward: 40,
          nextScenarioId: 'forest_village'
        }
      },
      {
        id: 'flee',
        text: '🏃 Fuir',
        consequence: {
          type: 'damage',
          value: 10,
          description: 'Vous fuyez mais le gobelin vous griffe le dos.',
          nextScenarioId: 'forest_clearing'
        }
      }
    ]
  },

  'forest_clearing': {
    id: 'forest_clearing',
    title: 'La Clairière',
    description: 'Vous arrivez dans une clairière. Un vieux ermite médite près d\'un feu. Il semble vous avoir attendu.',
    choices: [
      {
        id: 'talk_hermit',
        text: '🗣️ Parler à l\'ermite',
        consequence: {
          type: 'reward',
          value: 30,
          description: 'L\'ermite partage sa sagesse et vous donne des conseils de combat.',
          nextScenarioId: 'hermit_teaching'
        }
      },
      {
        id: 'ignore_hermit',
        text: '🚶 Continuer votre chemin',
        consequence: {
          type: 'story',
          description: 'Vous laissez l\'ermite à sa méditation et continuez vers le nord.',
          nextScenarioId: 'northern_path'
        }
      }
    ]
  },

  'hermit_teaching': {
    id: 'hermit_teaching',
    title: 'L\'Enseignement',
    description: '"Le monde est en péril, jeune voyageur. Les ombres s\'étendent. Seuls les courageux peuvent les repousser." L\'ermite vous tend une potion.',
    choices: [
      {
        id: 'accept_potion',
        text: '🧪 Accepter la potion',
        consequence: {
          type: 'heal',
          value: 40,
          description: 'L\'ermite vous donne une potion de soin.',
          nextScenarioId: 'northern_path'
        }
      },
      {
        id: 'ask_more',
        text: '❓ Demander plus d\'informations',
        consequence: {
          type: 'story',
          description: '"Cherchez le village au nord. Ils sauront vous guider."',
          nextScenarioId: 'northern_path'
        }
      }
    ]
  },

  // === VILLAGE ===
  'forest_village': {
    id: 'forest_village',
    title: 'Le Village Abandonné',
    description: 'Vous découvrez un village en ruines. Des traces de combat sont partout. Soudain, un orque enragé surgit des décombres !',
    choices: [
      {
        id: 'fight_orc',
        text: '⚔️ Affronter l\'orque',
        consequence: {
          type: 'combat',
          enemyLevel: 2,
          enemyType: 'orc',
          description: 'Un orque enragé vous barre la route !',
          xpReward: 100,
          nextScenarioId: 'village_survivor'
        }
      },
      {
        id: 'sneak',
        text: '🤥 Essayer de se faufiler',
        consequence: {
          type: 'story',
          description: 'Vous réussissez à vous faufiler discrètement.',
          nextScenarioId: 'village_survivor'
        }
      }
    ]
  },

  'village_survivor': {
    id: 'village_survivor',
    title: 'Le Survivant',
    description: 'Au fond du village, vous trouvez un survivant blessé. "Les ombres... elles viennent de la montagne..."',
    choices: [
      {
        id: 'help_survivor',
        text: '❤️ Aider le survivant',
        consequence: {
          type: 'heal',
          value: 20,
          description: 'Vous partagez vos ressources pour le soigner.',
          nextScenarioId: 'mountain_path'
        }
      },
      {
        id: 'leave_survivor',
        text: '💀 Laisser le survivant',
        consequence: {
          type: 'story',
          description: 'Vous décidez de poursuivre votre route sans vous attarder.',
          nextScenarioId: 'mountain_path'
        }
      }
    ]
  },

  // === MONTAGNE ===
  'northern_path': {
    id: 'northern_path',
    title: 'Le Chemin du Nord',
    description: 'Le chemin vers le nord est escarpé. Vous apercevez une grotte sombre. Des éclairs bleus en sortent par moments.',
    choices: [
      {
        id: 'enter_cave',
        text: '🕳️ Entrer dans la grotte',
        consequence: {
          type: 'combat',
          enemyLevel: 3,
          enemyType: 'ghost',
          description: 'Un spectre errant hante cette grotte !',
          xpReward: 150,
          nextScenarioId: 'cave_treasure'
        }
      },
      {
        id: 'avoid_cave',
        text: '⛰️ Contourner la grotte',
        consequence: {
          type: 'damage',
          value: 15,
          description: 'Le chemin est difficile, vous vous blessez en grimpant.',
          nextScenarioId: 'mountain_path'
        }
      }
    ]
  },

  'cave_treasure': {
    id: 'cave_treasure',
    title: 'Le Trésor',
    description: 'Après avoir vaincu le spectre, vous découvrez un coffre ancien.',
    choices: [
      {
        id: 'open_chest',
        text: '📦 Ouvrir le coffre',
        consequence: {
          type: 'reward',
          itemReward: 'w_iron_sword',
          description: 'Vous trouvez une épée en fer court !',
          nextScenarioId: 'mountain_path'
        }
      },
      {
        id: 'leave_chest',
        text: '🚶 Laisser le coffre',
        consequence: {
          type: 'story',
          description: 'Vous décidez de ne pas toucher à ce qui ne vous appartient pas.',
          nextScenarioId: 'mountain_path'
        }
      }
    ]
  },

  'mountain_path': {
    id: 'mountain_path',
    title: 'La Montagne Maudite',
    description: 'Vous arrivez au pied de la montagne. Un dragonnet garde le passage. Il semble agressif.',
    choices: [
      {
        id: 'fight_dragon',
        text: '⚔️ Combattre le dragonnet',
        consequence: {
          type: 'combat',
          enemyLevel: 1,
          enemyType: 'dragon',
          description: 'Un jeune dragonnet vous défie !',
          xpReward: 200,
          nextScenarioId: 'dragon_victory'
        }
      },
      {
        id: 'negotiate',
        text: '🗣️ Essayer de négocier',
        consequence: {
          type: 'story',
          description: 'Le dragonnet semble comprendre votre langage mais reste méfiant.',
          nextScenarioId: 'dragon_negotiation'
        }
      }
    ]
  },

  'dragon_negotiation': {
    id: 'dragon_negotiation',
    title: 'La Négociation',
    description: 'Le dragonnet vous écoute. "Je peux te laisser passer... mais tu dois me prouver ta valeur."',
    choices: [
      {
        id: 'offer_item',
        text: '🎁 Offrir un objet de votre inventaire',
        consequence: {
          type: 'offer',
          requiredItemType: 'any',
          description: 'Le dragonnet accepte votre offrande et vous laisse passer.',
          nextScenarioId: 'summit'
        }
      },
      {
        id: 'refuse',
        text: '🚫 Refuser et combattre',
        consequence: {
          type: 'combat',
          enemyLevel: 4,
          enemyType: 'dragon',
          description: 'Le dragonnet s\'irrite et attaque !',
          xpReward: 200,
          nextScenarioId: 'dragon_victory'
        }
      }
    ]
  },

  // === FIN ===
  'dragon_victory': {
    id: 'dragon_victory',
    title: 'La Victoire',
    description: 'Le dragonnet tombe, vaincu. Au sommet de la montagne, vous découvrez la source des ombres : un portail scellé.',
    choices: [
      {
        id: 'approach_portal',
        text: '🌀 S\'approcher du portail',
        consequence: {
          type: 'story',
          description: 'Le portail pulse d\'une énergie étrange. Votre aventure ne fait que commencer...',
          nextScenarioId: 'ending'
        }
      }
    ]
  },

  'summit': {
    id: 'summit',
    title: 'Le Sommet',
    description: 'Vous atteignez le sommet de la montagne. La vue est imprenable. Au loin, vous voyez d\'autres montagnes, d\'autres défis.',
    choices: [
      {
        id: 'rest',
        text: '🏕️ Faire camp et se reposer',
        consequence: {
          type: 'heal',
          value: 50,
          description: 'Vous vous reposez et récupérez vos forces.',
          nextScenarioId: 'ending'
        }
      },
      {
        id: 'continue',
        text: '🗺️ Continuer l\'exploration',
        consequence: {
          type: 'story',
          description: 'Votre quête continue vers de nouveaux horizons.',
          nextScenarioId: 'ending'
        }
      }
    ]
  },

  'ending': {
    id: 'ending',
    title: 'Fin du Chapitre 1',
    description: 'Vous avez survécu à cette première épreuve. Mais le monde est vaste et les dangers nombreux. Votre légende ne fait que commencer...',
    choices: [
      {
        id: 'rest_and_restart',
        text: '🔄 Se reposer et recommencer une nouvelle aventure',
        consequence: {
          type: 'heal',
          value: 9999,
          description: 'Vous vous reposez et récupérez toutes vos forces. Une nouvelle légende peut commencer.',
          nextScenarioId: 'intro'
        }
      }
    ]
  },

  // === SCÉNARIOS DE MORT ===
  'death_combat': {
    id: 'death_combat',
    title: '💀 DÉFAITE',
    description: 'Vous êtes tombé au combat. Votre voyage s\'arrête ici. Les ombres continuent de s\'étendre...',
    choices: [
      {
        id: 'try_again',
        text: '🔄 Essayer à nouveau',
        consequence: {
          type: 'death',
          description: 'Une nouvelle âme courageuse se lève.',
          nextScenarioId: 'intro'
        }
      }
    ]
  }
};
