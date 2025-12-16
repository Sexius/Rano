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
        server: dto.server || 'Unknown',
        name: dto.item_name || 'Unknown',
        price: dto.price || 0,
        amount: dto.quantity || 1,
        seller: dto.shop_name || dto.vendor_name || 'Unknown',
        shop_title: dto.vendor_title || dto.vendor_info || 'Unknown',
        location: dto.location || '알 수 없음',
        created_at: now,
        category: dto.item_type || '기타',
        image_placeholder: dto.image_url || `https://picsum.photos/seed/${dto.item_id || index}/64/64`,
        refine_level: 0,
        card_slots: 0,
        cards_equipped: [],
        description: '',
        stats: []
    };
}

export const searchVendingItems = async (
    itemName: string,
    server: string,
    category: string,
    page: number = 1
): Promise<VendingSearchResult> => {
    try {
        // [수정] ReferenceError 방지를 위해 변수를 함수 내부로 이동
        const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
        // /api가 중복으로 붙지 않도록 처리
        const baseUrl = rawUrl.endsWith('/api') ? rawUrl : `${rawUrl}/api`;

        console.log(`[VendingService] Requesting to: ${baseUrl}/vending`);

        // Build Query Parameters
        const params = new URLSearchParams();
        if (itemName) params.append('item', itemName);

        // 서버 파라미터 매핑 (한글 -> 영어)
        let serverParam = server;
        if (server === '바포메트') serverParam = 'baphomet';
        else if (server === '이프리트') serverParam = 'ifrit';
        else if (server === '전체 서버') serverParam = 'baphomet'; // 기본값

        if (server && server !== '전체 서버') params.append('server', serverParam);
        if (category && category !== '전체') params.append('category', category);

        params.append('page', page.toString());
        params.append('size', '10');

        const response = await fetch(`${baseUrl}/vending?${params.toString()}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result: VendingPageResponse = await response.json();

        return {
            items: result.data ? result.data.map((dto, index) => convertToMarketItem(dto, index)) : [],
            total: result.total || 0,
            page: result.page || 1,
            totalPages: result.totalPages || 0
        };

    } catch (error) {
        console.error('[VendingService] API Error:', error);
        return { items: [], total: 0, page: 1, totalPages: 0 };
    }
};
