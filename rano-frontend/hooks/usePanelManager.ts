import { useState, useEffect, useCallback } from 'react';

// Panel data types
export interface ItemInfo {
    id: number;
    name: string;
    description: string;
}

export interface CardInfo {
    id: number;
    name: string;
    description: string;
}

export interface PanelState {
    id: string;
    type: 'item' | 'card';
    itemId: string;
    itemName: string;
    pinned: boolean;
    position: { x: number; y: number };
    zIndex: number;
    data: ItemInfo | { cards: CardInfo[] } | null;
    isLoading: boolean;
    lastAccessed: number; // For LRU
}

interface PanelManagerState {
    inspectorPanel: PanelState | null;
    pinnedPanels: PanelState[];
    nextZIndex: number;
}

const MAX_PINNED_PANELS = 5;
const STORAGE_KEY = 'rano-panel-positions';
const PANEL_WIDTH = 450;
const PANEL_HEIGHT = 350;

// Clamp position to viewport
const clampPosition = (x: number, y: number): { x: number; y: number } => {
    return {
        x: Math.max(10, Math.min(x, window.innerWidth - PANEL_WIDTH - 10)),
        y: Math.max(10, Math.min(y, window.innerHeight - PANEL_HEIGHT - 10))
    };
};

// Get default position for new panels
const getDefaultPosition = (offset: number = 0): { x: number; y: number } => {
    const baseX = window.innerWidth - PANEL_WIDTH - 20;
    const baseY = window.innerHeight - PANEL_HEIGHT - 20;
    return clampPosition(baseX - offset * 30, baseY - offset * 30);
};

// Load positions from localStorage
const loadSavedPositions = (): Record<string, { x: number; y: number }> => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : {};
    } catch {
        return {};
    }
};

// Save positions to localStorage
const savePositions = (panels: PanelState[]) => {
    try {
        const positions: Record<string, { x: number; y: number }> = {};
        panels.forEach(p => {
            positions[p.id] = p.position;
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
    } catch {
        // Ignore storage errors
    }
};

export function usePanelManager() {
    const [state, setState] = useState<PanelManagerState>({
        inspectorPanel: null,
        pinnedPanels: [],
        nextZIndex: 100
    });

    const [draggingPanelId, setDraggingPanelId] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    // Re-clamp positions on window resize
    useEffect(() => {
        const handleResize = () => {
            setState(prev => ({
                ...prev,
                inspectorPanel: prev.inspectorPanel ? {
                    ...prev.inspectorPanel,
                    position: clampPosition(prev.inspectorPanel.position.x, prev.inspectorPanel.position.y)
                } : null,
                pinnedPanels: prev.pinnedPanels.map(p => ({
                    ...p,
                    position: clampPosition(p.position.x, p.position.y)
                }))
            }));
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // ESC key handler - closes Inspector only
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && state.inspectorPanel) {
                setState(prev => ({ ...prev, inspectorPanel: null }));
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [state.inspectorPanel]);

    // Save positions when panels change
    useEffect(() => {
        const allPanels = [
            ...(state.inspectorPanel ? [state.inspectorPanel] : []),
            ...state.pinnedPanels
        ];
        if (allPanels.length > 0) {
            savePositions(allPanels);
        }
    }, [state.inspectorPanel, state.pinnedPanels]);

    // Bring panel to front (update z-index)
    const bringToFront = useCallback((panelId: string) => {
        setState(prev => {
            const newZIndex = prev.nextZIndex + 1;

            if (prev.inspectorPanel?.id === panelId) {
                return {
                    ...prev,
                    inspectorPanel: { ...prev.inspectorPanel, zIndex: newZIndex, lastAccessed: Date.now() },
                    nextZIndex: newZIndex
                };
            }

            return {
                ...prev,
                pinnedPanels: prev.pinnedPanels.map(p =>
                    p.id === panelId
                        ? { ...p, zIndex: newZIndex, lastAccessed: Date.now() }
                        : p
                ),
                nextZIndex: newZIndex
            };
        });
    }, []);

    // Open Inspector panel (replaces content if exists)
    const openInspector = useCallback((
        type: 'item' | 'card',
        itemId: string,
        itemName: string,
        clickPosition?: { x: number; y: number }
    ) => {
        const savedPositions = loadSavedPositions();
        const panelId = `inspector-${type}`;

        setState(prev => {
            const existingPosition = savedPositions[panelId];
            const position = existingPosition
                ? clampPosition(existingPosition.x, existingPosition.y)
                : clickPosition
                    ? clampPosition(clickPosition.x, clickPosition.y + 10)
                    : getDefaultPosition();

            return {
                ...prev,
                inspectorPanel: {
                    id: panelId,
                    type,
                    itemId,
                    itemName,
                    pinned: false,
                    position,
                    zIndex: prev.nextZIndex + 1,
                    data: null,
                    isLoading: true,
                    lastAccessed: Date.now()
                },
                nextZIndex: prev.nextZIndex + 1
            };
        });

        return `inspector-${type}`;
    }, []);

    // Update panel data after fetch
    const updatePanelData = useCallback((panelId: string, data: ItemInfo | { cards: CardInfo[] } | null) => {
        setState(prev => {
            if (prev.inspectorPanel?.id === panelId) {
                return {
                    ...prev,
                    inspectorPanel: { ...prev.inspectorPanel, data, isLoading: false }
                };
            }

            return {
                ...prev,
                pinnedPanels: prev.pinnedPanels.map(p =>
                    p.id === panelId ? { ...p, data, isLoading: false } : p
                )
            };
        });
    }, []);

    // Pin current Inspector (creates pinned panel, frees Inspector)
    const pinCurrentPanel = useCallback(() => {
        setState(prev => {
            if (!prev.inspectorPanel) return prev;

            const pinnedPanel: PanelState = {
                ...prev.inspectorPanel,
                id: `pinned-${prev.inspectorPanel.type}-${prev.inspectorPanel.itemId}-${Date.now()}`,
                pinned: true,
                lastAccessed: Date.now()
            };

            let newPinnedPanels = [...prev.pinnedPanels, pinnedPanel];

            // LRU: Remove oldest if exceeds max
            if (newPinnedPanels.length > MAX_PINNED_PANELS) {
                newPinnedPanels.sort((a, b) => a.lastAccessed - b.lastAccessed);
                newPinnedPanels = newPinnedPanels.slice(1); // Remove oldest
            }

            return {
                ...prev,
                inspectorPanel: null,
                pinnedPanels: newPinnedPanels
            };
        });
    }, []);

    // Close panel
    const closePanel = useCallback((panelId: string) => {
        setState(prev => {
            if (prev.inspectorPanel?.id === panelId) {
                return { ...prev, inspectorPanel: null };
            }

            return {
                ...prev,
                pinnedPanels: prev.pinnedPanels.filter(p => p.id !== panelId)
            };
        });
    }, []);

    // Close Inspector only
    const closeInspector = useCallback(() => {
        setState(prev => ({ ...prev, inspectorPanel: null }));
    }, []);

    // Drag handlers
    const startDrag = useCallback((panelId: string, e: React.MouseEvent) => {
        const panel = state.inspectorPanel?.id === panelId
            ? state.inspectorPanel
            : state.pinnedPanels.find(p => p.id === panelId);

        if (!panel) return;

        setDraggingPanelId(panelId);
        setDragOffset({
            x: e.clientX - panel.position.x,
            y: e.clientY - panel.position.y
        });
        bringToFront(panelId);
    }, [state.inspectorPanel, state.pinnedPanels, bringToFront]);

    const onDrag = useCallback((e: React.MouseEvent) => {
        if (!draggingPanelId) return;

        const newPos = clampPosition(e.clientX - dragOffset.x, e.clientY - dragOffset.y);

        setState(prev => {
            if (prev.inspectorPanel?.id === draggingPanelId) {
                return {
                    ...prev,
                    inspectorPanel: { ...prev.inspectorPanel, position: newPos }
                };
            }

            return {
                ...prev,
                pinnedPanels: prev.pinnedPanels.map(p =>
                    p.id === draggingPanelId ? { ...p, position: newPos } : p
                )
            };
        });
    }, [draggingPanelId, dragOffset]);

    const endDrag = useCallback(() => {
        setDraggingPanelId(null);
    }, []);

    // Get all panels for rendering
    const getAllPanels = useCallback((): PanelState[] => {
        const all: PanelState[] = [...state.pinnedPanels];
        if (state.inspectorPanel) {
            all.push(state.inspectorPanel);
        }
        return all.sort((a, b) => a.zIndex - b.zIndex);
    }, [state.inspectorPanel, state.pinnedPanels]);

    return {
        inspectorPanel: state.inspectorPanel,
        pinnedPanels: state.pinnedPanels,
        getAllPanels,
        openInspector,
        updatePanelData,
        pinCurrentPanel,
        closePanel,
        closeInspector,
        bringToFront,
        startDrag,
        onDrag,
        endDrag,
        isDragging: draggingPanelId !== null,
        draggingPanelId
    };
}

export type PanelManager = ReturnType<typeof usePanelManager>;
