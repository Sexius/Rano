import React from 'react';
import { X, Pin, PinOff, Loader2 } from 'lucide-react';
import { PanelState, ItemInfo, CardInfo } from '../hooks/usePanelManager';

interface FloatingPanelProps {
    panel: PanelState;
    onClose: () => void;
    onPin?: () => void;
    onMouseDown: (e: React.MouseEvent) => void;
    onMouseMove: (e: React.MouseEvent) => void;
    onMouseUp: () => void;
    onClick: () => void;
    isDragging: boolean;
}

const FloatingPanel: React.FC<FloatingPanelProps> = ({
    panel,
    onClose,
    onPin,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onClick,
    isDragging
}) => {
    const isItemPanel = panel.type === 'item';
    const itemData = panel.data as ItemInfo | null;
    const cardData = panel.data as { cards: CardInfo[] } | null;

    return (
        <div
            className="fixed bg-white rounded-xl border border-gray-200 shadow-2xl w-[90vw] sm:w-[450px] animate-fade-in select-none"
            style={{
                left: panel.position.x,
                top: panel.position.y,
                zIndex: panel.zIndex,
                maxHeight: 'calc(100vh - 40px)',
                cursor: isDragging ? 'grabbing' : 'default'
            }}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onClick={onClick}
        >
            {/* Draggable Header */}
            <div
                className="flex justify-between items-start p-4 pb-2 cursor-grab active:cursor-grabbing border-b border-gray-100 bg-gray-50/50 rounded-t-xl"
                onMouseDown={onMouseDown}
            >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    {isItemPanel && itemData?.id && (
                        <img
                            src={`https://static.divine-pride.net/images/items/collection/${itemData.id}.png`}
                            alt={itemData.name}
                            className="w-12 h-12 object-contain bg-white rounded-lg border border-gray-100 p-1 flex-shrink-0"
                            onError={(e) => (e.target as HTMLImageElement).src = 'https://static.divine-pride.net/images/items/collection/909.png'}
                        />
                    )}
                    <div className="min-w-0">
                        <h4 className="font-bold text-gray-900 text-base truncate">
                            {isItemPanel
                                ? (itemData?.name || panel.itemName || '로딩중...')
                                : '카드/인챈트 정보'}
                        </h4>
                        <span className="text-xs text-gray-400 truncate block">
                            {isItemPanel && itemData?.id ? `ID: ${itemData.id}` : panel.itemName}
                        </span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1 flex-shrink-0">
                    {/* Pin/Unpin Button - only show for Inspector */}
                    {!panel.pinned && onPin && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onPin(); }}
                            className="p-1.5 text-gray-400 hover:text-kafra-600 hover:bg-kafra-50 rounded-lg transition-colors"
                            title="패널 고정 (Pin)"
                        >
                            <Pin size={16} />
                        </button>
                    )}
                    {panel.pinned && (
                        <span className="p-1.5 text-kafra-500" title="고정됨">
                            <PinOff size={16} />
                        </span>
                    )}

                    {/* Close Button */}
                    <button
                        onClick={(e) => { e.stopPropagation(); onClose(); }}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="닫기"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

            {/* Content with scroll */}
            <div className="p-4 pt-3 max-h-[400px] overflow-y-auto">
                {panel.isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-5 h-5 animate-spin text-kafra-500" />
                        <span className="ml-2 text-gray-500 text-sm">로딩 중...</span>
                    </div>
                ) : isItemPanel ? (
                    // Item Panel Content
                    itemData?.description ? (
                        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700">
                            <p className="whitespace-pre-wrap leading-relaxed">{itemData.description}</p>
                        </div>
                    ) : (
                        <p className="text-gray-400 text-sm py-4 text-center">아이템 정보를 찾을 수 없습니다</p>
                    )
                ) : (
                    // Card Panel Content
                    cardData?.cards && cardData.cards.length > 0 ? (
                        <div className="space-y-3">
                            {cardData.cards.map((card, idx) => (
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

            {/* Footer - Panel Type Indicator */}
            <div className="px-4 py-2 border-t border-gray-100 bg-gray-50/30 rounded-b-xl">
                <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{panel.pinned ? '📌 고정됨' : '🔍 Inspector'}</span>
                    <span className="text-[10px]">드래그하여 이동</span>
                </div>
            </div>
        </div>
    );
};

export default FloatingPanel;
