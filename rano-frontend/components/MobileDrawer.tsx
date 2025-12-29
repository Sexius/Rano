import React, { useState } from 'react';
import { X, Pin, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { PanelState, ItemInfo, CardInfo } from '../hooks/usePanelManager';

interface MobileDrawerProps {
    inspectorPanel: PanelState | null;
    pinnedPanels: PanelState[];
    onClose: (panelId: string) => void;
    onPin: () => void;
    onSelectPinned: (panelId: string) => void;
}

const MobileDrawer: React.FC<MobileDrawerProps> = ({
    inspectorPanel,
    pinnedPanels,
    onClose,
    onPin,
    onSelectPinned
}) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [activeTab, setActiveTab] = useState<'inspector' | string>('inspector');

    // Get current panel to display
    const currentPanel = activeTab === 'inspector'
        ? inspectorPanel
        : pinnedPanels.find(p => p.id === activeTab);

    if (!inspectorPanel && pinnedPanels.length === 0) return null;

    const isItemPanel = currentPanel?.type === 'item';
    const itemData = currentPanel?.data as ItemInfo | null;
    const cardData = currentPanel?.data as { cards: CardInfo[] } | null;

    return (
        <div
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl border-t border-gray-200 transition-transform duration-300"
            style={{
                transform: isExpanded ? 'translateY(0)' : 'translateY(calc(100% - 48px))',
                maxHeight: '80vh'
            }}
        >
            {/* Drawer Handle */}
            <div
                className="flex items-center justify-center py-2 cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="w-12 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Tab Navigation for Pinned Panels */}
            {(pinnedPanels.length > 0 || inspectorPanel) && (
                <div className="flex items-center gap-1 px-4 pb-2 overflow-x-auto">
                    {inspectorPanel && (
                        <button
                            onClick={() => setActiveTab('inspector')}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors
                ${activeTab === 'inspector'
                                    ? 'bg-kafra-500 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                            🔍 Inspector
                        </button>
                    )}
                    {pinnedPanels.map((panel, idx) => (
                        <button
                            key={panel.id}
                            onClick={() => setActiveTab(panel.id)}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors
                ${activeTab === panel.id
                                    ? 'bg-kafra-500 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                            📌 {idx + 1}
                        </button>
                    ))}
                </div>
            )}

            {/* Header */}
            {currentPanel && (
                <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        {isItemPanel && itemData?.id && (
                            <img
                                src={`https://static.divine-pride.net/images/items/collection/${itemData.id}.png`}
                                alt={itemData.name}
                                className="w-10 h-10 object-contain bg-gray-50 rounded-lg border border-gray-100 p-1"
                                onError={(e) => (e.target as HTMLImageElement).src = 'https://static.divine-pride.net/images/items/collection/909.png'}
                            />
                        )}
                        <div className="min-w-0">
                            <h4 className="font-bold text-gray-900 text-sm truncate">
                                {isItemPanel
                                    ? (itemData?.name || currentPanel.itemName)
                                    : '카드/인챈트'}
                            </h4>
                            <span className="text-xs text-gray-400">
                                {currentPanel.pinned ? '고정됨' : 'Inspector'}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {!currentPanel.pinned && activeTab === 'inspector' && (
                            <button
                                onClick={onPin}
                                className="p-2 text-gray-400 hover:text-kafra-600 hover:bg-kafra-50 rounded-lg"
                                title="고정"
                            >
                                <Pin size={18} />
                            </button>
                        )}
                        <button
                            onClick={() => onClose(currentPanel.id)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                        >
                            <X size={18} />
                        </button>
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                            {isExpanded ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                        </button>
                    </div>
                </div>
            )}

            {/* Content */}
            {currentPanel && isExpanded && (
                <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 140px)' }}>
                    {currentPanel.isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-5 h-5 animate-spin text-kafra-500" />
                            <span className="ml-2 text-gray-500">로딩 중...</span>
                        </div>
                    ) : isItemPanel ? (
                        itemData?.description ? (
                            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700">
                                <p className="whitespace-pre-wrap leading-relaxed">{itemData.description}</p>
                            </div>
                        ) : (
                            <p className="text-gray-400 text-sm py-4 text-center">정보를 찾을 수 없습니다</p>
                        )
                    ) : (
                        cardData?.cards && cardData.cards.length > 0 ? (
                            <div className="space-y-3">
                                {cardData.cards.map((card, idx) => (
                                    <div key={idx} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                        <div className="flex items-start gap-3">
                                            {card.id > 0 && (
                                                <img
                                                    src={`https://static.divine-pride.net/images/items/collection/${card.id}.png`}
                                                    alt={card.name}
                                                    className="w-10 h-10 object-contain bg-white rounded-lg border border-gray-200 p-1"
                                                    onError={(e) => (e.target as HTMLImageElement).src = 'https://static.divine-pride.net/images/items/collection/4001.png'}
                                                />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-gray-900 text-sm">{card.name}</h4>
                                                <p className="mt-1 text-xs text-gray-600 whitespace-pre-wrap">{card.description}</p>
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
            )}
        </div>
    );
};

export default MobileDrawer;
