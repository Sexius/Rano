export interface AbyssChaserObservedHit {
  label: 'chasing_break' | 'deft_stab_trigger' | 'deft_stab_manual';
  damage: number;
  hits: number;
}

export interface AbyssChaserSkillProfile {
  skillId: 'ABC_CHASING_BREAK' | 'ABC_DEFT_STAB';
  level: number;
  percentPerHit: number;
  hits: number;
  bonusPercent: number;
}

export interface AbyssChaserBuffProfile {
  pAtkBonus: number;
  hitBonus: number;
}

export interface AbyssChaserDraftScenario {
  baseLevel: number;
  baseStr: number;
  baseDex: number;
  baseLuk: number;
  pow: number;
  weaponAtk: number;
  weaponRefine: number;
  totalAtkFlat: number;
  totalAtkPercent: number;
  totalMeleePercent: number;
  totalRangedPercent: number;
  totalElementPercent: number;
  totalSizePercent: number;
  totalRacePercent: number;
  totalBossPercent: number;
  totalCriticalDamagePercent: number;
  totalSkillPercent: Record<string, number>;
  totalPatk: number;
  targetSize: 'small' | 'medium' | 'large';
  targetRace: 'formless' | 'other';
  targetDef: number;
  observed: AbyssChaserObservedHit[];
}

export interface AbyssChaserEstimatedHit {
  label: AbyssChaserObservedHit['label'];
  perHit: number;
  total: number;
  hits: number;
}

export interface AbyssChaserEstimateResult {
  estimated: AbyssChaserEstimatedHit[];
  observed: AbyssChaserObservedHit[];
  debug: {
    rawBaseAttackBudget: number;
    calibratedBaseAttackBudget: number;
    skillAttackBudget: Record<string, number>;
    meleeMultiplier: number;
    sizeMultiplier: number;
    raceMultiplier: number;
    elementMultiplier: number;
    bossMultiplier: number;
    atkMultiplier: number;
    calibrationSources: string[];
  };
}

export const ABYSS_CHASER_BUFFS: Record<'abyss_slayer_lv10', AbyssChaserBuffProfile> = {
  abyss_slayer_lv10: {
    pAtkBonus: 30,
    hitBonus: 300
  }
};

export const ABYSS_CHASER_SKILLS: Record<'chasing_break_lv5' | 'deft_stab_lv10', AbyssChaserSkillProfile> = {
  chasing_break_lv5: {
    skillId: 'ABC_CHASING_BREAK',
    level: 5,
    percentPerHit: 4250,
    hits: 1,
    bonusPercent: 100
  },
  deft_stab_lv10: {
    skillId: 'ABC_DEFT_STAB',
    level: 10,
    percentPerHit: 6200,
    hits: 5,
    bonusPercent: 89
  }
};

export const ABYSS_CHASER_OBSERVED_REFERENCE: AbyssChaserObservedHit[] = [
  { label: 'chasing_break', damage: 88068600, hits: 1 },
  { label: 'deft_stab_trigger', damage: 130860159, hits: 1 },
  { label: 'deft_stab_manual', damage: 126247790, hits: 5 }
];

export function buildAbyssChaserDraftScenario(): AbyssChaserDraftScenario {
  return {
    baseLevel: 256,
    baseStr: 120,
    baseDex: 100,
    baseLuk: 82,
    pow: 110,
    weaponAtk: 230,
    weaponRefine: 12,
    totalAtkFlat: 1234,
    totalAtkPercent: 138,
    totalMeleePercent: 294,
    totalRangedPercent: 68,
    totalElementPercent: 80,
    totalSizePercent: 93,
    totalRacePercent: 37,
    totalBossPercent: 0,
    totalCriticalDamagePercent: 0,
    totalSkillPercent: {
      ABC_CHASING_BREAK: 100,
      ABC_DEFT_STAB: 89
    },
    totalPatk: 260,
    targetSize: 'medium',
    targetRace: 'formless',
    targetDef: 0,
    observed: ABYSS_CHASER_OBSERVED_REFERENCE
  };
}

function getSizePercentForTarget(scenario: AbyssChaserDraftScenario): number {
  if (scenario.targetSize === 'small') return 83;
  if (scenario.targetSize === 'medium') return scenario.totalSizePercent;
  return 103;
}

function getRacePercentForTarget(scenario: AbyssChaserDraftScenario): number {
  if (scenario.targetRace === 'formless') {
    return scenario.totalRacePercent + 20;
  }
  return scenario.totalRacePercent;
}

function getBaseAttackBudget(scenario: AbyssChaserDraftScenario): number {
  const statAttack =
    scenario.baseStr * 2 +
    Math.floor(scenario.baseDex / 5) +
    Math.floor(scenario.baseLuk / 3) +
    Math.floor(scenario.baseLevel / 4) +
    scenario.pow * 3;

  const weaponAttack = scenario.weaponAtk + scenario.weaponRefine * 10;
  const pAtkAttack = scenario.totalPatk * 12;

  return statAttack + weaponAttack + scenario.totalAtkFlat + pAtkAttack;
}

function getCommonMultiplier(scenario: AbyssChaserDraftScenario): Omit<AbyssChaserEstimateResult['debug'], 'baseAttackBudget' | 'skillAttackBudget'> {
  return {
    meleeMultiplier: 1 + scenario.totalMeleePercent / 100,
    sizeMultiplier: 1 + getSizePercentForTarget(scenario) / 100,
    raceMultiplier: 1 + getRacePercentForTarget(scenario) / 100,
    elementMultiplier: 1 + scenario.totalElementPercent / 100,
    bossMultiplier: 1 + scenario.totalBossPercent / 100,
    atkMultiplier: 1 + scenario.totalAtkPercent / 100
  };
}

function estimateSkillPerHit(
  skillPercent: number,
  skillBonusPercent: number,
  baseAttackBudget: number,
  commonMultiplier: ReturnType<typeof getCommonMultiplier>,
  defense: number
): number {
  const skillMultiplier = (skillPercent / 100) * (1 + skillBonusPercent / 100);
  const combined =
    baseAttackBudget *
    commonMultiplier.atkMultiplier *
    commonMultiplier.meleeMultiplier *
    commonMultiplier.sizeMultiplier *
    commonMultiplier.raceMultiplier *
    commonMultiplier.elementMultiplier *
    commonMultiplier.bossMultiplier *
    skillMultiplier;

  const defenseDivisor = 1 + defense / 4000;
  return Math.floor(combined / defenseDivisor);
}

function getObservedDamage(
  scenario: AbyssChaserDraftScenario,
  label: AbyssChaserObservedHit['label']
): number | null {
  const match = scenario.observed.find((item) => item.label === label);
  return match ? match.damage : null;
}

function reverseBaseAttackBudgetFromObservation(
  observedDamage: number,
  skillPercent: number,
  skillBonusPercent: number,
  commonMultiplier: ReturnType<typeof getCommonMultiplier>,
  defense: number
): number {
  const skillMultiplier = (skillPercent / 100) * (1 + skillBonusPercent / 100);
  const defenseDivisor = 1 + defense / 4000;
  const totalCommonMultiplier =
    commonMultiplier.atkMultiplier *
    commonMultiplier.meleeMultiplier *
    commonMultiplier.sizeMultiplier *
    commonMultiplier.raceMultiplier *
    commonMultiplier.elementMultiplier *
    commonMultiplier.bossMultiplier *
    skillMultiplier;

  return (observedDamage * defenseDivisor) / totalCommonMultiplier;
}

function getCalibratedBaseAttackBudget(
  scenario: AbyssChaserDraftScenario,
  commonMultiplier: ReturnType<typeof getCommonMultiplier>,
  rawBaseAttackBudget: number
): { value: number; sources: string[] } {
  const samples: number[] = [];
  const sources: string[] = [];

  const chasingBreakObserved = getObservedDamage(scenario, 'chasing_break');
  if (chasingBreakObserved) {
    samples.push(
      reverseBaseAttackBudgetFromObservation(
        chasingBreakObserved,
        ABYSS_CHASER_SKILLS.chasing_break_lv5.percentPerHit,
        scenario.totalSkillPercent.ABC_CHASING_BREAK ?? 0,
        commonMultiplier,
        scenario.targetDef
      )
    );
    sources.push('체이싱 브레이크 본체');
  }

  const deftManualObserved = getObservedDamage(scenario, 'deft_stab_manual');
  if (deftManualObserved) {
    samples.push(
      reverseBaseAttackBudgetFromObservation(
        deftManualObserved,
        ABYSS_CHASER_SKILLS.deft_stab_lv10.percentPerHit,
        scenario.totalSkillPercent.ABC_DEFT_STAB ?? 0,
        commonMultiplier,
        scenario.targetDef
      )
    );
    sources.push('수동 데프트 스탭');
  }

  if (samples.length === 0) {
    return { value: rawBaseAttackBudget, sources: ['설명문 합산 초안'] };
  }

  const average = samples.reduce((sum, value) => sum + value, 0) / samples.length;
  return { value: average, sources };
}

export function estimateAbyssChaserTrainingDummyDamage(
  scenario: AbyssChaserDraftScenario = buildAbyssChaserDraftScenario()
): AbyssChaserEstimateResult {
  const rawBaseAttackBudget = getBaseAttackBudget(scenario);
  const commonMultiplier = getCommonMultiplier(scenario);
  const calibrated = getCalibratedBaseAttackBudget(scenario, commonMultiplier, rawBaseAttackBudget);
  const baseAttackBudget = calibrated.value;

  const chasingBreakPerHit = estimateSkillPerHit(
    ABYSS_CHASER_SKILLS.chasing_break_lv5.percentPerHit,
    scenario.totalSkillPercent.ABC_CHASING_BREAK ?? 0,
    baseAttackBudget,
    commonMultiplier,
    scenario.targetDef
  );

  const deftStabPerHit = estimateSkillPerHit(
    ABYSS_CHASER_SKILLS.deft_stab_lv10.percentPerHit,
    scenario.totalSkillPercent.ABC_DEFT_STAB ?? 0,
    baseAttackBudget,
    commonMultiplier,
    scenario.targetDef
  );

  return {
    estimated: [
      {
        label: 'chasing_break',
        perHit: chasingBreakPerHit,
        total: chasingBreakPerHit * ABYSS_CHASER_SKILLS.chasing_break_lv5.hits,
        hits: ABYSS_CHASER_SKILLS.chasing_break_lv5.hits
      },
      {
        label: 'deft_stab_trigger',
        perHit: deftStabPerHit,
        total: deftStabPerHit,
        hits: 1
      },
      {
        label: 'deft_stab_manual',
        perHit: deftStabPerHit,
        total: deftStabPerHit * ABYSS_CHASER_SKILLS.deft_stab_lv10.hits,
        hits: ABYSS_CHASER_SKILLS.deft_stab_lv10.hits
      }
    ],
    observed: scenario.observed,
    debug: {
      rawBaseAttackBudget,
      calibratedBaseAttackBudget: baseAttackBudget,
      skillAttackBudget: {
        ABC_CHASING_BREAK: chasingBreakPerHit,
        ABC_DEFT_STAB: deftStabPerHit
      },
      ...commonMultiplier
      ,
      calibrationSources: calibrated.sources
    }
  };
}
