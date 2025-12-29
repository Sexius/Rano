import React, { useState, useEffect } from 'react';
import { MarketItem } from '../types';
import { Package, Clock, Info } from 'lucide-react';
import { getZenyStyle, formatZeny } from '../utils/zenyStyle';
import { usePanelManager, CardInfo } from '../hooks/usePanelManager';
import FloatingPanel from './FloatingPanel';
import MobileDrawer from './MobileDrawer';

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
      let apiBase = (import.meta as any).env?.VITE_API_URL || 'https://rag-spring-backend.onrender.com';
      apiBase = apiBase.replace(/\/+$/, '');
      const apiUrl = apiBase.endsWith('/api') ? apiBase : `${apiBase}/api`;

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
      let apiBase = (import.meta as any).env?.VITE_API_URL || 'https://rag-spring-backend.onrender.com';
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
      <div className="flex flex-col gap-2 pb-20 md:pb-0 overflow-x-hidden">
        {items.map((item) => {
          const isSelected = selectedItemId === item.id;
          const fullName = getFullItemName(item);

          return (
            <div
              key={item.id}
              className={`
              relative group flex items-center justify-between p-3 rounded-xl border transition-all duration-200
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

              {/* Non-clickable container - only specific elements are clickable */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* Image Thumbnail - NOT clickable */}
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

                {/* Item Text Info - all parents need min-w-0 for clamp to work */}
                <div className="min-w-0 flex-1 overflow-hidden">
                  {/* Item Name - CLICKABLE, 2 line clamp with tooltip */}
                  <div
                    className={`text-sm font-bold leading-snug cursor-pointer hover:underline ${isSelected ? 'text-kafra-700' : 'text-gray-900'}`}
                    title={fullName}
                    onClick={(e) => {
                      e.stopPropagation();
                      onItemClick(item);
                      handleItemInfoClick(item.name, item.id, e);
                    }}
                    style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical' as const,
                      overflow: 'hidden',
                      wordBreak: 'break-word'
                    }}
                  >
                    {item.refine_level > 0 && <span className="text-game-gold mr-1">+{item.refine_level}</span>}
                    {item.name}
                    {item.card_slots > 0 && <span className="text-gray-400 ml-1">[{item.card_slots}]</span>}
                  </div>

                  {/* Card/Enchant - Separate Clickable Text */}
                  {item.cards_equipped && item.cards_equipped.length > 0 && (
                    <div
                      className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mb-1 cursor-pointer group"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCardClick(item, e);
                      }}
                    >
                      {item.cards_equipped.map((card, i) => {
                        const isEnchant = card.startsWith('[옵션]');
                        const displayName = card.replace('[옵션] ', '').replace('[옵션]', '');
                        return (
                          <span
                            key={i}
                            className={`text-xs font-medium transition-colors
                              ${isEnchant
                                ? 'text-purple-600 group-hover:text-purple-800'
                                : 'text-amber-600 group-hover:text-amber-800'
                              }`}
                          >
                            {isEnchant ? '✦' : '◆'} {displayName}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Server & Seller Info */}
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="font-medium text-gray-600">{item.server}</span>
                    <span className="w-0.5 h-2.5 bg-gray-200"></span>
                    <span className="truncate max-w-[120px]">{item.seller}</span>
                    <span className="hidden sm:flex items-center gap-0.5 text-gray-400">
                      <Clock size={10} /> {item.created_at}
                    </span>
                  </div>
                </div>
              </div>

              {/* Price Column */}
              <div className="flex items-center gap-2">
                <div className="text-right">
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

      {/* Desktop: Floating Panel (Inspector only) */}
      {!isMobile && panelManager.inspectorPanel && (
        <FloatingPanel
          panel={panelManager.inspectorPanel}
          onClose={panelManager.closeInspector}
          onMouseDown={(e) => panelManager.startDrag(panelManager.inspectorPanel!.id, e)}
          onMouseMove={panelManager.onDrag}
          onMouseUp={panelManager.endDrag}
          isDragging={panelManager.isDragging}
        />
      )}

      {/* Mobile: Bottom Drawer (Inspector only) */}
      {isMobile && panelManager.inspectorPanel && (
        <MobileDrawer
          inspectorPanel={panelManager.inspectorPanel}
          pinnedPanels={[]}
          onClose={() => panelManager.closeInspector()}
          onPin={() => { }}
          onSelectPinned={() => { }}
        />
      )}
    </>
  );
};

export default ResultsTable;
