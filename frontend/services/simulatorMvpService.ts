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
    label: '룬 나이트',
    damageType: 'physical',
    notes: '첫 MVP 비교 흐름의 기준이 되는 근접 물리 직업군입니다.'
  },
  {
    id: 'arch_mage',
    label: '아크 메이지',
    damageType: 'magic',
    notes: '첫 MVP 비교 흐름의 기준이 되는 마법 직업군입니다.'
  }
];

export const MVP_ROADMAP_PHASES: SimulatorRoadmapPhase[] = [
  {
    id: 'foundation',
    title: '1단계. 시뮬레이터 기반 정리',
    status: 'active',
    summary: '지원 직업, 핵심 슬롯, 빌드 완성도 기준을 먼저 고정합니다.'
  },
  {
    id: 'engine',
    title: '2단계. 계산 엔진 정리',
    status: 'next',
    summary: '컴포넌트마다 흩어진 공식과 옵션 적용 로직을 공통 엔진으로 통합합니다.'
  },
  {
    id: 'ocr',
    title: '3단계. OCR / AI 보조',
    status: 'later',
    summary: '계산식과 아이템 효과 구조가 안정된 뒤에 스크린샷 분석을 붙입니다.'
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
    headUpper: '투구 상단',
    headMid: '투구 중단',
    headLower: '투구 하단',
    armor: '갑옷',
    weapon: '무기',
    shield: '방패',
    garment: '걸칠것',
    shoes: '신발',
    accRight: '악세 우',
    accLeft: '악세 좌'
  };

  return labels[slot];
}
