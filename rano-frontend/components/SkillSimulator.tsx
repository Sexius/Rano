
import React, { useState, useEffect, useMemo } from 'react';
import { BookOpen, RotateCcw, ChevronRight, Swords, Shield, Crosshair, Zap, MessageCircle, Star, Sparkles, Flame, Wind, Skull, Heart, Target, Lock } from 'lucide-react';
import { SkillState } from '../types';
import { getSkillsWithDamage, SkillData } from '../services/skillService';
import { ALL_JOB_SKILLS, JOB_TREE_UI, SkillInfo } from '../src/data/skillData';

// --- 아이콘 컴포넌트 ---
function HammerIcon(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 12-8.5 8.5c-.83.83-2.17.83-3 0a2.12 2.12 0 0 1 0-3L12 9" /><path d="M17.64 15 22 10.64" /></svg>; }
function BeakerIcon(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4.5 3h15" /><path d="M6 3v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V3" /></svg>; }
function CrossIcon(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 2a2 2 0 0 0-2 2v5H4a2 2 0 0 0-2 2v2c0 1.1.9 2 2 2h5v5c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2v-5h5a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-5V4a2 2 0 0 0-2-2h-2z" /></svg>; }
function MusicIcon(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>; }
function TargetIcon(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>; }
function CatIcon(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5c.67 0 1.35.09 2 .26 1.78-2 5.03-2.84 6.42-2.26 1.4.58-.42 7-.42 7 .57 1.07 1 2.24 1 3.44C21 17.9 16.97 21 12 21S3 17.9 3 13.44c0-1.2.43-2.37 1-3.44 0 0-1.82-6.42-.42-7 1.39-.58 4.64.26 6.42 2.26 .65-.17 1.33-.26 2-.26z" /></svg>; }

// 아이콘 매핑
const getLineIcon = (iconName: string) => {
   const icons: Record<string, React.ReactNode> = {
      swords: <Swords size={16} />,
      shield: <Shield size={16} />,
      flame: <Flame size={16} />,
      book: <BookOpen size={16} />,
      crosshair: <Crosshair size={16} />,
      music: <MusicIcon size={16} />,
      cross: <CrossIcon size={16} />,
      zap: <Zap size={16} />,
      hammer: <HammerIcon size={16} />,
      beaker: <BeakerIcon size={16} />,
      skull: <Skull size={16} />,
      message: <MessageCircle size={16} />,
      star: <Star size={16} />,
      wind: <Wind size={16} />,
      target: <TargetIcon size={16} />,
      cat: <CatIcon size={16} />,
      sparkles: <Sparkles size={16} />,
   };
   return icons[iconName] || <Sparkles size={16} />;
};

const SkillSimulator: React.FC = () => {
   // 네비게이션 상태
   const [selectedCategory, setSelectedCategory] = useState("검사계열");
   const [selectedLineIndex, setSelectedLineIndex] = useState(0);
   const [selectedJobStep, setSelectedJobStep] = useState("검사");

   // 데이터 상태
   const [skillLevels, setSkillLevels] = useState<SkillState>({});
   const [hoveredSkill, setHoveredSkill] = useState<SkillInfo | null>(null);
   const [dbSkillData, setDbSkillData] = useState<Map<string, SkillData>>(new Map());

   // 현재 선택된 계열
   const currentCategory = JOB_TREE_UI[selectedCategory as keyof typeof JOB_TREE_UI] || [];
   const currentLine = currentCategory[selectedLineIndex];

   // 현재 선택된 직업의 스킬 목록
   const skills = ALL_JOB_SKILLS[selectedJobStep] || [];

   // DB 스킬 데이터 로드
   useEffect(() => {
      const loadDbSkills = async () => {
         try {
            const data = await getSkillsWithDamage();
            const map = new Map<string, SkillData>();
            data.forEach(s => {
               map.set(s.nameKr, s);
               map.set(s.engName, s);
            });
            setDbSkillData(map);
         } catch (e) {
            console.error('DB 스킬 로드 실패:', e);
         }
      };
      loadDbSkills();
   }, []);

   // 스킬 선행조건 충족 여부 확인
   const checkRequirements = (skill: SkillInfo): boolean => {
      if (!skill.requirements || skill.requirements.length === 0) return true;
      return skill.requirements.every(req => (skillLevels[req.skillId] || 0) >= req.level);
   };

   // 스킬 클릭 핸들러
   const handleSkillClick = (skill: SkillInfo, increment: boolean) => {
      if (!checkRequirements(skill) && increment) return; // 선행조건 미충족 시 증가 불가

      setSkillLevels(prev => {
         const current = prev[skill.id] || 0;
         if (increment) {
            return { ...prev, [skill.id]: Math.min(current + 1, skill.maxLevel) };
         } else {
            return { ...prev, [skill.id]: Math.max(current - 1, 0) };
         }
      });
   };

   // 리셋
   const resetSkills = () => {
      if (confirm('현재 직업의 스킬 트리를 초기화 하시겠습니까?')) {
         const newLevels = { ...skillLevels };
         skills.forEach(s => delete newLevels[s.id]);
         setSkillLevels(newLevels);
      }
   };

   // 포인트 계산
   const currentJobPoints = skills.reduce((acc, skill) => acc + (skillLevels[skill.id] || 0), 0);
   const totalPoints = Object.values(skillLevels).reduce((acc: number, curr: number) => acc + curr, 0);

   // 선행 스킬 정보 가져오기
   const getRequirementInfo = (skill: SkillInfo): string[] => {
      if (!skill.requirements) return [];
      return skill.requirements.map(req => {
         const reqSkill = Object.values(ALL_JOB_SKILLS).flat().find(s => s.id === req.skillId);
         const currentLevel = skillLevels[req.skillId] || 0;
         return `${reqSkill?.name || `ID:${req.skillId}`} Lv.${req.level} (현재: ${currentLevel})`;
      });
   };

   return (
      <div className="max-w-[1400px] mx-auto pb-20 animate-fade-in flex flex-col xl:flex-row gap-6">

         {/* --- 왼쪽: 직업 선택 사이드바 --- */}
         <div className="w-full xl:w-72 flex flex-col gap-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
               <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <BookOpen className="text-kafra-600" size={18} /> 직업 계열 선택
               </h3>

               <div className="space-y-1">
                  {Object.keys(JOB_TREE_UI).map(cat => (
                     <div key={cat} className="space-y-1">
                        <div
                           onClick={() => {
                              setSelectedCategory(cat);
                              setSelectedLineIndex(0);
                              const firstLine = JOB_TREE_UI[cat as keyof typeof JOB_TREE_UI]?.[0];
                              if (firstLine) setSelectedJobStep(firstLine.steps[1] || firstLine.steps[0]);
                           }}
                           className={`px-3 py-2 rounded-lg text-sm font-bold cursor-pointer flex justify-between items-center transition-colors ${selectedCategory === cat ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                           {cat}
                           {selectedCategory === cat && <ChevronRight size={14} />}
                        </div>

                        {selectedCategory === cat && (
                           <div className="pl-2 space-y-1 animate-slide-up">
                              {currentCategory.map((line, idx) => (
                                 <button
                                    key={idx}
                                    onClick={() => { setSelectedLineIndex(idx); setSelectedJobStep(line.steps[1] || line.steps[0]); }}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 border transition-all ${selectedLineIndex === idx ? 'bg-kafra-50 border-kafra-200 text-kafra-700' : 'bg-white border-transparent hover:bg-gray-50 text-gray-600'}`}
                                 >
                                    {getLineIcon(line.icon)} {line.name}
                                 </button>
                              ))}
                           </div>
                        )}
                     </div>
                  ))}
               </div>
            </div>

            {/* 포인트 현황 */}
            <div className="bg-gray-900 text-white rounded-2xl p-5 shadow-lg">
               <div className="text-xs font-bold text-gray-400 uppercase mb-1">Total Points Used</div>
               <div className="text-4xl font-black text-kafra-400">{totalPoints}</div>
               <div className="mt-4 text-xs text-gray-500 border-t border-gray-800 pt-3">
                  현재 선택된 {selectedJobStep} 포인트: <span className="text-white font-bold">{currentJobPoints}</span>
               </div>
            </div>
         </div>

         {/* --- 오른쪽: 스킬 트리 --- */}
         <div className="flex-1 flex flex-col gap-4">

            {/* 상단: 직업 단계 탭 */}
            {currentLine && (
               <div className="bg-white rounded-2xl border border-gray-200 p-2 shadow-sm flex overflow-x-auto no-scrollbar">
                  {currentLine.steps.map((step: string, idx: number) => (
                     <button
                        key={step}
                        onClick={() => setSelectedJobStep(step)}
                        className={`flex-1 min-w-[100px] px-4 py-3 rounded-xl text-sm font-bold transition-all relative whitespace-nowrap
                       ${selectedJobStep === step
                              ? 'bg-kafra-600 text-white shadow-md z-10'
                              : ALL_JOB_SKILLS[step]
                                 ? 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                 : 'text-gray-300 cursor-not-allowed'
                           }
                    `}
                        disabled={!ALL_JOB_SKILLS[step]}
                     >
                        <span className="text-[10px] opacity-60 block font-normal">
                           {idx === 0 ? '' : idx === 1 ? '1차' : idx === 2 ? '2차' : idx === 3 ? '3차' : '4차'}
                        </span>
                        {step}
                     </button>
                  ))}
               </div>
            )}

            {/* 메인 스킬 그리드 */}
            <div className="flex-1 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm min-h-[600px] relative select-none">
               <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

               <div className="relative z-10">
                  <div className="flex justify-between items-center mb-6">
                     <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        {selectedJobStep} <span className="text-gray-400 font-normal text-sm">스킬 트리</span>
                        <span className="text-xs text-gray-400 ml-2">({skills.length}개 스킬)</span>
                     </h2>
                     <button onClick={resetSkills} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-red-50 text-gray-500 hover:text-red-500 text-xs font-bold transition-colors">
                        <RotateCcw size={14} /> 초기화
                     </button>
                  </div>

                  {skills.length === 0 ? (
                     <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Target className="text-gray-300" size={48} />
                        <p className="text-gray-400 font-medium">이 직업의 스킬 데이터가 아직 없습니다.</p>
                        <p className="text-gray-300 text-sm">3차/4차 직업 데이터가 추가될 예정입니다.</p>
                     </div>
                  ) : (
                     <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 gap-4">
                        {skills.map(skill => {
                           const level = skillLevels[skill.id] || 0;
                           const isMaxed = level === skill.maxLevel;
                           const hasLevel = level > 0;
                           const dbInfo = dbSkillData.get(skill.name);
                           const canUse = checkRequirements(skill);

                           return (
                              <div
                                 key={skill.id}
                                 className="relative flex flex-col items-center group"
                                 onMouseEnter={() => setHoveredSkill(skill)}
                                 onMouseLeave={() => setHoveredSkill(null)}
                                 onContextMenu={(e) => { e.preventDefault(); handleSkillClick(skill, false); }}
                              >
                                 {/* 스킬 아이콘 */}
                                 <div
                                    onClick={() => handleSkillClick(skill, true)}
                                    className={`
                                    w-16 h-16 rounded-2xl border-2 flex items-center justify-center cursor-pointer transition-all relative shadow-sm
                                    ${!canUse
                                          ? 'bg-gray-100 border-gray-200 opacity-50 cursor-not-allowed'
                                          : isMaxed
                                             ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-200 shadow-amber-100'
                                             : hasLevel
                                                ? 'bg-blue-50 border-kafra-500 shadow-blue-100'
                                                : 'bg-white border-gray-300 hover:border-kafra-400 hover:scale-105'
                                       }
                                 `}
                                 >
                                    {!canUse && <Lock className="absolute top-1 right-1 text-gray-400" size={10} />}
                                    <img
                                       src={`/skill-icons/${skill.id}.png`}
                                       alt={skill.name}
                                       className="w-10 h-10"
                                       onError={(e) => {
                                          (e.target as HTMLImageElement).style.display = 'none';
                                       }}
                                    />

                                    {/* 레벨 배지 */}
                                    <div className={`
                                    absolute -bottom-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold border shadow-sm
                                    ${!canUse
                                          ? 'bg-gray-400 text-white border-gray-500'
                                          : isMaxed
                                             ? 'bg-amber-500 text-white border-amber-600'
                                             : hasLevel
                                                ? 'bg-kafra-600 text-white border-kafra-700'
                                                : 'bg-gray-600 text-white border-gray-700'
                                       }
                                 `}>
                                       {level} / {skill.maxLevel}
                                    </div>
                                 </div>

                                 {/* 스킬 이름 */}
                                 <div className={`mt-3.5 text-[11px] font-bold text-center leading-tight max-w-[84px] break-keep ${hasLevel ? 'text-gray-900' : canUse ? 'text-gray-400' : 'text-gray-300'}`}>
                                    {skill.name}
                                 </div>

                                 {/* 호버 툴팁 */}
                                 {hoveredSkill?.id === skill.id && (
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-80 bg-gray-900/95 backdrop-blur-sm text-white text-xs rounded-xl p-4 shadow-2xl z-50 pointer-events-none animate-fade-in border border-white/10">
                                       <div className="font-bold text-sm text-amber-400 mb-1">{skill.name}</div>
                                       <div className="text-gray-400 text-[10px] mb-2">ID: {skill.id} • {skill.type || 'active'}</div>

                                       {/* 선행 스킬 조건 */}
                                       {skill.requirements && skill.requirements.length > 0 && (
                                          <div className={`mb-3 p-2 rounded-lg border ${canUse ? 'bg-green-900/30 border-green-500/30' : 'bg-red-900/30 border-red-500/30'}`}>
                                             <div className={`font-bold text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1 ${canUse ? 'text-green-400' : 'text-red-400'}`}>
                                                <Lock size={10} /> 선행 스킬 조건
                                             </div>
                                             {getRequirementInfo(skill).map((req, idx) => (
                                                <div key={idx} className="text-gray-300 text-[11px]">• {req}</div>
                                             ))}
                                          </div>
                                       )}

                                       {/* DB 데미지 정보 */}
                                       {dbInfo && dbInfo.damagePercent > 0 && (
                                          <div className="mb-3 p-2 bg-gradient-to-r from-red-900/30 to-orange-900/30 rounded-lg border border-red-500/30">
                                             <div className="font-bold text-red-400 text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1">
                                                <Target size={10} /> 데미지 정보
                                             </div>
                                             <div className="flex gap-3 justify-around">
                                                <div className="text-center">
                                                   <div className="text-lg font-black text-white">{dbInfo.damagePercent}%</div>
                                                   <div className="text-[9px] text-gray-400">배율</div>
                                                </div>
                                                <div className="text-center">
                                                   <div className="text-lg font-black text-white">{dbInfo.hits}</div>
                                                   <div className="text-[9px] text-gray-400">타수</div>
                                                </div>
                                                <div className="text-center">
                                                   <div className="text-lg font-black text-amber-400">{(dbInfo.damagePercent * dbInfo.hits).toLocaleString()}%</div>
                                                   <div className="text-[9px] text-gray-400">총 배율</div>
                                                </div>
                                             </div>
                                          </div>
                                       )}

                                       <div className="pt-2 flex justify-between items-center text-gray-400">
                                          <span>Max Level</span>
                                          <span className="text-white font-bold bg-white/10 px-1.5 rounded">{skill.maxLevel}</span>
                                       </div>
                                    </div>
                                 )}
                              </div>
                           );
                        })}
                     </div>
                  )}
               </div>
            </div>
         </div>
      </div>
   );
};

export default SkillSimulator;
