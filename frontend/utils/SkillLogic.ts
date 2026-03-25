// 스킬별 특수 공식 로직
// DB에서 가져온 기본 정보(배율, 타수)에 조건부 로직을 추가합니다.

export interface SkillData {
    skillId: string;
    basePercent: number;  // DB에서 가져온 기본 배율 (예: 5200)
    hits: number;          // DB에서 가져온 타수 (예: 7)
}

export interface UserStats {
    baseLv: number;
    jobLv: number;
    str: number;
    dex: number;
    pow: number;
    pAtk: number;

    // 상태 플래그
    isCloaking?: boolean;    // 은신 상태
    isBackstab?: boolean;    // 백스탭 위치
    targetIsBoss?: boolean;  // 보스 몬스터
}

/**
 * 스킬별 조건부 로직 적용
 * @param skill - DB에서 가져온 스킬 기본 정보
 * @param stats - 사용자 스탯 및 상태
 * @returns 최종 스킬 배율 (%)
 */
export const applySkillLogic = (skill: SkillData, stats: UserStats): number => {
    let finalPercent = skill.basePercent;

    switch (skill.skillId) {

        // 체이싱 브레이크 (ABC_CHASING_BREAK)
        case 'ABC_CHASING_BREAK':
            // 기본: 5200% × 7회
            // 조건: BaseLv에 비례하여 증가 (예시 공식)
            const levelBonus = Math.floor(stats.baseLv / 10);
            finalPercent += levelBonus;

            // POW 스탯 보너스
            const powBonus = stats.pow * 2;
            finalPercent += powBonus;

            // 은신 상태일 경우 2배
            if (stats.isCloaking) {
                finalPercent *= 2;
            }
            break;

        // 데프트 스탭 (ABC_DEFT_STAB)
        case 'ABC_DEFT_STAB':
            // 백스탭 위치 공격 시 추가 데미지
            if (stats.isBackstab) {
                finalPercent *= 1.5;
            }
            break;

        // 러쉬 스트라이크 (MT_RUSH_STRIKE)
        case 'MT_RUSH_STRIKE':
            // STR 스탯 의존
            const strBonus = Math.floor(stats.str / 5);
            finalPercent += strBonus;
            break;

        // 어비스 스퀘어 (ABC_ABYSS_SQUARE)
        case 'ABC_ABYSS_SQUARE':
            // 보스 몬스터 대상 시 추가 데미지
            if (stats.targetIsBoss) {
                finalPercent *= 1.3;
            }
            break;

        // 기타 스킬은 기본 배율 사용
        default:
            break;
    }

    return Math.floor(finalPercent);
};

/**
 * 스킬 총 데미지 계산
 * @param skill - 스킬 정보
 * @param stats - 사용자 스탯
 * @param baseAtk - 기본 공격력
 * @returns 총 데미지
 */
export const calculateSkillDamage = (
    skill: SkillData,
    stats: UserStats,
    baseAtk: number
): { perHit: number; total: number } => {

    // 1. 조건부 로직 적용
    const finalPercent = applySkillLogic(skill, stats);

    // 2. 1타 데미지 계산
    const perHit = Math.floor(baseAtk * (finalPercent / 100));

    // 3. 타수 곱하기
    const total = perHit * skill.hits;

    return { perHit, total };
};
