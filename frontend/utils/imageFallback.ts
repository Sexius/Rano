/**
 * Item Image Fallback Utility v2
 * 이미지 로딩 실패 시 이름/타입 기반 카테고리 기본 아이콘으로 fallback
 * 
 * 수정사항:
 * - onerror = null 추가로 무한 루프 방지
 * - console.warn 디버그 로그 추가
 * - 절대 실패하지 않는 최종 fallback 보장
 */

// 기본 fallback 이미지 (Divine Pride에서 확실히 존재하는 ID)
// 512 = 사과 (가장 기본적인 아이템, 항상 존재)
const ULTIMATE_FALLBACK = 'https://static.divine-pride.net/images/items/collection/512.png';

// 카테고리별 기본 이미지 (Divine Pride의 확실히 존재하는 아이템 ID)
const FALLBACK_IMAGES: Record<string, string> = {
  cube: 'https://static.divine-pride.net/images/items/collection/6909.png',     // 엘드 큐브
  box: 'https://static.divine-pride.net/images/items/collection/7139.png',      // 선물 상자
  card: 'https://static.divine-pride.net/images/items/collection/4001.png',     // 포링카드
  potion: 'https://static.divine-pride.net/images/items/collection/501.png',    // 빨간포션
  weapon: 'https://static.divine-pride.net/images/items/collection/1101.png',   // 검
  armor: 'https://static.divine-pride.net/images/items/collection/2301.png',    // 갑옷
  headgear: 'https://static.divine-pride.net/images/items/collection/2220.png', // 모자
  accessory: 'https://static.divine-pride.net/images/items/collection/2601.png',// 반지
  material: 'https://static.divine-pride.net/images/items/collection/909.png',  // 젤로피
  default: ULTIMATE_FALLBACK,
};

// 이름 기반 카테고리 판별 패턴
const NAME_PATTERNS: [RegExp, string][] = [
  [/큐브|리폼|추출|변환|체인져/i, 'cube'],
  [/상자|박스|보상|캡슐|교환/i, 'box'],
  [/카드$/i, 'card'],
  [/포션|물약|회복/i, 'potion'],
  [/검|창|활|도끼|단검|완드|스태프|너클|채찍|악기|책|카타르|권총|라이플|수리검|무기/i, 'weapon'],
  [/갑옷|로브|슈트|코트|아머|옷$/i, 'armor'],
  [/투구|헬름|모자|가면|안경|머리띠|헤어|서클릿/i, 'headgear'],
  [/반지|귀걸이|목걸이|브로치|팔찌|액세서리/i, 'accessory'],
  [/조각|파편|결정|광석|재료|인챈트|강화|개조|정화|의식|룬|업그레이드|봉인|각인|부여/i, 'material'],
];

/**
 * 아이템 이름/타입으로 카테고리 결정
 */
export function getItemCategory(name?: string | null, _type?: string | null): string {
  if (name) {
    for (const [pattern, category] of NAME_PATTERNS) {
      if (pattern.test(name)) {
        return category;
      }
    }
  }
  return 'default';
}

/**
 * 카테고리에 맞는 fallback 이미지 URL 반환
 */
export function getFallbackImage(name?: string | null, type?: string | null): string {
  const category = getItemCategory(name, type);
  return FALLBACK_IMAGES[category] || ULTIMATE_FALLBACK;
}

/**
 * 이미지 onError 핸들러 생성
 * 사용: onError={createImageErrorHandler(item.name)}
 * 
 * 핵심:
 * 1. console.warn으로 디버그 로그
 * 2. onerror = null로 무한 루프 방지
 * 3. 카테고리 기반 fallback 적용
 */
export function createImageErrorHandler(name?: string | null, type?: string | null) {
  return (e: Event) => {
    const target = e.currentTarget as HTMLImageElement;
    if (!target) return;
    
    const originalSrc = target.src;
    
    // Extract itemId from src for debugging
    const idMatch = originalSrc.match(/\/(\d+)\.png$/);
    const itemId = idMatch ? idMatch[1] : 'unknown';
    
    let fallback = getFallbackImage(name, type);
    
    // 가드: fallback이 없거나 원본과 같으면 확정된 512로 강제
    if (!fallback || fallback === originalSrc) {
      fallback = ULTIMATE_FALLBACK;
    }
    
    // 디버그 로그 (prod에서도 문제 추적용)
    console.warn('[ImageFallback] Failed:', {
      name: name || 'unknown',
      itemId,
      originalSrc,
      fallbackSrc: fallback,
      category: getItemCategory(name, type)
    });
    
    // 무한 루프 방지: onerror 제거
    target.onerror = null;
    
    // fallback 적용
    target.src = fallback;
  };
}

/**
 * 이미지 URL 생성 (collection 타입)
 */
export function getItemImageUrl(itemId: number | string): string {
  return `https://static.divine-pride.net/images/items/collection/${itemId}.png`;
}

/**
 * 이미지 URL 생성 (item 타입)
 */
export function getItemIconUrl(itemId: number | string): string {
  return `https://static.divine-pride.net/images/items/item/${itemId}.png`;
}

export default {
  getFallbackImage,
  createImageErrorHandler,
  getItemImageUrl,
  getItemIconUrl,
  getItemCategory,
  FALLBACK_IMAGES,
  ULTIMATE_FALLBACK,
};
