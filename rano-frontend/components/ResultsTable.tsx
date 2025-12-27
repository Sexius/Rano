
import React, { useState } from 'react';
import { MarketItem } from '../types';
import { Package, Clock, X, Loader2, Info } from 'lucide-react';
import { getZenyStyle, formatZeny } from '../utils/zenyStyle';

interface ItemDbInfo {
  id: number;
  name: string;
  description: string;
}

interface ResultsTableProps {
  items: MarketItem[];
  isLoading: boolean;
  selectedItemId: string | null;
  onItemClick: (item: MarketItem) => void;
}

const ResultsTable: React.FC<ResultsTableProps> = ({ items, isLoading, selectedItemId, onItemClick }) => {
  // Small popup state for item DB info
  const [itemPopover, setItemPopover] = useState<{ itemId: string; position: { x: number; y: number } } | null>(null);
  const [itemInfo, setItemInfo] = useState<ItemDbInfo | null>(null);
  const [isLoadingInfo, setIsLoadingInfo] = useState(false);

  // Fetch item info from DB when clicking item name
  const fetchItemInfo = async (itemName: string, itemId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent row click

    const rect = (event.target as HTMLElement).getBoundingClientRect();
    setItemPopover({ itemId, position: { x: rect.left, y: rect.bottom + 8 } });
    setIsLoadingInfo(true);
    setItemInfo(null);

    try {
      // Construct proper API URL
      let apiBase = import.meta.env.VITE_API_URL || 'https://rag-spring-backend.onrender.com';
      apiBase = apiBase.replace(/\/+$/, '');
      const apiUrl = apiBase.endsWith('/api') ? apiBase : `${apiBase}/api`;

      // Extract base item name
      const baseName = itemName
        .replace(/^\[UNIQUE\]\s*/i, '')
        .replace(/^\+\d+\s*/, '')
        .replace(/\[\d+\]$/, '')
        .trim();

      const response = await fetch(`${apiUrl}/items/search?keyword=${encodeURIComponent(baseName)}`);
      if (response.ok) {
        const data = await response.json();
        const match = data.find((item: any) => item.nameKr === baseName) || data[0];
        if (match) {
          setItemInfo({
            id: match.id,
            name: match.nameKr,
            description: (match.description || '설명 없음').replace(/\^[0-9A-Fa-f]{6}/g, '').replace(/\\n/g, '\n')
          });
        }
      }
    } catch (e) {
      console.error('Failed to fetch item info:', e);
    } finally {
      setIsLoadingInfo(false);
    }
  };

  const closeItemPopover = () => {
    setItemPopover(null);
    setItemInfo(null);
  };

  // Card hover tooltip state
  const [cardTooltip, setCardTooltip] = useState<{ cardName: string; position: { x: number; y: number } } | null>(null);
  const [cardInfo, setCardInfo] = useState<{ id: number; name: string; description: string } | null>(null);
  const [isLoadingCard, setIsLoadingCard] = useState(false);
  const hoverTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Fetch card info on hover
  const fetchCardInfo = async (cardName: string, event: React.MouseEvent) => {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    setCardTooltip({ cardName, position: { x: rect.left, y: rect.bottom + 8 } });
    setIsLoadingCard(true);
    setCardInfo(null);

    try {
      let apiBase = import.meta.env.VITE_API_URL || 'https://rag-spring-backend.onrender.com';
      apiBase = apiBase.replace(/\/+$/, '');
      const apiUrl = apiBase.endsWith('/api') ? apiBase : `${apiBase}/api`;

      // Clean card name (remove [옵션] prefix)
      const cleanName = cardName.replace(/^\[옵션\]\s*/, '').trim();

      const response = await fetch(`${apiUrl}/items/search?keyword=${encodeURIComponent(cleanName)}`);
      if (response.ok) {
        const data = await response.json();
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

  const handleCardMouseEnter = (cardName: string, event: React.MouseEvent) => {
    event.stopPropagation();
    hoverTimeoutRef.current = setTimeout(() => {
      fetchCardInfo(cardName, event);
    }, 300); // 300ms delay to prevent accidental triggers
  };

  const handleCardMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setCardTooltip(null);
    setCardInfo(null);
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
    <>
      <div className="flex flex-col gap-2 pb-20 md:pb-0 overflow-x-hidden">
        {items.map((item) => {
          const isSelected = selectedItemId === item.id;

          return (
            <div
              key={item.id}
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
                    {/* Item Info Button */}
                    <button
                      onClick={(e) => fetchItemInfo(item.name, item.id, e)}
                      className="flex-shrink-0 p-0.5 text-kafra-400 hover:text-kafra-600 hover:bg-kafra-50 rounded transition-colors"
                      title="아이템 정보"
                    >
                      <Info size={14} />
                    </button>
                  </div>
                  {/* Card/Enchant Badges */}
                  {item.cards_equipped && item.cards_equipped.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 mb-1">
                      {item.cards_equipped.slice(0, 3).map((card, i) => (
                        <span
                          key={i}
                          onMouseEnter={(e) => handleCardMouseEnter(card, e)}
                          onMouseLeave={handleCardMouseLeave}
                          className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium cursor-pointer hover:ring-2 hover:ring-offset-1 transition-all ${card.startsWith('[옵션]')
                            ? 'bg-purple-50 text-purple-600 border border-purple-200 hover:ring-purple-300'
                            : 'bg-yellow-50 text-yellow-700 border border-yellow-200 hover:ring-yellow-300'
                            }`}
                        >
                          {card.replace('[옵션] ', '').slice(0, 12)}{card.length > 12 ? '…' : ''}
                        </span>
                      ))}
                      {item.cards_equipped.length > 3 && (
                        <span className="text-[10px] text-gray-400">+{item.cards_equipped.length - 3}</span>
                      )}
                    </div>
                  )}
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
                <div
                  className="text-base font-extrabold whitespace-nowrap"
                  style={{ color: getZenyStyle(item.price).color, textShadow: getZenyStyle(item.price).textShadow }}
                >
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

      {/* Small Item Info Popup */}
      {
        itemPopover && (
          <div
            className="fixed z-50 bg-white rounded-xl border border-gray-200 shadow-2xl p-4 max-w-sm w-[90vw] sm:w-[350px] animate-fade-in"
            style={{
              left: Math.min(itemPopover.position.x, window.innerWidth - 370),
              top: Math.min(itemPopover.position.y, window.innerHeight - 250)
            }}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                {itemInfo && (
                  <img
                    src={`https://static.divine-pride.net/images/items/collection/${itemInfo.id}.png`}
                    alt={itemInfo.name}
                    className="w-10 h-10 object-contain bg-gray-50 rounded-lg border border-gray-100 p-1"
                    onError={(e) => (e.target as HTMLImageElement).src = 'https://static.divine-pride.net/images/items/collection/909.png'}
                  />
                )}
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">{itemInfo?.name || '로딩중...'}</h4>
                  {itemInfo && <span className="text-xs text-gray-400">ID: {itemInfo.id}</span>}
                </div>
              </div>
              <button onClick={closeItemPopover} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={16} />
              </button>
            </div>

            {isLoadingInfo ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-kafra-500" />
              </div>
            ) : itemInfo ? (
              <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-700 max-h-40 overflow-y-auto">
                <p className="whitespace-pre-wrap leading-relaxed">{itemInfo.description}</p>
              </div>
            ) : (
              <p className="text-gray-400 text-xs py-3 text-center">아이템 정보를 찾을 수 없습니다</p>
            )}
          </div>
        )
      }

      {/* Card Hover Tooltip */}
      {cardTooltip && (
        <div
          className="fixed z-50 bg-white rounded-xl border border-gray-200 shadow-2xl p-3 max-w-sm w-[90vw] sm:w-[320px] animate-fade-in"
          style={{
            left: Math.min(cardTooltip.position.x, window.innerWidth - 340),
            top: Math.min(cardTooltip.position.y, window.innerHeight - 200)
          }}
          onMouseEnter={() => { if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current); }}
          onMouseLeave={handleCardMouseLeave}
        >
          <div className="flex items-center gap-2 mb-2">
            {cardInfo && (
              <img
                src={`https://static.divine-pride.net/images/items/collection/${cardInfo.id}.png`}
                alt={cardInfo.name}
                className="w-8 h-8 object-contain bg-gray-50 rounded-lg border border-gray-100 p-1"
                onError={(e) => (e.target as HTMLImageElement).src = 'https://static.divine-pride.net/images/items/collection/4001.png'}
              />
            )}
            <div>
              <h4 className="font-bold text-gray-900 text-sm">{cardInfo?.name || cardTooltip.cardName}</h4>
              {cardInfo && <span className="text-xs text-gray-400">ID: {cardInfo.id}</span>}
            </div>
          </div>

          {isLoadingCard ? (
            <div className="flex items-center justify-center py-3">
              <Loader2 className="w-4 h-4 animate-spin text-kafra-500" />
            </div>
          ) : cardInfo ? (
            <div className="bg-gray-50 rounded-lg p-2 text-xs text-gray-700 max-h-32 overflow-y-auto">
              <p className="whitespace-pre-wrap leading-relaxed">{cardInfo.description}</p>
            </div>
          ) : (
            <p className="text-gray-400 text-xs py-2 text-center">카드 정보를 찾을 수 없습니다</p>
          )}
        </div>
      )}

      {/* Backdrop to close popup */}
      {
        itemPopover && (
          <div className="fixed inset-0 z-40" onClick={closeItemPopover} />
        )
      }
    </>
  );
};

export default ResultsTable;
