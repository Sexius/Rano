
import React, { useState, useEffect } from 'react';
import { Swords, Target, Zap, RotateCcw, Crosshair, ShieldAlert, Search, PlusCircle, X, ChevronUp, ChevronDown, Shirt, Shield, Crown, Glasses, Component, Layers, Footprints, Box, Sword } from 'lucide-react';
import { searchItems } from '../services/itemService';
import { getSkillsWithDamage, SkillData } from '../services/skillService';
import { calculateSkillDamage } from '../utils/SkillLogic';
import { MarketItem, GearSet, EquipSlotId, EquippedItem } from '../types';

// --- Interfaces & Helpers (Consolidated) ---

interface DamageMods {
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

const initialMods: DamageMods = {
  equipAtk: 0, equipMatk: 0, pAtk: 0, sMatk: 0,
  meleeP: 0, rangeP: 0, allEleP: 0, allSizeP: 0, allRaceP: 0, critDmgP: 0,
  skillDmg: {}
};

const mapDbToMods = (source: any, target: DamageMods) => {
  if (!source) return;
  if (source.atk) target.equipAtk += source.atk;
  if (source.matk) target.equipMatk += source.matk;
  if (source.p_atk) target.pAtk += source.p_atk;
  if (source.s_matk) target.sMatk += source.s_matk;
  if (source.melee_dmg) target.meleeP += source.melee_dmg;
  if (source.range_dmg) target.rangeP += source.range_dmg;
  if (source.ele_all_dmg) target.allEleP += source.ele_all_dmg;
  if (source.size_all_dmg) target.allSizeP += source.size_all_dmg;
  if (source.race_all_dmg) target.allRaceP += source.race_all_dmg;
  if (source.cri_dmg) target.critDmgP += source.cri_dmg;

  if (source.skill_dmg) {
    Object.entries(source.skill_dmg).forEach(([key, val]) => {
      target.skillDmg[key] = (target.skillDmg[key] || 0) + (val as number);
    });
  }
};

// --- Enums & Constants ---

enum WeaponGrade {
  NONE = '무등급',
  D = 'D등급',
  C = 'C등급',
  B = 'B등급',
  A = 'A등급',
}

enum WeaponType {
  DAGGER = '단검',
  SWORD_1H = '한손검',
  SWORD_2H = '양손검',
  SPEAR_1H = '한손창',
  SPEAR_2H = '양손창',
  AXE_1H = '한손도끼',
  AXE_2H = '양손도끼',
  MACE = '둔기',
  ROD = '지팡이',
  BOW = '활',
  KATAR = '카타르',
  BOOK = '책',
  KNUCKLE = '너클',
  INSTRUMENT = '악기',
  WHIP = '채찍',
  GUN = '총',
  SHURIKEN = '수리검',
}

const SIZE_PENALTY: Record<WeaponType, [number, number, number]> = {
  [WeaponType.DAGGER]: [100, 75, 50],
  [WeaponType.SWORD_1H]: [75, 100, 75],
  [WeaponType.SWORD_2H]: [75, 75, 100],
  [WeaponType.SPEAR_1H]: [75, 75, 100],
  [WeaponType.SPEAR_2H]: [75, 75, 100],
  [WeaponType.AXE_1H]: [50, 75, 100],
  [WeaponType.AXE_2H]: [50, 75, 100],
  [WeaponType.MACE]: [75, 100, 100],
  [WeaponType.ROD]: [100, 100, 100],
  [WeaponType.BOW]: [100, 100, 75],
  [WeaponType.KATAR]: [75, 100, 75],
  [WeaponType.BOOK]: [100, 100, 50],
  [WeaponType.KNUCKLE]: [100, 75, 50],
  [WeaponType.INSTRUMENT]: [75, 100, 75],
  [WeaponType.WHIP]: [75, 100, 50],
  [WeaponType.GUN]: [100, 100, 100],
  [WeaponType.SHURIKEN]: [100, 100, 100],
};

const SKILL_NAME_MAP: Record<string, string> = {
  'ABC_CHASING_BREAK': '체이싱 브레이크',
  'ABC_ABYSS_SQUARE': '어비스 스퀘어',
  'MT_RUSH_STRIKE': '러쉬 스트라이크',
  'ABC_DEFT_STAB': '데프트 스탭',
  'MT_POWERFUL_SMASH': '파워풀 스매쉬',
  'MT_TRIPLE_BOWLING': '트리플 볼링 배쉬',
  'MT_MAGNUM_BREAK': '매그넘 브레이크',
  'SK_CHULL_HO_BATTERING': '철호포',
  'SH_HAWK_HUNT': '호크 헌팅',
  'SH_WIND_FLOW': '윈드 호크',
  'NW_OBLIVION_CURSE': '오블리비언 커즈',
  'NW_DEATH_NOTCH': '데스 노치',
  // Add more as needed
};

const SLOTS: { id: EquipSlotId; label: string; icon: React.ReactNode }[] = [
  { id: 'weapon', label: '무기', icon: <Sword size={18} /> },
  { id: 'headUpper', label: '상단', icon: <Crown size={18} /> },
  { id: 'headMid', label: '중단', icon: <Glasses size={18} /> },
  { id: 'headLower', label: '하단', icon: <Component size={18} /> },
  { id: 'armor', label: '갑옷', icon: <Shirt size={18} /> },
  { id: 'shield', label: '방패', icon: <Shield size={18} /> },
  { id: 'garment', label: '걸칠것', icon: <Layers size={18} /> },
  { id: 'shoes', label: '신발', icon: <Footprints size={18} /> },
  { id: 'accRight', label: '악세(우)', icon: <Box size={18} /> },
  { id: 'accLeft', label: '악세(좌)', icon: <Box size={18} /> },
];

const INITIAL_GEAR: GearSet = {
  headUpper: null, headMid: null, headLower: null,
  armor: null, weapon: null, shield: null,
  garment: null, shoes: null, accRight: null, accLeft: null
};

// --- Helper Components ---

const NumberInput = ({ label, value, onChange, suffix }: { label: string, value: number, onChange: (v: number) => void, suffix?: string }) => (
  <div className="flex justify-between items-center bg-gray-50 rounded px-2 py-1.5 border border-gray-200">
    <span className="text-xs font-bold text-gray-500">{label}</span>
    <div className="flex items-center gap-1">
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-12 bg-transparent text-right text-sm font-bold text-gray-900 focus:outline-none"
      />
      {suffix && <span className="text-xs text-gray-400">{suffix}</span>}
      <div className="flex flex-col ml-1">
        <button onClick={() => onChange(value + 1)} className="text-gray-400 hover:text-kafra-600"><ChevronUp size={8} /></button>
        <button onClick={() => onChange(Math.max(0, value - 1))} className="text-gray-400 hover:text-kafra-600"><ChevronDown size={8} /></button>
      </div>
    </div>
  </div>
);

const DamageCalculator: React.FC = () => {
  // --- Gear & Modal State ---
  const [gear, setGear] = useState<GearSet>(INITIAL_GEAR);
  const [searchModal, setSearchModal] = useState<{
    isOpen: boolean;
    slotId: EquipSlotId | null;
    isCardMode: boolean;
    cardSlotIndex: number;
  }>({
    isOpen: false, slotId: null, isCardMode: false, cardSlotIndex: -1
  });
  const [itemDetailModal, setItemDetailModal] = useState<{
    isOpen: boolean;
    item: EquippedItem | null;
  }>({ isOpen: false, item: null });
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<MarketItem[]>([]);

  // --- Skill State ---
  const [skills, setSkills] = useState<SkillData[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<SkillData | null>(null);
  const [skillDamage, setSkillDamage] = useState({ perHit: 0, total: 0 });
  const [skillSearch, setSkillSearch] = useState('');
  const [showSkillDropdown, setShowSkillDropdown] = useState(false);

  // --- Stats State ---
  const [stats, setStats] = useState({
    str: 0, dex: 0, luk: 0, int: 0, baseLv: 0, jobLv: 0, pow: 0, pAtk: 0
  });

  const [weaponInfo, setWeaponInfo] = useState({
    atk: 0, level: 0, refine: 0, grade: WeaponGrade.NONE, type: WeaponType.SWORD_1H
  });

  // Equipment grades for slots that support grades (weapon, armor, headUpper, garment)
  const [equipGrades, setEquipGrades] = useState<Record<string, WeaponGrade>>({
    weapon: WeaponGrade.NONE,
    armor: WeaponGrade.NONE,
    headUpper: WeaponGrade.NONE,
    garment: WeaponGrade.NONE
  });

  const [target, setTarget] = useState({
    def: 0, size: 1, // 0:Small, 1:Medium, 2:Large
  });

  // Parsed Modifiers (Auto-calculated)
  const [autoMods, setAutoMods] = useState<{
    equipAtk: number; atkP: number;
    raceP: number; sizeP: number; elementP: number; bossP: number;
    rangeP: number; meleeP: number; critDmgP: number; ignoreDef: number;
    skillDamage: Record<string, number>;
    cooldownReduction: number; // Skill cooldown reduction %
  }>({
    equipAtk: 0, atkP: 0,
    raceP: 0, sizeP: 0, elementP: 0, bossP: 0,
    rangeP: 0, meleeP: 0, critDmgP: 0, ignoreDef: 0,
    skillDamage: {},
    cooldownReduction: 0
  });

  // Result
  const [result, setResult] = useState({
    min: 0, max: 0, crit: 0, dps: 0
  });

  // --- Load Skills on Mount ---
  useEffect(() => {
    const loadSkills = async () => {
      console.log('🔄 Loading skills from API...');
      try {
        const skillList = await getSkillsWithDamage();
        console.log(`✅ Loaded ${skillList.length} skills:`, skillList.slice(0, 3));
        setSkills(skillList);
        // Auto-select first skill if available
        if (skillList.length > 0) {
          setSelectedSkill(skillList[0]);
          console.log('🎯 Auto-selected:', skillList[0].nameKr);
        } else {
          console.warn('⚠️ No skills with damage data found!');
        }
      } catch (error) {
        console.error('❌ Failed to load skills:', error);
      }
    };
    loadSkills();
  }, []);

  // --- Close dropdown when clicking outside ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Check if click is outside the skill selector
      if (!target.closest('.skill-selector-container')) {
        setShowSkillDropdown(false);
      }
    };

    if (showSkillDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showSkillDropdown]);

  // --- Parsing Logic (Robust Version) ---
  useEffect(() => {
    let newMods = JSON.parse(JSON.stringify(initialMods)); // Deep copy initialization

    // Prepare gear list with current state (refine, grade) merged
    const gearList = Object.entries(gear).map(([slotId, item]) => {
      if (!item) return null;
      const equipped = item as EquippedItem;
      return {
        slotId,
        item: equipped,
        refine: equipped.refine_level || 0,
        grade: (slotId === 'weapon' ? weaponInfo.grade : equipGrades[slotId]) || 'None',
        cachedData: null as any // To store parsed JSON
      };
    }).filter(g => g !== null) as { slotId: string, item: EquippedItem, refine: number, grade: string, cachedData: any }[];

    // ----------------------------------------------------
    // [Phase 1] Individual Item Options (Refine, Grade)
    // ----------------------------------------------------
    gearList.forEach((slot) => {
      const { item, refine, grade } = slot;

      // 1. JSON Parsing
      let data = item.parsedData;
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch (e) {
          console.error('JSON Parse Error', item.name, e);
        }
      } else if (!data && item.parsedStats) {
        // Fallback to parsedStats if no parsedData (legacy)
        data = item.parsedStats;
      }

      // Cache for Phase 2
      slot.cachedData = data;

      if (!data) return;

      console.log(`📊 Phase 1 Processing: ${item.name} (R:${refine}, G:${grade})`, data);

      // 1. Base Options
      if (data.base) mapDbToMods(data.base, newMods);

      // 2. Refine Options (Cumulative 1..Current)
      if (data.refine) {
        for (let i = 1; i <= refine; i++) {
          const refineKey = i.toString();
          if (data.refine[refineKey]) {
            mapDbToMods(data.refine[refineKey], newMods);
          }
        }
      }

      // 3. Grade Options (Cumulative D..Current)
      if (data.grade) {
        const grades = ["D", "C", "B", "A"];
        // Normalize grade string (e.g. "D등급" -> "D")
        const normalizedGrade = grade.replace('등급', '');
        const uIdx = grades.indexOf(normalizedGrade);

        if (uIdx !== -1) {
          for (let i = 0; i <= uIdx; i++) {
            const gKey = grades[i];
            if (data.grade[gKey]) {
              mapDbToMods(data.grade[gKey], newMods);
            }
          }
        }
      }

      // Weapon Stats Update
      if (slot.slotId === 'weapon') {
        if (data.base) {
          // Update weapon info state if needed, or mostly handled by parsing
        }
      }
    });

    // ----------------------------------------------------
    // [Phase 2] Set Effect Calculation (Conditions)
    // ----------------------------------------------------
    gearList.forEach((slot) => {
      const data = slot.cachedData;

      // Handle DB-style sets (if 'sets' key exists in parsedData)
      if (data && data.sets && Array.isArray(data.sets)) {
        data.sets.forEach((setOption: any) => {
          // 1. Find Partner Item
          // Check against Korean Name
          const partner = gearList.find(g => g.item.name.includes(setOption.target_name));

          if (partner) {
            let conditionMet = true;
            const myRefine = slot.refine;
            const partnerRefine = partner.refine;

            // 2. Check Conditions
            if (setOption.conditions) {
              setOption.conditions.forEach((cond: any) => {
                if (cond.type === 'refine_sum') {
                  // "Sum of refine levels >= X"
                  if ((myRefine + partnerRefine) < Number(cond.value)) {
                    conditionMet = false;
                  }
                }
                if (cond.type === 'grade_each') {
                  // "Each item grade >= X"
                  const gMap: Record<string, number> = { 'D': 0, 'C': 1, 'B': 2, 'A': 3, 'None': -1 };
                  const reqGradeVal = gMap[cond.value.replace('등급', '')] || 0;
                  const myGradeVal = gMap[slot.grade.replace('등급', '')] || -1;
                  const pGradeVal = gMap[partner.grade.replace('등급', '')] || -1;

                  if (myGradeVal < reqGradeVal || pGradeVal < reqGradeVal) {
                    conditionMet = false;
                  }
                }
              });
            }

            // 3. Apply Effects if Met
            if (conditionMet) {
              console.log(`🔥 Set Bonus Active: [${slot.item.name} + ${partner.item.name}]`);
              if (setOption.effects) {
                mapDbToMods(setOption.effects, newMods);
              }
            }
          }
        });
      }

      // Fallback: Check 'setEffects' from client-side parsing (parsedStats) if DB sets missing
      // This ensures backward compatibility if DB JSON doesn't have 'sets' yet
      if (data && data.setEffects && Array.isArray(data.setEffects)) {
        data.setEffects.forEach((set: any) => {
          const partner = gearList.find(g => g.item.name.includes(set.targetItemName));
          if (!partner) return;

          let ok = true;
          set.conditions.forEach((cond: any) => {
            if (cond.type === 'refine_sum') {
              if ((slot.refine + partner.refine) < Number(cond.value)) ok = false;
            }
            else if (cond.type === 'grade_each') {
              const gMap: Record<string, number> = { 'D': 0, 'C': 1, 'B': 2, 'A': 3, 'None': -1 };
              const reqVal = gMap[cond.value] || 0;
              const myVal = gMap[slot.grade.replace('등급', '')] || -1;
              const pVal = gMap[partner.grade.replace('등급', '')] || -1;
              if (myVal < reqVal || pVal < reqVal) ok = false;
            }
          });

          if (ok) {
            console.log(`🔥 Client-Parsed Set Active: ${set.targetItemName}`);
            if (set.effects) {
              if (set.effects.atk) newMods.equipAtk += set.effects.atk;
              if (set.effects.atkP) newMods.pAtk += set.effects.atkP;
              // Map other known client-parsed effects manually or assume mapDbToMods structure?
              // Client parser structure differs slightly (skillDamage object vs DB skill_dmg)
              // But mapDbToMods handles 'skill_dmg'. Client parser has 'skillDamage'.
              // Let's manually map crucial ones:
              if (set.effects.skillDamage) {
                Object.entries(set.effects.skillDamage).forEach(([k, v]) => {
                  newMods.skillDmg[k] = (newMods.skillDmg[k] || 0) + (v as number);
                });
              }
              if (set.effects.cooldownReduction) {
                // .. handle CDR
              }
            }
          }
        });
      }
    });

    console.log("🔥 Final Calculated Mods:", newMods);

    // Map DamageMods back to Component State Structure and localized keys
    // Convert English skill keys to Korean names using SKILL_NAME_MAP if needed

    const mappedSkillDamage: Record<string, number> = {};
    Object.entries(newMods.skillDmg).forEach(([key, val]) => {
      const korName = SKILL_NAME_MAP[key] || key;
      mappedSkillDamage[korName] = (mappedSkillDamage[korName] || 0) + (val as number);
    });

    setAutoMods({
      equipAtk: newMods.equipAtk,
      atkP: newMods.pAtk, // DB 'p_atk' -> frontend 'pAtk' (in mapper) -> here mapped to atkP state
      // NOTE: Check if pAtk in mapper is meant for Atk% or Trait P.Atk
      // Based on previous contexts, p_atk often means P.ATK % in private server JSONs.
      raceP: newMods.allRaceP,
      sizeP: newMods.allSizeP,
      elementP: newMods.allEleP,
      bossP: 0,
      rangeP: newMods.rangeP,
      meleeP: newMods.meleeP,
      critDmgP: newMods.critDmgP,
      ignoreDef: 0,
      skillDamage: mappedSkillDamage,
      cooldownReduction: 0 // If supported
    });

    // Cleanup
    // (Weapon WAtk/Lv are updated inside main calculation effect via weaponInfo state, 
    //  but here we should just focus on autoMods)

  }, [gear, weaponInfo.grade, equipGrades]);

  // --- Calculation Logic ---
  useEffect(() => {
    // 1. Status ATK
    // Formula: (STR + [DEX/5] + [LUK/3] + [BLv/4]) * 2 + (POW * 5)
    // Note: POW is 4th job stat, assumed additive similar to others but with higher multiplier
    const statAtk = (stats.str + Math.floor(stats.luk / 3) + Math.floor(stats.dex / 5) + Math.floor(stats.baseLv / 4)) * 2 + (stats.pow * 5);
    const pAtkMult = 1 + (stats.pAtk / 100);
    // Mastery ATK is added to Status ATK but is not affected by Element% (property of skill usually) or Size%? 
    // User says: "Status ATK + Mastery ATK ... are unaffected by Element Resist%". 
    // Usually Mastery ATK is added at the end of Status ATK calculation.

    // 2. Weapon ATK
    let wAtk = weaponInfo.atk;
    let wLv = weaponInfo.level;
    let wRefine = weaponInfo.refine;

    // Refine ATK (Basic)
    // Lv1: 2*R, Lv2: 3*R, Lv3: 5*R, Lv4: 7*R
    const refineBonusFactor = [0, 2, 3, 5, 7]; // Index 0 is dummy
    let refineAtk = wRefine * (refineBonusFactor[wLv] || 0);

    // Over Refine ATK
    // Safe Limits: Lv1:7, Lv2:6, Lv3:5, Lv4:4
    const safeLimit = [0, 7, 6, 5, 4];
    const overRefineBonusFactor = [0, 3, 5, 8, 14];
    let overRefineAtk = 0;
    if (wRefine > (safeLimit[wLv] || 20)) {
      overRefineAtk = (wRefine - safeLimit[wLv]) * (overRefineBonusFactor[wLv] || 0);
    }

    // Variance: ± 0.05 * Lv * WeaponATK
    const variance = 0.05 * wLv * wAtk;

    // STR Bonus: WeaponATK * (STR / 200)
    // Note: Use DEX for Ranged Weapons (Bow, Gun, Instrument, Whip)
    const isRangedWeapon = [WeaponType.BOW, WeaponType.GUN, WeaponType.INSTRUMENT, WeaponType.WHIP].includes(weaponInfo.type); // Simplified check
    const statForBonus = isRangedWeapon ? stats.dex : stats.str;
    const strBonus = wAtk * (statForBonus / 200);

    // Total Weapon ATK (Before Size) = Base + Refine + OverRefine + Variance + STRBonus
    // User Formula: "Total Equip ATK = Weapon ATK + Refine ATK + OverRefine + Random + Equip ATK + STR Bonus" ... wait.
    // User "Advanced" formula: ((Weapon + Refine + Over + Random) * Size + Equip) ...
    // So Equip ATK is OUTSIDE Size Penalty.

    const wAtkBase = wAtk + refineAtk + overRefineAtk + strBonus;

    // Size Penalty
    const sizeP = SIZE_PENALTY[weaponInfo.type][target.size] / 100;

    // Min/Max Weapon ATK (Applying Size Penalty only to weapon components)
    // Note: User says "Equip ATK is not affected by Weapon Size Penalty".
    // Weapon components subject to size penalty: Weapon ATK, Refine, Over Refine, Random?
    // Formula says: ((Weapon + Refine + OverRefine + Random) * Size ...
    // So YES, all those are subject to size.

    // Random is ± range.
    const wAtkMinRaw = (wAtk + refineAtk + overRefineAtk - variance);
    const wAtkMaxRaw = (wAtk + refineAtk + overRefineAtk + variance);

    // Apply Size Penalty
    const wAtkMinSized = wAtkMinRaw * sizeP;
    const wAtkMaxSized = wAtkMaxRaw * sizeP;

    // 3. Equipment ATK (from cards, armor, etc) - Added AFTER Size Penalty
    const equipAtk = autoMods.equipAtk;

    // 4. Modifiers
    // Formula: ( ... + Equip ATK ) * (Race + Slaughter) * Size * Boss * ATK% * Element * Resist
    // Note: This "Size" here is "Size Damage %" card (e.g. Skeleton Worker), NOT Weapon Size Penalty.

    const raceP = 1 + (autoMods.raceP / 100); // + Slaughter (ignored for now)
    const sizeModP = 1 + (autoMods.sizeP / 100); // Card Size %
    const bossP = 1 + (autoMods.bossP / 100);
    const atkP = 1 + (autoMods.atkP / 100);
    const elemP = 1 + (autoMods.elementP / 100);

    const finalModMult = raceP * sizeModP * bossP * atkP * elemP;

    // Calculate Advanced Equip ATK
    const advEquipAtkMin = (wAtkMinSized + equipAtk + strBonus) * finalModMult; // Wait, STR bonus is part of weapon or equip? 
    // User Formula: "Total Equip ATK = ... + STR Bonus"
    // "Advanced = ((Weapon...Random)*Size + Equip) ..."
    // It implies STR Bonus describes "Equip_ATK" part or is missed?
    // Standard Renewal: STR Bonus is WeaponATK * STR/200. It behaves like Weapon ATK.
    // Let's add it to the Sized group.

    const wAtkMinSizedFinal = (wAtkMinRaw + strBonus) * sizeP;
    const wAtkMaxSizedFinal = (wAtkMaxRaw + strBonus) * sizeP;

    const advEquipAtkMin2 = (wAtkMinSizedFinal + equipAtk) * finalModMult;
    const advEquipAtkMax2 = (wAtkMaxSizedFinal + equipAtk) * finalModMult;

    // Final Calculation
    // Total ATK = (Status + AdvancedEquip) * ...

    const finalStatAtk = statAtk * pAtkMult;

    const totalAtkMin = (statAtk + advEquipAtkMin2) * pAtkMult;
    const totalAtkMax = (statAtk + advEquipAtkMax2) * pAtkMult;

    // Final Multipliers
    const rangeMult = 1 + (Math.max(autoMods.rangeP, autoMods.meleeP) / 100);

    // 스킬 배율: 선택된 스킬의 배율 사용 (없으면 0)
    const skillPercent = selectedSkill ? selectedSkill.damagePercent : 0;
    const skillMult = skillPercent / 100;
    const skillHits = selectedSkill ? (selectedSkill.hits > 100 ? 1 : (selectedSkill.hits || 1)) : 1;

    const critMod = 1.4 + (autoMods.critDmgP / 100);

    // Def Reduction
    const effectiveDef = target.def * (1 - autoMods.ignoreDef / 100);
    const defReduction = (4000 + effectiveDef) / 4000;

    // 1타 데미지
    const perHitMin = Math.floor((totalAtkMin * rangeMult * skillMult) / defReduction);
    const perHitMax = Math.floor((totalAtkMax * rangeMult * skillMult) / defReduction);

    // 총 데미지 (타수 적용)
    const finalMin = perHitMin * skillHits;
    const finalMax = perHitMax * skillHits;

    // Crit (In Renewal, Crit DOES NOT ignore DEF. It just adds 1.4x damage.)
    const critDmg = Math.floor((totalAtkMax * critMod * rangeMult * skillMult) / defReduction) * skillHits;

    // DPS 계산 (쿨타임 기반)
    const avgDmg = (finalMin + finalMax) / 2;
    // 기본 쿨타임 1초 (스킬마다 다를 수 있지만 일단 기본값 사용)
    const baseSkillCooldown = 1.0; // 초 단위
    // 쿨타임 감소 적용
    const actualCooldown = baseSkillCooldown * (1 - autoMods.cooldownReduction / 100);
    const dps = actualCooldown > 0 ? Math.floor(avgDmg / actualCooldown) : 0;

    setResult({
      min: finalMin,
      max: finalMax,
      crit: critDmg,
      dps: dps
    });

  }, [stats, weaponInfo, target, autoMods, selectedSkill]);

  // --- Skill Damage Calculation ---
  useEffect(() => {
    if (!selectedSkill) {
      setSkillDamage({ perHit: 0, total: 0 });
      return;
    }

    console.log('🎯 스킬 선택:', selectedSkill.nameKr, `(${selectedSkill.damagePercent}% × ${selectedSkill.hits}회)`);

    // Calculate base ATK (simplified for now)
    const statAtk = (stats.str + Math.floor(stats.luk / 3) + Math.floor(stats.dex / 5) + Math.floor(stats.baseLv / 4)) * 2 + (stats.pow * 5);
    const pAtkMult = 1 + (stats.pAtk / 100);
    const baseAtk = statAtk * pAtkMult + autoMods.equipAtk;

    // Use SkillLogic
    const skillData = {
      skillId: selectedSkill.engName,
      basePercent: selectedSkill.damagePercent,
      hits: selectedSkill.hits > 100 ? 1 : (selectedSkill.hits || 1)  // 안전장치 적용
    };

    const userStats = {
      baseLv: stats.baseLv,
      jobLv: stats.jobLv,
      str: stats.str,
      dex: stats.dex,
      pow: stats.pow,
      pAtk: stats.pAtk,
      // Status flags (add UI for these later)
      isCloaking: false,
      isBackstab: false,
      targetIsBoss: false
    };

    const damage = calculateSkillDamage(skillData, userStats, baseAtk);
    console.log('📊 데미지 계산:', damage);
    setSkillDamage(damage);

  }, [selectedSkill, stats, autoMods]);


  // --- Handlers ---
  const handleSkillSelect = (skill: SkillData) => {
    console.log('🎯 스킬 선택 핸들러:', skill.nameKr, `(${skill.damagePercent}% × ${skill.hits}회)`);
    setShowSkillDropdown(false);
    setSkillSearch(skill.nameKr);
    // Force immediate update by using functional setState
    setSelectedSkill((prev) => {
      console.log('📌 이전 스킬:', prev?.nameKr || 'null');
      console.log('📌 새 스킬:', skill.nameKr);
      return skill;
    });
  };

  const handleSlotClick = (slotId: EquipSlotId) => {
    setSearchModal({ isOpen: true, slotId, isCardMode: false, cardSlotIndex: -1 });
    setSearchResults([]); setSearchQuery('');
  };

  const performSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      // NOTE: We currently search by name for ALL categories because the backend doesn't support category filtering yet.
      // The frontend will display whatever the backend returns for the keyword.
      let rawResults = await searchItems(searchQuery);

      // Client-side filtering
      let category = '전체';
      if (searchModal.isCardMode) {
        category = '카드';
      } else if (searchModal.slotId) {
        const slotLabel = SLOTS.find(s => s.id === searchModal.slotId)?.label || '';
        if (slotLabel === '무기') category = '무기';
        else category = '방어구';
      }

      // Import the filter function first (I need to import it up top, but I can't do it in this block.
      // Wait, I need to update the import statement too. For now, assume I will update the import in the next step or use helper if exported.)
      // Be better to update import simultaneously or use 'import { ... }' at top.
      const { filterItemsByCategory } = await import('../services/itemService');
      const filteredResults = filterItemsByCategory(rawResults, category);

      setSearchResults(filteredResults);
    } catch (error) { console.error(error); } finally { setIsSearching(false); }
  };

  const equipItem = (item: MarketItem) => {
    if (!searchModal.slotId) return;
    setGear(prev => {
      // Basic equip logic
      if (searchModal.isCardMode) {
        const target = prev[searchModal.slotId];
        if (!target) return prev;
        const cards = target.userCards || Array(target.card_slots).fill(null);
        cards[searchModal.cardSlotIndex] = item;
        return { ...prev, [searchModal.slotId]: { ...target, userCards: cards } };
      } else {
        const cards = Array(item.card_slots).fill(null);
        return { ...prev, [searchModal.slotId]: { ...item, userCards: cards } };
      }
    });
    setSearchModal({ isOpen: false, slotId: null, isCardMode: false, cardSlotIndex: -1 });
  };

  const unequip = (e: React.MouseEvent, slotId: EquipSlotId) => {
    e.stopPropagation();
    setGear(prev => ({ ...prev, [slotId]: null }));
  }

  return (
    <div className="max-w-[1400px] mx-auto pb-20 animate-fade-in flex flex-col xl:flex-row gap-6">

      {/* Left: Gear Panel */}
      <div className="flex-1 space-y-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2"><Swords className="text-kafra-600" size={18} /> 장비 세팅</h3>
            <button onClick={() => setGear(INITIAL_GEAR)} className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1"><RotateCcw size={12} /> 초기화</button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {SLOTS.map(slot => {
              const item = gear[slot.id];
              return (
                <div
                  key={slot.id}
                  onClick={() => handleSlotClick(slot.id)}
                  className={`relative border-2 rounded-xl p-2 cursor-pointer transition-all h-20 flex items-center gap-3 ${item ? 'border-kafra-200 bg-blue-50/30' : 'border-dashed border-gray-100 hover:border-gray-300'}`}
                >
                  <div
                    className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 cursor-pointer hover:bg-gray-100 transition"
                    onClick={(e) => {
                      if (item) {
                        e.stopPropagation();
                        setItemDetailModal({ isOpen: true, item });
                      }
                    }}
                  >
                    {item ? <img src={item.image_placeholder} className="w-full h-full object-cover rounded-lg" /> : <span className="text-gray-300">{slot.icon}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] text-gray-400 font-bold uppercase">{slot.label}</div>
                    <div className="flex items-center gap-1">
                      {/* Refine input for refinable slots */}
                      {item && ['weapon', 'armor', 'garment', 'shoes', 'headUpper'].includes(slot.id) && (
                        <div className="flex items-center bg-gray-100 rounded px-1 py-0.5" onClick={(e) => e.stopPropagation()}>
                          <span className="text-[9px] text-gray-500">R</span>
                          <input
                            type="number"
                            min="0" max="25"
                            value={item.refine_level}
                            onChange={(e) => {
                              const val = Math.max(0, Math.min(25, parseInt(e.target.value) || 0));
                              setGear(prev => {
                                const old = prev[slot.id];
                                return old ? { ...prev, [slot.id]: { ...old, refine_level: val } } : prev;
                              });
                            }}
                            className="w-8 bg-transparent text-[10px] font-bold text-center focus:outline-none text-amber-600 appearance-none"
                          />
                        </div>
                      )}
                      {/* Grade selector for weapon, armor, headUpper, garment */}
                      {item && ['weapon', 'armor', 'headUpper', 'garment'].includes(slot.id) && (
                        <select
                          value={slot.id === 'weapon' ? weaponInfo.grade : equipGrades[slot.id]}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            const newGrade = e.target.value as WeaponGrade;
                            if (slot.id === 'weapon') {
                              setWeaponInfo(prev => ({ ...prev, grade: newGrade }));
                            } else {
                              setEquipGrades(prev => ({ ...prev, [slot.id]: newGrade }));
                            }
                          }}
                          className="bg-gray-100 text-[9px] font-bold text-purple-600 px-1 py-0.5 rounded focus:outline-none appearance-none cursor-pointer"
                        >
                          <option value={WeaponGrade.NONE}>무</option>
                          <option value={WeaponGrade.D}>D</option>
                          <option value={WeaponGrade.C}>C</option>
                          <option value={WeaponGrade.B}>B</option>
                          <option value={WeaponGrade.A}>A</option>
                        </select>
                      )}
                      <div className="text-xs font-bold text-gray-900 truncate">
                        {item ? item.name : <span className="text-gray-300">장착 대기</span>}
                      </div>
                    </div>
                    {/* Card Slots */}
                    {item && (item.card_slots > 0) && (
                      <div className="flex gap-1 mt-1">
                        {Array.from({ length: item.card_slots }).map((_, i) => (
                          <div key={i}
                            onClick={(e) => { e.stopPropagation(); setSearchModal({ isOpen: true, slotId: slot.id, isCardMode: true, cardSlotIndex: i }); setSearchResults([]); setSearchQuery(''); }}
                            className={`w-3 h-3 rounded-full border flex items-center justify-center ${item.userCards?.[i] ? 'bg-yellow-400 border-yellow-500' : 'bg-gray-200 border-gray-300 hover:bg-gray-300'}`}
                          ></div>
                        ))}
                      </div>
                    )}
                  </div>
                  {item && <button onClick={(e) => unequip(e, slot.id)} className="absolute top-1 right-1 text-gray-300 hover:text-red-500 p-1"><X size={12} /></button>}
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4"><Crosshair className="text-kafra-600" size={18} /> 스탯 & 타겟</h3>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <NumberInput label="STR" value={stats.str} onChange={v => setStats({ ...stats, str: v })} />
            <NumberInput label="AGI" value={100} onChange={() => { }} suffix="(ASPD)" />
            <NumberInput label="DEX" value={stats.dex} onChange={v => setStats({ ...stats, dex: v })} />
            <NumberInput label="LUK" value={stats.luk} onChange={v => setStats({ ...stats, luk: v })} />
            <NumberInput label="POW" value={stats.pow} onChange={v => setStats({ ...stats, pow: v })} />
            <NumberInput label="P.ATK" value={stats.pAtk} onChange={v => setStats({ ...stats, pAtk: v })} />
            <NumberInput label="BaseLv" value={stats.baseLv} onChange={v => setStats({ ...stats, baseLv: v })} />
          </div>
          <div className="border-t border-gray-100 pt-3 grid grid-cols-2 gap-3">
            <NumberInput label="타겟 방어(DEF)" value={target.def} onChange={v => setTarget({ ...target, def: v })} />
            <div className="flex justify-between items-center bg-gray-50 rounded px-2 py-1.5 border border-gray-200">
              <span className="text-xs font-bold text-gray-500">크기</span>
              <select className="bg-transparent text-xs font-bold" value={target.size} onChange={e => setTarget({ ...target, size: Number(e.target.value) })}>
                <option value={0}>소형</option>
                <option value={1}>중형</option>
                <option value={2}>대형</option>
              </select>
            </div>
          </div>
        </div>

        {/* Skill Selector */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4"><Zap className="text-kafra-600" size={18} /> 스킬 선택</h3>

          {/* Searchable Input */}
          <div className="relative skill-selector-container">
            <input
              type="text"
              value={skillSearch}
              onChange={(e) => {
                console.log('🔍 검색어 변경:', e.target.value);
                setSkillSearch(e.target.value);
                setShowSkillDropdown(true);
              }}
              onFocus={(e) => {
                console.log('⚡ 포커스');
                setShowSkillDropdown(true);
                e.target.select(); // 텍스트 전체 선택
              }}
              placeholder="스킬 이름 검색... (예: 체이싱 브레이크)"
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold focus:outline-none focus:border-kafra-500"
            />

            {/* Filtered Skill List */}
            {showSkillDropdown && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-y-auto" style={{ bottom: 'auto', top: '100%' }}>
                {skills.length === 0 && (
                  <div className="px-3 py-2 text-xs text-gray-400">
                    ⚠️ 스킬 데이터를 로딩 중... (백엔드가 실행 중인지 확인하세요)
                  </div>
                )}
                {skills
                  .filter(s => s.nameKr.includes(skillSearch) || s.engName.toLowerCase().includes(skillSearch.toLowerCase()))
                  .slice(0, 20)
                  .map(skill => {
                    // 안전장치: 비정상적인 hits 값(100 이상)은 1로 표시
                    const displayHits = skill.hits > 100 ? 1 : (skill.hits || 1);
                    return (
                      <div
                        key={skill.engName}
                        onMouseDown={(e) => {
                          e.preventDefault(); // Prevent blur
                          handleSkillSelect(skill);
                        }}
                        className="px-3 py-2 hover:bg-kafra-50 cursor-pointer border-b border-gray-100 last:border-0"
                      >
                        <div className="text-sm font-bold text-gray-900">{skill.nameKr}</div>
                        <div className="text-xs text-gray-500">{skill.damagePercent}% × {displayHits}회</div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Selected Skill Display */}
          {selectedSkill && (
            <div className="mt-3 p-3 bg-kafra-50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <div className="text-sm font-bold text-kafra-700">{selectedSkill.nameKr}</div>
                <div className="text-xs text-gray-500">{selectedSkill.damagePercent}% × {selectedSkill.hits > 100 ? 1 : (selectedSkill.hits || 1)}회</div>
              </div>
              <div className="text-xs text-gray-500 mb-1">스킬 데미지</div>
              <div className="text-2xl font-black text-kafra-600">{skillDamage.total.toLocaleString()}</div>
              <div className="text-xs text-gray-500 mt-1">1타: {skillDamage.perHit.toLocaleString()} × {selectedSkill.hits > 100 ? 1 : (selectedSkill.hits || 1)}회</div>
            </div>
          )}
        </div>
      </div>

      {/* Right: Results Panel */}
      <div className="w-full xl:w-96 space-y-4">

        {/* Main Damage Display */}
        <div className="bg-gray-900 text-white rounded-2xl p-6 shadow-xl border-t-4 border-kafra-500">
          <div className="flex items-center gap-2 mb-6 opacity-80">
            <Target size={20} className="animate-pulse text-kafra-400" />
            <span className="font-bold text-sm tracking-widest uppercase text-kafra-100">Predicted Damage</span>
          </div>
          <div className="space-y-6">
            <div>
              <div className="text-xs font-bold text-gray-400 mb-1 uppercase">Final Damage</div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black">{result.min.toLocaleString()}</span>
                <span className="text-gray-500">~</span>
                <span className="text-3xl font-black">{result.max.toLocaleString()}</span>
              </div>
            </div>
            <div>
              <div className="text-xs font-bold text-amber-400 mb-1 uppercase flex items-center gap-1"><Zap size={12} /> Critical</div>
              <div className="text-4xl font-black text-white tracking-tighter drop-shadow-lg">{result.crit.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Auto Calculated Mods List */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm h-full max-h-[500px] overflow-y-auto custom-scrollbar">
          <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-1.5">
            <ShieldAlert size={14} /> 자동 적용 옵션 (Auto Mods)
          </h4>
          <div className="space-y-1">
            {autoMods.equipAtk > 0 && <div className="flex justify-between text-xs py-1 px-2 bg-gray-50 rounded"><span className="text-gray-600">장비 ATK 합</span><span className="font-bold">+{autoMods.equipAtk}</span></div>}
            {autoMods.atkP > 0 && <div className="flex justify-between text-xs py-1 px-2 bg-gray-50 rounded"><span className="text-gray-600">ATK %</span><span className="font-bold">+{autoMods.atkP}%</span></div>}
            {autoMods.critDmgP > 0 && <div className="flex justify-between text-xs py-1 px-2 bg-yellow-50 rounded"><span className="text-yellow-700">크리티컬 증뎀</span><span className="font-bold text-yellow-700">+{autoMods.critDmgP}%</span></div>}
            {autoMods.raceP > 0 && <div className="flex justify-between text-xs py-1 px-2 bg-gray-50 rounded"><span className="text-gray-600">종족 증뎀</span><span className="font-bold">+{autoMods.raceP}%</span></div>}
            {autoMods.sizeP > 0 && <div className="flex justify-between text-xs py-1 px-2 bg-gray-50 rounded"><span className="text-gray-600">크기 증뎀</span><span className="font-bold">+{autoMods.sizeP}%</span></div>}
            {autoMods.bossP > 0 && <div className="flex justify-between text-xs py-1 px-2 bg-gray-50 rounded"><span className="text-gray-600">보스 증뎀</span><span className="font-bold">+{autoMods.bossP}%</span></div>}
            {autoMods.rangeP > 0 && <div className="flex justify-between text-xs py-1 px-2 bg-green-50 rounded"><span className="text-green-700">원거리 증뎀</span><span className="font-bold text-green-700">+{autoMods.rangeP}%</span></div>}
            {autoMods.meleeP > 0 && <div className="flex justify-between text-xs py-1 px-2 bg-red-50 rounded"><span className="text-red-700">근접 증뎀</span><span className="font-bold text-red-700">+{autoMods.meleeP}%</span></div>}
            {autoMods.ignoreDef > 0 && <div className="flex justify-between text-xs py-1 px-2 bg-blue-50 rounded"><span className="text-blue-600">방어력 무시</span><span className="font-bold text-blue-600">{autoMods.ignoreDef}%</span></div>}
            {/* Skill-specific damage bonuses */}
            {Object.keys(autoMods.skillDamage).length > 0 && (
              <>
                <div className="text-[10px] font-bold text-purple-500 uppercase mt-2 pt-2 border-t border-gray-100">스킬 증뎀</div>
                {Object.entries(autoMods.skillDamage).map(([skillName, value]) => (
                  <div key={skillName} className="flex justify-between text-xs py-1 px-2 bg-purple-50 rounded">
                    <span className="text-purple-700 truncate">{skillName}</span>
                    <span className="font-bold text-purple-700">+{value}%</span>
                  </div>
                ))}
              </>
            )}
            {autoMods.cooldownReduction > 0 && <div className="flex justify-between text-xs py-1 px-2 bg-indigo-50 rounded"><span className="text-indigo-600">스킬 쿨타임 감소</span><span className="font-bold text-indigo-600">-{autoMods.cooldownReduction}%</span></div>}
          </div>
        </div>
      </div>

      {/* --- Search Modal (Reused Logic) --- */}
      {searchModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setSearchModal({ ...searchModal, isOpen: false })}></div>
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl relative z-10 flex flex-col max-h-[80vh] animate-slide-up">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                {searchModal.isCardMode ? <Zap size={18} className="text-yellow-500" /> : <Search size={18} className="text-kafra-500" />}
                {searchModal.isCardMode ? '카드 검색' : '장비 검색'}
              </h3>
              <button onClick={() => setSearchModal({ ...searchModal, isOpen: false })} className="p-2 hover:bg-gray-100 rounded-full text-gray-400"><X size={20} /></button>
            </div>
            <div className="p-4 bg-gray-50 border-b border-gray-100">
              <form onSubmit={performSearch} className="flex gap-2">
                <input autoFocus type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="검색어 입력..." className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-kafra-500 text-sm font-bold" />
                <button type="submit" disabled={isSearching} className="bg-gray-900 text-white px-5 rounded-xl font-bold text-sm hover:bg-black disabled:opacity-50">{isSearching ? '...' : '검색'}</button>
              </form>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {isSearching ? <div className="py-12 text-center text-gray-400">검색 중...</div> : searchResults.length > 0 ? (
                <div className="space-y-1">
                  {searchResults.map((item) => (
                    <div key={item.id} onClick={() => equipItem(item)} className="flex items-center gap-3 p-3 hover:bg-blue-50 rounded-xl cursor-pointer border border-transparent hover:border-blue-100 transition-all">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden shrink-0"><img src={item.image_placeholder} onError={(e) => e.currentTarget.src = 'https://via.placeholder.com/64?text=No+Img'} className="w-full h-full object-cover" /></div>
                      <div className="flex-1">
                        <div className="font-bold text-gray-900 text-sm">
                          {item.refine_level > 0 && <span className="text-amber-500">+{item.refine_level} </span>}
                          {item.name}
                        </div>
                        <div className="text-xs text-gray-400 line-clamp-1">
                          {item.description ? item.description.replace(/\\n/g, ' ').substring(0, 50) + '...' : '설명 없음'}
                        </div>
                      </div>
                      <button className="text-xs font-bold text-white bg-kafra-500 px-3 py-1.5 rounded-lg">선택</button>
                    </div>
                  ))}
                </div>
              ) : <div className="py-12 text-center text-gray-400 text-sm">결과가 없습니다.</div>}
            </div>
          </div>
        </div>
      )}

      {/* --- Item Detail Modal --- */}
      {itemDetailModal.isOpen && itemDetailModal.item && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setItemDetailModal({ isOpen: false, item: null })}></div>
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl relative z-10 flex flex-col max-h-[80vh] animate-slide-up">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <img src={itemDetailModal.item.image_placeholder} className="w-12 h-12 rounded-lg border border-gray-200" />
                <div>
                  <h3 className="font-bold text-gray-900">{itemDetailModal.item.name}</h3>
                  {itemDetailModal.item.refine_level > 0 && (
                    <span className="text-xs text-amber-600 font-bold">+{itemDetailModal.item.refine_level} 제련</span>
                  )}
                </div>
              </div>
              <button onClick={() => setItemDetailModal({ isOpen: false, item: null })} className="p-2 hover:bg-gray-100 rounded-full text-gray-400"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {itemDetailModal.item.parsedStats ? (
                <div className="space-y-3">
                  {/* Base Stats */}
                  {(itemDetailModal.item.parsedStats.baseAtk || itemDetailModal.item.parsedStats.weaponLevel) && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs font-bold text-gray-500 mb-2">기본 정보</div>
                      {itemDetailModal.item.parsedStats.baseAtk && <div className="text-sm">공격력: <span className="font-bold">{itemDetailModal.item.parsedStats.baseAtk}</span></div>}
                      {itemDetailModal.item.parsedStats.weaponLevel && <div className="text-sm">무기 레벨: <span className="font-bold">{itemDetailModal.item.parsedStats.weaponLevel}</span></div>}
                    </div>
                  )}
                  {/* Raw Description */}
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="text-xs font-bold text-blue-600 mb-2">아이템 설명</div>
                    <div className="text-xs text-gray-700 whitespace-pre-line leading-relaxed">
                      {itemDetailModal.item.description
                        ?.replace(/\\n/g, '\n')
                        .replace(/\^[0-9a-fA-F]{6}/g, '')
                        .replace(/\*\^?[0-9a-fA-F]{6}/g, '')
                        .replace(/\*(?=\S)/g, '')
                        .replace(/[□■◆◇]/g, '•')
                        .trim()
                      }
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500">파싱된 정보가 없습니다.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DamageCalculator;
