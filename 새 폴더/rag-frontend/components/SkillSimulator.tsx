
import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, RefreshCw, Lock, AlertCircle, RotateCcw, Check, X, ChevronRight, Swords, Shield, Crosshair, Zap, Anchor, MessageCircle, Star, Sparkles, Flame, Droplets, Wind, Skull, Heart, ZoomIn, ZoomOut } from 'lucide-react';
import { Skill, SkillState } from '../types';
import { fetchSkillsWithGemini } from '../services/geminiService';
import SkillDetailPanel from './SkillDetailPanel';

// --- Job Tree Structure (Same as before) ---
const JOB_TREE = {
   "검사계열": [
      { name: "나이트 계열", steps: ["소드맨", "나이트", "로드나이트", "룬나이트", "드래곤나이트"], icon: <Swords size={16} /> },
      { name: "크루세이더 계열", steps: ["소드맨", "크루세이더", "팔라딘", "로열가드", "임페리얼가드"], icon: <Shield size={16} /> },
   ],
   "법사계열": [
      { name: "위자드 계열", steps: ["매지션", "위자드", "하이위자드", "워록", "아크메이지"], icon: <Flame size={16} /> },
      { name: "세이지 계열", steps: ["매지션", "세이지", "프로페서", "소서러", "엘레멘탈마스터"], icon: <BookOpen size={16} /> },
   ],
   "상인계열": [
      { name: "블랙스미스 계열", steps: ["머첸트", "블랙스미스", "화이트스미스", "미케닉", "마이스터"], icon: <HammerIcon size={16} /> },
      { name: "알케미스트 계열", steps: ["머첸트", "알케미스트", "크리에이터", "제네릭", "바이올로"], icon: <BeakerIcon size={16} /> },
   ],
   "복사계열": [
      { name: "프리스트 계열", steps: ["어콜라이트", "프리스트", "하이프리스트", "아크비숍", "카디날"], icon: <CrossIcon size={16} /> },
      { name: "몽크 계열", steps: ["어콜라이트", "몽크", "챔피언", "수라", "인퀴지터"], icon: <Zap size={16} /> },
   ],
   "도둑계열": [
      { name: "어쌔신 계열", steps: ["씨프", "어쌔신", "어쌔신크로스", "길로틴크로스", "쉐도우크로스"], icon: <Skull size={16} /> },
      { name: "로그 계열", steps: ["씨프", "로그", "스토커", "쉐도우체이서", "어비스체이서"], icon: <MessageCircle size={16} /> },
   ],
   "궁수계열": [
      { name: "헌터 계열", steps: ["아처", "헌터", "스나이퍼", "레인저", "윈드호크"], icon: <Crosshair size={16} /> },
      { name: "바드/댄서 계열", steps: ["아처", "바드/댄서", "클로운/집시", "민스트럴/원더러", "트루바두르/트루베르"], icon: <MusicIcon size={16} /> },
   ],
   "확장직업": [
      { name: "태권 계열", steps: ["태권소년/소녀", "권성/소울링커", "성제/소울리퍼", "천제/영도사"], icon: <Star size={16} /> },
      { name: "닌자 계열", steps: ["닌자", "카게로우/오보로", "신키로/시라누이"], icon: <Wind size={16} /> },
      { name: "건슬링거 계열", steps: ["건슬링거", "리베리온", "나이트워치"], icon: <TargetIcon size={16} /> },
      { name: "슈퍼노비스", steps: ["슈퍼노비스", "슈퍼노비스(확장)", "하이퍼노비스"], icon: <Sparkles size={16} /> },
      { name: "도람족", steps: ["소환사", "혼령사"], icon: <CatIcon size={16} /> },
   ]
};

// --- Icons Components ---
function HammerIcon(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 12-8.5 8.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L12 9" /><path d="M17.64 15 22 10.64" /><path d="m20.91 11.7-1.25-1.25c-.6-.6-.93-1.4-.93-2.25V7.86c0-.55-.45-1-1-1H14c-.55 0-1 .45-1 1v3.8c0 .85-.33 1.65-.93 2.25L10.82 15" /></svg>; }
function BeakerIcon(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 3h15" /><path d="M6 3v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V3" /><path d="M6 14h12" /></svg>; }
function CrossIcon(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 2a2 2 0 0 0-2 2v5H4a2 2 0 0 0-2 2v2c0 1.1.9 2 2 2h5v5c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2v-5h5a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-5V4a2 2 0 0 0-2-2h-2z" /></svg>; }
function MusicIcon(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>; }
function TargetIcon(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>; }
function CatIcon(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5c.67 0 1.35.09 2 .26 1.78-2 5.03-2.84 6.42-2.26 1.4.58-.42 7-.42 7 .57 1.07 1 2.24 1 3.44C21 17.9 16.97 21 12 21S3 17.9 3 13.44c0-1.2.43-2.37 1-3.44 0 0-1.82-6.42-.42-7 1.39-.58 4.64.26 6.42 2.26 .65-.17 1.33-.26 2-.26z" /></svg>; }

const SkillSimulator: React.FC = () => {
   // Navigation State
   const [selectedCategory, setSelectedCategory] = useState("상인계열");
   const [selectedLineIndex, setSelectedLineIndex] = useState(1);
   const [selectedJobStep, setSelectedJobStep] = useState("제네릭");

   // Data State
   const [skillLevels, setSkillLevels] = useState<SkillState>({});
   const [skills, setSkills] = useState<Skill[]>([]);
   const [isLoading, setIsLoading] = useState(false);
   const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);

   // Cache
   const [skillCache, setSkillCache] = useState<Record<string, Skill[]>>({});

   // Current Line Data
   // @ts-ignore
   const currentLine = JOB_TREE[selectedCategory][selectedLineIndex];

   // Fetch skills logic
   useEffect(() => {
      const loadSkills = async () => {
         if (skillCache[selectedJobStep]) {
            setSkills(skillCache[selectedJobStep]);
            return;
         }
         setIsLoading(true);
         try {
            const data = await fetchSkillsWithGemini(selectedJobStep);
            setSkills(data);
            setSkillCache(prev => ({ ...prev, [selectedJobStep]: data }));
         } catch (e) { console.error(e); } finally { setIsLoading(false); }
      };
      loadSkills();
   }, [selectedJobStep]);

   // When skills load, select the first one if none selected
   useEffect(() => {
      if (skills.length > 0 && !selectedSkill) {
         setSelectedSkill(skills[0]);
      }
   }, [skills]);

   // Helper: Get Icon
   const getIcon = (iconName: string | undefined, size = 20) => {
      const name = iconName?.toLowerCase() || '';
      const className = "text-gray-700";
      if (name.includes('sword') || name.includes('axe')) return <Swords size={size} className="text-red-600" />;
      if (name.includes('shield')) return <Shield size={size} className="text-blue-600" />;
      if (name.includes('magic') || name.includes('book')) return <BookOpen size={size} className="text-purple-600" />;
      if (name.includes('fire')) return <Flame size={size} className="text-orange-500" />;
      if (name.includes('ice') || name.includes('water')) return <Droplets size={size} className="text-blue-500" />;
      if (name.includes('wind')) return <Wind size={size} className="text-green-500" />;
      if (name.includes('heal') || name.includes('potion')) return <Heart size={size} className="text-pink-500" />;
      if (name.includes('cart')) return <Anchor size={size} className="text-amber-800" />;
      if (name.includes('poison')) return <Skull size={size} className="text-green-700" />;
      return <Sparkles size={size} className="text-gray-500" />;
   };

   // Helper: Check requirements
   const checkRequirements = (skill: Skill) => {
      if (!skill.requirements) return { met: true, message: '' };
      for (const req of skill.requirements) {
         const currentLv = skillLevels[req.skillId] || 0;
         if (currentLv < req.level) {
            const reqSkillName = skills.find(s => s.id === req.skillId)?.name || req.skillId;
            return { met: false, message: `${reqSkillName} Lv.${req.level} 필요` };
         }
      }
      return { met: true, message: '' };
   };

   const handleLevelChange = (skill: Skill, increment: boolean) => {
      const currentLv = skillLevels[skill.id] || 0;
      const reqStatus = checkRequirements(skill);

      if (increment) {
         if (!reqStatus.met) {
            // Maybe show toast? For now just return.
            return;
         }
         if (currentLv < skill.maxLevel) {
            setSkillLevels(prev => ({ ...prev, [skill.id]: currentLv + 1 }));
         }
      } else {
         if (currentLv > 0) {
            setSkillLevels(prev => ({ ...prev, [skill.id]: currentLv - 1 }));
         }
      }
   };

   const handleSkillClick = (skill: Skill) => {
      setSelectedSkill(skill);
      // Optional: Click to level up? 
      // Let's keep click strictly for Selection to avoid accidental points allocation.
      // Double click could be level up.
   };

   const resetSkills = () => {
      if (confirm('스킬 트리를 초기화 하시겠습니까?')) {
         const newLevels = { ...skillLevels };
         skills.forEach(s => delete newLevels[s.id]);
         setSkillLevels(newLevels);
      }
   };

   const currentJobPoints = skills.reduce((acc, skill) => acc + (skillLevels[skill.id] || 0), 0);
   const totalPoints = Object.values(skillLevels).reduce((acc: number, curr: number) => acc + curr, 0);

   // SVG Line Calculation
   const renderLines = () => {
      return skills.map(skill => {
         if (!skill.requirements) return null;
         return skill.requirements.map((req, i) => {
            const parent = skills.find(s => s.id === req.skillId);
            if (!parent) return null;

            // Grid logic: 80px width col, 100px height row. Center is +40, +40 approx
            const x1 = (parent.col * 90) + 40;
            const y1 = (parent.row * 110) + 40;
            const x2 = (skill.col * 90) + 40;
            const y2 = (skill.row * 110) + 40;

            // Simple check if requirement is met
            const isReqMet = (skillLevels[parent.id] || 0) >= req.level;

            return (
               <line
                  key={`${skill.id}-${parent.id}-${i}`}
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke={isReqMet ? "#3b82f6" : "#e2e8f0"}
                  strokeWidth={isReqMet ? 2 : 1}
                  strokeDasharray={isReqMet ? "0" : "4"}
               />
            );
         });
      });
   };

   return (
      <div className="h-[calc(100vh-100px)] flex flex-col xl:flex-row gap-4 animate-fade-in pb-4">

         {/* --- Left: Job Selector (Compact Mode on Mobile?) --- */}
         <div className="hidden xl:flex w-64 flex-col gap-4 shrink-0 overflow-y-auto no-scrollbar">
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
               <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                  <BookOpen className="text-kafra-600" size={16} /> 직업 계열
               </h3>
               <div className="space-y-1">
                  {Object.keys(JOB_TREE).map(cat => (
                     <div key={cat} className="space-y-1">
                        <div
                           onClick={() => setSelectedCategory(cat)}
                           className={`px-3 py-2 rounded-lg text-xs font-bold cursor-pointer flex justify-between items-center transition-colors ${selectedCategory === cat ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                           {cat}
                           {selectedCategory === cat && <ChevronRight size={12} />}
                        </div>
                        {selectedCategory === cat && (
                           <div className="pl-2 space-y-1 animate-slide-up">
                              {/* @ts-ignore */}
                              {JOB_TREE[cat].map((line, idx) => (
                                 <button
                                    key={idx}
                                    onClick={() => { setSelectedLineIndex(idx); setSelectedJobStep(line.steps[0]); }}
                                    className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 border transition-all ${selectedLineIndex === idx ? 'bg-kafra-50 border-kafra-200 text-kafra-700' : 'bg-white border-transparent hover:bg-gray-50 text-gray-600'}`}
                                 >
                                    {line.icon} {line.name}
                                 </button>
                              ))}
                           </div>
                        )}
                     </div>
                  ))}
               </div>
            </div>
            {/* Total Points Card */}
            <div className="bg-gray-900 text-white rounded-2xl p-4 shadow-lg">
               <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Total Points</div>
               <div className="text-3xl font-black text-kafra-400">{totalPoints}</div>
            </div>
         </div>

         {/* --- Center: Skill Tree Area --- */}
         <div className="flex-1 flex flex-col min-w-0 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden relative">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white z-20">
               <div className="flex items-center gap-2 overflow-x-auto no-scrollbar max-w-[70%]">
                  {currentLine.steps.map((step: string, idx: number) => (
                     <button
                        key={step}
                        onClick={() => setSelectedJobStep(step)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors
                        ${selectedJobStep === step
                              ? 'bg-kafra-600 text-white shadow-sm'
                              : 'text-gray-500 hover:bg-gray-50'
                           }
                     `}
                     >
                        {step}
                     </button>
                  ))}
               </div>
               <button onClick={resetSkills} className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 px-2 py-1 rounded hover:bg-red-50 transition-colors">
                  <RotateCcw size={12} /> 초기화
               </button>
            </div>

            {/* Tree Canvas */}
            <div className="flex-1 overflow-auto bg-gray-50/30 relative custom-scrollbar p-10">
               {isLoading ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                     <RefreshCw className="animate-spin text-kafra-500 mb-2" size={24} />
                     <span className="text-xs text-gray-400">스킬 트리를 불러오는 중...</span>
                  </div>
               ) : (
                  <div className="relative min-w-[600px] min-h-[600px]">
                     {/* Connection Lines Layer */}
                     <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
                        {renderLines()}
                     </svg>

                     {/* Nodes Layer */}
                     <div className="relative z-10">
                        {skills.map(skill => {
                           const level = skillLevels[skill.id] || 0;
                           const reqStatus = checkRequirements(skill);
                           const isLocked = !reqStatus.met;
                           const isMaxed = level === skill.maxLevel;
                           const isSelected = selectedSkill?.id === skill.id;

                           return (
                              <div
                                 key={skill.id}
                                 onClick={() => handleSkillClick(skill)}
                                 className="absolute transition-all duration-200"
                                 style={{
                                    left: (skill.col * 90) + 'px',
                                    top: (skill.row * 110) + 'px',
                                    width: '80px',
                                    height: '80px'
                                 }}
                              >
                                 <div className={`
                                  w-full h-full rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all
                                  border-2 shadow-sm relative group bg-white
                                  ${isSelected
                                       ? 'border-kafra-500 ring-4 ring-kafra-100 z-20 scale-105'
                                       : isLocked
                                          ? 'border-gray-200 bg-gray-50 opacity-60 grayscale'
                                          : isMaxed
                                             ? 'border-amber-400 bg-amber-50'
                                             : 'border-gray-200 hover:border-kafra-300 hover:-translate-y-1'
                                    }
                               `}>
                                    {isLocked && <Lock size={12} className="absolute top-2 right-2 text-gray-400" />}
                                    {getIcon(skill.icon, 24)}

                                    {/* Level Bar */}
                                    <div className="mt-2 w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                       <div
                                          className={`h-full rounded-full transition-all duration-300 ${isMaxed ? 'bg-amber-400' : 'bg-kafra-500'}`}
                                          style={{ width: `${(level / skill.maxLevel) * 100}%` }}
                                       ></div>
                                    </div>
                                    <div className={`text-[9px] font-bold mt-0.5 ${isMaxed ? 'text-amber-600' : 'text-gray-400'}`}>
                                       {level}/{skill.maxLevel}
                                    </div>
                                 </div>

                                 <div className={`
                                  text-center text-[10px] font-bold mt-1 truncate px-1 py-0.5 rounded
                                  ${isSelected ? 'bg-kafra-600 text-white' : 'text-gray-600'}
                               `}>
                                    {skill.name}
                                 </div>
                              </div>
                           );
                        })}
                     </div>
                  </div>
               )}
            </div>
         </div>

         {/* --- Right: Detail Panel (Responsive) --- */}
         {/* 
          On Desktop: Static Panel on Right
          On Mobile: Fixed Bottom Sheet (using absolute/fixed positioning)
      */}
         <div className={`
         fixed inset-x-0 bottom-0 z-50 h-[45vh] shadow-[0_-4px_20px_rgba(0,0,0,0.1)] rounded-t-3xl overflow-hidden
         xl:static xl:h-auto xl:w-80 xl:rounded-2xl xl:shadow-sm xl:border xl:border-gray-200
         bg-white transition-transform duration-300 transform
         ${selectedSkill ? 'translate-y-0' : 'translate-y-full xl:translate-y-0'}
      `}>
            {selectedSkill ? (
               <SkillDetailPanel
                  skill={selectedSkill}
                  level={skillLevels[selectedSkill.id] || 0}
                  onClose={() => setSelectedSkill(null)}
                  onLevelChange={handleLevelChange}
                  requirementsMet={checkRequirements(selectedSkill)}
               />
            ) : (
               <div className="h-full flex flex-col items-center justify-center text-gray-300 p-6 text-center">
                  <BookOpen size={40} className="mb-4 opacity-20" />
                  <p className="text-sm font-bold">스킬을 선택하여<br />상세 정보를 확인하세요.</p>
               </div>
            )}
         </div>

      </div>
   );
};

export default SkillSimulator;
