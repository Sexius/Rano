import { MarketItem } from '../types';

// 백엔드 DTO 타입 정의
interface VendingPageResponse {
    data: any[];
    total: number;
    page: number;
    totalPages: number;
}

export interface VendingSearchResult {
    items: MarketItem[];
    total: number;
    page: number;
    totalPages: number;
}

// Convert backend DTO to frontend MarketItem
function convertToMarketItem(dto: any, index: number): MarketItem {
    const now = new Date().toISOString();
    return {
        id: `${dto.item_id || index}-${index}`,
        server: dto.server || dto.server_name || 'Unknown',
        name: dto.item_name || 'Unknown',
        price: dto.price || 0,
        amount: dto.quantity || 1,
        seller: dto.shop_name || dto.vendor_name || 'Unknown',
        shop_title: dto.vendor_title || dto.vendor_info || 'Unknown',
        location: dto.location || '알 수 없음',
        created_at: now,
        category: dto.item_type || '기타',
        image_placeholder: dto.item_icon_url || dto.image_url || `https://picsum.photos/seed/${dto.item_id || index}/64/64`,
        refine_level: 0,
        card_slots: 0,
        cards_equipped: [],
        description: '',
        stats: [],
        ssi: dto.ssi,
        map_id: dto.map_id
    };
}

export const searchVendingItems = async (
    itemName: string,
    server: string,
    category: string,
    page: number = 1
): Promise<VendingSearchResult> => {
    try {
        // [수정] URL 처리 - /api 중복 방지
        let rawUrl = import.meta.env.VITE_API_URL || 'https://rano.onrender.com';
        // trailing slash 제거
        rawUrl = rawUrl.replace(/\/+$/, '');
        // /api로 끝나면 그대로 사용, 아니면 /api 추가
        const baseUrl = rawUrl.endsWith('/api') ? rawUrl : `${rawUrl}/api`;

        console.log(`[VendingService] VITE_API_URL: ${import.meta.env.VITE_API_URL}`);
        console.log(`[VendingService] Final baseUrl: ${baseUrl}`);

        // Build Query Parameters
        const params = new URLSearchParams();
        if (itemName) params.append('item', itemName);

        // 서버 파라미터 매핑 (한글 -> 영어)
        let serverParam = 'baphomet'; // 기본값
        if (server === '바포메트') serverParam = 'baphomet';
        else if (server === '이그드라실') serverParam = 'yggdrasil';
        else if (server === '이프리트') serverParam = 'ifrit';

        params.append('server', serverParam);
        if (category && category !== '전체') params.append('category', category);

        params.append('page', page.toString());
        params.append('size', '100');
        params.append('sort', 'price');
        params.append('dir', 'asc');
        // ★ V2 API 호출 (DB 스냅샷 검색 - 빠름)
        const response = await fetch(`${baseUrl}/vending/v2/search?${params.toString()}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result: VendingPageResponse = await response.json();

        // Convert to MarketItem
        const items = result.data ? result.data.map((dto, index) => convertToMarketItem(dto, index)) : [];

        // Auto-fetch card details for each item (in parallel, with limit)
        const enrichedItems = await enrichWithCardDetails(items);

        return {
            items: enrichedItems,
            total: result.total || 0,
            page: result.page || 1,
            totalPages: result.totalPages || 0
        };

    } catch (error) {
        console.error('[VendingService] API Error:', error);
        return { items: [], total: 0, page: 1, totalPages: 0 };
    }
};

// Fetch card details for each item in parallel
async function enrichWithCardDetails(items: MarketItem[]): Promise<MarketItem[]> {
    // Process in batches to avoid overwhelming the server
    const batchSize = 5;
    const enrichedItems = [...items];

    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const promises = batch.map(async (item, batchIndex) => {
            if (item.ssi && item.map_id) {
                try {
                    const detail = await getVendingItemDetailInternal(item.server, item.ssi, item.map_id);
                    if (detail && detail.cards_equipped && detail.cards_equipped.length > 0) {
                        enrichedItems[i + batchIndex] = {
                            ...enrichedItems[i + batchIndex],
                            cards_equipped: detail.cards_equipped,
                            seller: detail.seller || enrichedItems[i + batchIndex].seller,
                            shop_title: detail.shop_title || enrichedItems[i + batchIndex].shop_title
                        };
                    }
                } catch (e) {
                    // Silently fail for individual items
                }
            }
        });
        await Promise.all(promises);
    }

    return enrichedItems;
}

// Internal function to get item detail (to avoid circular dependency)
async function getVendingItemDetailInternal(
    server: string,
    ssi: string,
    mapId: string
): Promise<{ seller?: string; shop_title?: string; cards_equipped?: string[] } | null> {
    try {
        let rawUrl = import.meta.env.VITE_API_URL || 'https://rano.onrender.com';
        rawUrl = rawUrl.replace(/\/+$/, '');
        const baseUrl = rawUrl.endsWith('/api') ? rawUrl : `${rawUrl}/api`;

        let serverParam = server;
        if (server === '바포메트') serverParam = 'baphomet';
        else if (server === '이프리트') serverParam = 'ifrit';

        const params = new URLSearchParams();
        params.append('server', serverParam);
        params.append('ssi', ssi);
        params.append('mapID', mapId);

        const response = await fetch(`${baseUrl}/vending/detail?${params.toString()}`);
        if (!response.ok) return null;

        const result = await response.json();
        return {
            seller: result.vendor_name,
            shop_title: result.vendor_info,
            cards_equipped: result.cards_equipped || []
        };
    } catch {
        return null;
    }
}

export const getVendingItemDetail = async (
    server: string,
    ssi: string,
    mapId: string
): Promise<Partial<MarketItem> | null> => {
    try {
        let rawUrl = import.meta.env.VITE_API_URL || 'https://rano.onrender.com';
        rawUrl = rawUrl.replace(/\/+$/, '');
        const baseUrl = rawUrl.endsWith('/api') ? rawUrl : `${rawUrl}/api`;

        // 서버 파라미터 매핑 (한글 -> 영어)
        let serverParam = server;
        if (server === '바포메트') serverParam = 'baphomet';
        else if (server === '이프리트') serverParam = 'ifrit';

        const params = new URLSearchParams();
        params.append('server', serverParam);
        params.append('ssi', ssi);
        params.append('mapID', mapId);

        const response = await fetch(`${baseUrl}/vending/detail?${params.toString()}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('[VendingService] Detail API response:', {
            seller: result.vendor_name,
            cards: result.cards_equipped
        });
        return {
            seller: result.vendor_name,
            shop_title: result.vendor_info,
            cards_equipped: result.cards_equipped || []
        };
    } catch (error) {
        console.error('[VendingService] Detail API Error:', error);
        return null;
    }
};
