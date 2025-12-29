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
    position: { x: number; y: number };
    zIndex: number;
    data: ItemInfo | { cards: CardInfo[] } | null;
    isLoading: boolean;
}

const STORAGE_KEY = 'rano-panel-position';
const PANEL_WIDTH = 450;
const PANEL_HEIGHT = 350;

// Clamp position to viewport
const clampPosition = (x: number, y: number): { x: number; y: number } => {
    return {
        x: Math.max(10, Math.min(x, window.innerWidth - PANEL_WIDTH - 10)),
        y: Math.max(10, Math.min(y, window.innerHeight - PANEL_HEIGHT - 10))
    };
};

// Get default position
const getDefaultPosition = (): { x: number; y: number } => {
    const baseX = window.innerWidth - PANEL_WIDTH - 20;
    const baseY = window.innerHeight - PANEL_HEIGHT - 20;
    return clampPosition(baseX, baseY);
};

// Load position from localStorage
const loadSavedPosition = (): { x: number; y: number } | null => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : null;
    } catch {
        return null;
    }
};

// Save position to localStorage
const savePosition = (position: { x: number; y: number }) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
    } catch {
        // Ignore storage errors
    }
};

export function usePanelManager() {
    const [inspectorPanel, setInspectorPanel] = useState<PanelState | null>(null);
    const [draggingPanelId, setDraggingPanelId] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    // Re-clamp position on window resize
    useEffect(() => {
        const handleResize = () => {
            setInspectorPanel(prev => prev ? {
                ...prev,
                position: clampPosition(prev.position.x, prev.position.y)
            } : null);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // ESC key handler - closes Inspector
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && inspectorPanel) {
                setInspectorPanel(null);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [inspectorPanel]);

    // Save position when it changes
    useEffect(() => {
        if (inspectorPanel) {
            savePosition(inspectorPanel.position);
        }
    }, [inspectorPanel?.position]);

    // Open Inspector panel (replaces content if exists)
    const openInspector = useCallback((
        type: 'item' | 'card',
        itemId: string,
        itemName: string,
        clickPosition?: { x: number; y: number }
    ) => {
        const savedPosition = loadSavedPosition();
        const panelId = `inspector-${type}-${itemId}`;

        // Use saved position, or click position, or default
        const position = savedPosition
            ? clampPosition(savedPosition.x, savedPosition.y)
            : clickPosition
                ? clampPosition(clickPosition.x, clickPosition.y + 10)
                : getDefaultPosition();

        setInspectorPanel({
            id: panelId,
            type,
            itemId,
            itemName,
            position,
            zIndex: 100,
            data: null,
            isLoading: true
        });

        return panelId;
    }, []);

    // Update panel data after fetch
    const updatePanelData = useCallback((panelId: string, data: ItemInfo | { cards: CardInfo[] } | null) => {
        setInspectorPanel(prev => {
            if (prev?.id === panelId) {
                return { ...prev, data, isLoading: false };
            }
            return prev;
        });
    }, []);

    // Close Inspector
    const closeInspector = useCallback(() => {
        setInspectorPanel(null);
    }, []);

    // Drag handlers
    const startDrag = useCallback((panelId: string, e: React.MouseEvent) => {
        if (!inspectorPanel || inspectorPanel.id !== panelId) return;

        setDraggingPanelId(panelId);
        setDragOffset({
            x: e.clientX - inspectorPanel.position.x,
            y: e.clientY - inspectorPanel.position.y
        });
    }, [inspectorPanel]);

    const onDrag = useCallback((e: React.MouseEvent) => {
        if (!draggingPanelId || !inspectorPanel) return;

        const newPos = clampPosition(e.clientX - dragOffset.x, e.clientY - dragOffset.y);
        setInspectorPanel(prev => prev ? { ...prev, position: newPos } : null);
    }, [draggingPanelId, dragOffset, inspectorPanel]);

    const endDrag = useCallback(() => {
        setDraggingPanelId(null);
    }, []);

    return {
        inspectorPanel,
        openInspector,
        updatePanelData,
        closeInspector,
        startDrag,
        onDrag,
        endDrag,
        isDragging: draggingPanelId !== null,
        draggingPanelId
    };
}

export type PanelManager = ReturnType<typeof usePanelManager>;
