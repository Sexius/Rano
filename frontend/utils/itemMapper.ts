// Item data mapper: DB structure (Python) → Frontend structure
export interface DamageMods {
    equipAtk: number;
    equipMatk: number;
    pAtk: number;
    sMatk: number;
    meleeP: number;
    rangeP: number;
    allEleP: number;
    allSizeP: number;
    allRaceP: number;
    critDmgP: number;
    skillDmg: Record<string, number>;
}

export const initialMods: DamageMods = {
    equipAtk: 0,
    equipMatk: 0,
    pAtk: 0,
    sMatk: 0,
    meleeP: 0,
    rangeP: 0,
    allEleP: 0,
    allSizeP: 0,
    allRaceP: 0,
    critDmgP: 0,
    skillDmg: {}
};

/**
 * Map DB data (Python structure) to frontend DamageMods
 * @param source - DB data object with keys like `atk`, `p_atk`, `melee_dmg`
 * @param target - DamageMods object to accumulate values
 */
export const mapDbToMods = (source: any, target: DamageMods): void => {
    if (!source) return;

    // Stats mapping
    if (source.atk) target.equipAtk += source.atk;
    if (source.matk) target.equipMatk += source.matk;
    if (source.p_atk) target.pAtk += source.p_atk;
    if (source.s_matk) target.sMatk += source.s_matk;

    // Damage modifiers
    if (source.melee_dmg) target.meleeP += source.melee_dmg;
    if (source.range_dmg) target.rangeP += source.range_dmg;
    if (source.ele_all_dmg) target.allEleP += source.ele_all_dmg;
    if (source.size_all_dmg) target.allSizeP += source.size_all_dmg;
    if (source.race_all_dmg) target.allRaceP += source.race_all_dmg;
    if (source.cri_dmg) target.critDmgP += source.cri_dmg;

    // Skill damage
    if (source.skill_dmg) {
        Object.entries(source.skill_dmg).forEach(([key, val]) => {
            target.skillDmg[key] = (target.skillDmg[key] || 0) + (val as number);
        });
    }
};
