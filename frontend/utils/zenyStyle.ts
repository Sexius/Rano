/**
 * Zeny color styling utility
 * Replicates Ragnarok Online in-game zeny colors based on price range
 */

interface ZenyStyle {
    color: string;
    textShadow: string;
}

export const getZenyStyle = (amount: number): ZenyStyle => {
    // 1,000,000,000+ (10억+)
    if (amount >= 1_000_000_000) {
        return { color: '#FF0000', textShadow: '1px 1px 0 #FF007B' };
    }
    // 100,000,000 ~ 999,999,999 (억 단위)
    if (amount >= 100_000_000) {
        return { color: '#000000', textShadow: '1px 1px 0 #CECE63' };
    }
    // 10,000,000 ~ 99,999,999 (천만 단위)
    if (amount >= 10_000_000) {
        return { color: '#FF0000', textShadow: 'none' };
    }
    // 1,000,000 ~ 9,999,999 (백만 단위)
    if (amount >= 1_000_000) {
        return { color: '#000000', textShadow: '1px 1px 0 #00FF00' };
    }
    // 100,000 ~ 999,999 (십만 단위)
    if (amount >= 100_000) {
        return { color: '#0000FF', textShadow: 'none' };
    }
    // 10,000 ~ 99,999 (만 단위)
    if (amount >= 10_000) {
        return { color: '#FF18FF', textShadow: 'none' };
    }
    // 1,000 ~ 9,999 (천 단위)
    if (amount >= 1_000) {
        return { color: '#FF0000', textShadow: '1px 1px 0 #FFFF00' };
    }
    // 100 ~ 999 (백 단위)
    if (amount >= 100) {
        return { color: '#0000FF', textShadow: '1px 1px 0 #00FFFF' };
    }
    // 10 ~ 99 (십 단위)
    if (amount >= 10) {
        return { color: '#00FFFF', textShadow: '1px 1px 0 #CE00CE' };
    }
    // 1 ~ 9 (일 단위)
    return { color: '#000000', textShadow: '1px 1px 0 #00FFFF' };
};

/**
 * Format zeny with thousand separators
 */
export const formatZeny = (amount: number): string => {
    return new Intl.NumberFormat('ko-KR').format(amount);
};
