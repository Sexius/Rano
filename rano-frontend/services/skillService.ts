// Skill API Service
const API_BASE = 'http://localhost:8080/api/skills';

export interface SkillData {
    engName: string;
    nameKr: string;
    maxLevel: number;
    damagePercent: number;
    hits: number;
}

/**
 * 특정 스킬 조회
 */
export const getSkill = async (engName: string): Promise<SkillData | null> => {
    try {
        const response = await fetch(`${API_BASE}/${engName}`);
        if (!response.ok) return null;
        return await response.json();
    } catch (error) {
        console.error('Failed to fetch skill:', error);
        return null;
    }
};

/**
 * 데미지 정보가 있는 스킬 목록 조회
 */
export const getSkillsWithDamage = async (): Promise<SkillData[]> => {
    try {
        const response = await fetch(API_BASE);
        if (!response.ok) return [];
        return await response.json();
    } catch (error) {
        console.error('Failed to fetch skills:', error);
        return [];
    }
};

/**
 * 스킬 검색
 */
export const searchSkills = async (keyword: string): Promise<SkillData[]> => {
    try {
        const response = await fetch(`${API_BASE}/search?keyword=${encodeURIComponent(keyword)}`);
        if (!response.ok) return [];
        return await response.json();
    } catch (error) {
        console.error('Failed to search skills:', error);
        return [];
    }
};
