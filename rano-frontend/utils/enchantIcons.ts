// Enchant name to Item ID cache
// Stores fetched enchant IDs to avoid repeated API calls

// Memory cache for enchant IDs
const enchantIdCache: Map<string, number> = new Map();

// Known enchant mappings (static fallback)
const KNOWN_ENCHANT_IDS: Record<string, number> = {
  // 보석 인챈트 (Lv1~4)
  "예기의 보석 1Lv": 313749,
  "예기의 보석 2Lv": 313750,
  "예기의 보석 3Lv": 313751,
  "예기의 보석 4Lv": 313752,
  "천공의 보석 1Lv": 313753,
  "천공의 보석 2Lv": 313754,
  "천공의 보석 3Lv": 313755,
  "천공의 보석 4Lv": 313756,
  "마력의 보석 1Lv": 313757,
  "마력의 보석 2Lv": 313758,
  "마력의 보석 3Lv": 313759,
  "마력의 보석 4Lv": 313760,
  "마정의 보석 1Lv": 313761,
  "마정의 보석 2Lv": 313762,
  "마정의 보석 3Lv": 313763,
  "마정의 보석 4Lv": 313764,
  "대지의 보석 1Lv": 313765,
  "대지의 보석 2Lv": 313766,
  "대지의 보석 3Lv": 313767,
  "대지의 보석 4Lv": 313768,
  "각성의 보석 1Lv": 313769,
  "각성의 보석 2Lv": 313770,
  "각성의 보석 3Lv": 313771,
  "각성의 보석 4Lv": 313772,
};

// Default icon for unknown enchants
const DEFAULT_ENCHANT_ICON = "https://static.divine-pride.net/images/items/collection/24323.png";
const DEFAULT_CARD_ICON = "https://static.divine-pride.net/images/items/collection/4001.png";

// Get icon URL for card or enchant name (sync - uses cache or fallback)
export function getEnchantIconUrl(name: string): string {
  const cleanName = name.replace('[옵션] ', '').replace('[옵션]', '').trim();
  const isEnchant = name.startsWith('[옵션]');
  
  // Check cache first
  const cachedId = enchantIdCache.get(cleanName);
  if (cachedId) {
    return `https://static.divine-pride.net/images/items/collection/${cachedId}.png`;
  }
  
  // Check known static mappings
  const knownId = KNOWN_ENCHANT_IDS[cleanName];
  if (knownId) {
    return `https://static.divine-pride.net/images/items/collection/${knownId}.png`;
  }
  
  // Return default icon
  return isEnchant ? DEFAULT_ENCHANT_ICON : DEFAULT_CARD_ICON;
}

// Add ID to cache (call this after fetching from API)
export function cacheEnchantId(name: string, id: number): void {
  const cleanName = name.replace('[옵션] ', '').replace('[옵션]', '').trim();
  enchantIdCache.set(cleanName, id);
}

// Lookup enchant/card ID from API and cache it
export async function lookupEnchantId(name: string): Promise<number | null> {
  const cleanName = name.replace('[옵션] ', '').replace('[옵션]', '').trim();
  
  // Check cache
  const cached = enchantIdCache.get(cleanName);
  if (cached) return cached;
  
  // Check known
  const known = KNOWN_ENCHANT_IDS[cleanName];
  if (known) {
    enchantIdCache.set(cleanName, known);
    return known;
  }
  
  try {
    let apiBase = (import.meta as any).env?.VITE_API_URL || 'https://rano.onrender.com';
    apiBase = apiBase.replace(/\/+$/, '');
    const apiUrl = apiBase.endsWith('/api') ? apiBase : `${apiBase}/api`;
    
    const response = await fetch(`${apiUrl}/items/search?keyword=${encodeURIComponent(cleanName)}`);
    if (response.ok) {
      const data = await response.json();
      const match = data.find((i: any) => i.nameKr === cleanName) || data[0];
      if (match && match.id) {
        enchantIdCache.set(cleanName, match.id);
        return match.id;
      }
    }
  } catch {
    // Silently fail
  }
  
  return null;
}
