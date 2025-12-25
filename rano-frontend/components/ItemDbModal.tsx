
import React from 'react';
import { X, Box, Coins, Scale, TrendingUp, Users, Info } from 'lucide-react';

interface ItemDbEntry {
    id: number;
    name: string;
    slots: number;
    type: string;
    description: string;
    stats: string[];
    weight: number;
    reqLevel: number;
    weaponLevel?: number;
    jobs: string;
    jobTags: string[];
    npcPrice: { buy?: number; sell?: number };
}

interface ItemDbModalProps {
    item: ItemDbEntry | null;
    onClose: () => void;
}

const ItemDbModal: React.FC<ItemDbModalProps> = ({ item, onClose }) => {
    if (!item) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-gray-900/70 backdrop-blur-sm animate-fade-in"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-slide-up">

                {/* Header */}
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-start">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white rounded-xl border border-gray-200 shadow-sm flex items-center justify-center p-1 relative">
                            <img src={`https://static.divine-pride.net/images/items/collection/${item.id}.png`} onError={(e) => (e.target as HTMLImageElement).src = 'https://static.divine-pride.net/images/items/collection/501.png'} alt={item.name} className="w-full h-full object-contain rounded-lg" />
                            {item.slots > 0 && (
                                <div className="absolute -bottom-1.5 -right-1.5 bg-gray-900 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-md border border-white shadow-sm">
                                    {item.slots}
                                </div>
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-mono text-gray-400 font-bold bg-white border border-gray-200 px-1.5 py-0.5 rounded">#{item.id}</span>
                                <span className="text-xs font-bold text-kafra-600 bg-kafra-50 px-2 py-0.5 rounded">{item.type}</span>
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 leading-tight">{item.name}</h2>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors shadow-sm border border-gray-100">
                        <X size={20} />
                    </button>
                </div>

                {/* Body (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">

                    {/* Basic Specs Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-center">
                            <div className="text-xs text-gray-400 font-bold mb-1 flex items-center justify-center gap-1"><Scale size={12} /> 무게</div>
                            <div className="font-bold text-gray-900">{item.weight}</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-center">
                            <div className="text-xs text-gray-400 font-bold mb-1 flex items-center justify-center gap-1"><TrendingUp size={12} /> 요구레벨</div>
                            <div className="font-bold text-gray-900">{item.reqLevel}</div>
                        </div>
                        {item.weaponLevel !== undefined && (
                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-center">
                                <div className="text-xs text-gray-400 font-bold mb-1 flex items-center justify-center gap-1"><Box size={12} /> 무기레벨</div>
                                <div className="font-bold text-gray-900">{item.weaponLevel}</div>
                            </div>
                        )}
                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-center">
                            <div className="text-xs text-gray-400 font-bold mb-1 flex items-center justify-center gap-1"><Coins size={12} /> 슬롯</div>
                            <div className="font-bold text-gray-900">{item.slots}</div>
                        </div>
                    </div>

                    {/* NPC Price Section */}
                    {(item.npcPrice.buy || item.npcPrice.sell) && (
                        <div className="space-y-2">
                            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                                <Coins size={16} className="text-kafra-500" /> NPC 상점 가격
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 text-center">
                                    <div className="text-[10px] text-blue-500 font-bold mb-1">상점 구매가</div>
                                    <div className="font-bold text-blue-700">{item.npcPrice.buy ? `${item.npcPrice.buy.toLocaleString()}z` : '-'}</div>
                                </div>
                                <div className="bg-green-50 p-3 rounded-xl border border-green-100 text-center">
                                    <div className="text-[10px] text-green-600 font-bold mb-1">디스카운트 구매가</div>
                                    <div className="font-bold text-green-700">{item.npcPrice.buy ? `${Math.floor(item.npcPrice.buy * 0.76).toLocaleString()}z` : '-'}</div>
                                </div>
                                <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 text-center">
                                    <div className="text-[10px] text-amber-600 font-bold mb-1">상점 판매가</div>
                                    <div className="font-bold text-amber-700">{item.npcPrice.sell ? `${item.npcPrice.sell.toLocaleString()}z` : '-'}</div>
                                </div>
                                <div className="bg-purple-50 p-3 rounded-xl border border-purple-100 text-center">
                                    <div className="text-[10px] text-purple-600 font-bold mb-1">오버차지 판매가</div>
                                    <div className="font-bold text-purple-700">{item.npcPrice.sell ? `${Math.floor(item.npcPrice.sell * 1.24).toLocaleString()}z` : '-'}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Description Box */}
                    <div className="space-y-2">
                        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                            <Info size={16} className="text-kafra-500" /> 아이템 설명
                        </h3>
                        <div className="bg-yellow-50/50 p-4 rounded-xl border border-yellow-100 text-sm text-gray-700 leading-relaxed font-serif relative">
                            <div className="absolute top-0 left-0 w-1 h-full bg-yellow-200 rounded-l-xl"></div>

                            {/* 설명 */}
                            {item.description && (
                                <p className="mb-3 whitespace-pre-wrap">
                                    {item.description}
                                </p>
                            )}

                            {/* 옵션/수치들 */}
                            {item.stats && item.stats.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-yellow-200/50 font-sans">
                                    {item.stats.map((stat, idx) => (
                                        <div key={idx} className="flex items-start gap-2 mb-1">
                                            <span className="text-yellow-500 mt-1.5 w-1 h-1 bg-yellow-400 rounded-full shrink-0"></span>
                                            <span className="text-gray-800 font-medium">{stat}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Job Restrictions */}
                    <div className="space-y-2">
                        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                            <Users size={16} className="text-kafra-500" /> 착용 가능 직업
                        </h3>
                        <div className="bg-white border border-gray-200 p-3 rounded-xl text-sm text-gray-600">
                            {item.jobs}
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center text-xs text-gray-400">
                    <span>Database ID: {item.id}</span>
                    <span>Data provided by RANO API</span>
                </div>

            </div>
        </div>
    );
};

export default ItemDbModal;
export type { ItemDbEntry };
