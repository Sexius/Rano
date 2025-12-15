import { MarketItem } from '../types';

const API_BASE_URL = 'http://localhost:8080/api';

interface VendingItemDto {
    item_id: number;
    vendor_title: string;
    server: string;
    shop_name: string;
    item_name: string;
    quantity: number;
    price: number;
    location: string;
    item_type: string;
    rarity: string;
    image_url?: string;
}

interface VendingPageResponse {
    data: VendingItemDto[];
    total: number;
    page: number;
    size: number;
    totalPages: number;  // Backend returns camelCase, not snake_case
}

export interface VendingSearchResult {
    items: MarketItem[];
    total: number;
    page: number;
    totalPages: number;
}

// Convert backend DTO to frontend MarketItem
function convertToMarketItem(dto: VendingItemDto, index: number): MarketItem {
    const now = new Date().toISOString();

    return {
        id: `${dto.item_id}-${index}`,
        server: dto.server,
        name: dto.item_name,
        price: dto.price,
        amount: dto.quantity,
        seller: dto.shop_name,
        shop_title: dto.vendor_title,
        location: dto.location || '알 수 없음',
        created_at: now,
        category: dto.item_type || '기타',
        refine_level: 0,
        card_slots: 0,
        cards_equipped: [],
        description: '',
        stats: [],
        image_placeholder: dto.image_url || `https://picsum.photos/seed/${dto.item_id}/64/64`
    };
}

export const searchVendingItems = async (
    query: string,
    server: string,
    category: string,
    page: number = 1
): Promise<VendingSearchResult> => {
    if (!query) return { items: [], total: 0, page: 1, totalPages: 0 };

    try {
        // Map frontend server names to backend server names
        const serverMap: { [key: string]: string } = {
            '바포메트': 'baphomet',
            '이프리트': 'ifrit',
            '전체 서버': 'baphomet'
        };

        const backendServer = serverMap[server] || 'baphomet';

        const url = `${API_BASE_URL}/vending?item=${encodeURIComponent(query)}&server=${backendServer}&page=${page}`;

        console.log('[VendingService] Calling API:', url);

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result: VendingPageResponse = await response.json();

        console.log('[VendingService] Response:', result);
        console.log('[VendingService] Mapping totalPages:', result.totalPages);

        // Always return pagination info, even if no items
        const searchResult: VendingSearchResult = {
            items: result.data ? result.data.map((dto, index) => convertToMarketItem(dto, index)) : [],
            total: result.total || 0,
            page: result.page || 1,
            totalPages: result.totalPages || 0
        };

        console.log('[VendingService] Returning:', searchResult);
        return searchResult;

    } catch (error) {
        console.error('[VendingService] Error:', error);
        return { items: [], total: 0, page: 1, totalPages: 0 };
    }
};
