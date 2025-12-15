
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
  DIKE = '다이크',
  FREYA = '프리야',
  SARA = '사라',
  THOR = '토르',
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

// Item Database Entry (Static Info)
export interface ItemDbEntry {
  id: number;
  name: string;
  slots: number;
  type: string;
  description: string;
  stats: string[];
  weight: number;
  reqLevel: number;
  weaponLevel?: number;
  jobs: string;
  jobTags: string[];
  npcPrice: { buy?: number; sell?: number };
}
