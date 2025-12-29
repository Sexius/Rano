
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

// Panel type for multi-panel system
interface Panel {
  id: string;
  type: 'item' | 'card';
  itemId: string;
  itemName: string;
  position: { x: number; y: number };
  data: ItemDbInfo | { cards: { id: number; name: string; description: string }[] } | null;
  isLoading: boolean;
}

const ResultsTable: React.FC<ResultsTableProps> = ({ items, isLoading, selectedItemId, onItemClick }) => {
  // Multi-panel state
  const [panels, setPanels] = useState<Panel[]>([]);
  const [draggingPanelId, setDraggingPanelId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Clamp position to viewport
  const clampPosition = (x: number, y: number, width: number = 450, height: number = 300) => {
    return {
      x: Math.max(10, Math.min(x, window.innerWidth - width - 10)),
      y: Math.max(10, Math.min(y, window.innerHeight - height - 10))
    };
  };

  // Open item info panel
  const openItemPanel = async (itemName: string, itemId: string, event: React.MouseEvent) => {
    event.stopPropagation();

    // Check if panel already exists
    if (panels.some(p => p.id === `item-${itemId}`)) return;

    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const pos = clampPosition(rect.left, rect.bottom + 8);

    const newPanel: Panel = {
      id: `item-${itemId}`,
      type: 'item',
      itemId,
      itemName,
      position: pos,
      data: null,
      isLoading: true
    };

    setPanels(prev => [...prev, newPanel]);

    try {
      let apiBase = import.meta.env.VITE_API_URL || 'https://rag-spring-backend.onrender.com';
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
          setPanels(prev => prev.map(p => p.id === `item-${itemId}` ? {
            ...p,
            data: {
              id: match.id,
              name: match.nameKr,
              description: (match.description || '설명 없음').replace(/\^[0-9A-Fa-f]{6}/g, '').replace(/\\n/g, '\n')
            },
            isLoading: false
          } : p));
          return;
        }
      }
      setPanels(prev => prev.map(p => p.id === `item-${itemId}` ? { ...p, isLoading: false } : p));
    } catch (e) {
      console.error('Failed to fetch item info:', e);
      setPanels(prev => prev.map(p => p.id === `item-${itemId}` ? { ...p, isLoading: false } : p));
    }
  };

  // Open card info panel
  const openCardPanel = async (item: MarketItem, event: React.MouseEvent) => {
    event.stopPropagation();

    const panelId = `card-${item.id}`;
    if (panels.some(p => p.id === panelId)) return;

    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const pos = clampPosition(rect.left, rect.bottom + 8);

    const newPanel: Panel = {
      id: panelId,
      type: 'card',
      itemId: item.id,
      itemName: item.name,
      position: pos,
      data: null,
      isLoading: true
    };

    setPanels(prev => [...prev, newPanel]);

    try {
      let apiBase = import.meta.env.VITE_API_URL || 'https://rag-spring-backend.onrender.com';
      apiBase = apiBase.replace(/\/+$/, '');
      const apiUrl = apiBase.endsWith('/api') ? apiBase : `${apiBase}/api`;

      const cards: { id: number; name: string; description: string }[] = [];
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
      setPanels(prev => prev.map(p => p.id === panelId ? { ...p, data: { cards }, isLoading: false } : p));
    } catch (e) {
      console.error('Failed to fetch card details:', e);
      setPanels(prev => prev.map(p => p.id === panelId ? { ...p, isLoading: false } : p));
    }
  };

  // Close panel
  const closePanel = (panelId: string) => {
    setPanels(prev => prev.filter(p => p.id !== panelId));
  };

  // Bring panel to front
  const bringToFront = (panelId: string) => {
    setPanels(prev => {
      const panel = prev.find(p => p.id === panelId);
      if (!panel) return prev;
      return [...prev.filter(p => p.id !== panelId), panel];
    });
  };

  // Drag handlers
  const handlePanelMouseDown = (panelId: string, e: React.MouseEvent) => {
    const panel = panels.find(p => p.id === panelId);
    if (!panel) return;
    setDraggingPanelId(panelId);
    setDragOffset({
      x: e.clientX - panel.position.x,
      y: e.clientY - panel.position.y
    });
    bringToFront(panelId);
  };

  const handlePanelMouseMove = (e: React.MouseEvent) => {
    if (!draggingPanelId) return;
    const newPos = clampPosition(e.clientX - dragOffset.x, e.clientY - dragOffset.y);
    setPanels(prev => prev.map(p => p.id === draggingPanelId ? { ...p, position: newPos } : p));
  };

  const handlePanelMouseUp = () => {
    setDraggingPanelId(null);
  };

  // Note: Old card modal code removed - now using multi-panel system (openCardPanel)


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

                {/* Item Text Info - Kafra Style: Full name + Card text */}
                <div className="min-w-0 flex-1 pr-2">
                  {/* Item Name - Full Display */}
                  <div className="flex items-start gap-1.5 mb-1">
                    <h4 className={`text-sm font-bold leading-tight break-words ${isSelected ? 'text-kafra-700' : 'text-gray-900'}`}>
                      {item.refine_level > 0 && <span className="text-game-gold mr-1">+{item.refine_level}</span>}
                      {item.name}
                      {item.card_slots > 0 && <span className="text-gray-400 ml-1">[{item.card_slots}]</span>}
                    </h4>
                    {/* Item Info Button */}
                    <button
                      onClick={(e) => openItemPanel(item.name, item.id, e)}
                      className="flex-shrink-0 p-0.5 text-kafra-400 hover:text-kafra-600 hover:bg-kafra-50 rounded transition-colors mt-0.5"
                      title="아이템 정보"
                    >
                      <Info size={14} />
                    </button>
                  </div>

                  {/* Card/Enchant - Kafra Style: Clickable Text */}
                  {item.cards_equipped && item.cards_equipped.length > 0 && (
                    <div
                      className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mb-1 cursor-pointer group"
                      onClick={(e) => openCardPanel(item, e)}
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

              {/* Price Column - Simplified */}
              <div className="flex items-center gap-2">
                {/* Price */}
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

      {/* Multi-Panel Rendering - Draggable Panels */}
      {panels.map((panel, index) => (
        <div
          key={panel.id}
          className="fixed bg-white rounded-xl border border-gray-200 shadow-2xl w-[90vw] sm:w-[450px] animate-fade-in select-none"
          style={{
            left: panel.position.x,
            top: panel.position.y,
            zIndex: 50 + index,
            maxHeight: 'calc(100vh - 40px)',
            overflowY: 'auto',
            cursor: draggingPanelId === panel.id ? 'grabbing' : 'default'
          }}
          onMouseMove={handlePanelMouseMove}
          onMouseUp={handlePanelMouseUp}
          onMouseLeave={handlePanelMouseUp}
          onClick={() => bringToFront(panel.id)}
        >
          {/* Draggable Header */}
          <div
            className="flex justify-between items-start p-4 pb-2 cursor-grab active:cursor-grabbing border-b border-gray-100"
            onMouseDown={(e) => handlePanelMouseDown(panel.id, e)}
          >
            <div className="flex items-center gap-3">
              {panel.type === 'item' && panel.data && 'id' in panel.data && panel.data.id && (
                <img
                  src={`https://static.divine-pride.net/images/items/collection/${panel.data.id}.png`}
                  alt={panel.data.name}
                  className="w-12 h-12 object-contain bg-gray-50 rounded-lg border border-gray-100 p-1"
                  onError={(e) => (e.target as HTMLImageElement).src = 'https://static.divine-pride.net/images/items/collection/909.png'}
                />
              )}
              <div>
                <h4 className="font-bold text-gray-900 text-base">
                  {panel.type === 'item' ? (panel.data && 'name' in panel.data ? panel.data.name : '로딩중...') : '카드/인챈트 정보'}
                </h4>
                <span className="text-xs text-gray-400">
                  {panel.type === 'item' && panel.data && 'id' in panel.data ? `ID: ${panel.data.id}` : panel.itemName}
                </span>
              </div>
            </div>
            <button onClick={() => closePanel(panel.id)} className="text-gray-400 hover:text-gray-600 p-1 -mt-1 -mr-1">
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 pt-3">
            {panel.isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-kafra-500" />
              </div>
            ) : panel.type === 'item' ? (
              // Item Panel Content
              panel.data && 'description' in panel.data ? (
                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700">
                  <p className="whitespace-pre-wrap leading-relaxed">{panel.data.description}</p>
                </div>
              ) : (
                <p className="text-gray-400 text-sm py-4 text-center">아이템 정보를 찾을 수 없습니다</p>
              )
            ) : (
              // Card Panel Content
              panel.data && 'cards' in panel.data && panel.data.cards.length > 0 ? (
                <div className="space-y-3">
                  {panel.data.cards.map((card, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <div className="flex items-start gap-3">
                        {card.id > 0 && (
                          <img
                            src={`https://static.divine-pride.net/images/items/collection/${card.id}.png`}
                            alt={card.name}
                            className="w-10 h-10 object-contain bg-white rounded-lg border border-gray-200 p-1 flex-shrink-0"
                            onError={(e) => (e.target as HTMLImageElement).src = 'https://static.divine-pride.net/images/items/collection/4001.png'}
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-900 text-sm">{card.name}</h4>
                          {card.id > 0 && <span className="text-xs text-gray-400">ID: {card.id}</span>}
                          <p className="mt-1 text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">
                            {card.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm py-4 text-center">카드 정보를 찾을 수 없습니다</p>
              )
            )}
          </div>
        </div>
      ))}
    </>
  );
};

export default ResultsTable;
