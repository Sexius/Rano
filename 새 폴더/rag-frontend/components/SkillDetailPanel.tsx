
import React from 'react';
import { Skill } from '../types';
import { X, Check, AlertCircle, ChevronUp, ChevronDown, RotateCcw } from 'lucide-react';

interface SkillDetailPanelProps {
    skill: Skill | null;
    level: number;
    onClose: () => void;
    onLevelChange: (skill: Skill, increment: boolean) => void;
    requirementsMet: { met: boolean; message: string };
}

const SkillDetailPanel: React.FC<SkillDetailPanelProps> = ({
    skill,
    level,
    onClose,
    onLevelChange,
    requirementsMet
}) => {
    if (!skill) return null;

    const isMaxed = level === skill.maxLevel;
    const isLocked = !requirementsMet.met;

    return (
        <div className="h-full flex flex-col bg-white">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex items-start justify-between bg-gray-50/50">
                <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shadow-sm ${isLocked ? 'bg-gray-100 border-gray-200 grayscale' : 'bg-white border-kafra-200'}`}>
                        {/* Note: Icon rendering is handled in parent, or pass icon node. For text we just use ID or generic */}
                        <div className="text-2xl">✨</div>
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 text-lg">{skill.name}</h3>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isMaxed ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                            {isMaxed ? 'Mastered' : `Lv. ${level} / ${skill.maxLevel}`}
                        </span>
                    </div>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                    <X size={20} className="text-gray-400" />
                </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">

                {/* Description */}
                <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">스킬 설명</h4>
                    <p className="text-sm text-gray-700 leading-relaxed bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                        {skill.description}
                    </p>
                </div>

                {/* Requirements */}
                <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">선행 조건</h4>
                    {skill.requirements && skill.requirements.length > 0 ? (
                        <div className="space-y-2">
                            {skill.requirements.map((req, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-sm bg-gray-50 p-2 rounded-lg border border-gray-100">
                                    {/* Logic for checking individual req needs state from parent, simplified here */}
                                    <span className="font-bold text-gray-700">{req.skillId}</span>
                                    <span className="text-gray-400">Lv.{req.level}</span>
                                </div>
                            ))}
                            {!requirementsMet.met && (
                                <div className="flex items-center gap-2 text-xs text-red-500 font-bold mt-2">
                                    <AlertCircle size={12} /> {requirementsMet.message}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-sm text-gray-400 italic">조건 없음</div>
                    )}
                </div>
            </div>

            {/* Footer / Controls */}
            <div className="p-4 border-t border-gray-100 bg-gray-50">
                <div className="flex items-center justify-between gap-4">
                    <button
                        onClick={() => onLevelChange(skill, false)}
                        disabled={level === 0}
                        className="flex-1 py-3 bg-white border border-gray-200 rounded-xl shadow-sm text-gray-700 font-bold hover:bg-gray-100 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        <ChevronDown size={18} /> 레벨 다운
                    </button>
                    <div className="text-2xl font-black text-gray-900 w-12 text-center">{level}</div>
                    <button
                        onClick={() => onLevelChange(skill, true)}
                        disabled={isMaxed || isLocked}
                        className="flex-1 py-3 bg-kafra-600 text-white rounded-xl shadow-md font-bold hover:bg-kafra-700 disabled:opacity-50 disabled:bg-gray-300 flex items-center justify-center gap-2"
                    >
                        <ChevronUp size={18} /> 레벨 업
                    </button>
                </div>
                {isLocked && (
                    <p className="text-center text-xs text-red-500 font-bold mt-3">
                        선행 스킬을 먼저 올려주세요.
                    </p>
                )}
            </div>
        </div>
    );
};

export default SkillDetailPanel;
