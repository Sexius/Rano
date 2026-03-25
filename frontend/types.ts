
export interface MarketItem {
  id: string;
  server: string;
  name: string;
  price: number;
  amount: number;
  seller: string;
  shop_title: string;
  location: string;
  created_at: string;
  category: string;
  refine_level: number;
  card_slots: number;
  cards_equipped: string[];
  description?: string;
  stats?: string[];
  image_placeholder?: string;
  parsedStats?: ParsedItemStats;  // Structured parsed item stats
  parsedData?: any;               // Raw DB JSON (or string)
  ssi?: string;                   // For fetching vending details
  map_id?: string;                // For fetching vending details
  shop_type?: 'sell' | 'buy';     // Vending shop type
}

export interface SearchParams {
  query: string;
  server: string;
  category: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface User {
  id: string;
  nickname: string;
  avatar?: string;
}

export interface Comment {
  id: number;
  author: string;
  content: string;
  date: string;
  isMine?: boolean; // Helper for frontend logic
}

export interface Post {
  id: number;
  title: string;
  author: string;
  content: string;
  date: string;
  views: number;
  likes: number; // Added
  comments: Comment[]; // Added
  isNotice?: boolean;
}

export type ViewMode = 'search' | 'itemInfo' | 'market' | 'calc' | 'sim' | 'board' | 'skill';

export enum ServerType {
  ALL = '전체 서버',
  BAPHOMET = '바포메트',
 
}

export enum ItemCategory {
  ALL = '전체',
  WEAPON = '무기',
  ARMOR = '방어구',
  CARD = '카드',
  CONSUMABLE = '소비',
  MISC = '기타',
  COSTUME = '의상',
}

// Simulator Types
export type EquipSlotId =
  | 'headUpper' | 'headMid' | 'headLower'
  | 'armor' | 'weapon' | 'shield' | 'garment' | 'shoes'
  | 'accRight' | 'accLeft';

export interface EquippedItem extends MarketItem {
  // Extended properties for simulator if needed (e.g. user custom cards)
  userCards?: (MarketItem | null)[];
}

export type GearSet = Record<EquipSlotId, EquippedItem | null>;

// Skill Simulator Types
export interface SkillRequirement {
  skillId: string;
  level: number;
}

export interface Skill {
  id: string;
  name: string;
  maxLevel: number;
  icon?: string; // Icon identifier or URL
  description: string;
  requirements?: SkillRequirement[];
  jobClass: string;
  // Grid position for visual layout (row, col)
  row: number;
  col: number;
}

export type SkillState = Record<string, number>; // skillId: level

// ============================================
// Parsed Item Stats (Structured Item Effects)
// ============================================

// Per-refine bonus: "3제련 당 ATK +35" or "7제련 시 ATK +5%"
export interface PerRefineBonus {
  type: 'every' | 'at';   // 'every' = N제련 당, 'at' = N제련 시
  refineLevel: number;    // The refine level threshold
  flatAtk?: number;
  atkPercent?: number;
  flatMatk?: number;
  matkPercent?: number;
  pAtk?: number;
  sMatk?: number;
  skillDamage?: Record<string, number>; // {"러쉬 스트라이크": 10, "명중 물리 데미지": 5}
  critDamage?: number;
  rangeDamage?: number;
  meleeDamage?: number;
  ignoreDef?: number;
  aspd?: number;
}

// Grade bonus: "[D등급] ATK +5%"
export interface GradeBonus {
  flatAtk?: number;
  atkPercent?: number;
  flatMatk?: number;
  matkPercent?: number;
  pAtk?: number;
  sMatk?: number;
  skillDamage?: Record<string, number>;
}

// Main parsed stats structure
export interface ParsedItemStats {
  // Base weapon info
  baseAtk?: number;         // 공격 : 370
  baseMatk?: number;        // MATK : 100
  weaponLevel?: number;     // 무기 레벨 : 5
  armorLevel?: number;      // 방어구 레벨 : 1
  requiredLevel?: number;   // 요구 레벨 (OPTIONAL - for compatibility)

  // Unconditional bonuses
  atk?: number;
  atkP?: number;
  flatAtk?: number;         // OPTIONAL - alias for atk
  atkPercent?: number;      // OPTIONAL - alias for atkP
  flatMatk?: number;        // OPTIONAL
  matkPercent?: number;     // OPTIONAL
  sMatk?: number;           // OPTIONAL
  str?: number;
  agi?: number;
  vit?: number;
  int?: number;
  dex?: number;
  luk?: number;

  // 4th job stats
  pow?: number;
  sta?: number;
  wis?: number;
  spl?: number;
  con?: number;
  crt?: number;

  // Damage modifiers
  raceP?: number;
  sizeP?: number;
  elementP?: number;
  bossP?: number;
  rangeP?: number;
  meleeP?: number;
  critDmgP?: number;
  ignoreDef?: number;
  pAtk?: number;

  // OPTIONAL - aliases for compatibility
  allRaceDamage?: number;
  allSizeDamage?: number;
  bossDamage?: number;
  critDamage?: number;
  rangeDamage?: number;
  meleeDamage?: number;

  // Per-refine bonuses
  perRefine?: PerRefineBonus[];

  // Grade bonuses
  gradeBonus?: {
    D?: GradeBonus;
    C?: GradeBonus;
    B?: GradeBonus;
    A?: GradeBonus;
  };

  skillDamage?: Record<string, number>;  // Skill-specific damage bonuses
  cooldownReduction?: number;  // Skill cooldown reduction %

  // DB structure (Python-generated data)
  base?: Record<string, any>;
  refine?: Record<string, Record<string, any>>;
  grade?: Record<string, Record<string, any>>;

  // Raw unparsed lines (for debugging/manual review)
  unparsedLines?: string[];

  // Set effects - OPTIONAL EXTENSION (does not break existing code)
  setEffects?: SetEffect[];
}

// ============================================
// Set Effect Types (Extension - Optional)
// ============================================

export type SetConditionType =
  | 'refine_sum'      // 제련도 합
  | 'grade_each'      // 각 아이템 등급
  | 'stat_sum'        // 스탯 합
  | 'job'             // 직업
  | 'base_level';     // 베이스 레벨

export interface SetCondition {
  type: SetConditionType;
  value: number | string;
  operator?: '>=' | '>' | '==' | '<' | '<=';
}

export interface SetEffect {
  targetItemName: string;  // e.g., "천공의 체이싱 대거"
  conditions: SetCondition[];
  effects: {
    atk?: number;
    atkP?: number;
    skillDamage?: Record<string, number>;
    cooldownReduction?: Record<string, number>;
    autoSpell?: Record<string, number>;
    [key: string]: any;
  };
}
