
import React, { useState } from 'react';
import { MarketItem } from '../types';
import { Package, Clock, X, Loader2, Info, CreditCard } from 'lucide-react';
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
  // Item popup state - now with dragging support
  const [itemPopover, setItemPopover] = useState<{ itemId: string; position: { x: number; y: number } } | null>(null);
  const [itemInfo, setItemInfo] = useState<ItemDbInfo | null>(null);
  const [isLoadingInfo, setIsLoadingInfo] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

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
    setIsDragging(false);
  };

  // Drag handlers for item popup
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!itemPopover) return;
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - itemPopover.position.x,
      y: e.clientY - itemPopover.position.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !itemPopover) return;
    setItemPopover({
      ...itemPopover,
      position: {
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      }
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Card modal state
  const [cardModalItem, setCardModalItem] = useState<MarketItem | null>(null);
  const [cardDetails, setCardDetails] = useState<{ id: number; name: string; description: string }[]>([]);
  const [isLoadingCards, setIsLoadingCards] = useState(false);

  // Open card modal and fetch all card details
  const openCardModal = async (item: MarketItem, event: React.MouseEvent) => {
    event.stopPropagation();
    setCardModalItem(item);
    setCardDetails([]);
    setIsLoadingCards(true);

    try {
      let apiBase = import.meta.env.VITE_API_URL || 'https://rag-spring-backend.onrender.com';
      apiBase = apiBase.replace(/\/+$/, '');
      const apiUrl = apiBase.endsWith('/api') ? apiBase : `${apiBase}/api`;

      const details: { id: number; name: string; description: string }[] = [];

      for (const cardName of item.cards_equipped || []) {
        const cleanName = cardName.replace(/^\[옵션\]\s*/, '').trim();
        try {
          const response = await fetch(`${apiUrl}/items/search?keyword=${encodeURIComponent(cleanName)}`);
          if (response.ok) {
            const data = await response.json();
            const match = data.find((item: any) => item.nameKr === cleanName) || data[0];
            if (match) {
              details.push({
                id: match.id,
                name: match.nameKr,
                description: (match.description || '설명 없음').replace(/\^[0-9A-Fa-f]{6}/g, '').replace(/\\n/g, '\n')
              });
            } else {
              details.push({ id: 0, name: cleanName, description: '정보를 찾을 수 없습니다' });
            }
          }
        } catch {
          details.push({ id: 0, name: cleanName, description: '정보를 찾을 수 없습니다' });
        }
      }
      setCardDetails(details);
    } catch (e) {
      console.error('Failed to fetch card details:', e);
    } finally {
      setIsLoadingCards(false);
    }
  };

  const closeCardModal = () => {
    setCardModalItem(null);
    setCardDetails([]);
  };

  // Note: Old hover-based card tooltip functions removed - now using click-based card modal


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
                  {/* Card/Enchant Badges - Simple Display */}
                  {item.cards_equipped && item.cards_equipped.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 mb-1">
                      {item.cards_equipped.slice(0, 3).map((card, i) => {
                        const isEnchant = card.startsWith('[옵션]');
                        const displayName = card.replace('[옵션] ', '').replace('[옵션]', '');
                        return (
                          <span
                            key={i}
                            className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium
                              ${isEnchant
                                ? 'bg-purple-50 text-purple-600 border border-purple-200'
                                : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                              }`}
                          >
                            {displayName.slice(0, 12)}{displayName.length > 12 ? '…' : ''}
                          </span>
                        );
                      })}
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

              {/* Price + Card Button Column */}
              <div className="flex items-center gap-2">
                {/* Card Info Button - Only show if item has cards */}
                {item.cards_equipped && item.cards_equipped.length > 0 && (
                  <button
                    onClick={(e) => openCardModal(item, e)}
                    className="flex items-center gap-1 px-2 py-1.5 bg-gradient-to-r from-amber-100 to-yellow-100 
                      border border-amber-300 rounded-lg text-amber-700 hover:from-amber-200 hover:to-yellow-200 
                      hover:border-amber-400 transition-all shadow-sm hover:shadow group"
                    title="카드 정보 보기"
                  >
                    <CreditCard size={14} className="group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold">{item.cards_equipped.length}</span>
                  </button>
                )}

                {/* Price */}
                <div className="text-right pl-2">
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
              </div>

              {/* Arrow for mobile hint */}
              <div className="ml-2 md:hidden text-gray-300">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </div>
            </div>
          );
        })}
      </div>

      {/* Item Info Popup - Draggable & Expanded */}
      {
        itemPopover && (
          <div
            className="fixed z-50 bg-white rounded-xl border border-gray-200 shadow-2xl w-[90vw] sm:w-[450px] animate-fade-in select-none"
            style={{
              left: itemPopover.position.x,
              top: itemPopover.position.y,
              cursor: isDragging ? 'grabbing' : 'default'
            }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Draggable Header */}
            <div
              className="flex justify-between items-start p-4 pb-2 cursor-grab active:cursor-grabbing border-b border-gray-100"
              onMouseDown={handleMouseDown}
            >
              <div className="flex items-center gap-3">
                {itemInfo && (
                  <img
                    src={`https://static.divine-pride.net/images/items/collection/${itemInfo.id}.png`}
                    alt={itemInfo.name}
                    className="w-12 h-12 object-contain bg-gray-50 rounded-lg border border-gray-100 p-1"
                    onError={(e) => (e.target as HTMLImageElement).src = 'https://static.divine-pride.net/images/items/collection/909.png'}
                  />
                )}
                <div>
                  <h4 className="font-bold text-gray-900 text-base">{itemInfo?.name || '로딩중...'}</h4>
                  {itemInfo && <span className="text-xs text-gray-400">ID: {itemInfo.id}</span>}
                </div>
              </div>
              <button onClick={closeItemPopover} className="text-gray-400 hover:text-gray-600 p-1 -mt-1 -mr-1">
                <X size={18} />
              </button>
            </div>

            {/* Content - No height limit */}
            <div className="p-4 pt-3">
              {isLoadingInfo ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-5 h-5 animate-spin text-kafra-500" />
                </div>
              ) : itemInfo ? (
                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700">
                  <p className="whitespace-pre-wrap leading-relaxed">{itemInfo.description}</p>
                </div>
              ) : (
                <p className="text-gray-400 text-sm py-4 text-center">아이템 정보를 찾을 수 없습니다</p>
              )}
            </div>
          </div>
        )
      }

      {/* Card Modal */}
      {cardModalItem && (
        <>
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={closeCardModal} />
          <div className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
            bg-white rounded-2xl border border-gray-200 shadow-2xl p-5 
            max-w-md w-[95vw] max-h-[80vh] overflow-y-auto animate-fade-in">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-lg text-gray-900">카드/인챈트 정보</h3>
                <p className="text-sm text-gray-500">{cardModalItem.name}</p>
              </div>
              <button onClick={closeCardModal} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={20} />
              </button>
            </div>

            {isLoadingCards ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-kafra-500" />
                <span className="ml-2 text-gray-500">카드 정보 로딩 중...</span>
              </div>
            ) : cardDetails.length > 0 ? (
              <div className="space-y-3">
                {cardDetails.map((card, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <div className="flex items-start gap-3">
                      {card.id > 0 && (
                        <img
                          src={`https://static.divine-pride.net/images/items/collection/${card.id}.png`}
                          alt={card.name}
                          className="w-12 h-12 object-contain bg-white rounded-lg border border-gray-200 p-1 flex-shrink-0"
                          onError={(e) => (e.target as HTMLImageElement).src = 'https://static.divine-pride.net/images/items/collection/4001.png'}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-900 text-sm">{card.name}</h4>
                        {card.id > 0 && <span className="text-xs text-gray-400">ID: {card.id}</span>}
                        <p className="mt-2 text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">
                          {card.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm py-4 text-center">카드 정보를 찾을 수 없습니다</p>
            )}
          </div>
        </>
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
