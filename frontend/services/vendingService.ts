import { MarketItem } from '../types';

interface VendingPageResponse {
  data: any[];
  total: number;
  page: number;
  totalPages: number;
  stale?: boolean;
  cacheStatus?: 'hit' | 'stale' | 'refreshed';
  source?: string;
  message?: string;
  reason?: string | null;
}

interface VendingErrorResponse {
  error?: string;
  cacheStatus?: 'miss';
  source?: string;
  message?: string;
  reason?: string;
  retryAfterSeconds?: number;
}

export class VendingApiError extends Error {
  status: number;
  payload: VendingErrorResponse;

  constructor(status: number, payload: VendingErrorResponse) {
    super(payload.message || `HTTP error ${status}`);
    this.status = status;
    this.payload = payload;
  }
}

export interface VendingSearchResult {
  items: MarketItem[];
  total: number;
  page: number;
  totalPages: number;
  stale: boolean;
  cacheStatus: 'hit' | 'stale' | 'refreshed';
  source: string;
  message?: string;
}

function getBaseApiUrl() {
  let rawUrl = import.meta.env.VITE_API_URL || 'https://rano.onrender.com';
  rawUrl = rawUrl.replace(/\/+$/, '');
  return rawUrl.endsWith('/api') ? rawUrl : `${rawUrl}/api`;
}

function mapServerParam(server: string) {
  if (server === '바포메트') return 'baphomet';
  if (server === '이프리트') return 'ifrit';
  if (server === '위그드라실' || server === '이그드라실') return 'yggdrasil';
  return server || 'baphomet';
}

function mapServerToKorean(server: string) {
  if (server === 'baphomet') return '바포메트';
  if (server === 'ifrit') return '이프리트';
  if (server === 'yggdrasil') return '이그드라실';
  return server;
}

function convertToMarketItem(dto: any, index: number): MarketItem {
  const now = new Date().toISOString();
  return {
    id: `${dto.item_id || dto.id || index}-${index}`,
    server: mapServerToKorean(dto.server || dto.server_name || 'Unknown'),
    name: dto.item_name || 'Unknown',
    price: dto.price || 0,
    amount: dto.quantity || 1,
    seller: dto.shop_name || dto.vendor_name || 'Unknown',
    shop_title: dto.vendor_title || dto.vendor_info || 'Unknown',
    location: dto.map_id || dto.location || '',
    created_at: now,
    category: dto.item_type || '기타',
    image_placeholder: dto.item_icon_url || dto.image_url || `https://imgc1.gnjoy.com/games/ro1/20130212_item_deal/itemDeal/images/no-img.gif`,
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
  page: number = 1,
  size: number = 10
): Promise<VendingSearchResult> => {
  const baseUrl = getBaseApiUrl();
  const params = new URLSearchParams();

  if (itemName) params.append('item', itemName);
  if (server !== '전체') params.append('server', mapServerParam(server));
  if (category && category !== '전체') params.append('category', category);
  params.append('page', page.toString());
  params.append('size', size.toString());
  params.append('sort', 'price');
  params.append('dir', 'asc');

  const response = await fetch(`${baseUrl}/vending/v2/search?${params.toString()}`);
  let payload: any = {};
  try {
    payload = await response.json();
  } catch {
    payload = {};
  }

  if (!response.ok) {
    throw new VendingApiError(response.status, payload);
  }

  const result = payload as VendingPageResponse;
  let items = result.data ? result.data.map((dto, index) => convertToMarketItem(dto, index)) : [];

  return {
    items,
    total: result.total || 0,
    page: result.page || 1,
    totalPages: result.totalPages || 0,
    stale: Boolean(result.stale),
    cacheStatus: result.cacheStatus || 'hit',
    source: result.source || 'cache_only',
    message: result.message
  };
};

export async function enrichWithCardDetails(items: MarketItem[]): Promise<MarketItem[]> {
  // Cloudflare Turnstile 방어로 인해 상세 API 호출 중단 (100% 실패 및 지연 유발)
  // TODO: 우회 로직 구현 전까지 리스트 데이터만 반환
  return items;
}

async function getVendingItemDetailInternal(
  server: string,
  ssi: string,
  mapId: string
): Promise<{ seller?: string; shop_title?: string; cards_equipped?: string[]; location?: string } | null> {
  try {
    const baseUrl = getBaseApiUrl();
    const params = new URLSearchParams();
    params.append('server', mapServerParam(server));
    params.append('ssi', ssi);
    params.append('mapID', mapId);

    const response = await fetch(`${baseUrl}/vending/detail?${params.toString()}`);
    if (!response.ok) {
      return null;
    }

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
    const detail = await getVendingItemDetailInternal(server, ssi, mapId);
    if (!detail) {
      return null;
    }
    return {
      seller: detail.seller,
      shop_title: detail.shop_title,
      cards_equipped: detail.cards_equipped || []
    };
  } catch {
    return null;
  }
};
