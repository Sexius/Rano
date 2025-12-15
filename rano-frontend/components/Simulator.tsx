
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Shield, Sword, Shirt, Footprints, Crown, Glasses, 
  Component, Box, Search, X, Zap, RotateCcw, 
  Layers, User as UserIcon, PlusCircle, ChevronUp, ChevronDown, 
  BarChart3, Hash, Swords, Target, Sparkles, Ghost, Calculator, Skull
} from 'lucide-react';
import { EquipSlotId, GearSet, MarketItem, EquippedItem } from '../types';
import { searchItemsWithGemini } from '../services/geminiService';

// --- Enums for Calc ---
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

// --- Slot Configuration ---
const SLOTS: { id: EquipSlotId; label: string; icon: React.ReactNode }[] = [
  { id: 'headUpper', label: '투구(상단)', icon: <Crown size={20} /> },
  { id: 'headMid', label: '투구(중단)', icon: <Glasses size={20} /> },
  { id: 'headLower', label: '투구(하단)', icon: <Component size={20} /> },
  { id: 'armor', label: '갑옷', icon: <Shirt size={20} /> },
  { id: 'weapon', label: '무기', icon: <Sword size={20} /> },
  { id: 'shield', label: '방패', icon: <Shield size={20} /> },
  { id: 'garment', label: '걸칠것', icon: <Layers size={20} /> },
  { id: 'shoes', label: '신발', icon: <Footprints size={20} /> },
  { id: 'accRight', label: '악세(우)', icon: <Box size={20} /> },
  { id: 'accLeft', label: '악세(좌)', icon: <Box size={20} /> },
];

const INITIAL_GEAR: GearSet = {
  headUpper: null, headMid: null, headLower: null,
  armor: null, weapon: null, shield: null,
  garment: null, shoes: null, accRight: null, accLeft: null
};

// --- Interfaces for Stats ---
interface BaseStats {
  str: number; agi: number; vit: number; int: number; dex: number; luk: number;
}
interface TraitStats {
  pow: number; sta: number; wis: number; spl: number; con: number; crt: number;
}
interface ParsedBonuses {
  str: number; agi: number; vit: number; int: number; dex: number; luk: number;
  atk: number; matk: number; def: number; mdef: number;
  hit: number; flee: number; cri: number; aspd: number;
  atkP: number; matkP: number;
  rangeP: number; meleeP: number;
  bossP: number; raceP: number; sizeP: number;
  ignoreDef: number;
  critDmgP: number;
  hp: number; sp: number;
  hpP: number; spP: number;
}
interface WeaponInfo {
  atk: number;
  level: number;
  refine: number;
  type: WeaponType;
}

const INITIAL_PARSED: ParsedBonuses = {
  str: 0, agi: 0, vit: 0, int: 0, dex: 0, luk: 0,
  atk: 0, matk: 0, def: 0, mdef: 0,
  hit: 0, flee: 0, cri: 0, aspd: 0,
  atkP: 0, matkP: 0, rangeP: 0, meleeP: 0, bossP: 0, raceP: 0, sizeP: 0, ignoreDef: 0,
  critDmgP: 0,
  hp: 0, sp: 0, hpP: 0, spP: 0
};

type GearType = 'normal' | 'shadow' | 'costume';
type TabType = 'normal' | 'special' | 'calc';

const Simulator: React.FC = () => {
  // --- Gear State ---
  const [activeTab, setActiveTab] = useState<TabType>('normal');
  const [normalGear, setNormalGear] = useState<GearSet>(INITIAL_GEAR);
  const [shadowGear, setShadowGear] = useState<GearSet>(INITIAL_GEAR);
  const [costumeGear, setCostumeGear] = useState<GearSet>(INITIAL_GEAR);

  // --- Stats State ---
  const [baseStats, setBaseStats] = useState<BaseStats>({ str: 120, agi: 100, vit: 50, int: 1, dex: 100, luk: 1 });
  const [traitStats, setTraitStats] = useState<TraitStats>({ pow: 0, sta: 0, wis: 0, spl: 0, con: 0, crt: 0 });
  const [bonuses, setBonuses] = useState<ParsedBonuses>(INITIAL_PARSED);
  const [weaponInfo, setWeaponInfo] = useState<WeaponInfo>({ atk: 0, level: 4, refine: 0, type: WeaponType.SWORD_1H });
  const [rightPanelTab, setRightPanelTab] = useState<'status' | 'bonus'>('status');

  // --- Calc State ---
  const [calcConfig, setCalcConfig] = useState({
     targetDef: 100, targetSize: 1, // 0:Small, 1:Medium, 2:Large
     skillPercent: 100, masteryAtk: 0,
     baseLv: 250
  });
  const [calcResult, setCalcResult] = useState({ min: 0, max: 0, crit: 0 });

  // Search Modal State
  const [searchModal, setSearchModal] = useState<{
    isOpen: boolean;
    slotId: EquipSlotId | null;
    gearType: GearType;
    isCardMode: boolean;
    cardSlotIndex: number; 
  }>({
    isOpen: false, slotId: null, gearType: 'normal', isCardMode: false, cardSlotIndex: -1
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<MarketItem[]>([]);

  // --- Parsing Logic ---
  useEffect(() => {
    const newBonuses: ParsedBonuses = { ...INITIAL_PARSED };
    let wAtk = 0;
    let wLv = 4;
    let wRefine = 0;
    
    const parseString = (str: string) => {
      if (/STR\s*\+\s*(\d+)/i.test(str)) newBonuses.str += parseInt(RegExp.$1);
      if (/AGI\s*\+\s*(\d+)/i.test(str)) newBonuses.agi += parseInt(RegExp.$1);
      if (/VIT\s*\+\s*(\d+)/i.test(str)) newBonuses.vit += parseInt(RegExp.$1);
      if (/INT\s*\+\s*(\d+)/i.test(str)) newBonuses.int += parseInt(RegExp.$1);
      if (/DEX\s*\+\s*(\d+)/i.test(str)) newBonuses.dex += parseInt(RegExp.$1);
      if (/LUK\s*\+\s*(\d+)/i.test(str)) newBonuses.luk += parseInt(RegExp.$1);
      
      if (/ATK\s*\+\s*(\d+)(?!%)/i.test(str)) newBonuses.atk += parseInt(RegExp.$1);
      if (/MATK\s*\+\s*(\d+)(?!%)/i.test(str)) newBonuses.matk += parseInt(RegExp.$1);
      if (/HIT\s*\+\s*(\d+)/i.test(str)) newBonuses.hit += parseInt(RegExp.$1);
      if (/FLEE\s*\+\s*(\d+)/i.test(str)) newBonuses.flee += parseInt(RegExp.$1);
      if (/(CRI|Critical)\s*\+\s*(\d+)/i.test(str)) newBonuses.cri += parseInt(RegExp.$2);
      if (/ASPD\s*\+\s*(\d+)(?!%)/i.test(str)) newBonuses.aspd += parseInt(RegExp.$1);

      if (/ATK\s*\+\s*(\d+)%/i.test(str)) newBonuses.atkP += parseInt(RegExp.$1);
      if (/MATK\s*\+\s*(\d+)%/i.test(str)) newBonuses.matkP += parseInt(RegExp.$1);
      if (/원거리\s*물리\s*데미지\s*(\d+)%/i.test(str)) newBonuses.rangeP += parseInt(RegExp.$1);
      if (/근접\s*물리\s*데미지\s*(\d+)%/i.test(str)) newBonuses.meleeP += parseInt(RegExp.$1);
      if (/(모든|전체)\s*크기.*(\d+)%/i.test(str)) newBonuses.sizeP += parseInt(RegExp.$2);
      if (/(모든|전체)\s*종족.*(\d+)%/i.test(str)) newBonuses.raceP += parseInt(RegExp.$2);
      if (/보스.*(\d+)%/i.test(str)) newBonuses.bossP += parseInt(RegExp.$1);
      if (/방어력.*무시\s*(\d+)%/i.test(str)) newBonuses.ignoreDef += parseInt(RegExp.$1);
      if (/(크리티컬|크리).*데미지\s*(\d+)%/i.test(str)) newBonuses.critDmgP += parseInt(RegExp.$2);

      // Weapon parsing
      if (/공격\s*:\s*(\d+)/.test(str)) wAtk = parseInt(RegExp.$1);
      if (/무기레벨\s*:\s*(\d+)/.test(str)) wLv = parseInt(RegExp.$1);
    };

    const allGears = [
      ...Object.values(normalGear),
      ...Object.values(shadowGear),
      ...Object.values(costumeGear)
    ] as (EquippedItem | null)[];
    
    // Weapon Specifics from Normal Gear
    if (normalGear.weapon) {
       wRefine = normalGear.weapon.refine_level;
       if (normalGear.weapon.stats) normalGear.weapon.stats.forEach(s => parseString(s));
    }

    allGears.forEach(item => {
      if (!item) return;
      if (item.stats) item.stats.forEach(s => parseString(s));
      if (item.userCards) {
        item.userCards.forEach(c => {
           if(c && c.stats) c.stats.forEach(s => parseString(s));
        });
      }
    });

    setWeaponInfo(prev => ({
        ...prev,
        atk: wAtk > 0 ? wAtk : prev.atk,
        level: wLv,
        refine: wRefine
    }));

    setBonuses(newBonuses);
  }, [normalGear, shadowGear, costumeGear]);

  // --- Damage Calc Logic ---
  useEffect(() => {
    // 1. Status ATK
    const finalStr = baseStats.str + bonuses.str;
    const finalDex = baseStats.dex + bonuses.dex;
    const finalLuk = baseStats.luk + bonuses.luk;
    
    // Simple Renewal Formula approximation
    const statAtk = (finalStr + Math.floor(finalLuk/3) + Math.floor(finalDex/5) + Math.floor(calcConfig.baseLv/4) + (traitStats.pow * 5)) * 2;
    const pAtkMult = 1 + (traitStats.pow / 100); // Rough approximation of P.ATK
    const finalStatAtk = (statAtk + calcConfig.masteryAtk) * pAtkMult;

    // 2. Weapon ATK
    const gradeBonus = 10; // Avg for calculation
    const refineAtk = weaponInfo.refine * gradeBonus;
    const variance = weaponInfo.level * weaponInfo.atk * 0.05;
    const strBonus = (weaponInfo.atk * finalStr) / 200;
    const wAtkBase = weaponInfo.atk + refineAtk + strBonus;

    const sizeP = SIZE_PENALTY[weaponInfo.type][calcConfig.targetSize] / 100;
    const wAtkMinRaw = (wAtkBase - variance) * sizeP;
    const wAtkMaxRaw = (wAtkBase + variance) * sizeP;

    // 3. Modifiers (Bonuses)
    const equipAtk = bonuses.atk;
    
    // Multipliers
    const raceMult = 1 + (bonuses.raceP / 100);
    const sizeMult = 1 + (bonuses.sizeP / 100);
    const bossMult = 1 + (bonuses.bossP / 100);
    const atkPMult = 1 + (bonuses.atkP / 100);

    const totalModMult = raceMult * sizeMult * bossMult * atkPMult;

    const finalWAtkMin = (wAtkMinRaw + equipAtk) * pAtkMult * totalModMult;
    const finalWAtkMax = (wAtkMaxRaw + equipAtk) * pAtkMult * totalModMult;

    // 4. Total
    const rangeMult = 1 + (Math.max(bonuses.rangeP, bonuses.meleeP) / 100);
    
    const totalMin = (finalStatAtk + finalWAtkMin) * rangeMult;
    const totalMax = (finalStatAtk + finalWAtkMax) * rangeMult;

    // Def Reduction
    let effectiveDef = calcConfig.targetDef * (1 - bonuses.ignoreDef/100);
    const defReduction = (4000 + effectiveDef) / 4000;
    const skillMult = calcConfig.skillPercent / 100;

    const finalMin = Math.floor((totalMin / defReduction) * skillMult);
    const finalMax = Math.floor((totalMax / defReduction) * skillMult);

    // Crit
    const critMod = 1.4 + (bonuses.critDmgP / 100);
    const critDmg = Math.floor(totalMax * critMod * skillMult);

    setCalcResult({ min: finalMin, max: finalMax, crit: critDmg });

  }, [baseStats, traitStats, bonuses, weaponInfo, calcConfig]);


  // --- Handlers ---
  const handleSlotClick = (slotId: EquipSlotId, gearType: GearType) => {
    setSearchModal({ isOpen: true, slotId, gearType, isCardMode: false, cardSlotIndex: -1 });
    setSearchResults([]); setSearchQuery('');
  };

  const handleCardSlotClick = (e: React.MouseEvent, slotId: EquipSlotId, index: number, gearType: GearType) => {
    e.stopPropagation();
    setSearchModal({ isOpen: true, slotId, gearType, isCardMode: true, cardSlotIndex: index });
    setSearchResults([]); setSearchQuery('');
  };

  const performSearch = async (e?: React.FormEvent) => {
    if(e) e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      let query = searchQuery;
      let category = '전체';
      
      if (searchModal.isCardMode) {
        category = '카드'; 
      } else {
         if (searchModal.gearType === 'costume') category = '의상';
         else if (searchModal.gearType === 'shadow') category = '쉐도우';
         else {
             const label = SLOTS.find(s => s.id === searchModal.slotId)?.label || '';
             if (label.includes('무기')) category = '무기';
             else category = '방어구'; 
         }
      }

      const results = await searchItemsWithGemini(query, '전체 서버', category);
      setSearchResults(results);
    } catch (error) { console.error(error); } finally { setIsSearching(false); }
  };

  const equipItem = (item: MarketItem) => {
    if (!searchModal.slotId) return;

    const setGear = (
        searchModal.gearType === 'normal' ? setNormalGear :
        searchModal.gearType === 'shadow' ? setShadowGear : 
        setCostumeGear
    );

    setGear(prev => {
      if (searchModal.isCardMode) {
        const target = prev[searchModal.slotId!];
        if (!target) return prev;
        const cards = target.userCards || Array(target.card_slots).fill(null);
        cards[searchModal.cardSlotIndex] = item;
        return { ...prev, [searchModal.slotId!]: { ...target, userCards: cards } };
      } else {
        const cards = Array(item.card_slots).fill(null);
        return { ...prev, [searchModal.slotId!]: { ...item, userCards: cards } };
      }
    });
    closeModal();
  };

  const unequipItem = (e: React.MouseEvent, slotId: EquipSlotId, gearType: GearType) => {
    e.stopPropagation();
    if (gearType === 'normal') setNormalGear(prev => ({ ...prev, [slotId]: null }));
    else if (gearType === 'shadow') setShadowGear(prev => ({ ...prev, [slotId]: null }));
    else setCostumeGear(prev => ({ ...prev, [slotId]: null }));
  };

  const closeModal = () => setSearchModal({ isOpen: false, slotId: null, gearType: 'normal', isCardMode: false, cardSlotIndex: -1 });

  const resetAll = () => {
    if(confirm('모든 장비 세팅을 초기화 하시겠습니까?')) {
      setNormalGear(INITIAL_GEAR); setShadowGear(INITIAL_GEAR); setCostumeGear(INITIAL_GEAR);
    }
  };

  // --- Render Slot Helper ---
  const renderSlot = (slotId: EquipSlotId, gearType: GearType, customLabel?: string) => {
    const slotConfig = SLOTS.find(s => s.id === slotId)!;
    
    let currentGearSet = normalGear;
    if (gearType === 'shadow') currentGearSet = shadowGear;
    if (gearType === 'costume') currentGearSet = costumeGear;

    const item = currentGearSet[slotId];
    
    // Determine Label
    let displayLabel = customLabel || slotConfig.label;
    if (!customLabel) {
       if (gearType === 'shadow') displayLabel = `S.${slotConfig.label}`;
       if (gearType === 'costume') displayLabel = `의상 ${slotConfig.label.replace('투구', '').replace(/[()]/g, '')}`;
    }

    return (
      <div 
        key={`${gearType}-${slotId}`}
        onClick={() => handleSlotClick(slotId, gearType)}
        className={`relative group bg-white rounded-xl border-2 transition-all cursor-pointer h-24 sm:h-28
          ${item ? 'border-kafra-200 hover:border-kafra-500 shadow-sm' : 'border-dashed border-gray-200 hover:border-gray-400 hover:bg-gray-50'}`}
      >
        <div className="absolute top-1 left-2 text-[10px] font-bold text-gray-400 uppercase tracking-tighter truncate max-w-[90%]">
          {displayLabel}
        </div>
        {item ? (
          <div className="h-full flex flex-col p-2">
            <div className="flex-1 flex items-center justify-center gap-2">
               <div className="w-10 h-10 sm:w-12 sm:h-12 rounded bg-gray-50 border border-gray-100 overflow-hidden shrink-0">
                  <img src={item.image_placeholder} className="w-full h-full object-cover"/>
               </div>
               <div className="flex-1 min-w-0">
                  <div className="text-xs sm:text-sm font-bold text-gray-900 leading-tight line-clamp-2">
                    {item.refine_level > 0 && <span className="text-amber-500 mr-1">+{item.refine_level}</span>}
                    {item.name}
                  </div>
               </div>
            </div>
            {/* Card/Enchant Slots */}
            {((item.card_slots > 0) || (gearType === 'costume')) && (
              <div className="mt-1 flex gap-1 justify-end">
                {Array.from({ length: Math.max(item.card_slots, gearType === 'costume' ? 1 : 0) }).map((_, idx) => {
                  const c = item.userCards?.[idx];
                  return (
                    <div key={idx} onClick={(e) => handleCardSlotClick(e, slotId, idx, gearType)} className={`w-5 h-5 rounded-full border flex items-center justify-center hover:scale-110 transition-transform relative z-10 ${c ? 'bg-yellow-100 border-yellow-300 text-yellow-700' : 'bg-gray-100 border-gray-300 hover:bg-gray-200'}`} title={c ? c.name : (gearType === 'costume' ? "인챈트" : "카드")}>
                      {c ? <Zap size={10} fill="currentColor"/> : <PlusCircle size={10} className="text-gray-400"/>}
                    </div>
                  );
                })}
              </div>
            )}
            <button onClick={(e) => unequipItem(e, slotId, gearType)} className="absolute top-1 right-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"><X size={14} /></button>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-300 gap-1">{slotConfig.icon}<span className="text-[10px] hidden sm:block">빈 슬롯</span></div>
        )}
      </div>
    );
  };

  const StatController = ({ label, value, onChange }: { label: string, value: number, onChange: (val: number) => void }) => (
    <div className="flex items-center justify-between py-1 border-b border-gray-50 last:border-0">
      <span className="text-xs font-bold text-gray-600 w-8">{label}</span>
      <div className="flex items-center gap-1">
        <input 
          type="number" 
          value={value} 
          onChange={(e) => onChange(Math.max(1, parseInt(e.target.value) || 0))}
          className="w-10 text-right text-sm font-bold bg-transparent focus:outline-none focus:bg-gray-50 rounded"
        />
        <div className="flex flex-col">
          <button onClick={() => onChange(value + 1)} className="text-gray-400 hover:text-kafra-600"><ChevronUp size={10}/></button>
          <button onClick={() => onChange(Math.max(1, value - 1))} className="text-gray-400 hover:text-kafra-600"><ChevronDown size={10}/></button>
        </div>
      </div>
    </div>
  );

  const BonusRow = ({ label, val, isPercent = false }: { label: string, val: number, isPercent?: boolean }) => {
    if (val === 0) return null;
    return (
      <div className="flex justify-between text-xs py-1 px-2 hover:bg-gray-50 rounded">
        <span className="text-gray-600">{label}</span>
        <span className="font-bold text-blue-600">+{val}{isPercent ? '%' : ''}</span>
      </div>
    );
  };

  return (
    <div className="max-w-[1400px] mx-auto pb-20 animate-fade-in flex flex-col xl:flex-row gap-6">
      
      {/* --- Left Panel: Equipment Slots --- */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-4">
           <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <UserIcon className="text-kafra-600"/> 장비 시뮬레이터
              </h2>
              <p className="text-sm text-gray-500">장비를 착용하고 스탯 변화를 확인하세요.</p>
           </div>
           <button onClick={resetAll} className="text-sm text-gray-500 hover:text-red-500 flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-gray-100"><RotateCcw size={14}/> 초기화</button>
        </div>

        {/* Tab Switcher */}
        <div className="bg-gray-100 p-1 rounded-xl inline-flex mb-6 w-full sm:w-auto">
          <button onClick={() => setActiveTab('normal')} className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'normal' ? 'bg-white shadow text-kafra-600' : 'text-gray-500 hover:text-gray-900'}`}>
             <Shield size={16}/> 일반 장비
          </button>
          <button onClick={() => setActiveTab('special')} className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'special' ? 'bg-white shadow text-purple-600' : 'text-gray-500 hover:text-gray-900'}`}>
             <Sparkles size={16}/> 특수 장비
          </button>
          <button onClick={() => setActiveTab('calc')} className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'calc' ? 'bg-white shadow text-red-600' : 'text-gray-500 hover:text-gray-900'}`}>
             <Calculator size={16}/> 데미지 계산기
          </button>
        </div>

        {/* --- Tab Content --- */}
        <div className="animate-fade-in">
          
          {activeTab === 'normal' && (
             /* Normal Gear Layout (Grid) */
             <div className="space-y-8">
                {/* Headgears */}
                <div>
                   <h3 className="text-sm font-bold text-blue-600 mb-3 flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg border border-blue-100">
                      <Crown size={16}/> 투구 장비 (Headgear)
                   </h3>
                   <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {renderSlot('headUpper', 'normal')}
                      {renderSlot('headMid', 'normal')}
                      {renderSlot('headLower', 'normal')}
                   </div>
                </div>

                {/* Body Equipment */}
                <div>
                   <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg border border-gray-200">
                      <Shield size={16}/> 일반 장비 (Equipment)
                   </h3>
                   <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3">
                      {renderSlot('weapon', 'normal')}
                      {renderSlot('shield', 'normal')}
                      {renderSlot('armor', 'normal')}
                      {renderSlot('garment', 'normal')}
                      {renderSlot('shoes', 'normal')}
                      {renderSlot('accRight', 'normal')}
                      {renderSlot('accLeft', 'normal')}
                   </div>
                </div>
             </div>
          )}

          {activeTab === 'special' && (
             /* Special Gear Layout (Costume & Shadow) */
             <div className="space-y-8">
                {/* Costumes Section */}
                <div>
                   <h3 className="text-sm font-bold text-pink-500 mb-3 flex items-center gap-2 bg-pink-50 px-3 py-2 rounded-lg border border-pink-100">
                      <Sparkles size={16}/> 의상 장비 (Costume)
                   </h3>
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {renderSlot('headUpper', 'costume', '의상 상단')}
                      {renderSlot('headMid', 'costume', '의상 중단')}
                      {renderSlot('headLower', 'costume', '의상 하단')}
                      {renderSlot('garment', 'costume', '의상 걸칠것')}
                   </div>
                </div>

                {/* Shadows Section */}
                <div>
                   <h3 className="text-sm font-bold text-purple-600 mb-3 flex items-center gap-2 bg-purple-50 px-3 py-2 rounded-lg border border-purple-100">
                      <Ghost size={16}/> 쉐도우 장비 (Shadow)
                   </h3>
                   <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                      {renderSlot('armor', 'shadow', 'S.아머')}
                      {renderSlot('weapon', 'shadow', 'S.웨폰')}
                      {renderSlot('shield', 'shadow', 'S.쉴드')}
                      {renderSlot('shoes', 'shadow', 'S.슈즈')}
                      {renderSlot('accRight', 'shadow', 'S.이어링')}
                      {renderSlot('accLeft', 'shadow', 'S.펜던트')}
                   </div>
                </div>
             </div>
          )}

          {activeTab === 'calc' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {/* Calc Config */}
               <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2"><Target className="text-red-500" size={18}/> 타겟 및 스킬 설정</h3>
                  
                  <div className="space-y-3">
                     <div>
                        <label className="text-xs font-bold text-gray-500 mb-1 block">몬스터 방어력 (DEF)</label>
                        <input type="number" value={calcConfig.targetDef} onChange={(e) => setCalcConfig({...calcConfig, targetDef: Number(e.target.value)})} className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm font-bold"/>
                     </div>
                     <div>
                        <label className="text-xs font-bold text-gray-500 mb-1 block">몬스터 크기</label>
                        <select value={calcConfig.targetSize} onChange={(e) => setCalcConfig({...calcConfig, targetSize: Number(e.target.value)})} className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm font-bold">
                           <option value={0}>소형</option>
                           <option value={1}>중형</option>
                           <option value={2}>대형</option>
                        </select>
                     </div>
                     <div className="grid grid-cols-2 gap-3">
                        <div>
                           <label className="text-xs font-bold text-gray-500 mb-1 block">스킬 퍼뎀 (%)</label>
                           <input type="number" value={calcConfig.skillPercent} onChange={(e) => setCalcConfig({...calcConfig, skillPercent: Number(e.target.value)})} className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm font-bold"/>
                        </div>
                        <div>
                           <label className="text-xs font-bold text-gray-500 mb-1 block">마스터리 ATK</label>
                           <input type="number" value={calcConfig.masteryAtk} onChange={(e) => setCalcConfig({...calcConfig, masteryAtk: Number(e.target.value)})} className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm font-bold"/>
                        </div>
                     </div>
                     <div>
                        <label className="text-xs font-bold text-gray-500 mb-1 block">베이스 레벨</label>
                        <input type="number" value={calcConfig.baseLv} onChange={(e) => setCalcConfig({...calcConfig, baseLv: Number(e.target.value)})} className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm font-bold"/>
                     </div>
                  </div>

                  <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 text-xs text-yellow-800">
                     <p className="font-bold mb-1">💡 안내</p>
                     우측 패널의 스탯과 현재 장착된 모든 장비(일반/특수)의 옵션이 자동으로 계산식에 적용됩니다.
                  </div>
               </div>

               {/* Calc Result */}
               <div className="bg-gray-900 text-white rounded-2xl p-6 shadow-xl border-t-4 border-red-500 flex flex-col justify-center">
                   <div className="flex items-center gap-2 mb-6 opacity-80">
                      <Skull size={24} className="animate-pulse text-red-500"/>
                      <span className="font-bold text-lg tracking-widest uppercase text-gray-100">Total Damage</span>
                   </div>
                   <div className="space-y-8 text-center">
                      <div>
                         <div className="text-xs font-bold text-gray-400 mb-2 uppercase">Normal Hit</div>
                         <div className="flex items-baseline justify-center gap-2">
                            <span className="text-4xl font-black">{calcResult.min.toLocaleString()}</span>
                            <span className="text-gray-500 text-xl">~</span>
                            <span className="text-4xl font-black">{calcResult.max.toLocaleString()}</span>
                         </div>
                      </div>
                      <div className="pt-6 border-t border-gray-800">
                         <div className="text-xs font-bold text-amber-400 mb-2 uppercase flex items-center justify-center gap-1"><Zap size={14}/> Critical Hit</div>
                         <div className="text-5xl font-black text-white tracking-tighter drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]">
                            {calcResult.crit.toLocaleString()}
                         </div>
                      </div>
                   </div>
               </div>
            </div>
          )}

        </div>
      </div>

      {/* --- Right Panel: Stats & Dashboard --- */}
      <div className="w-full xl:w-96 flex flex-col gap-4">
        
        {/* Status Header */}
        <div className="bg-kafra-600 text-white p-3 rounded-t-xl flex justify-between items-center shadow-lg">
           <span className="font-bold flex items-center gap-2"><BarChart3 size={18}/> 캐릭터 상태 (Status)</span>
           <div className="flex bg-kafra-700 rounded-lg p-0.5">
              <button onClick={() => setRightPanelTab('status')} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${rightPanelTab === 'status' ? 'bg-white text-kafra-600' : 'text-kafra-200 hover:text-white'}`}>스탯</button>
              <button onClick={() => setRightPanelTab('bonus')} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${rightPanelTab === 'bonus' ? 'bg-white text-kafra-600' : 'text-kafra-200 hover:text-white'}`}>장비옵션</button>
           </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-b-xl shadow-sm -mt-4 p-4 min-h-[500px]">
          
          {rightPanelTab === 'status' ? (
            <div className="space-y-6">
               {/* 1. Base Stats */}
               <div>
                  <h4 className="text-xs font-bold text-gray-400 mb-2 border-b border-gray-100 pb-1">기본 스탯 (Base Stats)</h4>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                     <div className="flex justify-between items-center py-1">
                        <StatController label="STR" value={baseStats.str} onChange={v => setBaseStats({...baseStats, str: v})} />
                        <span className="text-xs font-bold text-kafra-500">+{bonuses.str}</span>
                     </div>
                     <div className="flex justify-between items-center py-1">
                        <StatController label="AGI" value={baseStats.agi} onChange={v => setBaseStats({...baseStats, agi: v})} />
                        <span className="text-xs font-bold text-kafra-500">+{bonuses.agi}</span>
                     </div>
                     <div className="flex justify-between items-center py-1">
                        <StatController label="VIT" value={baseStats.vit} onChange={v => setBaseStats({...baseStats, vit: v})} />
                        <span className="text-xs font-bold text-kafra-500">+{bonuses.vit}</span>
                     </div>
                     <div className="flex justify-between items-center py-1">
                        <StatController label="INT" value={baseStats.int} onChange={v => setBaseStats({...baseStats, int: v})} />
                        <span className="text-xs font-bold text-kafra-500">+{bonuses.int}</span>
                     </div>
                     <div className="flex justify-between items-center py-1">
                        <StatController label="DEX" value={baseStats.dex} onChange={v => setBaseStats({...baseStats, dex: v})} />
                        <span className="text-xs font-bold text-kafra-500">+{bonuses.dex}</span>
                     </div>
                     <div className="flex justify-between items-center py-1">
                        <StatController label="LUK" value={baseStats.luk} onChange={v => setBaseStats({...baseStats, luk: v})} />
                        <span className="text-xs font-bold text-kafra-500">+{bonuses.luk}</span>
                     </div>
                  </div>
               </div>

               {/* 2. Trait Stats */}
               <div>
                  <h4 className="text-xs font-bold text-gray-400 mb-2 border-b border-gray-100 pb-1">특성 스탯 (Traits)</h4>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                     <StatController label="POW" value={traitStats.pow} onChange={v => setTraitStats({...traitStats, pow: v})} />
                     <StatController label="STA" value={traitStats.sta} onChange={v => setTraitStats({...traitStats, sta: v})} />
                     <StatController label="WIS" value={traitStats.wis} onChange={v => setTraitStats({...traitStats, wis: v})} />
                     <StatController label="SPL" value={traitStats.spl} onChange={v => setTraitStats({...traitStats, spl: v})} />
                     <StatController label="CON" value={traitStats.con} onChange={v => setTraitStats({...traitStats, con: v})} />
                     <StatController label="CRT" value={traitStats.crt} onChange={v => setTraitStats({...traitStats, crt: v})} />
                  </div>
               </div>

               {/* 3. Derived Summary */}
               <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between text-sm">
                     <span className="font-bold text-gray-600">ATK</span>
                     <span className="font-bold text-gray-900">{bonuses.atk} <span className="text-xs text-gray-400 font-normal">+{bonuses.atkP}%</span></span>
                  </div>
                  <div className="flex justify-between text-sm">
                     <span className="font-bold text-gray-600">MATK</span>
                     <span className="font-bold text-gray-900">{bonuses.matk} <span className="text-xs text-gray-400 font-normal">+{bonuses.matkP}%</span></span>
                  </div>
                  <div className="flex justify-between text-sm">
                     <span className="font-bold text-gray-600">ASPD</span>
                     <span className="font-bold text-gray-900">150 <span className="text-xs text-green-500">+{bonuses.aspd}</span></span>
                  </div>
                  <div className="flex justify-between text-sm">
                     <span className="font-bold text-gray-600">CRI</span>
                     <span className="font-bold text-gray-900">{1 + Math.floor((baseStats.luk + bonuses.luk) * 0.3) + bonuses.cri}</span>
                  </div>
               </div>
            </div>
          ) : (
            <div className="space-y-4 h-full flex flex-col">
               <div className="p-2 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-600 mb-2">
                  <InfoIcon className="inline mr-1 w-3 h-3"/>
                  모든 장비(일반/의상/쉐도우)의 옵션이 자동 합산됩니다.
               </div>
               
               <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-4">
                 {/* Attack Bonuses */}
                 <div>
                    <h5 className="flex items-center gap-1 text-xs font-bold text-gray-900 mb-2"><Swords size={12}/> 공격 (Offensive)</h5>
                    <div className="bg-white border border-gray-100 rounded-lg divide-y divide-gray-50">
                       <BonusRow label="물리 공격력 (ATK)" val={bonuses.atk} />
                       <BonusRow label="마법 공격력 (MATK)" val={bonuses.matk} />
                       <BonusRow label="ATK % 증가" val={bonuses.atkP} isPercent />
                       <BonusRow label="MATK % 증가" val={bonuses.matkP} isPercent />
                       <BonusRow label="원거리 데미지" val={bonuses.rangeP} isPercent />
                       <BonusRow label="근접 데미지" val={bonuses.meleeP} isPercent />
                       <BonusRow label="모든 크기 증뎀" val={bonuses.sizeP} isPercent />
                       <BonusRow label="모든 종족 증뎀" val={bonuses.raceP} isPercent />
                       <BonusRow label="보스형 증뎀" val={bonuses.bossP} isPercent />
                       <BonusRow label="크리티컬 증뎀" val={bonuses.critDmgP} isPercent />
                       <BonusRow label="방어력 무시" val={bonuses.ignoreDef} isPercent />
                       <BonusRow label="크리티컬 (CRI)" val={bonuses.cri} />
                    </div>
                 </div>
                 
                 {/* Defense/Utility */}
                 <div>
                    <h5 className="flex items-center gap-1 text-xs font-bold text-gray-900 mb-2"><Shield size={12}/> 방어/기타 (Def/Etc)</h5>
                    <div className="bg-white border border-gray-100 rounded-lg divide-y divide-gray-50">
                       <BonusRow label="물리 방어력 (DEF)" val={bonuses.def} />
                       <BonusRow label="마법 방어력 (MDEF)" val={bonuses.mdef} />
                       <BonusRow label="명중률 (HIT)" val={bonuses.hit} />
                       <BonusRow label="회피율 (FLEE)" val={bonuses.flee} />
                       <BonusRow label="공격속도 (ASPD)" val={bonuses.aspd} />
                    </div>
                 </div>
               </div>
            </div>
          )}
        </div>
      </div>

      {/* --- Search Modal --- */}
      {searchModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={closeModal}></div>
           <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl relative z-10 flex flex-col max-h-[80vh] animate-slide-up">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                 <h3 className="font-bold text-gray-900 flex items-center gap-2">
                   {searchModal.isCardMode ? <Zap size={18} className="text-yellow-500"/> : <Search size={18} className="text-kafra-500"/>}
                   {searchModal.isCardMode ? '카드/인챈트 장착' : '아이템 장착'}
                   <span className="text-gray-400 text-sm font-normal">
                     - {SLOTS.find(s => s.id === searchModal.slotId)?.label} ({searchModal.gearType})
                   </span>
                 </h3>
                 <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-full text-gray-400"><X size={20}/></button>
              </div>
              <div className="p-4 bg-gray-50 border-b border-gray-100">
                 <form onSubmit={performSearch} className="flex gap-2">
                    <input autoFocus type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={searchModal.isCardMode ? "카드/인챈트 이름 검색..." : "아이템 이름 검색..."} className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-kafra-500 focus:ring-2 focus:ring-kafra-100 text-sm font-bold"/>
                    <button type="submit" disabled={isSearching} className="bg-gray-900 text-white px-5 rounded-xl font-bold text-sm hover:bg-black disabled:opacity-50">{isSearching ? '...' : '검색'}</button>
                 </form>
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                 {isSearching ? <div className="py-12 text-center text-gray-400">검색 중...</div> : searchResults.length > 0 ? (
                   <div className="space-y-1">
                     {searchResults.map((item) => (
                       <div key={item.id} onClick={() => equipItem(item)} className="flex items-center gap-3 p-3 hover:bg-blue-50 rounded-xl cursor-pointer border border-transparent hover:border-blue-100 transition-all group">
                         <div className="w-10 h-10 bg-gray-100 rounded-lg border border-gray-200 overflow-hidden shrink-0"><img src={item.image_placeholder} className="w-full h-full object-cover"/></div>
                         <div className="flex-1"><div className="font-bold text-gray-900 text-sm">{item.refine_level > 0 && <span className="text-amber-500">+{item.refine_level} </span>}{item.name}</div><div className="text-xs text-gray-400 flex gap-2 mt-0.5"><span>{item.category}</span>{item.card_slots > 0 && <span>[{item.card_slots}]</span>}</div></div>
                         <button className="text-xs font-bold text-white bg-kafra-500 px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100">장착</button>
                       </div>
                     ))}
                   </div>
                 ) : <div className="py-12 text-center text-gray-400 text-sm">결과가 없습니다.</div>}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

// Helper for info icon
const InfoIcon = ({className}:{className?:string}) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
);

export default Simulator;
