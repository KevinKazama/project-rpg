export type EquipmentType = 'weapon' | 'armor';
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface BaseEquipment {
  id: string;
  name: string;
  type: EquipmentType;
  rarity: Rarity;
  levelRequired: number;
  description: string;
}

export interface Weapon extends BaseEquipment {
  type: 'weapon';
  bonusAtk: number;
}

export interface Armor extends BaseEquipment {
  type: 'armor';
  bonusDef: number;
}

export type Equipment = Weapon | Armor;

// 📖 LE DICTIONNAIRE COMPLET DU JEU
export const ITEM_DATABASE: { weapons: Weapon[]; armors: Armor[] } = {
  weapons: [
    // --- NIVEAU 1 ---
    { id: 'w_rust_dagger', name: 'Dague Rouillée', type: 'weapon', rarity: 'common', levelRequired: 1, bonusAtk: 3, description: 'Mieux que rien, mais attention au tétanos.' },
    { id: 'w_wooden_staff', name: 'Bâton d\'Initié', type: 'weapon', rarity: 'common', levelRequired: 1, bonusAtk: 4, description: 'Un morceau de bois solidifié par la magie.' },
    { id: 'w_iron_sword', name: 'Épée en Fer court', type: 'weapon', rarity: 'rare', levelRequired: 1, bonusAtk: 7, description: 'Une lame standard forgée pour les recrues.' },
    
    // --- NIVEAU 2 à 3 ---
    { id: 'w_steel_mace', name: 'Masse en Acier', type: 'weapon', rarity: 'common', levelRequired: 2, bonusAtk: 10, description: 'Lourde et parfaite pour briser des os.' },
    { id: 'w_ranger_bow', name: 'Arc de Chasseur', type: 'weapon', rarity: 'rare', levelRequired: 2, bonusAtk: 14, description: 'Un arc en bois d\'if d\'une grande précision.' },
    { id: 'w_shadow_blade', name: 'Lame des Ombres', type: 'weapon', rarity: 'epic', levelRequired: 3, bonusAtk: 22, description: 'Une dague obscure qui semble absorber la lumière ambiante.' },

    // --- NIVEAU 4 à 5 ---
    { id: 'w_paladin_greatsword', name: 'Espadon de Justice', type: 'weapon', rarity: 'rare', levelRequired: 4, bonusAtk: 28, description: 'Une épée à deux mains bénie par les anciens.' },
    { id: 'w_lava_axe', name: 'Hache de Magma', type: 'weapon', rarity: 'epic', levelRequired: 5, bonusAtk: 38, description: 'Forgée au cœur d\'un volcan, elle irradie de chaleur.' },
    
    // --- ENDGAME / LEGENDARY ---
    { id: 'w_excalibur', name: 'Excalibur', type: 'weapon', rarity: 'legendary', levelRequired: 5, bonusAtk: 55, description: 'La lame mythique des rois. Sa puissance est sans limite.' }
  ],
  armors: [
    // --- NIVEAU 1 ---
    { id: 'a_ragged_clothes', name: 'Habits Déchirés', type: 'armor', rarity: 'common', levelRequired: 1, bonusDef: 2, description: 'Protège à peine du vent.' },
    { id: 'a_leather_vest', name: 'Veste en Cuir', type: 'armor', rarity: 'rare', levelRequired: 1, bonusDef: 5, description: 'Souple et renforcée aux endroits critiques.' },
    
    // --- NIVEAU 2 à 3 ---
    { id: 'a_chainmail', name: 'Cotte de Mailles', type: 'armor', rarity: 'common', levelRequired: 2, bonusDef: 10, description: 'Un assemblage de milliers d\'anneaux de fer.' },
    { id: 'a_steel_breastplate', name: 'Plastron en Acier', type: 'armor', rarity: 'rare', levelRequired: 3, bonusDef: 18, description: 'Une armure lourde polie comme un miroir.' },

    // --- NIVEAU 4 à 5 ---
    { id: 'a_dragon_scale', name: 'Armure en Écailles de Dragon', type: 'armor', rarity: 'epic', levelRequired: 4, bonusDef: 30, description: 'Aussi légère que de la soie, aussi dure que le diamant.' },
    { id: 'a_immortal_plate', name: 'Égide de l\'Immortel', type: 'armor', rarity: 'legendary', levelRequired: 5, bonusDef: 45, description: 'Une armure divine qui repousse le destin lui-même.' }
  ]
};

export function getRandomEquipmentLoot(enemyLevel: number): Equipment | null {
  // 1. On détermine d'abord la rareté cible (Probabilités)
  const randRarity = Math.random() * 100;
  let targetRarity: 'common' | 'rare' | 'epic' | 'legendary' = 'common';

  if (randRarity < 60) targetRarity = 'common';
  else if (randRarity < 85) targetRarity = 'rare';
  else if (randRarity < 97) targetRarity = 'epic';
  else targetRarity = 'legendary';

  // 2. On choisit le type d'objet : 50% Arme, 50% Armure
  const itemType = Math.random() < 0.5 ? 'weapons' : 'armors';

  // 3. On filtre la base de données selon le type, le niveau et la rareté
  let validItems = ITEM_DATABASE[itemType].filter(
    (item: any) => item.levelRequired <= enemyLevel && item.rarity === targetRarity
  );

  // 🛡️ Sécurité 1 : Si la rareté précise n'existe pas pour ce niveau, on prend tout ce qui matche le niveau dans cette catégorie
  if (validItems.length === 0) {
    validItems = ITEM_DATABASE[itemType].filter((item: any) => item.levelRequired <= enemyLevel);
  }

  // 🛡️ Sécurité 2 : Si la catégorie entière est vide, on se rabat sur les armes par défaut
  if (validItems.length === 0) {
    validItems = ITEM_DATABASE.weapons.filter(w => w.levelRequired <= enemyLevel);
  }

  if (validItems.length === 0) return null;

  // 4. On pioche un objet au hasard et on lui donne un ID unique pour le sac
  const randomIndex = Math.floor(Math.random() * validItems.length);
  const selectedTemplate = validItems[randomIndex];

  return {
    ...selectedTemplate,
    id: Math.random().toString(36).substring(2, 11)
  };
}