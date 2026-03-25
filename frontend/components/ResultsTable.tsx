import React, { useState, useEffect } from 'react';
import { MarketItem } from '../types';
import { Package, Info } from 'lucide-react';
import { getZenyStyle, formatZeny } from '../utils/zenyStyle';
import { usePanelManager, CardInfo } from '../hooks/usePanelManager';
import { getEnchantIconUrl } from '../utils/enchantIcons';
import FloatingPanel from './FloatingPanel';

interface ResultsTableProps {
  items: MarketItem[];
  isLoading: boolean;
  selectedItemId: string | null;
  onItemClick: (item: MarketItem) => void;
}

// Hook to detect mobile viewport
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
};

// Build full item name for tooltip
const getFullItemName = (item: MarketItem): string => {
  let name = '';
  if (item.refine_level > 0) name += `+${item.refine_level} `;
  name += item.name;
  if (item.card_slots > 0) name += ` [${item.card_slots}]`;
  return name;
};

const ResultsTable: React.FC<ResultsTableProps> = ({ items, isLoading, selectedItemId, onItemClick }) => {
  const isMobile = useIsMobile();
  const panelManager = usePanelManager();

  // Fetch item info and update panel
  const handleItemInfoClick = async (itemName: string, itemId: string, event: React.MouseEvent) => {
    event.stopPropagation();

    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const panelId = panelManager.openInspector('item', itemId, itemName, { x: rect.left, y: rect.bottom });

    try {
      let apiBase = (import.meta as any).env?.VITE_API_URL || 'https://rano.onrender.com';
      apiBase = apiBase.replace(/\/+$/, '');
      const apiUrl = apiBase.endsWith('/api') ? apiBase : `${apiBase}/api`;

      // 1차 핫픽스: itemId 기반 조회 우선
      const numericId = parseInt(itemId, 10);
      if (!isNaN(numericId) && numericId > 0) {
        try {
          const idResponse = await fetch(`${apiUrl}/items/${numericId}`);
          if (idResponse.ok) {
            const match = await idResponse.json();
            if (match && match.id) {
              panelManager.updatePanelData(panelId, {
                id: match.id,
                name: match.nameKr || match.name || itemName,
                description: (match.description || '설명 없음').replace(/\^[0-9A-Fa-f]{6}/g, '').replace(/\\n/g, '\n')
              });
              return; // 성공 시 즉시 리턴, fallback 방지
            }
          }
        } catch (idError) {
          console.warn('[Hotfix] ID-based lookup failed, falling back to name search:', idError);
        }
      }

      // Fallback: 기존 이름 기반 검색 (itemId 없거나 404일 때)
      const baseName = itemName
        .replace(/^\[UNIQUE\]\s*/i, '')
        .replace(/^\+\d+/, '')
        .replace(/\[\d+\]$/, '')
        .replace(/\.\.\.$/, '')
        .trim();

      const response = await fetch(`${apiUrl}/items/search?keyword=${encodeURIComponent(baseName)}`);
      if (response.ok) {
        const data = await response.json();
        const match = data.find((item: any) => item.nameKr === baseName) || data[0];
        if (match) {
          panelManager.updatePanelData(panelId, {
            id: match.id,
            name: match.nameKr,
            description: (match.description || '설명 없음').replace(/\^[0-9A-Fa-f]{6}/g, '').replace(/\\n/g, '\n')
          });
          return;
        }
      }
      panelManager.updatePanelData(panelId, null);
    } catch (e) {
      console.error('Failed to fetch item info:', e);
      panelManager.updatePanelData(panelId, null);
    }
  };

  // Fetch card info and update panel
  const handleCardClick = async (item: MarketItem, event: React.MouseEvent) => {
    event.stopPropagation();

    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const panelId = panelManager.openInspector('card', item.id, item.name, { x: rect.left, y: rect.bottom });

    try {
      let apiBase = (import.meta as any).env?.VITE_API_URL || 'https://rano.onrender.com';
      apiBase = apiBase.replace(/\/+$/, '');
      const apiUrl = apiBase.endsWith('/api') ? apiBase : `${apiBase}/api`;

      const cards: CardInfo[] = [];
      for (const cardName of item.cards_equipped || []) {
        const cleanName = cardName.replace(/^\[옵션\]\s*/, '').trim();
        try {
          const response = await fetch(`${apiUrl}/items/search?keyword=${encodeURIComponent(cleanName)}`);
          if (response.ok) {
            const data = await response.json();
            const match = data.find((i: any) => i.nameKr === cleanName) || data[0];
            if (match) {
              cards.push({
                id: match.id,
                name: match.nameKr,
                description: (match.description || '설명 없음').replace(/\^[0-9A-Fa-f]{6}/g, '').replace(/\\n/g, '\n')
              });
            } else {
              cards.push({ id: 0, name: cleanName, description: '정보를 찾을 수 없습니다' });
            }
          }
        } catch {
          cards.push({ id: 0, name: cleanName, description: '정보를 찾을 수 없습니다' });
        }
      }
      panelManager.updatePanelData(panelId, { cards });
    } catch (e) {
      console.error('Failed to fetch card details:', e);
      panelManager.updatePanelData(panelId, null);
    }
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
      {/* Premium Dashboard Style List */}
      <div className="flex flex-col gap-2">
        {items.map((item) => {
          const isSelected = selectedItemId === item.id;
          const fullName = getFullItemName(item);

          return (
            <div
              key={item.id}
              className={`
                flex gap-2 md:grid md:grid-cols-[50px_1fr_170px_170px_60px_100px] md:gap-3 md:items-start
                px-2 py-2 md:px-4 md:py-3 bg-white rounded-lg shadow-sm
                transition-all duration-200
                ${isSelected ? 'ring-2 ring-kafra-400 ring-offset-1' : 'hover:shadow-md'}
              `}
            >
              {/* ========== 모바일 전용: 좌측 고정 칼럼 ========== */}
              <div className="md:hidden w-16 shrink-0 flex flex-col items-center gap-0.5 pt-0.5">
                {/* 배지 */}
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                  item.shop_type === 'buy' 
                    ? 'bg-red-50 text-red-600' 
                    : 'bg-blue-50 text-blue-600'
                }`}>
                  {item.shop_type === 'buy' ? '구매' : '판매'}
                </span>
                {/* 아이템 이미지 */}
                <div className="w-8 h-8 rounded bg-gray-50 flex items-center justify-center">
                  <img src={item.image_placeholder} alt={item.name} className="w-full h-full object-cover" />
                </div>
                {/* 서버명 */}
                <span className="text-[10px] text-gray-400 truncate max-w-full text-center">
                  {item.server}
                </span>
              </div>

              {/* ========== 모바일 전용: 우측 가변 칼럼 (4줄) ========== */}
              <div className="md:hidden min-w-0 flex-1 flex flex-col gap-0.5 justify-center">
                <div className="flex justify-between items-baseline gap-2 min-w-0">
                  <span 
                    className={`flex-1 min-w-0 text-sm font-bold ${isSelected ? 'text-kafra-700' : 'text-gray-900'} cursor-pointer hover:text-kafra-600 transition-colors truncate`}
                    title={fullName}
                    onClick={(e) => {
                      e.stopPropagation();
                      onItemClick(item);
                      // 모바일도 FloatingPanel(Inspector) 사용
                      handleItemInfoClick(item.name, item.id, e);
                    }}
                  >
                    {item.refine_level > 0 && <span className="text-amber-500">+{item.refine_level} </span>}
                    {item.name}
                    {item.card_slots > 0 && <span className="text-gray-400 font-normal">[{item.card_slots}]</span>}
                  </span>
                  <span className="shrink-0 text-xs text-gray-500">{item.amount.toLocaleString()}개</span>
                </div>
                {/* 2줄: 상점명 */}
                <span className="text-xs text-gray-500 truncate min-w-0" title={item.shop_title}>
                  {item.shop_title}
                </span>
                {/* 3줄: 제니 (원본 그대로, 축약 금지) */}
                <span
                  className="text-sm font-bold whitespace-nowrap"
                  style={{ color: getZenyStyle(item.price).color, textShadow: getZenyStyle(item.price).textShadow }}
                >
                  {item.price.toLocaleString()}<span className="text-xs text-gray-400 font-normal ml-0.5">z</span>
                </span>
                {/* 4줄: 인챈트/카드 (있을 때만, 클릭 가능) */}
                {item.cards_equipped && item.cards_equipped.length > 0 && (
                  <span 
                    className="text-xs text-purple-600 truncate min-w-0 cursor-pointer hover:text-purple-800 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      // 모바일도 FloatingPanel(Inspector) 사용
                      handleCardClick(item, e);
                    }}
                  >
                    {item.cards_equipped.map(c => c.replace('[옵션] ', '').replace('[옵션]', '')).join(', ')}
                  </span>
                )}
              </div>

              {/* ========== 데스크톱 전용: Column 1 태그 ========== */}
              <div className="hidden md:flex justify-center pt-1">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${
                  item.shop_type === 'buy' 
                    ? 'bg-red-50 text-red-600' 
                    : 'bg-blue-50 text-blue-600'
                }`}>
                  {item.shop_type === 'buy' ? '구매' : '판매'}
                </span>
              </div>

              {/* ========== 데스크톱 전용: Column 2 아이콘+이름 ========== */}
              <div className="hidden md:flex items-center gap-3 min-w-0">
                <div className="shrink-0 w-10 h-10 rounded bg-gray-50 flex items-center justify-center">
                  <img src={item.image_placeholder} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0 flex-1 flex flex-col gap-0.5">
                  <span 
                    className={`text-sm font-bold ${isSelected ? 'text-kafra-700' : 'text-gray-900'} cursor-pointer hover:text-kafra-600 transition-colors truncate`}
                    title={fullName}
                    onClick={(e) => {
                      e.stopPropagation();
                      onItemClick(item);
                      handleItemInfoClick(item.name, item.id, e);
                    }}
                  >
                    {item.refine_level > 0 && <span className="text-amber-500">+{item.refine_level} </span>}
                    {item.name}
                    {item.card_slots > 0 && <span className="text-gray-400 font-normal">[{item.card_slots}]</span>}
                  </span>
                  <span className="text-xs text-gray-400">
                    {item.server}
                  </span>
                </div>
              </div>

              {/* Desktop only: Column 3 카드/인챌 (모바일에서 숨김) */}
              <div 
                className="hidden md:flex flex-col gap-1 cursor-pointer min-w-0"
                onClick={(e) => {
                  e.stopPropagation();
                  if (item.cards_equipped && item.cards_equipped.length > 0) {
                    handleCardClick(item, e);
                  }
                }}
              >
                {item.cards_equipped && item.cards_equipped.length > 0 ? (
                  <>
                    {item.cards_equipped.map((card, i) => {
                      const isEnchant = card.startsWith('[옵션]');
                      const displayName = card.replace('[옵션] ', '').replace('[옵션]', '');
                      return (
                        <div
                          key={i}
                          className={`inline-flex items-center gap-1.5 text-xs ${
                            isEnchant ? 'text-purple-600' : 'text-amber-700'
                          }`}
                          title={displayName}
                        >
                          {isEnchant ? (
                            <img 
                              src={getEnchantIconUrl(card)} 
                              alt="enchant" 
                              className="w-4 h-4 shrink-0"
                            />
                          ) : (
                            <img 
                              src="https://static.divine-pride.net/images/items/collection/4001.png" 
                              alt="card" 
                              className="w-4 h-4 shrink-0"
                            />
                          )}
                          <span className="truncate">{displayName}</span>
                        </div>
                      );
                    })}
                  </>
                ) : (
                  <span className="text-xs text-gray-300">-</span>
                )}
              </div>

              {/* Column 4: 상점 정보 (모바일에서 숨김) */}
              <div className="hidden md:block overflow-hidden pt-0.5">
                <div className="text-sm text-gray-800 font-medium truncate" title={item.shop_title}>
                  {item.shop_title}
                </div>
                <div className="text-xs text-gray-400 truncate">
                  {item.seller !== item.shop_title && item.seller !== 'Unknown' && `${item.seller} `}
                  {item.location && /[a-zA-Z]/.test(item.location) && `· ${item.location}`}
                </div>
              </div>

              {/* Column 5: 수량 (모바일에서 숨김) */}
              <div className="hidden md:block text-right pt-0.5">
                <span className="text-sm text-gray-600">{item.amount.toLocaleString()}</span>
              </div>

              {/* Column 6: 가격 (데스크톱에서만 - 모바일은 상단에 표시) */}
              <div className="hidden md:block text-right pt-0.5">
                <span
                  className="text-base font-bold whitespace-nowrap"
                  style={{ color: getZenyStyle(item.price).color, textShadow: getZenyStyle(item.price).textShadow }}
                >
                  {formatZeny(item.price)}
                  <span className="text-xs text-gray-400 font-normal ml-0.5">z</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* FloatingPanel - 모바일/데스크톱 모두 사용 */}
      {panelManager.inspectorPanel && (
        <FloatingPanel
          panel={panelManager.inspectorPanel}
          onClose={panelManager.closeInspector}
          onMouseDown={(e) => panelManager.startDrag(panelManager.inspectorPanel!.id, e)}
          onMouseMove={panelManager.onDrag}
          onMouseUp={panelManager.endDrag}
          isDragging={panelManager.isDragging}
        />
      )}
    </>
  );
};

export default ResultsTable;
