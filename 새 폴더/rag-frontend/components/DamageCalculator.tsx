
import React, { useState, useEffect } from 'react';
import { Swords, Target, Zap, RotateCcw, Crosshair, ShieldAlert, Search, PlusCircle, X, ChevronUp, ChevronDown, Shirt, Shield, Crown, Glasses, Component, Layers, Footprints, Box, Sword } from 'lucide-react';
import { searchItemsWithGemini } from '../services/geminiService';
import { MarketItem, GearSet, EquipSlotId, EquippedItem } from '../types';

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
        <button onClick={() => onChange(value + 1)} className="text-gray-400 hover:text-kafra-600"><ChevronUp size={8}/></button>
        <button onClick={() => onChange(Math.max(0, value - 1))} className="text-gray-400 hover:text-kafra-600"><ChevronDown size={8}/></button>
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
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<MarketItem[]>([]);

  // --- Stats State ---
  const [stats, setStats] = useState({
    str: 120, dex: 100, luk: 1, int: 1, baseLv: 250, jobLv: 50, pow: 0, pAtk: 0
  });

  const [weaponInfo, setWeaponInfo] = useState({
    atk: 0, level: 4, refine: 0, grade: WeaponGrade.NONE, type: WeaponType.SWORD_1H
  });

  const [target, setTarget] = useState({
    def: 100, size: 1, // 0:Small, 1:Medium, 2:Large
  });

  // Parsed Modifiers (Auto-calculated)
  const [autoMods, setAutoMods] = useState({
    equipAtk: 0, atkP: 0,
    raceP: 0, sizeP: 0, elementP: 0, bossP: 0,
    rangeP: 0, meleeP: 0, critDmgP: 0, ignoreDef: 0
  });

  // Manual Modifiers (User Overrides)
  const [manualMods, setManualMods] = useState({
    masteryAtk: 0, skillP: 100,
  });

  // Result
  const [result, setResult] = useState({
    min: 0, max: 0, crit: 0, dps: 0
  });

  // --- Parsing Logic ---
  useEffect(() => {
    const newMods = {
      equipAtk: 0, atkP: 0, raceP: 0, sizeP: 0, elementP: 0, bossP: 0,
      rangeP: 0, meleeP: 0, critDmgP: 0, ignoreDef: 0
    };

    let wAtk = 0;
    let wLv = 4;
    let wRefine = 0;

    const parseString = (str: string) => {
      // ATK
      if (/ATK\s*\+\s*(\d+)(?!%)/i.test(str)) newMods.equipAtk += parseInt(RegExp.$1);
      if (/ATK\s*\+\s*(\d+)%/i.test(str)) newMods.atkP += parseInt(RegExp.$1);
      
      // Damage Percentages
      if (/(크리티컬|크리).*데미지\s*(\d+)%/i.test(str)) newMods.critDmgP += parseInt(RegExp.$2);
      if (/원거리.*데미지\s*(\d+)%/i.test(str)) newMods.rangeP += parseInt(RegExp.$1);
      if (/근접.*데미지\s*(\d+)%/i.test(str)) newMods.meleeP += parseInt(RegExp.$1);
      if (/(모든|전체)\s*크기.*(\d+)%/i.test(str)) newMods.sizeP += parseInt(RegExp.$2);
      if (/(모든|전체)\s*종족.*(\d+)%/i.test(str)) newMods.raceP += parseInt(RegExp.$2);
      if (/보스.*(\d+)%/i.test(str)) newMods.bossP += parseInt(RegExp.$1);
      if (/방어력.*무시\s*(\d+)%/i.test(str)) newMods.ignoreDef += parseInt(RegExp.$1);
      
      // Weapon Specific (Only if processing weapon slot)
      if (/공격\s*:\s*(\d+)/.test(str)) wAtk = parseInt(RegExp.$1);
      if (/무기레벨\s*:\s*(\d+)/.test(str)) wLv = parseInt(RegExp.$1);
    };

    // Iterate Gear
    Object.entries(gear).forEach(([slot, item]) => {
      const equippedItem = item as EquippedItem | null;
      if (!equippedItem) return;
      const isWeapon = slot === 'weapon';

      if (isWeapon) wRefine = equippedItem.refine_level;

      // Item Stats
      if (equippedItem.stats) equippedItem.stats.forEach(s => parseString(s));
      
      // Card Stats
      if (equippedItem.userCards) {
        equippedItem.userCards.forEach(c => {
          if (c && c.stats) c.stats.forEach(s => parseString(s));
        });
      }
    });

    // Update Weapon Info State if changed
    if (gear.weapon) {
       // We use functional update to avoid infinite loop if values are same, 
       // but here we just set it. In a real app, use deep compare or ref.
       // For now, only update if base ATK changed to avoid overriding user manual weapon type selection.
       if(wAtk !== weaponInfo.atk || wLv !== weaponInfo.level || wRefine !== weaponInfo.refine) {
         setWeaponInfo(prev => ({ ...prev, atk: wAtk || prev.atk, level: wLv, refine: wRefine }));
       }
    }

    setAutoMods(newMods);
  }, [gear]); // Recalculate when gear changes

  // --- Calculation Logic ---
  useEffect(() => {
    // 1. Status ATK
    const statAtk = (stats.str + Math.floor(stats.luk/3) + Math.floor(stats.dex/5) + Math.floor(stats.baseLv/4) + (stats.pow * 5)) * 2;
    const pAtkMult = 1 + (stats.pAtk / 100);
    const finalStatAtk = (statAtk + manualMods.masteryAtk) * pAtkMult;

    // 2. Weapon ATK
    let refineAtk = 0;
    // Simplified Grade Refine (Assuming Grade B for calculation demo if not set)
    const gradeBonus = 10; // Avg
    refineAtk = weaponInfo.refine * gradeBonus;

    const variance = weaponInfo.level * weaponInfo.atk * 0.05;
    const strBonus = (weaponInfo.atk * stats.str) / 200;
    const wAtkBase = weaponInfo.atk + refineAtk + strBonus;
    
    const sizeP = SIZE_PENALTY[weaponInfo.type][target.size] / 100;
    const wAtkMinRaw = (wAtkBase - variance) * sizeP;
    const wAtkMaxRaw = (wAtkBase + variance) * sizeP;

    // 3. Modifiers (Total = Manual + Auto)
    const equipAtk = autoMods.equipAtk;
    const atkP = autoMods.atkP; // Total ATK %
    
    // Multipliers
    // Note: In detailed RO formula, these stack multiplicatively groups. 
    // Here we simplify: (Race + Size + Boss + Element) as one group for demo, or separate.
    // Standard Renewal: Race * Size * TargetProp * Element * Boss * ATK%
    // Let's treat AutoMods as distinct multipliers
    const raceMult = 1 + (autoMods.raceP / 100);
    const sizeMult = 1 + (autoMods.sizeP / 100);
    const bossMult = 1 + (autoMods.bossP / 100);
    const elemMult = 1 + (autoMods.elementP / 100); // Not fully parsed yet
    const atkPMult = 1 + (atkP / 100);

    const totalModMult = raceMult * sizeMult * bossMult * elemMult * atkPMult;

    const finalWAtkMin = (wAtkMinRaw + equipAtk) * pAtkMult * totalModMult;
    const finalWAtkMax = (wAtkMaxRaw + equipAtk) * pAtkMult * totalModMult;

    // 4. Total & Def
    // Range/Melee Mods apply to final total ATK
    const rangeMult = 1 + (Math.max(autoMods.rangeP, autoMods.meleeP) / 100);

    const totalMin = (finalStatAtk + finalWAtkMin) * rangeMult;
    const totalMax = (finalStatAtk + finalWAtkMax) * rangeMult;

    // Def Reduction (Ignore Def)
    let effectiveDef = target.def * (1 - autoMods.ignoreDef/100);
    const defReduction = (4000 + effectiveDef) / 4000;
    
    const skillMult = manualMods.skillP / 100;

    const finalMin = Math.floor((totalMin / defReduction) * skillMult);
    const finalMax = Math.floor((totalMax / defReduction) * skillMult);

    // Crit
    const critMod = 1.4 + (autoMods.critDmgP / 100);
    const critDmg = Math.floor(totalMax * critMod * skillMult); // Crit ignores DEF? Yes usually.

    setResult({
      min: finalMin,
      max: finalMax,
      crit: critDmg,
      dps: Math.floor((finalMin + finalMax)/2 * 7) // Approx
    });

  }, [stats, weaponInfo, target, autoMods, manualMods]);


  // --- Handlers ---
  const handleSlotClick = (slotId: EquipSlotId) => {
    setSearchModal({ isOpen: true, slotId, isCardMode: false, cardSlotIndex: -1 });
    setSearchResults([]); setSearchQuery('');
  };

  const performSearch = async (e?: React.FormEvent) => {
    if(e) e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      let category = searchModal.isCardMode ? '카드' : '전체';
      if (!searchModal.isCardMode) {
         const label = SLOTS.find(s => s.id === searchModal.slotId)?.label || '';
         if (label.includes('무기')) category = '무기';
         else category = '방어구';
      }
      const results = await searchItemsWithGemini(searchQuery, '전체 서버', category);
      setSearchResults(results);
    } catch (error) { console.error(error); } finally { setIsSearching(false); }
  };

  const equipItem = (item: MarketItem) => {
    if (!searchModal.slotId) return;
    setGear(prev => {
      // Basic equip logic
      if (searchModal.isCardMode) {
        const target = prev[searchModal.slotId];
        if(!target) return prev;
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
    setGear(prev => ({...prev, [slotId]: null}));
  }

  return (
    <div className="max-w-[1400px] mx-auto pb-20 animate-fade-in flex flex-col xl:flex-row gap-6">
       
       {/* Left: Gear Panel */}
       <div className="flex-1 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
             <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2"><Swords className="text-kafra-600" size={18}/> 장비 세팅</h3>
                <button onClick={() => setGear(INITIAL_GEAR)} className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1"><RotateCcw size={12}/> 초기화</button>
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
                        <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                           {item ? <img src={item.image_placeholder} className="w-full h-full object-cover rounded-lg"/> : <span className="text-gray-300">{slot.icon}</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                           <div className="text-[10px] text-gray-400 font-bold uppercase">{slot.label}</div>
                           <div className="text-xs font-bold text-gray-900 truncate">{item ? (item.refine_level > 0 ? `+${item.refine_level} ${item.name}` : item.name) : <span className="text-gray-300">장착 대기</span>}</div>
                           {/* Card Slots */}
                           {item && (item.card_slots > 0) && (
                              <div className="flex gap-1 mt-1">
                                {Array.from({length: item.card_slots}).map((_, i) => (
                                   <div key={i} 
                                     onClick={(e) => { e.stopPropagation(); setSearchModal({isOpen:true, slotId:slot.id, isCardMode:true, cardSlotIndex:i}); setSearchResults([]); setSearchQuery(''); }}
                                     className={`w-3 h-3 rounded-full border flex items-center justify-center ${item.userCards?.[i] ? 'bg-yellow-400 border-yellow-500' : 'bg-gray-200 border-gray-300 hover:bg-gray-300'}`}
                                   ></div>
                                ))}
                              </div>
                           )}
                        </div>
                        {item && <button onClick={(e) => unequip(e, slot.id)} className="absolute top-1 right-1 text-gray-300 hover:text-red-500 p-1"><X size={12}/></button>}
                     </div>
                   );
                })}
             </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
             <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4"><Crosshair className="text-kafra-600" size={18}/> 스탯 & 타겟</h3>
             <div className="grid grid-cols-3 gap-3 mb-4">
               <NumberInput label="STR" value={stats.str} onChange={v => setStats({...stats, str: v})} />
               <NumberInput label="AGI" value={100} onChange={() => {}} suffix="(ASPD)"/>
               <NumberInput label="DEX" value={stats.dex} onChange={v => setStats({...stats, dex: v})} />
               <NumberInput label="LUK" value={stats.luk} onChange={v => setStats({...stats, luk: v})} />
               <NumberInput label="POW" value={stats.pow} onChange={v => setStats({...stats, pow: v})} />
               <NumberInput label="P.ATK" value={stats.pAtk} onChange={v => setStats({...stats, pAtk: v})} />
               <NumberInput label="BaseLv" value={stats.baseLv} onChange={v => setStats({...stats, baseLv: v})} />
             </div>
             <div className="border-t border-gray-100 pt-3 grid grid-cols-2 gap-3">
               <NumberInput label="타겟 방어(DEF)" value={target.def} onChange={v => setTarget({...target, def: v})} />
               <div className="flex justify-between items-center bg-gray-50 rounded px-2 py-1.5 border border-gray-200">
                  <span className="text-xs font-bold text-gray-500">크기</span>
                  <select className="bg-transparent text-xs font-bold" value={target.size} onChange={e => setTarget({...target, size: Number(e.target.value)})}>
                     <option value={0}>소형</option>
                     <option value={1}>중형</option>
                     <option value={2}>대형</option>
                  </select>
               </div>
             </div>
          </div>
       </div>

       {/* Right: Results Panel */}
       <div className="w-full xl:w-96 space-y-4">
          
          {/* Main Damage Display */}
          <div className="bg-gray-900 text-white rounded-2xl p-6 shadow-xl border-t-4 border-kafra-500">
             <div className="flex items-center gap-2 mb-6 opacity-80">
                <Target size={20} className="animate-pulse text-kafra-400"/>
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
                   <div className="text-xs font-bold text-amber-400 mb-1 uppercase flex items-center gap-1"><Zap size={12}/> Critical</div>
                   <div className="text-4xl font-black text-white tracking-tighter drop-shadow-lg">{result.crit.toLocaleString()}</div>
                </div>
             </div>
          </div>

          {/* Auto Calculated Mods List */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm h-full max-h-[500px] overflow-y-auto custom-scrollbar">
             <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-1.5">
               <ShieldAlert size={14}/> 자동 적용 옵션 (Auto Mods)
             </h4>
             <div className="space-y-1">
                {autoMods.equipAtk > 0 && <div className="flex justify-between text-xs py-1 px-2 bg-gray-50 rounded"><span className="text-gray-600">장비 ATK 합</span><span className="font-bold">+{autoMods.equipAtk}</span></div>}
                {autoMods.atkP > 0 && <div className="flex justify-between text-xs py-1 px-2 bg-gray-50 rounded"><span className="text-gray-600">ATK %</span><span className="font-bold">+{autoMods.atkP}%</span></div>}
                {autoMods.critDmgP > 0 && <div className="flex justify-between text-xs py-1 px-2 bg-yellow-50 rounded"><span className="text-yellow-700">크리티컬 증뎀</span><span className="font-bold text-yellow-700">+{autoMods.critDmgP}%</span></div>}
                {autoMods.raceP > 0 && <div className="flex justify-between text-xs py-1 px-2 bg-gray-50 rounded"><span className="text-gray-600">종족 증뎀</span><span className="font-bold">+{autoMods.raceP}%</span></div>}
                {autoMods.sizeP > 0 && <div className="flex justify-between text-xs py-1 px-2 bg-gray-50 rounded"><span className="text-gray-600">크기 증뎀</span><span className="font-bold">+{autoMods.sizeP}%</span></div>}
                {autoMods.bossP > 0 && <div className="flex justify-between text-xs py-1 px-2 bg-gray-50 rounded"><span className="text-gray-600">보스 증뎀</span><span className="font-bold">+{autoMods.bossP}%</span></div>}
                {autoMods.ignoreDef > 0 && <div className="flex justify-between text-xs py-1 px-2 bg-blue-50 rounded"><span className="text-blue-600">방어력 무시</span><span className="font-bold text-blue-600">{autoMods.ignoreDef}%</span></div>}
             </div>

             <div className="mt-4 pt-4 border-t border-gray-100">
                <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">수동 보정 (Manual)</h4>
                <div className="space-y-2">
                   <NumberInput label="스킬 퍼뎀(%)" value={manualMods.skillP} onChange={v => setManualMods({...manualMods, skillP: v})} />
                   <NumberInput label="마스터리 ATK" value={manualMods.masteryAtk} onChange={v => setManualMods({...manualMods, masteryAtk: v})} />
                </div>
             </div>
          </div>
       </div>

       {/* --- Search Modal (Reused Logic) --- */}
      {searchModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setSearchModal({...searchModal, isOpen: false})}></div>
           <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl relative z-10 flex flex-col max-h-[80vh] animate-slide-up">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                 <h3 className="font-bold text-gray-900 flex items-center gap-2">
                   {searchModal.isCardMode ? <Zap size={18} className="text-yellow-500"/> : <Search size={18} className="text-kafra-500"/>}
                   {searchModal.isCardMode ? '카드 검색' : '장비 검색'}
                 </h3>
                 <button onClick={() => setSearchModal({...searchModal, isOpen: false})} className="p-2 hover:bg-gray-100 rounded-full text-gray-400"><X size={20}/></button>
              </div>
              <div className="p-4 bg-gray-50 border-b border-gray-100">
                 <form onSubmit={performSearch} className="flex gap-2">
                    <input autoFocus type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="검색어 입력..." className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-kafra-500 text-sm font-bold"/>
                    <button type="submit" disabled={isSearching} className="bg-gray-900 text-white px-5 rounded-xl font-bold text-sm hover:bg-black disabled:opacity-50">{isSearching ? '...' : '검색'}</button>
                 </form>
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                 {isSearching ? <div className="py-12 text-center text-gray-400">검색 중...</div> : searchResults.length > 0 ? (
                   <div className="space-y-1">
                     {searchResults.map((item) => (
                       <div key={item.id} onClick={() => equipItem(item)} className="flex items-center gap-3 p-3 hover:bg-blue-50 rounded-xl cursor-pointer border border-transparent hover:border-blue-100 transition-all">
                         <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden shrink-0"><img src={item.image_placeholder} className="w-full h-full object-cover"/></div>
                         <div className="flex-1"><div className="font-bold text-gray-900 text-sm">{item.refine_level > 0 && <span className="text-amber-500">+{item.refine_level} </span>}{item.name}</div><div className="text-xs text-gray-400">{item.stats?.[0] || item.category}</div></div>
                         <button className="text-xs font-bold text-white bg-kafra-500 px-3 py-1.5 rounded-lg">선택</button>
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

export default DamageCalculator;
