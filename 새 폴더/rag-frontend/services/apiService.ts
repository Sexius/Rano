
import { MarketItem, SearchParams } from '../types';
import { parseItemType } from '../utils/divinePrideUtils';

// Local backend for Vending Search (Crawling) and Divine Pride Proxy
const BACKEND_BASE_URL = 'http://localhost:8080/api';

interface VendingData {
    id: number;
    vendor_name: string;
    server_name: string;
    coordinates: string;
    item_name: string;
    price: number;
    category: string;
    rarity: string;
}

interface PaginationInfo {
    total: number;
    page: number;
    size: number;
    total_pages: number;
}

interface VendingResponse {
    data: VendingData[];
    total: number;
    page: number;
    size: number;
    totalPages: number;
}

export const searchMarketItems = async (
    query: string,
    server: string,
    category: string,
    page: number = 1,
    signal?: AbortSignal
): Promise<{ items: MarketItem[], pagination: PaginationInfo }> => {
    try {
        let serverParam = server;
        if (server === '바포메트') serverParam = 'baphomet';
        else if (server === '이프리트') serverParam = 'ifrit';

        const params = new URLSearchParams({
            server: serverParam,
            page: page.toString(),
            size: '10',
            item: query
        });

        const response = await fetch(`${BACKEND_BASE_URL}/vending?${params.toString()}`, { signal });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data: VendingResponse = await response.json();

        const items: MarketItem[] = data.data.map((item) => {
            let name = item.item_name;
            let refine = 0;
            let slots = 0;

            const refineMatch = name.match(/^\+(\d+)\s+(.+)/);
            if (refineMatch) {
                refine = parseInt(refineMatch[1]);
                name = refineMatch[2];
            }

            const slotMatch = name.match(/(.+)\s+\[(\d+)\]$/);
            if (slotMatch) {
                slots = parseInt(slotMatch[2]);
                name = slotMatch[1];
            }

            return {
                id: item.id.toString(),
                server: item.server_name,
                name: name,
                price: item.price,
                amount: 1,
                seller: item.vendor_name,
                shop_title: item.vendor_name,
                location: item.coordinates,
                created_at: new Date().toISOString().split('T')[0],
                category: item.category,
                refine_level: refine,
                card_slots: slots,
                cards_equipped: [],
                description: `Rarity: ${item.rarity}`,
                stats: [],
                image_placeholder: `https://static.divine-pride.net/images/items/collection/${item.id}.png`
            };
        });

        return {
            items,
            pagination: {
                total: data.total,
                page: data.page,
                size: data.size,
                total_pages: data.totalPages
            }
        };

    } catch (error) {
        console.error("API Search Error:", error);
        return {
            items: [],
            pagination: { total: 0, page: 1, size: 10, total_pages: 0 }
        };
    }
};

// Get item detail by ID through backend proxy
export const getItemDetail = async (id: number, server: string = 'kRO'): Promise<any> => {
    try {
        const url = `${BACKEND_BASE_URL}/divine/item/${id}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Failed to fetch item detail: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Divine Pride Item Error:", error);
        return null;
    }
};

// Search items through backend proxy (CORS prevents direct Divine Pride calls)
export const searchDivineItem = async (query: string): Promise<any> => {
    try {
        const url = `${BACKEND_BASE_URL}/divine/search?query=${encodeURIComponent(query)}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Failed to search divine item: ${response.status}`);
        }

        const result = await response.json();

        // Extract items array from various possible response structures
        if (result && typeof result === 'object') {
            if (result.items && Array.isArray(result.items)) {
                return result.items;
            }
            if (Array.isArray(result)) {
                return result;
            }
            // Try to find array in response object
            const items = Object.values(result).find(val => Array.isArray(val));
            if (items) {
                return items;
            }
        }

        return result;
    } catch (error) {
        console.error("Divine Pride Search Error:", error);
        return null;
    }
};

export const getMonsterDetail = async (id: number): Promise<any> => {
    try {
        return null;
    } catch (error) {
        console.error("Divine Pride Monster Error:", error);
        return null;
    }
};
