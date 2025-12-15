
import React from 'react';
import { MarketItem } from '../types';
import { Package, Clock, Star, Zap } from 'lucide-react';

interface ResultsTableProps {
  items: MarketItem[];
  isLoading: boolean;
  selectedItemId: string | null;
  onItemClick: (item: MarketItem) => void;
}

const ResultsTable: React.FC<ResultsTableProps> = ({ items, isLoading, selectedItemId, onItemClick }) => {
  const formatZeny = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-100 p-4 animate-pulse flex items-center justify-between">
            <div className="flex items-center gap-3 w-2/3">
              <div className="h-10 w-10 bg-gray-100 rounded-lg"></div>
              <div className="space-y-2 flex-1">
                <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                <div className="h-2 bg-gray-50 rounded w-1/4"></div>
              </div>
            </div>
            <div className="h-4 bg-gray-100 rounded w-16"></div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 border-dashed">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gray-50 mb-3">
          <Package className="h-6 w-6 text-gray-300" />
        </div>
        <h3 className="text-base font-bold text-gray-900">검색 결과가 없습니다</h3>
        <p className="mt-1 text-xs text-gray-500">필터를 변경하거나 검색어를 확인해주세요.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 pb-20 md:pb-0">
      {items.map((item, index) => {
        const isSelected = selectedItemId === item.id;

        return (
          <div
            key={`${item.id}-${index}`}
            onClick={() => onItemClick(item)}
            className={`
              relative group flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all duration-200
              ${isSelected
                ? 'bg-kafra-50/50 border-kafra-500 ring-1 ring-kafra-500 shadow-sm z-10'
                : 'bg-white border-gray-100 hover:border-kafra-300 hover:shadow-card'
              }
            `}
          >
            {/* Selection Indicator Bar */}
            {isSelected && (
              <div className="absolute left-0 top-3 bottom-3 w-1 bg-kafra-500 rounded-r-full"></div>
            )}

            <div className="flex items-center gap-3 min-w-0 flex-1">
              {/* Image Thumbnail */}
              <div className="relative shrink-0">
                <div className={`h-11 w-11 rounded-lg overflow-hidden border ${isSelected ? 'border-kafra-200' : 'border-gray-100'} bg-gray-50`}>
                  <img src={item.image_placeholder} alt={item.name} className="w-full h-full object-cover" />
                </div>
                {item.card_slots > 0 && (
                  <div className="absolute -bottom-1 -right-1 bg-gray-900 text-white text-[9px] font-bold px-1 rounded-md border border-white">
                    {item.card_slots}
                  </div>
                )}
              </div>

              {/* Item Text Info */}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <h4 className={`text-sm font-bold truncate ${isSelected ? 'text-kafra-700' : 'text-gray-900'}`}>
                    {item.refine_level > 0 && <span className="text-game-gold mr-1">+{item.refine_level}</span>}
                    {item.name}
                  </h4>
                  {/* Card Badges (Mobile: Hidden, PC: Show up to 2) */}
                  <div className="hidden sm:flex items-center gap-1">
                    {item.cards_equipped?.slice(0, 2).map((c, i) => (
                      <span key={i} className="w-1.5 h-1.5 rounded-full bg-yellow-400" title={c}></span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="font-medium text-gray-600">{item.server}</span>
                  <span className="w-0.5 h-2.5 bg-gray-200"></span>
                  <span className="truncate max-w-[100px]">{item.seller}</span>
                  <span className="hidden sm:flex items-center gap-0.5 text-gray-400">
                    <Clock size={10} /> {item.created_at}
                  </span>
                </div>
              </div>
            </div>

            {/* Price Column */}
            <div className="text-right pl-3">
              <div className={`text-base font-extrabold whitespace-nowrap ${item.price >= 100000000 ? 'text-red-500' : 'text-gray-900'}`}>
                {formatZeny(item.price)}
                <span className="text-[10px] text-gray-400 font-normal ml-0.5">Z</span>
              </div>
              <div className="text-[10px] font-medium text-gray-400 bg-gray-50 inline-block px-1.5 rounded-sm">
                {item.amount}개
              </div>
            </div>

            {/* Arrow for mobile hint */}
            <div className="ml-2 md:hidden text-gray-300">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ResultsTable;
