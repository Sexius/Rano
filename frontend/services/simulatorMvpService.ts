import { EquipSlotId, GearSet } from '../types';

export interface SimulatorMvpJob {
  id: string;
  label: string;
  damageType: 'physical' | 'magic';
  notes: string;
}

export interface SimulatorRoadmapPhase {
  id: string;
  title: string;
  status: 'active' | 'next' | 'later';
  summary: string;
}

export interface SimulatorMvpSnapshot {
  equippedCoreSlots: EquipSlotId[];
  missingCoreSlots: EquipSlotId[];
  completionRate: number;
  readinessLabel: 'empty' | 'draft' | 'core_ready';
}

export const MVP_CORE_SLOTS: EquipSlotId[] = [
  'weapon',
  'armor',
  'garment',
  'shoes',
  'accRight',
  'accLeft',
  'headUpper'
];

export const MVP_SUPPORTED_JOBS: SimulatorMvpJob[] = [
  {
    id: 'rune_knight',
    label: 'Rune Knight',
    damageType: 'physical',
    notes: 'Physical melee baseline for the first build comparison flow.'
  },
  {
    id: 'arch_mage',
    label: 'Arch Mage',
    damageType: 'magic',
    notes: 'Magic baseline for the first spell damage flow.'
  }
];

export const MVP_ROADMAP_PHASES: SimulatorRoadmapPhase[] = [
  {
    id: 'foundation',
    title: 'Phase 1. Simulator foundation',
    status: 'active',
    summary: 'Define supported jobs, core slots, and build readiness for the first public simulator flow.'
  },
  {
    id: 'engine',
    title: 'Phase 2. Calculation cleanup',
    status: 'next',
    summary: 'Unify formula helpers and reuse parsed item effects instead of duplicating logic per component.'
  },
  {
    id: 'ocr',
    title: 'Phase 3. OCR / AI assist',
    status: 'later',
    summary: 'Add screenshot parsing only after the calculation engine and item effect model are stable.'
  }
];

export function getSimulatorMvpSnapshot(gear: GearSet): SimulatorMvpSnapshot {
  const equippedCoreSlots = MVP_CORE_SLOTS.filter((slot) => Boolean(gear[slot]));
  const missingCoreSlots = MVP_CORE_SLOTS.filter((slot) => !gear[slot]);
  const completionRate = Math.round((equippedCoreSlots.length / MVP_CORE_SLOTS.length) * 100);

  let readinessLabel: SimulatorMvpSnapshot['readinessLabel'] = 'empty';
  if (equippedCoreSlots.length > 0) readinessLabel = 'draft';
  if (missingCoreSlots.length <= 2) readinessLabel = 'core_ready';

  return {
    equippedCoreSlots,
    missingCoreSlots,
    completionRate,
    readinessLabel
  };
}

export function formatEquipSlotLabel(slot: EquipSlotId): string {
  const labels: Record<EquipSlotId, string> = {
    headUpper: 'Head Upper',
    headMid: 'Head Mid',
    headLower: 'Head Lower',
    armor: 'Armor',
    weapon: 'Weapon',
    shield: 'Shield',
    garment: 'Garment',
    shoes: 'Shoes',
    accRight: 'Accessory R',
    accLeft: 'Accessory L'
  };

  return labels[slot];
}
