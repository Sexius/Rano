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
  basePatk: number;
  pow: number;
  masteryAttack: number;
  weaponAtk: number;
  weaponLevel: number;
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

export interface AbyssChaserAttackBuckets {
  statusAttack: number;
  weaponAttack: number;
  refineAttack: number;
  overRefineAttack: number;
  equipmentAttack: number;
  masteryAttack: number;
  basePatkAttack: number;
  pAtkAttack: number;
  powAttack: number;
}

export interface AbyssChaserPercentSource {
  label: string;
  value: number;
}

export interface AbyssChaserPercentBreakdown {
  total: number;
  known: number;
  unresolved: number;
  sources: AbyssChaserPercentSource[];
}

export interface AbyssChaserEstimateResult {
  estimated: AbyssChaserEstimatedHit[];
  observed: AbyssChaserObservedHit[];
  debug: {
    rawBaseAttackBudget: number;
    calibratedBaseAttackBudget: number;
    calibrationRatio: number;
    traitCalibrationRatio: number;
    pAtkCalibrationRatio: number;
    calibrationMode: 'patk_residual' | 'trait_residual' | 'uniform_fallback';
    fixedAttackBudget: number;
    rawTraitAttackBudget: number;
    calibratedTraitAttackBudget: number;
    rawPAtkCoefficient: number;
    calibratedPAtkCoefficient: number;
    rawPowCoefficient: number;
    calibratedPowCoefficient: number;
    rawAttackBuckets: AbyssChaserAttackBuckets;
    calibratedAttackBuckets: AbyssChaserAttackBuckets;
    skillAttackBudget: Record<string, number>;
    meleeMultiplier: number;
    sizeMultiplier: number;
    raceMultiplier: number;
    elementMultiplier: number;
    bossMultiplier: number;
    atkMultiplier: number;
    commonMultiplierProduct: number;
    calibrationSources: string[];
    deftTriggerRatio: number;
    frontAtk: number;
    statDamageBase: number;
    weaponDamageBase: number;
    refineDamageBase: number;
    overRefineDamageBase: number;
    minRandomWeaponAttack: number;
    maxRandomWeaponAttack: number;
    atkPercentBreakdown: AbyssChaserPercentBreakdown;
    meleePercentBreakdown: AbyssChaserPercentBreakdown;
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
    basePatk: 61,
    pow: 110,
    masteryAttack: 0,
    weaponAtk: 230,
    weaponLevel: 5,
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
    totalPatk: 290,
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

function getSafeRefineLevel(weaponLevel: number): number {
  if (weaponLevel <= 1) return 7;
  if (weaponLevel === 2) return 6;
  if (weaponLevel === 3) return 5;
  return 4;
}

function getOverRefineCoefficient(weaponLevel: number): number {
  if (weaponLevel <= 1) return 3;
  if (weaponLevel === 2) return 5;
  if (weaponLevel === 3) return 8;
  return 14;
}

function getRawAttackBuckets(scenario: AbyssChaserDraftScenario): AbyssChaserAttackBuckets {
  const frontAtk =
    scenario.baseStr +
    Math.floor(scenario.baseDex / 5) +
    Math.floor(scenario.baseLuk / 3) +
    Math.floor(scenario.baseLevel / 4);

  const statusAttack = frontAtk * 2;
  const weaponAttack = scenario.weaponAtk * ((scenario.baseStr + 200) / 200);
  const inferredRefineCoefficient = scenario.weaponLevel >= 4 ? 7 : 5;
  const refineAttack = scenario.weaponRefine * inferredRefineCoefficient;
  const safeRefineLevel = getSafeRefineLevel(scenario.weaponLevel);
  const overRefineValue = Math.max(0, scenario.weaponRefine - safeRefineLevel);
  const overRefineAttack = overRefineValue * getOverRefineCoefficient(scenario.weaponLevel);

  const bonusPatk = Math.max(0, scenario.totalPatk - scenario.basePatk);

  return {
    statusAttack,
    weaponAttack,
    refineAttack,
    overRefineAttack,
    equipmentAttack: scenario.totalAtkFlat,
    masteryAttack: scenario.masteryAttack,
    basePatkAttack: scenario.basePatk * 12,
    pAtkAttack: bonusPatk * 12,
    powAttack: scenario.pow * 3
  };
}

function getBaseAttackBudget(scenario: AbyssChaserDraftScenario): number {
  const buckets = getRawAttackBuckets(scenario);
  return (
    getFixedAttackBudget(buckets) +
    getTraitAttackBudget(buckets)
  );
}

function getFixedAttackBudget(buckets: AbyssChaserAttackBuckets): number {
  return (
    buckets.statusAttack +
    buckets.weaponAttack +
    buckets.refineAttack +
    buckets.overRefineAttack +
    buckets.equipmentAttack +
    buckets.masteryAttack +
    buckets.basePatkAttack
  );
}

function getTraitAttackBudget(buckets: AbyssChaserAttackBuckets): number {
  return buckets.pAtkAttack + buckets.powAttack;
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

function getAtkPercentBreakdown(scenario: AbyssChaserDraftScenario): AbyssChaserPercentBreakdown {
  const sources: AbyssChaserPercentSource[] = [
    { label: '투구', value: 8 },
    { label: '갑옷', value: 52 },
    { label: '걸칠것', value: 10 },
    { label: '신발', value: 22 },
    { label: '악세', value: 20 },
    { label: '쉐도우', value: 10 }
  ];

  const known = sources.reduce((sum, source) => sum + source.value, 0);
  return {
    total: scenario.totalAtkPercent,
    known,
    unresolved: Math.max(0, scenario.totalAtkPercent - known),
    sources
  };
}

function getMeleePercentBreakdown(scenario: AbyssChaserDraftScenario): AbyssChaserPercentBreakdown {
  const sources: AbyssChaserPercentSource[] = [
    { label: '투구', value: 15 },
    { label: '갑옷', value: 57 },
    { label: '걸칠것', value: 88 },
    { label: '신발', value: 23 },
    { label: '방패', value: 10 },
    { label: '악세(우)', value: 42 },
    { label: '악세(좌)', value: 27 },
    { label: '의상', value: 2 },
    { label: '쉐도우', value: 22 }
  ];

  const known = sources.reduce((sum, source) => sum + source.value, 0);
  return {
    total: scenario.totalMeleePercent,
    known,
    unresolved: Math.max(0, scenario.totalMeleePercent - known),
    sources
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

function getObservedTriggerRatio(scenario: AbyssChaserDraftScenario): number {
  const trigger = getObservedDamage(scenario, 'deft_stab_trigger');
  const manual = getObservedDamage(scenario, 'deft_stab_manual');

  if (!trigger || !manual || manual === 0) {
    return 1;
  }

  return trigger / manual;
}

function scaleAttackBuckets(
  buckets: AbyssChaserAttackBuckets,
  ratio: number
): AbyssChaserAttackBuckets {
  return {
    statusAttack: buckets.statusAttack * ratio,
    weaponAttack: buckets.weaponAttack * ratio,
    refineAttack: buckets.refineAttack * ratio,
    overRefineAttack: buckets.overRefineAttack * ratio,
    equipmentAttack: buckets.equipmentAttack * ratio,
    masteryAttack: buckets.masteryAttack * ratio,
    basePatkAttack: buckets.basePatkAttack * ratio,
    pAtkAttack: buckets.pAtkAttack * ratio,
    powAttack: buckets.powAttack * ratio
  };
}

function calibrateAttackBuckets(
  rawBuckets: AbyssChaserAttackBuckets,
  calibratedTotal: number,
  scenario: AbyssChaserDraftScenario
): {
  buckets: AbyssChaserAttackBuckets;
  overallRatio: number;
  traitRatio: number;
  pAtkRatio: number;
  mode: 'patk_residual' | 'trait_residual' | 'uniform_fallback';
  fixedBudget: number;
  rawTraitBudget: number;
  calibratedTraitBudget: number;
} {
  const rawTotal =
    getFixedAttackBudget(rawBuckets) + getTraitAttackBudget(rawBuckets);
  const fixedBudget = getFixedAttackBudget(rawBuckets);
  const rawTraitBudget = getTraitAttackBudget(rawBuckets);
  const overallRatio = rawTotal > 0 ? calibratedTotal / rawTotal : 1;
  const rawPowBudget = rawBuckets.powAttack;
  const rawPAtkBudget = rawBuckets.pAtkAttack;
  const bonusPatk = Math.max(0, scenario.totalPatk - scenario.basePatk);

  if (
    rawPAtkBudget > 0 &&
    bonusPatk > 0 &&
    calibratedTotal >= fixedBudget + rawPowBudget
  ) {
    const calibratedPAtkBudget = calibratedTotal - fixedBudget - rawPowBudget;
    const pAtkRatio = calibratedPAtkBudget / rawPAtkBudget;

    return {
      buckets: {
        ...rawBuckets,
        pAtkAttack: calibratedPAtkBudget,
        powAttack: rawPowBudget
      },
      overallRatio,
      traitRatio: (calibratedPAtkBudget + rawPowBudget) / rawTraitBudget,
      pAtkRatio,
      mode: 'patk_residual',
      fixedBudget,
      rawTraitBudget,
      calibratedTraitBudget: calibratedPAtkBudget + rawPowBudget
    };
  }

  if (rawTraitBudget > 0 && calibratedTotal >= fixedBudget) {
    const calibratedTraitBudget = calibratedTotal - fixedBudget;
    const traitRatio = calibratedTraitBudget / rawTraitBudget;

    return {
      buckets: {
        ...rawBuckets,
        pAtkAttack: rawBuckets.pAtkAttack * traitRatio,
        powAttack: rawBuckets.powAttack * traitRatio
      },
      overallRatio,
      traitRatio,
      pAtkRatio: traitRatio,
      mode: 'trait_residual',
      fixedBudget,
      rawTraitBudget,
      calibratedTraitBudget
    };
  }

  const scaled = scaleAttackBuckets(rawBuckets, overallRatio);
  return {
    buckets: scaled,
    overallRatio,
    traitRatio: overallRatio,
    pAtkRatio: overallRatio,
    mode: 'uniform_fallback',
    fixedBudget: getFixedAttackBudget(scaled),
    rawTraitBudget,
    calibratedTraitBudget: getTraitAttackBudget(scaled)
  };
}

export function estimateAbyssChaserTrainingDummyDamage(
  scenario: AbyssChaserDraftScenario = buildAbyssChaserDraftScenario()
): AbyssChaserEstimateResult {
  const rawAttackBuckets = getRawAttackBuckets(scenario);
  const frontAtk =
    scenario.baseStr +
    Math.floor(scenario.baseDex / 5) +
    Math.floor(scenario.baseLuk / 3) +
    Math.floor(scenario.baseLevel / 4);
  const statDamageBase = rawAttackBuckets.statusAttack;
  const weaponDamageBase = rawAttackBuckets.weaponAttack;
  const refineDamageBase = rawAttackBuckets.refineAttack;
  const overRefineDamageBase = rawAttackBuckets.overRefineAttack;
  const minRandomWeaponAttack =
    scenario.weaponAtk *
    (1 - 0.05 * scenario.weaponLevel + scenario.baseStr / 200);
  const maxRandomWeaponAttack =
    scenario.weaponAtk *
    (1 + 0.05 * scenario.weaponLevel + scenario.baseStr / 200);
  const rawBaseAttackBudget = getBaseAttackBudget(scenario);
  const commonMultiplier = getCommonMultiplier(scenario);
  const calibrated = getCalibratedBaseAttackBudget(scenario, commonMultiplier, rawBaseAttackBudget);
  const baseAttackBudget = calibrated.value;
  const attackCalibration = calibrateAttackBuckets(rawAttackBuckets, baseAttackBudget, scenario);
  const calibrationRatio = attackCalibration.overallRatio;
  const calibratedAttackBuckets = attackCalibration.buckets;
  const bonusPatk = Math.max(0, scenario.totalPatk - scenario.basePatk);
  const rawPAtkCoefficient = bonusPatk > 0 ? rawAttackBuckets.pAtkAttack / bonusPatk : 0;
  const calibratedPAtkCoefficient = bonusPatk > 0 ? calibratedAttackBuckets.pAtkAttack / bonusPatk : 0;
  const rawPowCoefficient = scenario.pow > 0 ? rawAttackBuckets.powAttack / scenario.pow : 0;
  const calibratedPowCoefficient = scenario.pow > 0 ? calibratedAttackBuckets.powAttack / scenario.pow : 0;

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
  const deftTriggerRatio = getObservedTriggerRatio(scenario);
  const deftStabTriggerPerHit = Math.floor(deftStabPerHit * deftTriggerRatio);
  const commonMultiplierProduct =
    commonMultiplier.atkMultiplier *
    commonMultiplier.meleeMultiplier *
    commonMultiplier.sizeMultiplier *
    commonMultiplier.raceMultiplier *
    commonMultiplier.elementMultiplier *
    commonMultiplier.bossMultiplier;
  const atkPercentBreakdown = getAtkPercentBreakdown(scenario);
  const meleePercentBreakdown = getMeleePercentBreakdown(scenario);

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
        perHit: deftStabTriggerPerHit,
        total: deftStabTriggerPerHit,
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
      calibrationRatio,
      traitCalibrationRatio: attackCalibration.traitRatio,
      pAtkCalibrationRatio: attackCalibration.pAtkRatio,
      calibrationMode: attackCalibration.mode,
      fixedAttackBudget: attackCalibration.fixedBudget,
      rawTraitAttackBudget: attackCalibration.rawTraitBudget,
      calibratedTraitAttackBudget: attackCalibration.calibratedTraitBudget,
      rawPAtkCoefficient,
      calibratedPAtkCoefficient,
      rawPowCoefficient,
      calibratedPowCoefficient,
      rawAttackBuckets,
      calibratedAttackBuckets,
      skillAttackBudget: {
        ABC_CHASING_BREAK: chasingBreakPerHit,
        ABC_DEFT_STAB: deftStabPerHit
      },
      ...commonMultiplier
      ,
      commonMultiplierProduct,
      calibrationSources: calibrated.sources,
      deftTriggerRatio,
      frontAtk,
      statDamageBase,
      weaponDamageBase,
      refineDamageBase,
      overRefineDamageBase,
      minRandomWeaponAttack,
      maxRandomWeaponAttack,
      atkPercentBreakdown,
      meleePercentBreakdown
    }
  };
}
