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
        location: dto.map_id || dto.location || '',
        created_at: now,
        category: dto.item_type || '기타',
        image_placeholder: dto.item_icon_url || dto.image_url || `https://picsum.photos/seed/${dto.item_id || index}/64/64`,
        refine_level: 0,
        card_slots: 0,
        cards_equipped: [],
        description: '',
        stats: [],
        ssi: dto.ssi,
        map_id: dto.map_id,
        shop_type: dto.shop_type || 'sell'
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
        let serverParam = 'baphomet'; // 기본값 (전체 선택 시에도 baphomet)
        if (server === '바포메트') serverParam = 'baphomet';
        else if (server === '이그드라실') serverParam = 'yggdrasil';
        else if (server === '이프리트') serverParam = 'ifrit';
        // '전체' 선택 시 serverParam 생략 (백엔드에서 기본값 사용)

        if (server !== '전체') {
            params.append('server', serverParam);
        }
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
        let items = result.data ? result.data.map((dto, index) => convertToMarketItem(dto, index)) : [];

        // 클라이언트 측 서버 필터링 (GNJOY API가 서버 필터링을 지원하지 않는 경우)
        if (server !== '전체') {
            const serverNameMap: Record<string, string[]> = {
                '바포메트': ['바포메트', 'Baphomet', '바포'],
                '이그드라실': ['이그드라실', 'Yggdrasil', '이그'],
                '이프리트': ['이프리트', 'Ifrit', '이프']
            };
            const validNames = serverNameMap[server] || [];
            if (validNames.length > 0) {
                items = items.filter(item => 
                    validNames.some(name => item.server.includes(name))
                );
            }
        }

        // 카드 상세는 개별 아이템 클릭 시에만 로드 (검색 속도 최적화)
        const enrichedItems = items;

        return {
            items: enrichedItems,
            total: server !== '전체' ? items.length : (result.total || 0),
            page: result.page || 1,
            // 서버 필터링 시 클라이언트 측 필터링으로 인해 정확한 페이지네이션 불가 → UI 숨김 처리 (totalPages=1)
            totalPages: server !== '전체' ? 1 : (result.totalPages || 0)
        };

    } catch (error) {
        console.error('[VendingService] API Error:', error);
        return { items: [], total: 0, page: 1, totalPages: 0 };
    }
};

// Fetch card details for each item in parallel (export for background loading)
export async function enrichWithCardDetails(items: MarketItem[]): Promise<MarketItem[]> {
    // Lazy import to avoid circular dependency
    const { lookupEnchantId } = await import('../utils/enchantIcons');
    
    // Process in batches to avoid overwhelming the server
    const batchSize = 5;
    const enrichedItems = [...items];

    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const promises = batch.map(async (item, batchIndex) => {
            if (item.ssi && item.map_id) {
                try {
                    const detail = await getVendingItemDetailInternal(item.server, item.ssi, item.map_id);
                    if (detail) {
                        const cardsEquipped = detail.cards_equipped || enrichedItems[i + batchIndex].cards_equipped;
                        
                        // Lookup and cache enchant IDs (await to ensure cache is populated)
                        if (cardsEquipped && cardsEquipped.length > 0) {
                            await Promise.all(cardsEquipped.map(cardName => lookupEnchantId(cardName)));
                        }
                        
                        enrichedItems[i + batchIndex] = {
                            ...enrichedItems[i + batchIndex],
                            cards_equipped: cardsEquipped,
                            seller: detail.seller || enrichedItems[i + batchIndex].seller,
                            shop_title: detail.shop_title || enrichedItems[i + batchIndex].shop_title,
                            location: detail.location || enrichedItems[i + batchIndex].location
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

async function getVendingItemDetailInternal(
    server: string,
    ssi: string,
    mapId: string
): Promise<{ seller?: string; shop_title?: string; cards_equipped?: string[]; location?: string } | null> {
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
            cards_equipped: result.cards_equipped || [],
            location: result.map_id
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
