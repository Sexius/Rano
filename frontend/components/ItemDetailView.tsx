
import React, { useEffect, useState } from 'react';
import { MarketItem } from '../types';
import { X, Store, MapPin, Copy, Shield, Zap, Clock, Info, Loader2 } from 'lucide-react';
import { createImageErrorHandler } from '../utils/imageFallback';

interface ItemDetailViewProps {
  item: MarketItem | null;
  onClose: () => void;
}

const ItemDetailView: React.FC<ItemDetailViewProps> = ({ item, onClose }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [detailedItem, setDetailedItem] = useState<Partial<MarketItem> | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Card tooltip state
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [cardInfo, setCardInfo] = useState<{ id: number; name: string; description: string } | null>(null);
  const [isLoadingCard, setIsLoadingCard] = useState(false);

  // Fetch card info when clicked
  const fetchCardInfo = async (cardName: string) => {
    setSelectedCard(cardName);
    setIsLoadingCard(true);
    setCardInfo(null);

    try {
      // Construct proper API URL
      let apiBase = import.meta.env.VITE_API_URL || 'https://rano.onrender.com';
      apiBase = apiBase.replace(/\/+$/, ''); // Remove trailing slashes
      const apiUrl = apiBase.endsWith('/api') ? apiBase : `${apiBase}/api`;

      // Clean card name (remove [옵션] prefix for enchants)
      const cleanName = cardName.replace(/^\[옵션\]\s*/, '').trim();

      console.log('[CardTooltip] Searching for:', cleanName);

      const response = await fetch(`${apiUrl}/items/search?keyword=${encodeURIComponent(cleanName)}`);
      if (response.ok) {
        const data = await response.json();
        console.log('[CardTooltip] API returned:', data.length, 'items');
        const match = data.find((item: any) => item.nameKr === cleanName) || data[0];
        if (match) {
          setCardInfo({
            id: match.id,
            name: match.nameKr,
            description: (match.description || '설명 없음').replace(/\^[0-9A-Fa-f]{6}/g, '').replace(/\\n/g, '\n')
          });
        }
      }
    } catch (e) {
      console.error('Failed to fetch card info:', e);
    } finally {
      setIsLoadingCard(false);
    }
  };

  const closeCardTooltip = () => {
    setSelectedCard(null);
    setCardInfo(null);
  };

  useEffect(() => {
    if (item) {
      setIsAnimating(true);

      // Fetch actual seller name if ssi exists
      if (item.ssi && item.map_id) {
        setIsLoadingDetail(true);
        import('../services/vendingService').then(({ getVendingItemDetail }) => {
          getVendingItemDetail(item.server, item.ssi!, item.map_id!)
            .then(detail => {
              if (detail) setDetailedItem(detail);
              setIsLoadingDetail(false);
            })
            .catch(() => setIsLoadingDetail(false));
        });
      } else {
        setDetailedItem(null);
      }
    }
  }, [item]);

  if (!item) return null;

  // Use detailed information if available
  const displaySeller = detailedItem?.seller || item.seller;
  const displayShopTitle = detailedItem?.shop_title || item.shop_title;
  const displayCards = (detailedItem?.cards_equipped && detailedItem.cards_equipped.length > 0)
    ? detailedItem.cards_equipped
    : item.cards_equipped;

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
              <div className="text-sm font-bold text-gray-900 mb-1 line-clamp-2">"{displayShopTitle}"</div>
              <div className="flex items-center justify-between mt-3 text-sm">
                <div className="flex flex-col">
                  <span className="text-xs text-gray-400">판매자</span>
                  <span className={`font-medium text-gray-700 ${isLoadingDetail ? 'animate-pulse' : ''}`}>
                    {isLoadingDetail ? '불러오는 중...' : displaySeller}
                  </span>
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
            <Info size={14} className="text-kafra-500" /> 아이템 상세
          </h3>

          {/* Cards - Clickable with Tooltip */}
          {displayCards && displayCards.length > 0 && (
            <div className="mb-3 relative">
              <div className="flex flex-wrap gap-2">
                {displayCards.map((card, i) => (
                  <button
                    key={i}
                    onClick={() => fetchCardInfo(card)}
                    className="flex items-center gap-2 bg-white border border-yellow-200 shadow-sm px-3 py-2 rounded-lg text-sm font-bold text-gray-700 hover:bg-yellow-50 hover:border-yellow-400 transition-all cursor-pointer"
                  >
                    <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                    {card}
                    <span className="text-xs text-kafra-500 ml-1">ⓘ</span>
                  </button>
                ))}
              </div>

              {/* Card Info Tooltip/Popup */}
              {selectedCard && (
                <div className="absolute z-50 top-full left-0 mt-2 w-full max-w-md bg-white rounded-xl border border-gray-200 shadow-2xl p-4 animate-fade-in">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      {cardInfo && (
                        <img
                          src={`https://static.divine-pride.net/images/items/collection/${cardInfo.id}.png`}
                          alt={cardInfo.name}
                          className="w-10 h-10 object-contain"
                          onError={createImageErrorHandler(cardInfo.name)}
                        />
                      )}
                      <div>
                        <h4 className="font-bold text-gray-900">{selectedCard}</h4>
                        {cardInfo && <span className="text-xs text-gray-400">ID: {cardInfo.id}</span>}
                      </div>
                    </div>
                    <button onClick={closeCardTooltip} className="text-gray-400 hover:text-gray-600">
                      <X size={16} />
                    </button>
                  </div>

                  {isLoadingCard ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-5 h-5 animate-spin text-kafra-500" />
                    </div>
                  ) : cardInfo ? (
                    <div className="bg-yellow-50/50 border border-yellow-100 rounded-lg p-3 text-sm text-gray-700">
                      <p className="whitespace-pre-wrap leading-relaxed">{cardInfo.description}</p>
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm">카드 정보를 찾을 수 없습니다</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Stats */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 text-sm text-gray-600 space-y-2 shadow-sm">
            {item.stats && item.stats.length > 0 ? (
              item.stats.map((stat, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-gray-400 shrink-0"></span>
                  <span className="leading-relaxed">{stat}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-400 italic">추가 옵션 없음</p>
            )}
            {item.description && (
              <div className="pt-3 mt-3 border-t border-gray-100 text-xs text-gray-500 italic">
                "{item.description}"
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity ${isAnimating ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* Modal */}
      <div className={`
        relative w-full max-w-md bg-white rounded-2xl shadow-2xl max-h-[85vh] overflow-hidden flex flex-col
        transition-all duration-300 ease-out transform
        ${isAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
      `}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X size={20} />
        </button>

        {/* Content */}
        <div className="overflow-y-auto">
          <DetailContent />
        </div>
      </div>
    </div>
  );
};

export default ItemDetailView;
