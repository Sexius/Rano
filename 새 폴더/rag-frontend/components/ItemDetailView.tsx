import React, { useEffect, useState } from 'react';
import { MarketItem } from '../types';
import { X, Store, MapPin, Copy, Shield, Zap, Clock, Info, Search } from 'lucide-react';
import { searchDivineItem, getItemDetail } from '../services/apiService';
import { getUniqueDescriptionLines } from '../utils/divinePrideUtils';

interface ItemDetailViewProps {
  item: MarketItem | null;
  onClose: () => void;
}

const ItemDetailView: React.FC<ItemDetailViewProps> = ({ item, onClose }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [detailedInfo, setDetailedInfo] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    if (item) {
      setIsAnimating(true);
      setDetailedInfo(null);
      fetchDivinePrideInfo(item.name);
    }
  }, [item]);

  const fetchDivinePrideInfo = async (name: string) => {
    setLoadingDetail(true);
    try {
      // 1. Search for Item ID
      // Remove refine level and slots for better search match
      const cleanName = name.replace(/^\+\d+\s+/, '').replace(/\s+\[\d+\]$/, '').trim();
      const searchResult = await searchDivineItem(cleanName);

      if (searchResult && Array.isArray(searchResult) && searchResult.length > 0) {
        // Assume first result is correct (or filter by specific logic)
        const firstMatch = searchResult[0];
        if (firstMatch && firstMatch.id) {
          // 2. Fetch Item Detail
          const detail = await getItemDetail(firstMatch.id);
          setDetailedInfo(detail);
        }
      }
    } catch (e) {
      console.error("Failed to load detailed info", e);
    } finally {
      setLoadingDetail(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('명령어가 복사되었습니다: ' + text);
  };

  if (!item) return null;

  const formatZeny = (amount: number) => new Intl.NumberFormat('ko-KR').format(amount);

  // Content Component to be reused in both Desktop and Mobile views
  const DetailContent = () => (
    <div className="h-full flex flex-col">
      {/* Header Image Area */}
      <div className="relative shrink-0">
        <div className="absolute inset-0 bg-gradient-to-b from-kafra-500/10 to-transparent"></div>
        <div className="p-6 flex flex-col items-center justify-center pt-8 pb-6">
          <div className="h-24 w-24 bg-white rounded-2xl shadow-lg border-4 border-white overflow-hidden mb-4 relative group">
            <img src={item.image_placeholder} alt={item.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
            {item.refine_level > 0 && (
              <div className="absolute top-0 right-0 bg-game-gold text-white text-xs font-bold px-2 py-0.5 rounded-bl-lg shadow-sm">
                +{item.refine_level}
              </div>
            )}
          </div>
          <div className="text-center px-4">
            <h2 className="text-xl font-bold text-gray-900 leading-tight">
              {item.name}
            </h2>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-bold rounded">{item.server}</span>
              <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-bold rounded">{item.category}</span>
              <span className="flex items-center gap-1 text-xs text-gray-400"><Clock size={10} /> {item.created_at}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto px-6 pb-24 md:pb-6 space-y-6 no-scrollbar">

        {/* Price Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm text-center">
          <div className="text-xs text-gray-500 font-bold mb-1">판매 가격</div>
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-3xl font-extrabold text-gray-900 tracking-tight">{formatZeny(item.price)}</span>
            <span className="text-sm font-medium text-gray-400">Zeny</span>
          </div>
          <div className="mt-2 text-xs text-gray-400">수량 {item.amount}개 보유 중</div>
        </div>

        {/* Shop Info */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5 uppercase tracking-wider">
            <Store size={14} className="text-kafra-500" /> 판매 상점 정보
          </h3>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 relative overflow-hidden">
            <div className="relative z-10">
              <div className="text-sm font-bold text-gray-900 mb-1 line-clamp-2">"{item.shop_title}"</div>
              <div className="flex items-center justify-between mt-3 text-sm">
                <div className="flex flex-col">
                  <span className="text-xs text-gray-400">판매자</span>
                  <span className="font-medium text-gray-700">{item.seller}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xs text-gray-400">위치</span>
                  <span className="font-medium text-gray-700 flex items-center gap-1">
                    <MapPin size={12} /> {item.location}
                  </span>
                </div>
              </div>
            </div>
            {/* Decoration */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-kafra-100 rounded-full blur-2xl opacity-50 -mr-6 -mt-6"></div>
          </div>
        </div>

        {/* Item Details */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5 uppercase tracking-wider">
            <Info size={14} className="text-kafra-500" /> 아이템 상세 정보 (Divine Pride)
          </h3>

          {/* Detailed Info from API */}
          {loadingDetail ? (
            <div className="flex justify-center py-4 bg-gray-50 rounded-xl">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-kafra-500"></div>
            </div>
          ) : detailedInfo ? (
            <div className="bg-white border border-gray-200 rounded-xl p-4 text-sm text-gray-600 space-y-3 shadow-sm">
              {detailedInfo.description && (
                <div className="bg-gray-50 p-3 rounded-lg text-xs leading-relaxed">
                  {getUniqueDescriptionLines(detailedInfo.description).map((line, idx) => (
                    <div key={idx} className="min-h-[1.2em]">{line}</div>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 text-xs">
                {detailedInfo.weight !== undefined && (
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span className="text-gray-400">무게</span>
                    <span className="font-bold">{detailedInfo.weight}</span>
                  </div>
                )}
                {detailedInfo.defense !== undefined && (
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span className="text-gray-400">방어력</span>
                    <span className="font-bold">{detailedInfo.defense}</span>
                  </div>
                )}
                {detailedInfo.attack !== undefined && (
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span className="text-gray-400">공격력</span>
                    <span className="font-bold">{detailedInfo.attack}</span>
                  </div>
                )}
                {detailedInfo.slots !== undefined && (
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span className="text-gray-400">슬롯</span>
                    <span className="font-bold">{detailedInfo.slots}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-4 bg-gray-50 rounded-xl text-xs text-gray-400">
              상세 정보를 불러올 수 없습니다.
            </div>
          )}

          {/* In-game Cards (from Vending) */}
          {item.cards_equipped && item.cards_equipped.length > 0 && (
            <div className="mb-3">
              <div className="flex flex-wrap gap-2">
                {item.cards_equipped.map((card, i) => (
                  <div key={i} className="flex items-center gap-2 bg-white border border-yellow-200 shadow-sm px-3 py-2 rounded-lg text-sm font-bold text-gray-700">
                    <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                    {card}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Floating Action Button for Copy */}
      <div className="p-4 border-t border-gray-100 bg-white">
        <button
          onClick={() => copyToClipboard(`/w ${item.seller}`)}
          className="w-full bg-gray-900 hover:bg-black text-white font-bold py-3.5 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95"
        >
          <Copy size={18} />
          <span>판매자에게 귓속말 복사</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Desktop Side Panel (Hidden on Mobile) */}
      <div className="hidden lg:block w-[400px] h-[calc(100vh-80px)] sticky top-24 bg-white rounded-2xl shadow-xl border border-gray-100 ml-6 overflow-hidden">
        <div className="absolute top-4 right-4 z-10">
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        <DetailContent />
      </div>

      {/* 2. Mobile Bottom Sheet (Hidden on Desktop) */}
      <div className="lg:hidden fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none">
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity pointer-events-auto ${isAnimating ? 'opacity-100' : 'opacity-0'}`}
          onClick={onClose}
        ></div>

        {/* Sheet */}
        <div className={`
           pointer-events-auto w-full sm:w-[480px] bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl h-[85vh] sm:h-[80vh] flex flex-col relative
           transition-transform duration-300 ease-out transform
           ${isAnimating ? 'translate-y-0' : 'translate-y-full'}
        `}>
          {/* Drag Handle for mobile feel */}
          <div className="w-full flex justify-center pt-3 pb-1" onClick={onClose}>
            <div className="w-12 h-1.5 bg-gray-200 rounded-full"></div>
          </div>

          <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full z-10 bg-white/50">
            <X size={24} />
          </button>

          <DetailContent />
        </div>
      </div>
    </>
  );
};

export default ItemDetailView;
