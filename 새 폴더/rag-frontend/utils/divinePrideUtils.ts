
export const ITEM_TYPE_MAP: Record<number, string> = {
    0: 'Unknown',
    1: 'Weapons',
    2: 'Armor',
    3: 'Consumable',
    4: 'Ammo',
    5: 'DelayConsume',
    6: 'ShadowGear',
    11: 'Card',
};

export interface ParsedDescription {
    flavorText: string;
    stats: { label: string; value: string }[];
    meta: {
        class?: string;
        position?: string;
        weight?: string;
        reqLevel?: string;
        jobs?: string;
        defense?: string;
        attack?: string;
        property?: string;
        weaponLevel?: string;
    };
}

export const parseDivinePrideDescription = (description: string): ParsedDescription => {
    if (!description) {
        return { flavorText: '', stats: [], meta: {} };
    }

    // 1. Clean color codes and line breaks
    // Handle standard hex codes and potentially 'oooooo' or other formats observed
    const cleanedDescription = description
        .replace(/\^([0-9A-Fa-z]{6})/g, '') // Remove hex codes and 'oooooo'
        .replace(/\^([0-9A-Fa-z]{6})/g, ''); // Double pass just in case

    const rawLines = cleanedDescription.split(/\r\n|\n/);

    const flavorLines: string[] = [];
    const stats: { label: string; value: string }[] = [];
    const meta: ParsedDescription['meta'] = {};

    // Standard KR labels map
    const KEYWORDS: Record<string, string> = {
        '계열': 'class',
        '방어': 'defense',
        '위치': 'position',
        '무게': 'weight',
        '요구 레벨': 'reqLevel',
        '요구레벨': 'reqLevel',
        '장착': 'jobs',
        '무기 레벨': 'weaponLevel',
        '무기레벨': 'weaponLevel',
        '공격': 'attack',
        '속성': 'property'
    };

    // Create a regex for capturing these specific keys
    // Sort keys by length descending to ensure "무기 레벨" matches before "무기" (if "무기" was a key)
    const sortedKeys = Object.keys(KEYWORDS).sort((a, b) => b.length - a.length);
    const keysPattern = sortedKeys.map(k => k.replace(/ /g, '\\s*')).join('|');

    // Regex: (Key)\s*[:]\s*(Value)(Lookahead for next Key or End of Line)
    const metaRegex = new RegExp(`(${keysPattern})\\s*[:함]\\s*(.*?)(?=\\s+(?:${keysPattern})\\s*[:함]|$)`, 'gi');

    let isMetaSection = false;

    rawLines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return;

        if (/^[_\-=\.]+$/.test(trimmed)) return;

        let current = trimmed;
        let matchFound = false;

        // 0. Split "Flavor + Stat" on the same line
        // Patterns: "2제련", "ATK", "MATK", "+3", "물리", "마법", "대미지", "모든 크기", "모든 속성", "방어구 레벨"
        if (!isMetaSection) {
            // Regex to identify the start of a stat/option section.
            // Includes:
            // 1. "N제련" (e.g. 2제련, 7제련)
            // 2. Stat keywords (ATK, MATK, etc.)
            // 3. "+Number" (e.g. +3)
            // 4. Korean Option Keywords (물리, 마법, 대미지, 변동, 고정, 스킬, 쿨타임)
            const statStartRegex = /(\d+제련|\bATK\b|\bMATK\b|\bDEF\b|\bMDEF\b|\bCRI\b|\bFLEE\b|\bHIT\b|\bASPD\b|\bP\.ATK\b|\bS\.MATK\b|\bSTR\b|\bAGI\b|\bVIT\b|\bINT\b|\bDEX\b|\bLUK\b|\bPOW\b|\bSTA\b|\bWIS\b|\bSPL\b|\bCON\b|\bCRT\b|\+\d+|물리|마법|대미지|변동|고정|스킬|쿨타임|계열 :|무게 :|방어 :|위치 :|요구 레벨 :|장착 :|파괴불가)/;

            const match = current.match(statStartRegex);

            if (match && match.index !== undefined) {
                // If the match is at the very beginning (index 0), then this whole line is a stat.
                // We don't need to split, just ensure it's treated as a stat in the loop below.
                // UNLESS we are in the "Flavor" gathering phase. If we find a stat start at 0, 
                // we should probably stop gathering flavor (conceptually), but our loop logic handles "stats.push" if it matches criteria.

                // If match is > 0, we split.
                if (match.index > 0) {
                    const splitIdx = match.index;
                    const flavorPart = current.slice(0, splitIdx).trim();
                    const statPart = current.slice(splitIdx).trim();

                    if (flavorPart.length > 0) {
                        flavorLines.push(flavorPart);
                        current = statPart; // Continue processing the 'stat' part
                    }
                }
            }
        }

        // Reset lastIndex for global regex
        metaRegex.lastIndex = 0;

        const matches = [...current.matchAll(metaRegex)];

        if (matches.length > 0) {
            matches.forEach(m => {
                const rawKey = m[1].replace(/\s+/g, ' ');
                const value = m[2].trim();

                // Map rawKey to our meta field
                const mappedField = KEYWORDS[rawKey] || KEYWORDS[rawKey.replace(' ', '')];

                if (mappedField) {
                    meta[mappedField as keyof ParsedDescription['meta']] = value;
                }
            });
            matchFound = true;
            isMetaSection = true;
        }

        if (!matchFound) {
            // Re-use regex to check if 'current' NOW starts with a stat pattern (even if we just split it, or if it was a full line)
            // This ensures "2제련 당" is caught as a stat.
            const statStartRegex = /(\d+제련|\bATK\b|\bMATK\b|\bDEF\b|\bMDEF\b|\bCRI\b|\bFLEE\b|\bHIT\b|\bASPD\b|\bP\.ATK\b|\bS\.MATK\b|\bSTR\b|\bAGI\b|\bVIT\b|\bINT\b|\bDEX\b|\bLUK\b|\bPOW\b|\bSTA\b|\bWIS\b|\bSPL\b|\bCON\b|\bCRT\b|\+\d+|물리|마법|대미지|변동|고정|스킬|쿨타임|계열 :|무게 :|방어 :|위치 :|요구 레벨 :|장착 :|파괴불가)/;

            if (current === '파괴불가') {
                stats.push({ label: '특수', value: '파괴불가' });
                isMetaSection = true;
            } else if (isMetaSection || current.startsWith('[') || current.includes('+') || current.includes('%') || current.includes('제련') || statStartRegex.test(current)) {
                // Added 'statStartRegex.test(current)' to catch things like "2제련 당" or "ATK + 30" that didn't trip isMetaSection yet.
                stats.push({ label: '', value: current });
                isMetaSection = true;
            } else {
                flavorLines.push(current);
            }
        }
    });

    return {
        flavorText: flavorLines.join(' '),
        stats,
        meta
    };
};

export const parseItemType = (typeId: number, subTypeId: number): string => {
    if (typeId === 6) return '카드';
    if (typeId === 5) return '소비';
    if (typeId === 4) return '장비'; // Armor/Weapon
    if (typeId === 10) return '쉐도우';
    return '기타';
};

export const getUniqueDescriptionLines = (description: string): string[] => {
    if (!description) return [];

    // 1. Clean color codes
    const clean = description.replace(/\^([0-9A-Fa-z]{6})/g, '');

    // 2. Split lines (handle various newlines AND <br>)
    const lines = clean.replace(/<br\s*\/?>/gi, '\n').split(/\r\n|\n|\\n/);

    // 3. Normalize and Dedup
    const map = new Map<string, string>();
    const order = new Array<string>();

    console.log('[DESC] Raw lines:', lines);

    lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return;

        // Normalize key: 
        // 1. Remove leading bullets (*, -, •) and spaces
        // 2. Remove trailing punctuation (., ,) to match lines that might differ only by ending
        // 3. Remove all whitespaces inside to ignore spacing differences? (Risky)
        // Let's stick to punctuation.
        const key = trimmed
            .replace(/^[\*\-•\s]+/, '') // Leading bullets
            .replace(/[.,;]+$/, '')     // Trailing punctuation
            .trim();

        if (!key) return;

        console.log(`[DESC] Key: "${key}" -> Orig: "${trimmed}"`);

        if (!map.has(key)) {
            order.push(key);
            map.set(key, trimmed);
        } else {
            // Collision: Pick the "better" version (longer)
            const existing = map.get(key)!;
            if (trimmed.length > existing.length) {
                map.set(key, trimmed);
            }
        }
    });

    const result = order.map(k => map.get(k)!);
    console.log('[DESC] Final unique lines:', result);
    return result;
};
