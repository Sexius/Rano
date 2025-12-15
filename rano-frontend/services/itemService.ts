import { MarketItem, ParsedItemStats, PerRefineBonus, GradeBonus, SetEffect } from '../types';

const API_BASE_URL = 'http://localhost:8080/api';

// Backend response interface
interface BackendItem {
    id: number;
    nameKr: string;
    description: string;
    slots: number;
    rawData?: string;
    parsedData?: string | ParsedItemStats; // Can be JSON string or already parsed object
    updatedAt?: string;
}

// ============================================
// Robust Item Description Parser
// ============================================

// Clean color codes and special markers from RO item descriptions
const cleanColorCodes = (text: string): string => {
    return text
        // Remove color codes: ^CC3D3D, ^777777, etc.
        .replace(/\^[0-9a-fA-F]{6}/g, '')
        // Remove asterisk markers: *000000, *^000000
        .replace(/\*\^?[0-9a-fA-F]{6}/g, '')
        // Remove standalone asterisks at start of words
        .replace(/\*(?=\S)/g, '')
        // Remove box drawing characters and special symbols
        .replace(/[□■◆◇★☆]/g, '')
        // Clean up extra spaces
        .replace(/\s+/g, ' ')
        .trim();
};

// Parse item description into structured data
export const parseItemDescription = (description: string): ParsedItemStats => {
    if (!description) return {};

    const stats: ParsedItemStats = {
        perRefine: [],
        gradeBonus: {},
        unparsedLines: []
    };

    // Clean and split into lines
    const cleanDesc = cleanColorCodes(description);
    const lines = cleanDesc.split('\\n').map(l => l.trim()).filter(l => l.length > 0);

    for (const line of lines) {
        let matched = false;

        // === BASE WEAPON/ARMOR INFO ===
        // 공격 : 370
        const baseAtkMatch = line.match(/공격\s*:\s*(\d+)/);
        if (baseAtkMatch) {
            stats.baseAtk = parseInt(baseAtkMatch[1]);
            matched = true;
        }

        // 무기 레벨 : 5 or 무기레벨 : 5
        const weaponLvMatch = line.match(/무기\s*레벨\s*:?\s*(\d+)/);
        if (weaponLvMatch) {
            stats.weaponLevel = parseInt(weaponLvMatch[1]);
            matched = true;
        }

        // 방어구 레벨 : 1
        const armorLvMatch = line.match(/방어구\s*레벨\s*:?\s*(\d+)/);
        if (armorLvMatch) {
            stats.armorLevel = parseInt(armorLvMatch[1]);
            matched = true;
        }

        // 요구 레벨 : 100
        const reqLvMatch = line.match(/요구\s*레벨\s*:?\s*(\d+)/);
        if (reqLvMatch) {
            stats.requiredLevel = parseInt(reqLvMatch[1]);
            matched = true;
        }

        // === PER-REFINE BONUSES ("N제련 당" or "N제련 시") ===
        const perRefineMatch = line.match(/(\d+)제련\s*(당|시)/);
        if (perRefineMatch) {
            const refineLevel = parseInt(perRefineMatch[1]);
            const type: 'every' | 'at' = perRefineMatch[2] === '당' ? 'every' : 'at';
            const bonus: PerRefineBonus = { type, refineLevel };

            // ATK + N (flat)
            const atkFlatMatch = line.match(/ATK\s*\+\s*(\d+)(?!%)/i);
            if (atkFlatMatch) bonus.flatAtk = parseInt(atkFlatMatch[1]);

            // ATK + N% (percent)
            const atkPercentMatch = line.match(/ATK\s*\+\s*(\d+)%/i);
            if (atkPercentMatch) bonus.atkPercent = parseInt(atkPercentMatch[1]);

            // MATK + N
            const matkFlatMatch = line.match(/MATK\s*\+\s*(\d+)(?!%)/i);
            if (matkFlatMatch) bonus.flatMatk = parseInt(matkFlatMatch[1]);

            // MATK + N%
            const matkPercentMatch = line.match(/MATK\s*\+\s*(\d+)%/i);
            if (matkPercentMatch) bonus.matkPercent = parseInt(matkPercentMatch[1]);

            // P.ATK + N
            const pAtkMatch = line.match(/P\.ATK\s*\+\s*(\d+)/i);
            if (pAtkMatch) bonus.pAtk = parseInt(pAtkMatch[1]);

            // S.MATK + N
            const sMatkMatch = line.match(/S\.MATK\s*\+\s*(\d+)/i);
            if (sMatkMatch) bonus.sMatk = parseInt(sMatkMatch[1]);

            // 크리티컬 데미지 N% 증가
            const critDmgMatch = line.match(/크리티컬\s*데미지\s*(\d+)%/);
            if (critDmgMatch) bonus.critDamage = parseInt(critDmgMatch[1]);

            // 원거리 물리 데미지 N% 증가
            const rangeDmgMatch = line.match(/원거리\s*(물리\s*)?데미지\s*(\d+)%/);
            if (rangeDmgMatch) bonus.rangeDamage = parseInt(rangeDmgMatch[2]);

            // 근접 물리 데미지 N% 증가
            const meleeDmgMatch = line.match(/근접\s*(물리\s*)?데미지\s*(\d+)%/);
            if (meleeDmgMatch) bonus.meleeDamage = parseInt(meleeDmgMatch[2]);

            // Specific skill damage: "러쉬 스트라이크 데미지 N% 증가" or "명중 물리 데미지 N% 증가"
            const skillDmgMatch = line.match(/([가-힣\s]+)\s*데미지\s*(\d+)%\s*증가/);
            if (skillDmgMatch) {
                const skillName = skillDmgMatch[1].trim();
                if (!['원거리', '근접', '크리티컬', '물리', '마법'].includes(skillName)) {
                    bonus.skillDamage = bonus.skillDamage || {};
                    bonus.skillDamage[skillName] = parseInt(skillDmgMatch[2]);
                }
            }

            // 방어력 N% 무시
            const ignoreDefMatch = line.match(/방어력\s*(\d+)%\s*무시/);
            if (ignoreDefMatch) bonus.ignoreDef = parseInt(ignoreDefMatch[1]);

            stats.perRefine!.push(bonus);
            matched = true;
        }

        // === GRADE BONUSES ("[D등급]", "[C등급]", etc.) ===
        const gradeMatch = line.match(/\[(A|B|C|D)등급\]/);
        if (gradeMatch) {
            const grade = gradeMatch[1] as 'A' | 'B' | 'C' | 'D';
            const bonus: GradeBonus = {};

            // ATK + N%
            const atkPercentMatch = line.match(/ATK\s*\+\s*(\d+)%/i);
            if (atkPercentMatch) bonus.atkPercent = parseInt(atkPercentMatch[1]);

            // ATK + N (flat)
            const atkFlatMatch = line.match(/ATK\s*\+\s*(\d+)(?!%)/i);
            if (atkFlatMatch && !atkPercentMatch) bonus.flatAtk = parseInt(atkFlatMatch[1]);

            // MATK + N%
            const matkPercentMatch = line.match(/MATK\s*\+\s*(\d+)%/i);
            if (matkPercentMatch) bonus.matkPercent = parseInt(matkPercentMatch[1]);

            // P.ATK + N
            const pAtkMatch = line.match(/P\.ATK\s*\+\s*(\d+)/i);
            if (pAtkMatch) bonus.pAtk = parseInt(pAtkMatch[1]);

            // S.MATK + N
            const sMatkMatch = line.match(/S\.MATK\s*\+\s*(\d+)/i);
            if (sMatkMatch) bonus.sMatk = parseInt(sMatkMatch[1]);

            // Skill damage
            const skillDmgMatch = line.match(/([가-힣\s]+)\s*데미지\s*(\d+)%\s*증가/);
            if (skillDmgMatch) {
                bonus.skillDamage = bonus.skillDamage || {};
                bonus.skillDamage[skillDmgMatch[1].trim()] = parseInt(skillDmgMatch[2]);
            }

            stats.gradeBonus![grade] = bonus;
            matched = true;
        }

        // === UNCONDITIONAL FLAT BONUSES (no refine/grade condition) ===
        if (!perRefineMatch && !gradeMatch) {
            // ATK + N (flat)
            const atkFlatMatch = line.match(/^ATK\s*\+\s*(\d+)(?!%)/i);
            if (atkFlatMatch) {
                const value = parseInt(atkFlatMatch[1]);
                stats.flatAtk = (stats.flatAtk || 0) + value;
                stats.atk = (stats.atk || 0) + value;  // Alias for compatibility
                matched = true;
            }

            // ATK + N%
            const atkPercentMatch = line.match(/^ATK\s*\+\s*(\d+)%/i);
            if (atkPercentMatch) {
                const value = parseInt(atkPercentMatch[1]);
                stats.atkPercent = (stats.atkPercent || 0) + value;
                stats.atkP = (stats.atkP || 0) + value;  // Alias for compatibility
                matched = true;
            }

            // MATK + N
            const matkFlatMatch = line.match(/^MATK\s*\+\s*(\d+)(?!%)/i);
            if (matkFlatMatch) {
                stats.flatMatk = (stats.flatMatk || 0) + parseInt(matkFlatMatch[1]);
                matched = true;
            }

            // MATK + N%
            const matkPercentMatch = line.match(/^MATK\s*\+\s*(\d+)%/i);
            if (matkPercentMatch) {
                stats.matkPercent = (stats.matkPercent || 0) + parseInt(matkPercentMatch[1]);
                matched = true;
            }

            // P.ATK + N
            const pAtkMatch = line.match(/P\.ATK\s*\+\s*(\d+)/i);
            if (pAtkMatch) {
                stats.pAtk = (stats.pAtk || 0) + parseInt(pAtkMatch[1]);
                matched = true;
            }

            // S.MATK + N
            const sMatkMatch = line.match(/S\.MATK\s*\+\s*(\d+)/i);
            if (sMatkMatch) {
                stats.sMatk = (stats.sMatk || 0) + parseInt(sMatkMatch[1]);
                matched = true;
            }

            // Individual stats: STR, AGI, VIT, INT, DEX, LUK, POW, STA, WIS, SPL, CON, CRT
            const statPatterns: [RegExp, keyof ParsedItemStats][] = [
                [/STR\s*\+\s*(\d+)/i, 'str'],
                [/AGI\s*\+\s*(\d+)/i, 'agi'],
                [/VIT\s*\+\s*(\d+)/i, 'vit'],
                [/INT\s*\+\s*(\d+)/i, 'int'],
                [/DEX\s*\+\s*(\d+)/i, 'dex'],
                [/LUK\s*\+\s*(\d+)/i, 'luk'],
                [/POW\s*\+\s*(\d+)/i, 'pow'],
                [/STA\s*\+\s*(\d+)/i, 'sta'],
                [/WIS\s*\+\s*(\d+)/i, 'wis'],
                [/SPL\s*\+\s*(\d+)/i, 'spl'],
                [/CON\s*\+\s*(\d+)/i, 'con'],
                [/CRT\s*\+\s*(\d+)/i, 'crt'],
            ];

            for (const [pattern, key] of statPatterns) {
                const match = line.match(pattern);
                if (match) {
                    (stats as any)[key] = ((stats as any)[key] || 0) + parseInt(match[1]);
                    matched = true;
                }
            }

            // 모든 종족에게 주는 물리 데미지 N% 증가
            const allRaceMatch = line.match(/모든\s*종족.*물리\s*데미지\s*(\d+)%/);
            if (allRaceMatch) {
                stats.allRaceDamage = (stats.allRaceDamage || 0) + parseInt(allRaceMatch[1]);
                matched = true;
            }

            // 모든 크기에게 주는 물리 데미지 N% 증가
            const allSizeMatch = line.match(/모든\s*크기.*물리\s*데미지\s*(\d+)%/);
            if (allSizeMatch) {
                stats.allSizeDamage = (stats.allSizeDamage || 0) + parseInt(allSizeMatch[1]);
                matched = true;
            }

            // 보스형 적에게 주는 물리 데미지 N% 증가
            const bossMatch = line.match(/보스.*데미지\s*(\d+)%/);
            if (bossMatch) {
                stats.bossDamage = (stats.bossDamage || 0) + parseInt(bossMatch[1]);
                matched = true;
            }

            // 크리티컬 데미지 N% 증가
            const critDmgMatch = line.match(/크리티컬\s*데미지\s*(\d+)%/);
            if (critDmgMatch && !perRefineMatch && !gradeMatch) {
                const value = parseInt(critDmgMatch[1]);
                stats.critDamage = (stats.critDamage || 0) + value;
                stats.critDmgP = (stats.critDmgP || 0) + value;
                matched = true;
            }

            // 원거리 물리 데미지 N% 증가
            const rangeDmgMatch = line.match(/원거리\s*(물리\s*)?데미지\s*(\d+)%/);
            if (rangeDmgMatch && !perRefineMatch && !gradeMatch) {
                const value = parseInt(rangeDmgMatch[2]);
                stats.rangeDamage = (stats.rangeDamage || 0) + value;
                stats.rangeP = (stats.rangeP || 0) + value;
                matched = true;
            }

            // 근접 물리 데미지 N% 증가
            const meleeDmgMatch = line.match(/근접\s*(물리\s*)?데미지\s*(\d+)%/);
            if (meleeDmgMatch && !perRefineMatch && !gradeMatch) {
                const value = parseInt(meleeDmgMatch[2]);
                stats.meleeDamage = (stats.meleeDamage || 0) + value;
                stats.meleeP = (stats.meleeP || 0) + value;
                matched = true;
            }

            // 방어력 N% 무시
            const ignoreDefMatch = line.match(/(물리\s*)?방어력\s*(\d+)%\s*무시/);
            if (ignoreDefMatch && !perRefineMatch && !gradeMatch) {
                stats.ignoreDef = (stats.ignoreDef || 0) + parseInt(ignoreDefMatch[2]);
                matched = true;
            }
        }

        // Track unparsed lines for debugging
        if (!matched && line.length > 5 && !line.startsWith('계열') && !line.startsWith('장착')) {
            stats.unparsedLines!.push(line);
        }
    }

    // Parse set effects (EXTENSION - does not affect existing parsing)
    stats.setEffects = parseSetEffects(description);

    return stats;
};

// Parse set effects (conditional bonuses based on equipped items)
const parseSetEffects = (description: string): SetEffect[] => {
    const setEffects: SetEffect[] = [];
    const lines = description.split('\\n');

    let currentSet: Partial<SetEffect> | null = null;

    lines.forEach(line => {
        const cleaned = cleanColorCodes(line);

        // Pattern: "XXX와 함께 장착 시" or "XXX(와)과 함께"
        const setTargetMatch = cleaned.match(/([가-힣\s\(\)]+?)(와|과) 함께( 장착)?( 시)?[,:]/);
        if (setTargetMatch) {
            // Save previous set if exists
            if (currentSet && currentSet.targetItemName) {
                setEffects.push(currentSet as SetEffect);
            }

            currentSet = {
                targetItemName: setTargetMatch[1].trim(),
                conditions: [],
                effects: {}
            };
            return;
        }

        if (!currentSet) return;

        // Parse conditions
        // "제련도 합이 24 이상"
        const refineSumMatch = cleaned.match(/제련도\s*합이?\s*(\d+)\s*이상/);
        if (refineSumMatch) {
            currentSet.conditions = currentSet.conditions || [];
            currentSet.conditions.push({
                type: 'refine_sum',
                value: parseInt(refineSumMatch[1]),
                operator: '>='
            });
        }

        // "각 A등급 이상" or "둘 다 A등급"
        const gradeMatch = cleaned.match(/각|둘\s*다.*?([A-D])등급\s*이상/);
        if (gradeMatch) {
            currentSet.conditions = currentSet.conditions || [];
            currentSet.conditions.push({
                type: 'grade_each',
                value: gradeMatch[1]
            });
        }

        // Parse effects
        currentSet.effects = currentSet.effects || {};

        // Skill damage: "데프트 스탭 데미지 45% 증가"
        const skillDmgMatch = cleaned.match(/([가-힣\s]+?)\s*데미지\s*(\d+)%\s*증가/);
        if (skillDmgMatch) {
            const skillName = skillDmgMatch[1].trim();
            const value = parseInt(skillDmgMatch[2]);
            currentSet.effects.skillDamage = currentSet.effects.skillDamage || {};
            currentSet.effects.skillDamage[skillName] = value;
        }

        // Cooldown reduction: "스킬 쿨타임 0.3초 감소" or "쿨타임 감소 0.3초"
        const cooldownMatch = cleaned.match(/([가-힣\s]+?)?\s*(?:스킬\s*)?쿨타임\s*(?:감소)?\s*(\d+(?:\.\d+)?)\s*초\s*(?:감소)?/);
        if (cooldownMatch) {
            const skillName = cooldownMatch[1]?.trim() || 'ALL';
            const value = parseFloat(cooldownMatch[2]);
            currentSet.effects.cooldownReduction = currentSet.effects.cooldownReduction || {};
            currentSet.effects.cooldownReduction[skillName] = value;
        }

        // Auto spell: "데프트 스탭 10레벨 발동"
        const autoSpellMatch = cleaned.match(/([가-힣\s]+?)\s*(\d+)\s*레벨\s*(?:발동|시전)/);
        if (autoSpellMatch) {
            const skillName = autoSpellMatch[1].trim();
            const level = parseInt(autoSpellMatch[2]);
            currentSet.effects.autoSpell = currentSet.effects.autoSpell || {};
            currentSet.effects.autoSpell[skillName] = level;
        }

        // ATK bonus
        const atkMatch = cleaned.match(/ATK\s*\+\s*(\d+)/);
        if (atkMatch && currentSet) {
            currentSet.effects.atk = (currentSet.effects.atk || 0) + parseInt(atkMatch[1]);
        }
    });

    // Save last set
    if (currentSet && currentSet.targetItemName) {
        setEffects.push(currentSet as SetEffect);
    }

    return setEffects;
};

// Legacy function for backward compatibility (returns string array)
const parseStatsFromDescription = (description: string): string[] => {
    if (!description) return [];

    const stats: string[] = [];
    const lines = description.split('\\n');

    lines.forEach(line => {
        const cleanLine = line.trim();
        if (/ATK\s*\+\s*\d+/i.test(cleanLine)) stats.push(cleanLine);
        else if (/MATK\s*\+\s*\d+/i.test(cleanLine)) stats.push(cleanLine);
        else if (/(STR|AGI|VIT|INT|DEX|LUK|POW|STA|WIS|SPL|CON|CRT)\s*\+\s*\d+/i.test(cleanLine)) stats.push(cleanLine);
        else if (/%/.test(cleanLine) && (/(증가|감소|데미지|공격력)/.test(cleanLine))) stats.push(cleanLine);
        else if (/무기레벨|요구레벨/.test(cleanLine)) stats.push(cleanLine);
        else if (/(계열|직업)\s*:/.test(cleanLine)) stats.push(cleanLine);
        else if (/공격\s*:\s*\d+/.test(cleanLine)) stats.push(cleanLine);
    });

    return stats;
};

export const searchItems = async (query: string): Promise<MarketItem[]> => {
    if (!query) return [];

    try {
        const response = await fetch(`${API_BASE_URL}/items/search?keyword=${encodeURIComponent(query)}`);

        if (!response.ok) {
            throw new Error(`Item search failed: ${response.status}`);
        }

        const data: BackendItem[] = await response.json();

        // Convert to MarketItem
        return data.map(item => {
            const stats = parseStatsFromDescription(item.description || '');

            // Use parsedData from backend if available, otherwise parse client-side
            let parsedStats: ParsedItemStats = {};
            if (item.parsedData) {
                try {
                    // Backend returns parsedData as JSON string, parse it
                    parsedStats = typeof item.parsedData === 'string'
                        ? JSON.parse(item.parsedData)
                        : item.parsedData;
                    console.log('✅ Using backend parsedData for:', item.nameKr, parsedStats);
                } catch (e) {
                    console.error('Failed to parse parsedData:', e);
                    parsedStats = parseItemDescription(item.description || '');
                }
            } else {
                // Fallback to client-side parsing if backend doesn't have it
                console.log('⚠️ No backend parsedData, parsing client-side for:', item.nameKr);
                parsedStats = parseItemDescription(item.description || '');
                console.log('📊 Client-parsed stats:', parsedStats);
            }

            return {
                id: item.id.toString(),
                server: '전체 서버',
                name: item.nameKr,
                price: 0,
                amount: 1,
                seller: 'System',
                shop_title: 'Item Database',
                location: 'DB',
                created_at: item.updatedAt || new Date().toISOString(),
                category: '기타',
                refine_level: 0,
                card_slots: item.slots || 0,
                cards_equipped: [],
                description: item.description,
                stats: stats,
                parsedStats: parsedStats,
                image_placeholder: `https://static.divine-pride.net/images/items/item/${item.id}.png`
            };
        });

    } catch (error) {
        console.error("Item Service Error:", error);
        return [];
    }
};

export const filterItemsByCategory = (items: MarketItem[], category: string): MarketItem[] => {
    if (category === '전체' || !category) return items;

    return items.filter(item => {
        const desc = item.description || "";
        const typeMatch = /계열\s*:\s*\^?[0-9a-fA-F]*\s*([^\^]+)/.exec(desc);
        const type = typeMatch ? typeMatch[1].trim() : "";

        if (category === '무기') {
            // Check for "Weapon Level" or specific weapon types
            if (desc.includes('무기 레벨') || desc.includes('무기레벨')) return true;
            // Fallback: Check known weapon types
            const weaponTypes = ['단검', '한손검', '양손검', '창', '도끼', '둔기', '지팡이', '활', '카타르', '책', '너클', '악기', '채찍', '총', '수리검', '풍마수리검'];
            if (weaponTypes.some(t => type.includes(t))) return true;
            return false;
        }

        if (category === '방어구') {
            // Check for "Armor Level" or "Defense"
            if (desc.includes('방어구 레벨') || desc.includes('방어구레벨') || desc.includes('방어 :')) return true;
            if (type.includes('갑옷') || type.includes('투구') || type.includes('걸칠것') || type.includes('신발') || type.includes('방패') || type.includes('액세서리')) return true;
            return false;
        }

        if (category === '카드') {
            return type.includes('카드') || item.name.endsWith('카드');
        }

        return true;
    });
};
