export interface PhysicalDamageEngineInput {
  baseStr: number;
  baseDex: number;
  baseLuk: number;
  baseLevel: number;
  pow: number;
  weaponAtk: number;
  weaponLevel: number;
  weaponRefine: number;
  targetDef: number;
  targetSizePenalty: number;
  masteryAtk: number;
  skillPercent: number;
  equipAtk: number;
  atkPercent: number;
  racePercent: number;
  sizePercent: number;
  bossPercent: number;
  rangeOrMeleePercent: number;
  critDamagePercent: number;
  ignoreDefPercent: number;
}

export interface PhysicalDamageEngineResult {
  min: number;
  max: number;
  crit: number;
  debug: {
    statAtk: number;
    finalStatAtk: number;
    weaponBaseAtk: number;
    sizePenaltyMultiplier: number;
    totalModifierMultiplier: number;
  };
}

export function calculatePhysicalDamageSummary(
  input: PhysicalDamageEngineInput
): PhysicalDamageEngineResult {
  const statAtk = (
    input.baseStr +
    Math.floor(input.baseLuk / 3) +
    Math.floor(input.baseDex / 5) +
    Math.floor(input.baseLevel / 4) +
    (input.pow * 5)
  ) * 2;

  const pAtkMult = 1 + (input.pow / 100);
  const finalStatAtk = (statAtk + input.masteryAtk) * pAtkMult;

  const refineAtk = input.weaponRefine * 10;
  const variance = input.weaponLevel * input.weaponAtk * 0.05;
  const strBonus = (input.weaponAtk * input.baseStr) / 200;
  const weaponBaseAtk = input.weaponAtk + refineAtk + strBonus;

  const wAtkMinRaw = (weaponBaseAtk - variance) * input.targetSizePenalty;
  const wAtkMaxRaw = (weaponBaseAtk + variance) * input.targetSizePenalty;

  const raceMult = 1 + (input.racePercent / 100);
  const sizeMult = 1 + (input.sizePercent / 100);
  const bossMult = 1 + (input.bossPercent / 100);
  const atkPercentMult = 1 + (input.atkPercent / 100);
  const totalModifierMultiplier = raceMult * sizeMult * bossMult * atkPercentMult;

  const finalWeaponMin = (wAtkMinRaw + input.equipAtk) * pAtkMult * totalModifierMultiplier;
  const finalWeaponMax = (wAtkMaxRaw + input.equipAtk) * pAtkMult * totalModifierMultiplier;

  const rangeOrMeleeMult = 1 + (input.rangeOrMeleePercent / 100);
  const totalMin = (finalStatAtk + finalWeaponMin) * rangeOrMeleeMult;
  const totalMax = (finalStatAtk + finalWeaponMax) * rangeOrMeleeMult;

  const effectiveDef = input.targetDef * (1 - input.ignoreDefPercent / 100);
  const defReduction = (4000 + effectiveDef) / 4000;
  const skillMult = input.skillPercent / 100;

  const min = Math.floor((totalMin / defReduction) * skillMult);
  const max = Math.floor((totalMax / defReduction) * skillMult);
  const crit = Math.floor(totalMax * (1.4 + (input.critDamagePercent / 100)) * skillMult);

  return {
    min,
    max,
    crit,
    debug: {
      statAtk,
      finalStatAtk,
      weaponBaseAtk,
      sizePenaltyMultiplier: input.targetSizePenalty,
      totalModifierMultiplier
    }
  };
}
