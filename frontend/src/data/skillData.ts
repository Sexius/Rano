// 전체 직업 트리 및 스킬 데이터 (ragnaplace.com 참고)
// 직업 진행: 노비스 → 1차 → 2차(+전승) → 3차 → 4차

// ================ 직업 트리 구조 ================
export const JOB_TREE_FULL = {
    // 검사 계열
    "검사계열": {
        "나이트 계열": {
            progression: ["노비스", "검사", "기사", "로드나이트", "룬나이트", "드래곤나이트"],
            icon: "swords"
        },
        "크루세이더 계열": {
            progression: ["노비스", "검사", "크루세이더", "팔라딘", "로열가드", "임페리얼가드"],
            icon: "shield"
        }
    },

    // 마법사 계열
    "마법사계열": {
        "위자드 계열": {
            progression: ["노비스", "마법사", "위자드", "하이위자드", "워록", "아크메이지"],
            icon: "flame"
        },
        "세이지 계열": {
            progression: ["노비스", "마법사", "세이지", "프로페서", "소서러", "엘레멘탈마스터"],
            icon: "book"
        }
    },

    // 궁수 계열
    "궁수계열": {
        "헌터 계열": {
            progression: ["노비스", "궁수", "헌터", "스나이퍼", "레인저", "윈드호크"],
            icon: "crosshair"
        },
        "바드 계열": {
            progression: ["노비스", "궁수", "바드", "클로운", "민스트럴", "트루바두르"],
            icon: "music"
        },
        "댄서 계열": {
            progression: ["노비스", "궁수", "댄서", "집시", "원더러", "트루베르"],
            icon: "music"
        }
    },

    // 복사 계열
    "복사계열": {
        "프리스트 계열": {
            progression: ["노비스", "복사", "프리스트", "하이프리스트", "아크비숍", "카디날"],
            icon: "cross"
        },
        "몽크 계열": {
            progression: ["노비스", "복사", "몽크", "챔피언", "수라", "인퀴지터"],
            icon: "zap"
        }
    },

    // 상인 계열
    "상인계열": {
        "블랙스미스 계열": {
            progression: ["노비스", "상인", "블랙스미스", "화이트스미스", "미케닉", "마이스터"],
            icon: "hammer"
        },
        "알케미스트 계열": {
            progression: ["노비스", "상인", "알케미스트", "크리에이터", "제네릭", "바이올로"],
            icon: "beaker"
        }
    },

    // 도둑 계열
    "도둑계열": {
        "어쌔신 계열": {
            progression: ["노비스", "도둑", "어쌔신", "어쌔신크로스", "길로틴크로스", "쉐도우크로스"],
            icon: "skull"
        },
        "로그 계열": {
            progression: ["노비스", "도둑", "로그", "스토커", "쉐도우체이서", "어비스체이서"],
            icon: "message"
        }
    },

    // 확장 직업
    "확장직업": {
        "태권소년 계열": {
            progression: ["태권소년", "권성", "성제"],
            icon: "star"
        },
        "소울링커 계열": {
            progression: ["태권소년", "소울링커", "소울리퍼"],
            icon: "sparkles"
        },
        "닌자 계열": {
            progression: ["닌자", "카게로우", "시라누이"],
            alternateProgression: ["닌자", "오보로", "신키로"],
            icon: "wind"
        },
        "건슬링거 계열": {
            progression: ["건슬링거", "리베리온", "나이트워치"],
            icon: "target"
        },
        "슈퍼노비스 계열": {
            progression: ["슈퍼노비스", "확장슈퍼노비스", "하이퍼노비스"],
            icon: "sparkles"
        },
        "도람족 계열": {
            progression: ["소환사", "혼령사"],
            icon: "cat"
        }
    }
};

// ================ 전체 스킬 데이터 ================
export interface SkillInfo {
    id: number;
    name: string;
    maxLevel: number;
    type?: 'active' | 'passive' | 'buff';
    requirements?: { skillId: number; level: number }[];
}

export const ALL_JOB_SKILLS: Record<string, SkillInfo[]> = {
    // ================ 노비스 ================
    "노비스": [
        { id: 1, name: "기본기", maxLevel: 9, type: "passive" },
    ],

    // ================ 1차 직업: 검사 ================
    "검사": [
        { id: 2, name: "한손검 수련", maxLevel: 10, type: "passive" },
        { id: 3, name: "양손검 수련", maxLevel: 10, type: "passive" },
        { id: 4, name: "HP회복력 향상", maxLevel: 10, type: "passive" },
        { id: 5, name: "배쉬", maxLevel: 10, type: "active" },
        { id: 6, name: "프로보크", maxLevel: 10, type: "active" },
        { id: 7, name: "매그넘 브레이크", maxLevel: 10, type: "active", requirements: [{ skillId: 5, level: 5 }] },
        { id: 8, name: "인듀어", maxLevel: 10, type: "buff", requirements: [{ skillId: 6, level: 5 }] },
        { id: 142, name: "이동시 HP 회복", maxLevel: 1, type: "passive" },
        { id: 144, name: "급소 치기", maxLevel: 1, type: "passive", requirements: [{ skillId: 5, level: 6 }] },
        { id: 145, name: "오토 버서크", maxLevel: 1, type: "passive", requirements: [{ skillId: 8, level: 1 }] },
    ],

    // ================ 2차 직업: 기사 (+ 로드나이트 전승) ================
    "기사": [
        // 기사 스킬
        { id: 55, name: "창 수련", maxLevel: 10, type: "passive" },
        { id: 56, name: "피어스", maxLevel: 10, type: "active", requirements: [{ skillId: 55, level: 1 }] },
        { id: 57, name: "브랜디쉬 스피어", maxLevel: 10, type: "active", requirements: [{ skillId: 58, level: 3 }, { skillId: 63, level: 1 }] },
        { id: 58, name: "스피어 스탭", maxLevel: 10, type: "active", requirements: [{ skillId: 56, level: 5 }] },
        { id: 59, name: "스피어 부메랑", maxLevel: 5, type: "active", requirements: [{ skillId: 56, level: 3 }] },
        { id: 60, name: "투핸드 퀴큰", maxLevel: 10, type: "buff", requirements: [{ skillId: 3, level: 1 }] },
        { id: 61, name: "오토 카운터", maxLevel: 5, type: "active", requirements: [{ skillId: 3, level: 1 }] },
        { id: 62, name: "볼링 배쉬", maxLevel: 10, type: "active", requirements: [{ skillId: 5, level: 10 }, { skillId: 7, level: 3 }] },
        { id: 63, name: "라이딩", maxLevel: 1, type: "passive", requirements: [{ skillId: 8, level: 1 }] },
        { id: 64, name: "카발리 마스터리", maxLevel: 5, type: "passive", requirements: [{ skillId: 63, level: 1 }] },
        // 로드나이트 전승 스킬 (2차에 포함)
        { id: 355, name: "오라 블레이드", maxLevel: 5, type: "buff" },
        { id: 356, name: "패링", maxLevel: 10, type: "active", requirements: [{ skillId: 3, level: 10 }, { skillId: 60, level: 3 }] },
        { id: 357, name: "컨센트레이션", maxLevel: 5, type: "buff", requirements: [{ skillId: 8, level: 5 }] },
        { id: 358, name: "텐션 릴렉스", maxLevel: 1, type: "passive", requirements: [{ skillId: 4, level: 10 }] },
        { id: 359, name: "버서크", maxLevel: 1, type: "active", requirements: [{ skillId: 145, level: 1 }] },
        { id: 397, name: "스파이럴 피어스", maxLevel: 5, type: "active", requirements: [{ skillId: 56, level: 5 }, { skillId: 58, level: 5 }, { skillId: 63, level: 1 }] },
        { id: 398, name: "헤드 크러쉬", maxLevel: 5, type: "active", requirements: [{ skillId: 59, level: 3 }] },
        { id: 399, name: "조인트 비트", maxLevel: 10, type: "active", requirements: [{ skillId: 398, level: 3 }] },
    ],

    // ================ 2차 직업: 크루세이더 (+ 팔라딘 전승) ================
    "크루세이더": [
        { id: 248, name: "신앙 심정", maxLevel: 10, type: "passive" },
        { id: 249, name: "오토 가드", maxLevel: 10, type: "active" },
        { id: 250, name: "실드 차지", maxLevel: 5, type: "active", requirements: [{ skillId: 249, level: 5 }] },
        { id: 251, name: "실드 부메랑", maxLevel: 5, type: "active", requirements: [{ skillId: 250, level: 3 }] },
        { id: 252, name: "리플렉트 실드", maxLevel: 10, type: "buff", requirements: [{ skillId: 250, level: 3 }] },
        { id: 253, name: "홀리 크로스", maxLevel: 10, type: "active", requirements: [{ skillId: 248, level: 7 }] },
        { id: 254, name: "그랜드 크로스", maxLevel: 10, type: "active", requirements: [{ skillId: 248, level: 10 }, { skillId: 253, level: 6 }] },
        { id: 255, name: "프로비던스", maxLevel: 5, type: "buff", requirements: [{ skillId: 29, level: 5 }, { skillId: 24, level: 5 }] },
        { id: 256, name: "디펜더", maxLevel: 5, type: "buff", requirements: [{ skillId: 252, level: 5 }, { skillId: 249, level: 5 }] },
        { id: 257, name: "스피어 퀴큰", maxLevel: 10, type: "buff", requirements: [{ skillId: 55, level: 10 }] },
        { id: 258, name: "프레셔", maxLevel: 5, type: "active", requirements: [{ skillId: 248, level: 10 }, { skillId: 8, level: 5 }] },
        { id: 261, name: "디몬스트레이션", maxLevel: 5, type: "active", requirements: [{ skillId: 258, level: 2 }] },
        // 팔라딘 전승
        { id: 360, name: "프레셔", maxLevel: 5, type: "active" },
        { id: 361, name: "새크리파이스", maxLevel: 5, type: "active", requirements: [{ skillId: 258, level: 3 }] },
        { id: 362, name: "가스펠", maxLevel: 10, type: "buff" },
        { id: 363, name: "쉬링크", maxLevel: 5, type: "buff" },
        { id: 365, name: "쉴드 체인", maxLevel: 5, type: "active", requirements: [{ skillId: 250, level: 5 }, { skillId: 256, level: 3 }] },
        { id: 400, name: "마티르 레코닝", maxLevel: 5, type: "active" },
    ],

    // ================ 1차 직업: 마법사 ================
    "마법사": [
        { id: 9, name: "SP회복력 향상", maxLevel: 10, type: "passive" },
        { id: 10, name: "콜드 볼트", maxLevel: 10, type: "active" },
        { id: 11, name: "파이어 볼트", maxLevel: 10, type: "active" },
        { id: 12, name: "라이트닝 볼트", maxLevel: 10, type: "active" },
        { id: 13, name: "파이어 월", maxLevel: 10, type: "active", requirements: [{ skillId: 11, level: 4 }, { skillId: 16, level: 1 }] },
        { id: 14, name: "소울 스트라이크", maxLevel: 10, type: "active", requirements: [{ skillId: 15, level: 4 }] },
        { id: 15, name: "나팜 비트", maxLevel: 10, type: "active" },
        { id: 16, name: "사이트", maxLevel: 1, type: "active" },
        { id: 17, name: "세이프티 월", maxLevel: 10, type: "active", requirements: [{ skillId: 14, level: 5 }, { skillId: 15, level: 7 }] },
        { id: 18, name: "스톤 커스", maxLevel: 10, type: "active" },
        { id: 19, name: "프로스트 다이버", maxLevel: 10, type: "active", requirements: [{ skillId: 10, level: 5 }] },
        { id: 20, name: "썬더 스톰", maxLevel: 10, type: "active", requirements: [{ skillId: 12, level: 4 }] },
    ],

    // ================ 2차 직업: 위자드 (+ 하이위자드 전승) ================
    "위자드": [
        { id: 70, name: "파이어 필라", maxLevel: 10, type: "active", requirements: [{ skillId: 13, level: 5 }] },
        { id: 71, name: "메테오 스톰", maxLevel: 10, type: "active", requirements: [{ skillId: 70, level: 5 }, { skillId: 16, level: 1 }] },
        { id: 72, name: "쥬피터 썬더", maxLevel: 10, type: "active", requirements: [{ skillId: 12, level: 5 }, { skillId: 15, level: 5 }] },
        { id: 73, name: "로드 오브 버밀리온", maxLevel: 10, type: "active", requirements: [{ skillId: 20, level: 5 }, { skillId: 72, level: 5 }] },
        { id: 74, name: "워터 볼", maxLevel: 5, type: "active", requirements: [{ skillId: 10, level: 5 }, { skillId: 12, level: 5 }] },
        { id: 75, name: "아이스 월", maxLevel: 10, type: "active", requirements: [{ skillId: 18, level: 1 }, { skillId: 19, level: 1 }] },
        { id: 76, name: "프로스트 노바", maxLevel: 10, type: "active", requirements: [{ skillId: 75, level: 1 }, { skillId: 19, level: 5 }] },
        { id: 77, name: "스톰 가스트", maxLevel: 10, type: "active", requirements: [{ skillId: 19, level: 1 }, { skillId: 72, level: 3 }] },
        { id: 78, name: "어스 스파이크", maxLevel: 5, type: "active", requirements: [{ skillId: 18, level: 1 }] },
        { id: 79, name: "헤븐스 드라이브", maxLevel: 5, type: "active", requirements: [{ skillId: 78, level: 3 }] },
        { id: 80, name: "퀘이크", maxLevel: 5, type: "active", requirements: [{ skillId: 79, level: 1 }] },
        { id: 81, name: "사이트 블라스터", maxLevel: 1, type: "active", requirements: [{ skillId: 16, level: 1 }] },
        { id: 83, name: "에너지 코트", maxLevel: 5, type: "buff", requirements: [{ skillId: 9, level: 3 }] },
        // 하이위자드 전승
        { id: 365, name: "마직 파워", maxLevel: 10, type: "buff" },
        { id: 366, name: "소울 드레인", maxLevel: 10, type: "passive", requirements: [{ skillId: 14, level: 10 }] },
        { id: 367, name: "그래비테이션 필드", maxLevel: 5, type: "active" },
        { id: 368, name: "나팜 벌컨", maxLevel: 5, type: "active", requirements: [{ skillId: 15, level: 10 }] },
    ],

    // ================ 1차 직업: 궁수 ================
    "궁수": [
        { id: 43, name: "부엉이의 눈", maxLevel: 10, type: "passive" },
        { id: 44, name: "집중력 향상", maxLevel: 10, type: "passive", requirements: [{ skillId: 43, level: 3 }] },
        { id: 45, name: "봉시 가리기", maxLevel: 10, type: "passive" },
        { id: 46, name: "애로우 샤워", maxLevel: 10, type: "active", requirements: [{ skillId: 47, level: 5 }] },
        { id: 47, name: "더블 스트레이핑", maxLevel: 10, type: "active" },
        { id: 48, name: "애로우 크래프팅", maxLevel: 1, type: "active" },
        { id: 147, name: "화살 충전", maxLevel: 1, type: "active" },
    ],

    // ================ 2차 직업: 헌터 (+ 스나이퍼 전승) ================
    "헌터": [
        { id: 115, name: "스키드 트랩", maxLevel: 5, type: "active" },
        { id: 116, name: "랜드 마인", maxLevel: 5, type: "active" },
        { id: 117, name: "앵클 스네어", maxLevel: 5, type: "active", requirements: [{ skillId: 115, level: 1 }] },
        { id: 118, name: "쇼크웨이브 트랩", maxLevel: 5, type: "active", requirements: [{ skillId: 117, level: 1 }] },
        { id: 119, name: "샌드맨", maxLevel: 5, type: "active", requirements: [{ skillId: 120, level: 1 }] },
        { id: 120, name: "플래쉬어", maxLevel: 5, type: "active", requirements: [{ skillId: 115, level: 1 }] },
        { id: 121, name: "프리징 트랩", maxLevel: 5, type: "active", requirements: [{ skillId: 120, level: 1 }] },
        { id: 122, name: "블라스트 마인", maxLevel: 5, type: "active", requirements: [{ skillId: 116, level: 1 }, { skillId: 119, level: 1 }] },
        { id: 123, name: "클레이모어 트랩", maxLevel: 5, type: "active", requirements: [{ skillId: 118, level: 1 }, { skillId: 122, level: 1 }] },
        { id: 124, name: "리무브 트랩", maxLevel: 1, type: "active", requirements: [{ skillId: 116, level: 1 }] },
        { id: 125, name: "탤키 박스", maxLevel: 1, type: "active", requirements: [{ skillId: 124, level: 1 }] },
        { id: 126, name: "비스트 베인", maxLevel: 10, type: "passive" },
        { id: 127, name: "팔콘 마스터리", maxLevel: 1, type: "passive", requirements: [{ skillId: 126, level: 1 }] },
        { id: 128, name: "스틸 크로우", maxLevel: 10, type: "passive", requirements: [{ skillId: 127, level: 1 }] },
        { id: 129, name: "블리츠 비트", maxLevel: 5, type: "active", requirements: [{ skillId: 127, level: 1 }] },
        { id: 130, name: "디텍팅", maxLevel: 4, type: "active", requirements: [{ skillId: 44, level: 1 }] },
        { id: 131, name: "스프링 트랩", maxLevel: 5, type: "active", requirements: [{ skillId: 124, level: 1 }, { skillId: 130, level: 1 }] },
        { id: 132, name: "애로우 레펠", maxLevel: 10, type: "passive" },
        // 스나이퍼 전승
        { id: 377, name: "트루 사이트", maxLevel: 10, type: "buff" },
        { id: 378, name: "팬텀 메나스", maxLevel: 5, type: "active" },
        { id: 379, name: "샤프 슈팅", maxLevel: 5, type: "active", requirements: [{ skillId: 47, level: 10 }] },
        { id: 380, name: "윈드 워크", maxLevel: 10, type: "buff" },
    ],

    // ================ 1차 직업: 복사 ================
    "복사": [
        { id: 21, name: "마인드 브레이커", maxLevel: 1, type: "passive" },
        { id: 23, name: "데몬 베인", maxLevel: 10, type: "passive" },
        { id: 24, name: "힐", maxLevel: 10, type: "active" },
        { id: 25, name: "아쿠아 베네딕타", maxLevel: 1, type: "active" },
        { id: 26, name: "큐어", maxLevel: 1, type: "active" },
        { id: 27, name: "인크리스 아질리티", maxLevel: 10, type: "buff", requirements: [{ skillId: 24, level: 3 }] },
        { id: 28, name: "디크리스 아질리티", maxLevel: 10, type: "active", requirements: [{ skillId: 27, level: 1 }] },
        { id: 29, name: "디바인 프로텍션", maxLevel: 10, type: "passive" },
        { id: 30, name: "블레싱", maxLevel: 10, type: "buff", requirements: [{ skillId: 29, level: 5 }] },
        { id: 31, name: "속성 부여", maxLevel: 1, type: "active" },
        { id: 32, name: "텔레포트", maxLevel: 2, type: "active", requirements: [{ skillId: 21, level: 1 }] },
        { id: 33, name: "워프 포탈", maxLevel: 4, type: "active", requirements: [{ skillId: 32, level: 2 }] },
        { id: 34, name: "뉴마", maxLevel: 1, type: "active", requirements: [{ skillId: 21, level: 1 }] },
    ],

    // ================ 2차 직업: 프리스트 (+ 하이프리스트 전승) ================
    "프리스트": [
        { id: 66, name: "임포시티오 마누스", maxLevel: 5, type: "buff" },
        { id: 67, name: "아스페르시오", maxLevel: 5, type: "buff", requirements: [{ skillId: 25, level: 1 }] },
        { id: 68, name: "성체강림", maxLevel: 5, type: "buff", requirements: [{ skillId: 67, level: 1 }] },
        { id: 69, name: "성역", maxLevel: 10, type: "active", requirements: [{ skillId: 68, level: 3 }] },
        { id: 70, name: "마그니피캇", maxLevel: 5, type: "buff" },
        { id: 71, name: "글로리아", maxLevel: 5, type: "buff", requirements: [{ skillId: 70, level: 3 }] },
        { id: 72, name: "레주렉션", maxLevel: 4, type: "active", requirements: [{ skillId: 27, level: 4 }] },
        { id: 73, name: "턴 언데드", maxLevel: 10, type: "active", requirements: [{ skillId: 72, level: 1 }] },
        { id: 74, name: "매그너스 엑소시즘", maxLevel: 10, type: "active", requirements: [{ skillId: 73, level: 10 }] },
        { id: 75, name: "렉스 디비나", maxLevel: 10, type: "active" },
        { id: 76, name: "렉스 아테나", maxLevel: 5, type: "active", requirements: [{ skillId: 75, level: 3 }] },
        { id: 77, name: "슬로우 포이즌", maxLevel: 4, type: "buff" },
        { id: 78, name: "키리에 엘레이손", maxLevel: 10, type: "buff" },
        { id: 79, name: "리커버리", maxLevel: 1, type: "active" },
        { id: 156, name: "SP회복력 향상", maxLevel: 10, type: "passive" },
        // 하이프리스트 전승
        { id: 361, name: "어섬션", maxLevel: 5, type: "buff", requirements: [{ skillId: 78, level: 3 }] },
        { id: 362, name: "바실리카", maxLevel: 5, type: "active", requirements: [{ skillId: 69, level: 5 }] },
        { id: 363, name: "미라클", maxLevel: 10, type: "buff" },
        { id: 364, name: "메디타티오", maxLevel: 10, type: "buff" },
    ],

    // ================ 2차 직업: 몽크 (+ 챔피언 전승) ================
    "몽크": [
        { id: 259, name: "철손", maxLevel: 10, type: "passive" },
        { id: 260, name: "기공술", maxLevel: 5, type: "active", requirements: [{ skillId: 259, level: 5 }] },
        { id: 261, name: "금강", maxLevel: 5, type: "buff" },
        { id: 262, name: "인내", maxLevel: 10, type: "passive", requirements: [{ skillId: 261, level: 2 }] },
        { id: 263, name: "분노", maxLevel: 5, type: "buff", requirements: [{ skillId: 262, level: 5 }] },
        { id: 264, name: "폭기", maxLevel: 5, type: "buff", requirements: [{ skillId: 260, level: 3 }] },
        { id: 265, name: "잔영", maxLevel: 5, type: "passive", requirements: [{ skillId: 262, level: 5 }] },
        { id: 266, name: "연환 폭기권", maxLevel: 5, type: "active", requirements: [{ skillId: 264, level: 3 }] },
        { id: 267, name: "반탄 공", maxLevel: 5, type: "active", requirements: [{ skillId: 266, level: 3 }] },
        { id: 268, name: "발경", maxLevel: 5, type: "active", requirements: [{ skillId: 263, level: 3 }] },
        { id: 269, name: "아수라 패황권", maxLevel: 5, type: "active", requirements: [{ skillId: 264, level: 4 }, { skillId: 268, level: 3 }] },
        { id: 270, name: "극의 몸", maxLevel: 5, type: "buff", requirements: [{ skillId: 263, level: 5 }, { skillId: 269, level: 3 }] },
        { id: 271, name: "흡기", maxLevel: 1, type: "active", requirements: [{ skillId: 266, level: 1 }] },
        // 챔피언 전승
        { id: 401, name: "진동파", maxLevel: 5, type: "active" },
        { id: 402, name: "염파권", maxLevel: 5, type: "active", requirements: [{ skillId: 268, level: 5 }] },
        { id: 403, name: "신령합일", maxLevel: 1, type: "active", requirements: [{ skillId: 269, level: 5 }] },
        { id: 404, name: "호법", maxLevel: 5, type: "buff" },
    ],

    // ================ 1차 직업: 상인 ================
    "상인": [
        { id: 35, name: "상인 정신", maxLevel: 10, type: "passive" },
        { id: 36, name: "맘모나이트", maxLevel: 10, type: "active" },
        { id: 37, name: "카트 레볼루션", maxLevel: 1, type: "active", requirements: [{ skillId: 41, level: 1 }] },
        { id: 38, name: "아이템 감정", maxLevel: 1, type: "active" },
        { id: 39, name: "오버차지", maxLevel: 10, type: "passive", requirements: [{ skillId: 35, level: 1 }] },
        { id: 40, name: "디스카운트", maxLevel: 10, type: "passive", requirements: [{ skillId: 39, level: 3 }] },
        { id: 41, name: "푸쉬 카트", maxLevel: 10, type: "passive" },
        { id: 42, name: "노점 개설", maxLevel: 1, type: "active", requirements: [{ skillId: 41, level: 3 }] },
        { id: 153, name: "인조 사역마제작", maxLevel: 1, type: "active" },
    ],

    // ================ 2차 직업: 블랙스미스 (+ 화이트스미스 전승) ================
    "블랙스미스": [
        { id: 95, name: "플라멜", maxLevel: 5, type: "active" },
        { id: 96, name: "햄머폴", maxLevel: 5, type: "active" },
        { id: 97, name: "아드레날린 러쉬", maxLevel: 5, type: "buff", requirements: [{ skillId: 96, level: 2 }] },
        { id: 98, name: "웨폰 퍼팩션", maxLevel: 10, type: "buff", requirements: [{ skillId: 95, level: 3 }] },
        { id: 99, name: "오버 트러스트", maxLevel: 5, type: "buff" },
        { id: 100, name: "맥시마이즈 파워", maxLevel: 5, type: "buff", requirements: [{ skillId: 99, level: 2 }] },
        { id: 101, name: "웨폰 리페어", maxLevel: 1, type: "active", requirements: [{ skillId: 98, level: 1 }] },
        { id: 102, name: "무기 강화", maxLevel: 10, type: "active" },
        { id: 103, name: "토마호크 스로잉", maxLevel: 1, type: "active" },
        { id: 104, name: "무기 제작", maxLevel: 3, type: "active" },
        { id: 110, name: "스킨 템퍼링", maxLevel: 5, type: "passive" },
        // 화이트스미스 전승
        { id: 384, name: "카트 부스트", maxLevel: 1, type: "active", requirements: [{ skillId: 37, level: 1 }] },
        { id: 385, name: "풀 아드레날린 러쉬", maxLevel: 5, type: "buff", requirements: [{ skillId: 97, level: 5 }] },
        { id: 386, name: "멜트다운", maxLevel: 10, type: "buff", requirements: [{ skillId: 99, level: 3 }] },
        { id: 387, name: "카트 터미네이션", maxLevel: 10, type: "active", requirements: [{ skillId: 384, level: 1 }] },
        { id: 388, name: "파워 스윙", maxLevel: 5, type: "active", requirements: [{ skillId: 97, level: 1 }] },
    ],

    // ================ 2차 직업: 알케미스트 (+ 크리에이터 전승) ================
    "알케미스트": [
        { id: 225, name: "약물 제조 연구", maxLevel: 10, type: "passive" },
        { id: 226, name: "물약 투척", maxLevel: 5, type: "active", requirements: [{ skillId: 225, level: 5 }] },
        { id: 227, name: "산성 데몬스트레이션", maxLevel: 10, type: "active", requirements: [{ skillId: 225, level: 5 }] },
        { id: 228, name: "바이오 에틱스", maxLevel: 1, type: "passive" },
        { id: 229, name: "콜 호문클러스", maxLevel: 1, type: "active", requirements: [{ skillId: 228, level: 1 }] },
        { id: 230, name: "호문클러스 휴식", maxLevel: 1, type: "active", requirements: [{ skillId: 229, level: 1 }] },
        { id: 231, name: "호문클러스 부활", maxLevel: 5, type: "active", requirements: [{ skillId: 229, level: 1 }] },
        { id: 232, name: "스피어 마스터리", maxLevel: 10, type: "passive" },
        { id: 233, name: "식물 재배", maxLevel: 2, type: "active" },
        { id: 234, name: "스페셜 물약 제조", maxLevel: 5, type: "active", requirements: [{ skillId: 225, level: 5 }] },
        // 크리에이터 전승
        { id: 489, name: "아시드 테러", maxLevel: 10, type: "active", requirements: [{ skillId: 227, level: 5 }] },
        { id: 490, name: "플랜트 컬티베이션", maxLevel: 2, type: "active", requirements: [{ skillId: 233, level: 2 }] },
        { id: 491, name: "호문클러스 강화", maxLevel: 5, type: "active", requirements: [{ skillId: 229, level: 1 }] },
        { id: 492, name: "포트 퓨전", maxLevel: 10, type: "active" },
        { id: 493, name: "플랜트 마인", maxLevel: 5, type: "active", requirements: [{ skillId: 490, level: 1 }] },
    ],

    // ================ 1차 직업: 도둑 ================
    "도둑": [
        { id: 48, name: "더블 어택", maxLevel: 10, type: "passive" },
        { id: 49, name: "회피율 증가", maxLevel: 10, type: "passive" },
        { id: 50, name: "스틸", maxLevel: 10, type: "active" },
        { id: 51, name: "하이딩", maxLevel: 10, type: "active" },
        { id: 52, name: "인베넘", maxLevel: 10, type: "active" },
        { id: 53, name: "해독", maxLevel: 1, type: "active", requirements: [{ skillId: 52, level: 3 }] },
    ],

    // ================ 2차 직업: 어쌔신 (+ 어쌔신크로스 전승) ================
    "어쌔신": [
        { id: 131, name: "클로킹", maxLevel: 10, type: "active", requirements: [{ skillId: 51, level: 2 }] },
        { id: 132, name: "소닉 블로우", maxLevel: 10, type: "active", requirements: [{ skillId: 48, level: 5 }] },
        { id: 133, name: "그림투스", maxLevel: 5, type: "passive", requirements: [{ skillId: 139, level: 4 }] },
        { id: 134, name: "인첸트 포이즌", maxLevel: 10, type: "buff", requirements: [{ skillId: 52, level: 1 }] },
        { id: 135, name: "포이즌 리엑트", maxLevel: 10, type: "active", requirements: [{ skillId: 134, level: 3 }] },
        { id: 136, name: "베놈 더스트", maxLevel: 10, type: "active", requirements: [{ skillId: 134, level: 5 }] },
        { id: 137, name: "베놈 스플래셔", maxLevel: 10, type: "active", requirements: [{ skillId: 136, level: 5 }] },
        { id: 139, name: "카타르 마스터리", maxLevel: 10, type: "passive" },
        { id: 140, name: "소닉 액셀러레이션", maxLevel: 10, type: "passive", requirements: [{ skillId: 132, level: 5 }] },
        { id: 141, name: "좌손 수련", maxLevel: 5, type: "passive", requirements: [{ skillId: 48, level: 5 }] },
        { id: 142, name: "우손 수련", maxLevel: 5, type: "passive", requirements: [{ skillId: 141, level: 2 }] },
        // 어쌔신크로스 전승
        { id: 378, name: "어드밴스드 클로킹", maxLevel: 10, type: "passive", requirements: [{ skillId: 131, level: 3 }] },
        { id: 379, name: "메테오 어썰트", maxLevel: 10, type: "active", requirements: [{ skillId: 132, level: 5 }] },
        { id: 380, name: "소울 디스트로이어", maxLevel: 10, type: "active", requirements: [{ skillId: 134, level: 5 }, { skillId: 132, level: 5 }] },
    ],

    // ================ 2차 직업: 로그 (+ 스토커 전승) ================
    "로그": [
        { id: 137, name: "백스탭", maxLevel: 10, type: "active", requirements: [{ skillId: 51, level: 4 }] },
        { id: 210, name: "스냅", maxLevel: 10, type: "active" },
        { id: 211, name: "터널 드라이브", maxLevel: 5, type: "passive", requirements: [{ skillId: 51, level: 1 }] },
        { id: 212, name: "레이드", maxLevel: 5, type: "active", requirements: [{ skillId: 137, level: 1 }] },
        { id: 213, name: "스트립 웨폰", maxLevel: 5, type: "active" },
        { id: 214, name: "스트립 실드", maxLevel: 5, type: "active" },
        { id: 215, name: "스트립 아머", maxLevel: 5, type: "active" },
        { id: 216, name: "스트립 헬름", maxLevel: 5, type: "active" },
        { id: 217, name: "백슬라이딩", maxLevel: 1, type: "active" },
        { id: 218, name: "갱스터 파라다이스", maxLevel: 1, type: "passive" },
        { id: 219, name: "컴파일스 실프", maxLevel: 5, type: "active", requirements: [{ skillId: 50, level: 1 }] },
        { id: 220, name: "플래그스톤", maxLevel: 1, type: "active" },
        { id: 221, name: "그래피티", maxLevel: 1, type: "active" },
        { id: 222, name: "검 거부", maxLevel: 5, type: "buff", requirements: [{ skillId: 213, level: 5 }] },
        { id: 288, name: "인티미데이트", maxLevel: 5, type: "active" },
        // 스토커 전승
        { id: 389, name: "클로즈 컨파인", maxLevel: 1, type: "active" },
        { id: 390, name: "풀 스트립", maxLevel: 5, type: "active", requirements: [{ skillId: 213, level: 5 }, { skillId: 214, level: 5 }, { skillId: 215, level: 5 }, { skillId: 216, level: 5 }] },
        { id: 391, name: "프리저브", maxLevel: 1, type: "buff" },
        { id: 392, name: "체이스 워크", maxLevel: 5, type: "active", requirements: [{ skillId: 211, level: 3 }] },
        { id: 393, name: "스태글리프", maxLevel: 5, type: "active" },
    ],

    // ================ 확장직업: 태권소년/소녀 ================
    "태권소년": [
        { id: 407, name: "태권 자세", maxLevel: 7, type: "buff" },
        { id: 408, name: "회선해", maxLevel: 7, type: "active" },
        { id: 409, name: "고급 회선해", maxLevel: 7, type: "active", requirements: [{ skillId: 408, level: 1 }] },
        { id: 410, name: "천갑궁", maxLevel: 7, type: "active" },
        { id: 411, name: "뇌각", maxLevel: 7, type: "active" },
        { id: 412, name: "돌려차기", maxLevel: 7, type: "active" },
        { id: 413, name: "내려차기", maxLevel: 7, type: "active" },
        { id: 414, name: "위로 차기", maxLevel: 7, type: "active" },
        { id: 415, name: "뒤후리기", maxLevel: 7, type: "active" },
        { id: 416, name: "날아차기", maxLevel: 7, type: "active" },
        { id: 417, name: "연대팀", maxLevel: 5, type: "passive" },
    ],

    // ================ 확장직업: 권성 (리뉴얼) ================
    "권성": [
        { id: 2554, name: "태양의 무", maxLevel: 1, type: "buff" },
        { id: 2555, name: "달의 무", maxLevel: 1, type: "buff" },
        { id: 2556, name: "별의 무", maxLevel: 1, type: "buff" },
        { id: 2561, name: "온기", maxLevel: 4, type: "active" },
        { id: 2562, name: "냉기", maxLevel: 4, type: "active" },
        { id: 2563, name: "기운 용출", maxLevel: 3, type: "active" },
        { id: 2564, name: "기운 분출", maxLevel: 3, type: "active" },
        { id: 2565, name: "기운 폭발", maxLevel: 3, type: "active" },
        { id: 427, name: "태양과 달과 별의 감정", maxLevel: 10, type: "passive" },
        { id: 444, name: "태양과 달과 별의 기적", maxLevel: 10, type: "passive" },
    ],

    // ================ 확장직업: 닌자 ================
    "닌자": [
        { id: 3001, name: "인술 수련", maxLevel: 10, type: "passive" },
        { id: 3002, name: "표창 수련", maxLevel: 10, type: "passive" },
        { id: 3003, name: "표창 투척", maxLevel: 10, type: "active", requirements: [{ skillId: 3002, level: 1 }] },
        { id: 3004, name: "폭발 쿠나이", maxLevel: 5, type: "active", requirements: [{ skillId: 3003, level: 5 }] },
        { id: 3005, name: "은닉", maxLevel: 10, type: "active", requirements: [{ skillId: 3001, level: 1 }] },
        { id: 3006, name: "그림자 뛰기", maxLevel: 5, type: "active", requirements: [{ skillId: 3005, level: 5 }] },
        { id: 3007, name: "그림자 분신", maxLevel: 10, type: "active", requirements: [{ skillId: 3005, level: 3 }] },
        { id: 3008, name: "바람 베기", maxLevel: 10, type: "active" },
        { id: 3009, name: "불꽃 방사", maxLevel: 10, type: "active" },
        { id: 3010, name: "물의 공격", maxLevel: 10, type: "active" },
        { id: 3011, name: "뇌격파", maxLevel: 5, type: "active", requirements: [{ skillId: 3008, level: 3 }] },
        { id: 3012, name: "얼음의 창", maxLevel: 5, type: "active", requirements: [{ skillId: 3010, level: 3 }] },
        { id: 3013, name: "화염용", maxLevel: 5, type: "active", requirements: [{ skillId: 3009, level: 3 }] },
    ],

    // ================ 확장직업: 건슬링거 ================
    "건슬링거": [
        { id: 2001, name: "플립 더 코인", maxLevel: 5, type: "active" },
        { id: 2002, name: "인크리징 어큐러시", maxLevel: 1, type: "buff", requirements: [{ skillId: 2001, level: 1 }] },
        { id: 2003, name: "매드니스 캔슬러", maxLevel: 1, type: "buff", requirements: [{ skillId: 2002, level: 1 }] },
        { id: 2004, name: "스네이크 아이", maxLevel: 10, type: "passive" },
        { id: 2005, name: "체인 액션", maxLevel: 10, type: "passive" },
        { id: 2006, name: "래피드 샤워", maxLevel: 10, type: "active", requirements: [{ skillId: 2005, level: 3 }] },
        { id: 2007, name: "디스펠러", maxLevel: 10, type: "active" },
        { id: 2008, name: "트래킹", maxLevel: 10, type: "active" },
        { id: 2009, name: "풀 버스터", maxLevel: 10, type: "active", requirements: [{ skillId: 2008, level: 5 }] },
        { id: 2010, name: "스프레드 어택", maxLevel: 10, type: "active" },
        { id: 2011, name: "트리플 액션", maxLevel: 1, type: "passive", requirements: [{ skillId: 2005, level: 1 }] },
        { id: 2012, name: "불스 아이", maxLevel: 1, type: "active", requirements: [{ skillId: 2008, level: 10 }] },
    ],

    // ================ 확장직업: 소환사 (도람족) ================
    "소환사": [
        { id: 5001, name: "도람 기본기", maxLevel: 3, type: "passive" },
        { id: 5002, name: "털뭉치 공격", maxLevel: 5, type: "active" },
        { id: 5003, name: "캣 클로", maxLevel: 5, type: "active" },
        { id: 5004, name: "매혹의 눈빛", maxLevel: 5, type: "active" },
        { id: 5005, name: "보온 털", maxLevel: 5, type: "buff" },
        { id: 5006, name: "낮잠", maxLevel: 5, type: "buff" },
        { id: 5007, name: "귀여운 미끼", maxLevel: 5, type: "active" },
        { id: 5008, name: "태양의 축복", maxLevel: 5, type: "buff" },
        { id: 5009, name: "달의 축복", maxLevel: 5, type: "buff" },
        { id: 5010, name: "별자리의 축복", maxLevel: 5, type: "buff" },
        { id: 5011, name: "대지의 샤쿠", maxLevel: 5, type: "active" },
        { id: 5012, name: "카라멜라이즈", maxLevel: 5, type: "active" },
        { id: 5013, name: "채집 수련", maxLevel: 5, type: "passive" },
    ],

    // ================ 확장직업: 권성 ================
    "권성": [
        { id: 418, name: "태양의 무", maxLevel: 1, type: "active" },
        { id: 419, name: "달의 무", maxLevel: 1, type: "active" },
        { id: 420, name: "별의 무", maxLevel: 1, type: "active" },
        { id: 421, name: "온기", maxLevel: 4, type: "buff" },
        { id: 422, name: "냉기", maxLevel: 4, type: "buff" },
        { id: 423, name: "기운 용출", maxLevel: 3, type: "buff" },
        { id: 424, name: "기운 분출", maxLevel: 3, type: "buff" },
        { id: 425, name: "기운 폭발", maxLevel: 3, type: "active" },
        { id: 426, name: "태양과 달과 별의 감정", maxLevel: 9, type: "buff" },
        { id: 427, name: "태양과 달과 별의 기적", maxLevel: 10, type: "active" },
    ],

    // ================ 확장직업: 소울링커 ================
    "소울링커": [
        { id: 428, name: "카이텔", maxLevel: 7, type: "buff" },
        { id: 429, name: "카웁", maxLevel: 7, type: "buff" },
        { id: 430, name: "카이나", maxLevel: 7, type: "buff" },
        { id: 431, name: "소울 링크", maxLevel: 5, type: "buff" },
        { id: 432, name: "에스마", maxLevel: 10, type: "active" },
        { id: 433, name: "에스틴", maxLevel: 7, type: "active" },
        { id: 434, name: "에스프", maxLevel: 7, type: "active" },
        { id: 435, name: "에스피", maxLevel: 7, type: "active" },
        { id: 436, name: "에스코르", maxLevel: 7, type: "active" },
        { id: 437, name: "에스쿠라", maxLevel: 7, type: "active" },
    ],

    // ================ 확장직업: 리베리온 ================
    "리베리온": [
        { id: 2030, name: "플래티넘 얼터", maxLevel: 5, type: "buff" },
        { id: 2031, name: "라운드 트립", maxLevel: 5, type: "active" },
        { id: 2032, name: "파이어 레인", maxLevel: 5, type: "active" },
        { id: 2033, name: "셰터 스톰", maxLevel: 5, type: "active" },
        { id: 2034, name: "밴디쉬먼트", maxLevel: 5, type: "active" },
        { id: 2035, name: "바인드 트랩", maxLevel: 5, type: "active" },
        { id: 2036, name: "히트 배럴", maxLevel: 5, type: "buff" },
        { id: 2037, name: "매스 스파이럴", maxLevel: 5, type: "active" },
        { id: 2038, name: "안티 머테리얼 블라스트", maxLevel: 5, type: "active" },
        { id: 2039, name: "해머 오브 갓", maxLevel: 5, type: "active" },
    ],

    // ================ 확장직업: 카게로우/오보로 ================
    "카게로우": [
        { id: 3020, name: "십자 참격", maxLevel: 10, type: "active" },
        { id: 3021, name: "오오카미요", maxLevel: 5, type: "active" },
        { id: 3022, name: "구름 가린 달", maxLevel: 5, type: "buff" },
        { id: 3023, name: "밤안개", maxLevel: 5, type: "active" },
        { id: 3024, name: "순간 이동술", maxLevel: 1, type: "active" },
        { id: 3025, name: "무혈참격", maxLevel: 5, type: "active" },
        { id: 3026, name: "회광반조", maxLevel: 5, type: "active" },
        { id: 3027, name: "저주의 몸", maxLevel: 5, type: "buff" },
        { id: 3028, name: "그림자 전사", maxLevel: 5, type: "buff" },
        { id: 3029, name: "꼭두각시 술법", maxLevel: 5, type: "active" },
    ],

    // ================ 3차 직업: 룬나이트 ================
    "룬나이트": [
        { id: 2001, name: "엔첸트 블레이드", maxLevel: 10, type: "buff" },
        { id: 2002, name: "소닉 웨이브", maxLevel: 10, type: "active" },
        { id: 2003, name: "데스 바운드", maxLevel: 10, type: "active" },
        { id: 2004, name: "헌드레드 스피어", maxLevel: 10, type: "active" },
        { id: 2005, name: "윈드 커터", maxLevel: 5, type: "active" },
        { id: 2006, name: "이그니션 브레이크", maxLevel: 5, type: "active" },
        { id: 2007, name: "드래곤 트레이닝", maxLevel: 5, type: "passive" },
        { id: 2008, name: "드래곤 브레스", maxLevel: 10, type: "active" },
        { id: 2009, name: "드래곤 하울링", maxLevel: 5, type: "buff" },
        { id: 2010, name: "룬 마스터리", maxLevel: 10, type: "passive" },
        { id: 2020, name: "팬텀 스러스트", maxLevel: 5, type: "active" },
        { id: 5004, name: "드래곤 브레스 워터", maxLevel: 10, type: "active" },
        { id: 5014, name: "풀 스로틀", maxLevel: 5, type: "buff" },
    ],

    // ================ 3차 직업: 로열가드 ================
    "로열가드": [
        { id: 2307, name: "캐논 스피어", maxLevel: 5, type: "active" },
        { id: 2308, name: "배니싱 포인트", maxLevel: 10, type: "active" },
        { id: 2310, name: "쉴드 프레스", maxLevel: 5, type: "active" },
        { id: 2311, name: "핀포인트 어택", maxLevel: 5, type: "active" },
        { id: 2313, name: "포스 오브 뱅가드", maxLevel: 5, type: "buff" },
        { id: 2317, name: "오버브랜드", maxLevel: 5, type: "active" },
        { id: 2318, name: "프레시지오", maxLevel: 5, type: "buff" },
        { id: 2320, name: "문 슬래셔", maxLevel: 5, type: "active" },
        { id: 2321, name: "레이 오브 제네시스", maxLevel: 5, type: "active" },
        { id: 2323, name: "어스 드라이브", maxLevel: 5, type: "active" },
        { id: 2324, name: "반스 오브 가드", maxLevel: 5, type: "buff" },
        { id: 2325, name: "인스피라시오", maxLevel: 5, type: "buff" },
        { id: 2326, name: "베르투스 마그나", maxLevel: 5, type: "buff" },
        { id: 5014, name: "풀 스로틀", maxLevel: 5, type: "buff" },
    ],

    // ================ 3차 직업: 워록 ================
    "워록": [
        { id: 2201, name: "화이트 임프리즌", maxLevel: 5, type: "active" },
        { id: 2202, name: "소울 익스펜션", maxLevel: 5, type: "active" },
        { id: 2203, name: "프로스트 미스티", maxLevel: 5, type: "active" },
        { id: 2204, name: "잭 프로스트", maxLevel: 5, type: "active" },
        { id: 2205, name: "마쉬 오브 어비스", maxLevel: 5, type: "active" },
        { id: 2206, name: "리코그나이즈드 스펠", maxLevel: 5, type: "buff" },
        { id: 2207, name: "시에나 엑서크레이트", maxLevel: 5, type: "active" },
        { id: 2208, name: "라디어스", maxLevel: 3, type: "passive" },
        { id: 2209, name: "스테이시스", maxLevel: 5, type: "active" },
        { id: 2210, name: "드레인 라이프", maxLevel: 10, type: "active" },
        { id: 2211, name: "크림슨 록", maxLevel: 5, type: "active" },
        { id: 2212, name: "헬 인페르노", maxLevel: 5, type: "active" },
        { id: 2213, name: "코멧", maxLevel: 5, type: "active" },
        { id: 2214, name: "체인 라이트닝", maxLevel: 5, type: "active" },
        { id: 2216, name: "어스 스트레인", maxLevel: 5, type: "active" },
        { id: 2217, name: "테트라 볼텍스", maxLevel: 10, type: "active" },
        { id: 2230, name: "릴리스", maxLevel: 2, type: "active" },
        { id: 2231, name: "리딩 스펠북", maxLevel: 1, type: "active" },
        { id: 5014, name: "풀 스로틀", maxLevel: 5, type: "buff" },
    ],

    // ================ 3차 직업: 소서러 ================
    "소서러": [
        { id: 2444, name: "서먼 아그니", maxLevel: 3, type: "active" },
        { id: 2445, name: "스펠 피스트", maxLevel: 10, type: "active" },
        { id: 2446, name: "어스 그레이브", maxLevel: 5, type: "active" },
        { id: 2447, name: "다이아몬드 더스트", maxLevel: 5, type: "active" },
        { id: 2448, name: "포이즌 버스터", maxLevel: 5, type: "active" },
        { id: 2449, name: "사이킥 웨이브", maxLevel: 5, type: "active" },
        { id: 2450, name: "클라우드 킬", maxLevel: 5, type: "active" },
        { id: 2451, name: "스트라이킹", maxLevel: 5, type: "buff" },
        { id: 2452, name: "워머", maxLevel: 5, type: "active" },
        { id: 2453, name: "바쿰 엑스트림", maxLevel: 5, type: "active" },
        { id: 2454, name: "바레티르 스피어", maxLevel: 10, type: "active" },
        { id: 2455, name: "아를로", maxLevel: 5, type: "active" },
        { id: 2458, name: "서먼 아쿠아", maxLevel: 3, type: "active" },
        { id: 2459, name: "서먼 벤투스", maxLevel: 3, type: "active" },
        { id: 2460, name: "서먼 테라", maxLevel: 3, type: "active" },
        { id: 2463, name: "정령의 교감", maxLevel: 5, type: "passive" },
        { id: 2464, name: "정령 치유", maxLevel: 1, type: "active" },
        { id: 2465, name: "화염의 문장", maxLevel: 3, type: "active" },
        { id: 2466, name: "수해의 문장", maxLevel: 3, type: "active" },
        { id: 2467, name: "풍해의 문장", maxLevel: 3, type: "active" },
        { id: 2468, name: "지해의 문장", maxLevel: 3, type: "active" },
        { id: 5008, name: "엘리멘탈 실드", maxLevel: 5, type: "active" },
        { id: 5014, name: "풀 스로틀", maxLevel: 5, type: "buff" },
    ],

    // ================ 3차 직업: 레인저 ================
    "레인저": [
        { id: 2233, name: "애로우 스톰", maxLevel: 10, type: "active" },
        { id: 2234, name: "피어 브리즈", maxLevel: 5, type: "passive" },
        { id: 2235, name: "레인저 메인", maxLevel: 1, type: "passive" },
        { id: 2236, name: "에임드 볼트", maxLevel: 10, type: "active" },
        { id: 2237, name: "디토네이터", maxLevel: 1, type: "active" },
        { id: 2238, name: "일렉트릭 쇼커", maxLevel: 5, type: "active" },
        { id: 2239, name: "클러스터 밤", maxLevel: 5, type: "active" },
        { id: 2240, name: "워그 마스터리", maxLevel: 1, type: "passive" },
        { id: 2241, name: "워그 라이더", maxLevel: 3, type: "buff" },
        { id: 2242, name: "워그 바이트", maxLevel: 5, type: "active" },
        { id: 2243, name: "워그 스트라이크", maxLevel: 5, type: "active" },
        { id: 2244, name: "워그 대쉬", maxLevel: 1, type: "active" },
        { id: 2245, name: "투스 오브 워그", maxLevel: 10, type: "passive" },
        { id: 2246, name: "예민한 후각", maxLevel: 5, type: "active" },
        { id: 2247, name: "카무플라쥬", maxLevel: 1, type: "buff" },
        { id: 2248, name: "트랩 연구", maxLevel: 10, type: "passive" },
        { id: 2249, name: "마젠타 트랩", maxLevel: 1, type: "active" },
        { id: 2250, name: "코발트 트랩", maxLevel: 1, type: "active" },
        { id: 2251, name: "메이즈 트랩", maxLevel: 1, type: "active" },
        { id: 2252, name: "버듀어 트랩", maxLevel: 1, type: "active" },
        { id: 2253, name: "파이어링 트랩", maxLevel: 5, type: "active" },
        { id: 2254, name: "아이스 트랩", maxLevel: 5, type: "active" },
        { id: 5014, name: "풀 스로틀", maxLevel: 5, type: "buff" },
    ],

    // ================ 3차 직업: 아크비숍 ================
    "아크비숍": [
        { id: 2038, name: "쥬덱스", maxLevel: 10, type: "active" },
        { id: 2039, name: "안실라", maxLevel: 1, type: "active" },
        { id: 2040, name: "아도라무스", maxLevel: 10, type: "active" },
        { id: 2041, name: "클레멘티아", maxLevel: 3, type: "buff" },
        { id: 2042, name: "칸토캔디두스", maxLevel: 3, type: "buff" },
        { id: 2043, name: "콜루세오 힐", maxLevel: 5, type: "active" },
        { id: 2044, name: "에피클레시스", maxLevel: 5, type: "active" },
        { id: 2045, name: "프라에파티오", maxLevel: 10, type: "buff" },
        { id: 2046, name: "오라티오", maxLevel: 10, type: "active" },
        { id: 2047, name: "라우다 아그누스", maxLevel: 4, type: "active" },
        { id: 2048, name: "라우다 라무스", maxLevel: 4, type: "active" },
        { id: 2049, name: "에우카리스티카", maxLevel: 10, type: "passive" },
        { id: 2050, name: "레노바티오", maxLevel: 1, type: "buff" },
        { id: 2051, name: "하이네스 힐", maxLevel: 5, type: "active" },
        { id: 2052, name: "클리어런스", maxLevel: 5, type: "active" },
        { id: 2053, name: "엑스피아티오", maxLevel: 5, type: "buff" },
        { id: 2054, name: "듀플레 라이트", maxLevel: 10, type: "active" },
        { id: 2515, name: "사크라멘트", maxLevel: 5, type: "buff" },
        { id: 2057, name: "실렌티움", maxLevel: 5, type: "active" },
        { id: 5014, name: "풀 스로틀", maxLevel: 5, type: "buff" },
    ],

    // ================ 3차 직업: 수라 ================
    "수라": [
        { id: 2327, name: "천라지망", maxLevel: 10, type: "active" },
        { id: 2328, name: "지뢰진", maxLevel: 5, type: "active" },
        { id: 2329, name: "대전붕추", maxLevel: 10, type: "active" },
        { id: 2330, name: "호포", maxLevel: 10, type: "active" },
        { id: 2332, name: "폭기산탄", maxLevel: 5, type: "active" },
        { id: 2333, name: "파쇄주", maxLevel: 5, type: "active" },
        { id: 2334, name: "주박진", maxLevel: 5, type: "active" },
        { id: 2335, name: "섬전보", maxLevel: 5, type: "active" },
        { id: 2336, name: "수라신탄", maxLevel: 10, type: "active" },
        { id: 2337, name: "선풍퇴", maxLevel: 1, type: "active" },
        { id: 2338, name: "잠룡승천", maxLevel: 10, type: "buff" },
        { id: 2341, name: "전기주입", maxLevel: 1, type: "active" },
        { id: 2343, name: "나찰파황격", maxLevel: 10, type: "active" },
        { id: 2344, name: "점혈-묵", maxLevel: 5, type: "active" },
        { id: 2345, name: "점혈-반", maxLevel: 5, type: "active" },
        { id: 2346, name: "점혈-구", maxLevel: 5, type: "active" },
        { id: 2347, name: "점혈-쾌", maxLevel: 5, type: "active" },
        { id: 2348, name: "점혈-활", maxLevel: 5, type: "active" },
        { id: 2517, name: "사자후", maxLevel: 10, type: "active" },
        { id: 5009, name: "섬광연격", maxLevel: 5, type: "active" },
        { id: 5014, name: "풀 스로틀", maxLevel: 5, type: "buff" },
    ],

    // ================ 3차 직업: 미케닉 ================
    "미케닉": [
        { id: 2255, name: "마도기어 라이센스", maxLevel: 5, type: "passive" },
        { id: 2256, name: "부스트 너클", maxLevel: 5, type: "active" },
        { id: 2257, name: "파일 벙커", maxLevel: 3, type: "active" },
        { id: 2258, name: "발칸 암", maxLevel: 3, type: "active" },
        { id: 2259, name: "플레어 런처", maxLevel: 3, type: "active" },
        { id: 2260, name: "콜드 슬로어", maxLevel: 3, type: "active" },
        { id: 2261, name: "암 캐논", maxLevel: 5, type: "active" },
        { id: 2262, name: "액셀러레이션", maxLevel: 3, type: "buff" },
        { id: 2263, name: "호버링", maxLevel: 1, type: "buff" },
        { id: 2264, name: "프런트 사이드 슬라이드", maxLevel: 1, type: "active" },
        { id: 2265, name: "백 사이드 슬라이드", maxLevel: 1, type: "active" },
        { id: 2266, name: "메인 프레임 개조", maxLevel: 4, type: "passive" },
        { id: 2267, name: "셀프 디스트럭션", maxLevel: 3, type: "active" },
        { id: 2268, name: "쉐이프 시프트", maxLevel: 4, type: "buff" },
        { id: 2269, name: "이머전시 쿨", maxLevel: 1, type: "active" },
        { id: 2270, name: "인프라레드 스캔", maxLevel: 1, type: "active" },
        { id: 2271, name: "분석", maxLevel: 3, type: "active" },
        { id: 2272, name: "마그네틱 필드", maxLevel: 3, type: "active" },
        { id: 2273, name: "뉴트럴 배리어", maxLevel: 3, type: "buff" },
        { id: 2275, name: "리페어", maxLevel: 5, type: "active" },
        { id: 2278, name: "액스 부메랑", maxLevel: 5, type: "active" },
        { id: 2279, name: "파워 스윙", maxLevel: 10, type: "active" },
        { id: 2280, name: "액스 토네이도", maxLevel: 5, type: "active" },
        { id: 2281, name: "FAW 실버 스나이퍼", maxLevel: 5, type: "active" },
        { id: 2282, name: "FAW 매직 데코이", maxLevel: 5, type: "active" },
        { id: 5006, name: "라바 플로우", maxLevel: 5, type: "active" },
        { id: 5014, name: "풀 스로틀", maxLevel: 5, type: "buff" },
    ],

    // ================ 3차 직업: 제네릭 ================
    "제네릭": [
        { id: 2475, name: "카트 개조", maxLevel: 5, type: "passive" },
        { id: 2476, name: "카트 토네이도", maxLevel: 5, type: "active" },
        { id: 2477, name: "카트 캐논", maxLevel: 5, type: "active" },
        { id: 2478, name: "카트 부스트", maxLevel: 5, type: "buff" },
        { id: 2479, name: "가시나무 덫", maxLevel: 5, type: "active" },
        { id: 2480, name: "블러드 서커", maxLevel: 5, type: "active" },
        { id: 2481, name: "스포어 익스플로젼", maxLevel: 5, type: "active" },
        { id: 2482, name: "월 오브 쏜", maxLevel: 5, type: "active" },
        { id: 2483, name: "크레이지 위드", maxLevel: 10, type: "active" },
        { id: 2485, name: "데모닉 파이어", maxLevel: 5, type: "active" },
        { id: 2486, name: "파이어 익스팬션", maxLevel: 5, type: "active" },
        { id: 2490, name: "헬 플랜트", maxLevel: 5, type: "active" },
        { id: 2492, name: "만드라고라의 고함", maxLevel: 5, type: "active" },
        { id: 2493, name: "슬링 아이템", maxLevel: 1, type: "active" },
        { id: 2494, name: "체인지 머트리얼", maxLevel: 1, type: "active" },
        { id: 2495, name: "믹스 쿠킹", maxLevel: 2, type: "active" },
        { id: 2496, name: "크리에이트 봄", maxLevel: 2, type: "active" },
        { id: 2497, name: "스페셜 파머시", maxLevel: 10, type: "active" },
        { id: 5014, name: "풀 스로틀", maxLevel: 5, type: "buff" },
    ],


    // ================ 3차 직업: 길로틴크로스 ================
    "길로틴크로스": [
        { id: 2021, name: "베놈 임프레스", maxLevel: 5, type: "active" },
        { id: 2022, name: "크로스 임팩트", maxLevel: 5, type: "active" },
        { id: 2023, name: "다크 일루젼", maxLevel: 5, type: "active" },
        { id: 2024, name: "새로운 독 연구", maxLevel: 10, type: "passive" },
        { id: 2025, name: "새로운 독 제조", maxLevel: 1, type: "active" },
        { id: 2026, name: "안티 도트", maxLevel: 1, type: "active" },
        { id: 2027, name: "포이즈닝 웨폰", maxLevel: 5, type: "buff" },
        { id: 2028, name: "웨폰 블로킹", maxLevel: 5, type: "buff" },
        { id: 2029, name: "카운터 슬래쉬", maxLevel: 5, type: "active" },
        { id: 2030, name: "웨폰 크러쉬", maxLevel: 5, type: "active" },
        { id: 2031, name: "베놈 프레셔", maxLevel: 5, type: "active" },
        { id: 2032, name: "포이즌 스모크", maxLevel: 5, type: "active" },
        { id: 2033, name: "클로킹 익시드", maxLevel: 5, type: "buff" },
        { id: 2034, name: "팬텀 메나스", maxLevel: 5, type: "active" },
        { id: 2035, name: "할루시네이션 워크", maxLevel: 5, type: "buff" },
        { id: 2036, name: "롤링 커터", maxLevel: 5, type: "active" },
        { id: 2037, name: "크로스 리퍼 슬래셔", maxLevel: 5, type: "active" },
        { id: 5001, name: "검은 손톱", maxLevel: 5, type: "active" },
        { id: 5014, name: "풀 스로틀", maxLevel: 5, type: "buff" },
    ],

    // ================ 3차 직업: 쉐도우체이서 ================
    "쉐도우체이서": [
        { id: 2284, name: "페이탈 메나스", maxLevel: 10, type: "active" },
        { id: 2285, name: "리프로듀스", maxLevel: 10, type: "buff" },
        { id: 2286, name: "오토 섀도우 스펠", maxLevel: 10, type: "buff" },
        { id: 2287, name: "섀도우 폼", maxLevel: 5, type: "buff" },
        { id: 2288, name: "트라이앵글 샷", maxLevel: 10, type: "active" },
        { id: 2290, name: "인비지빌리티", maxLevel: 5, type: "buff" },
        { id: 2297, name: "스트립 악세서리", maxLevel: 5, type: "active" },
        { id: 2299, name: "맨홀", maxLevel: 3, type: "active" },
        { id: 2300, name: "디멘션 도어", maxLevel: 3, type: "active" },
        { id: 2301, name: "카오스 패닉", maxLevel: 3, type: "active" },
        { id: 2302, name: "블러디 러스트", maxLevel: 3, type: "active" },
        { id: 2304, name: "페인트 봄", maxLevel: 5, type: "active" },
        { id: 2305, name: "마스커레이드: 이그노어런스", maxLevel: 3, type: "active" },
        { id: 2306, name: "마스커레이드: 위크니스", maxLevel: 3, type: "active" },
        { id: 2309, name: "마스커레이드: 글루미", maxLevel: 3, type: "active" },
        { id: 5014, name: "풀 스로틀", maxLevel: 5, type: "buff" },
    ],

    // ================ 3차 직업: 민스트럴 ================
    "민스트럴": [
        { id: 2381, name: "풍차를 향해 돌격", maxLevel: 5, type: "buff" },
        { id: 2382, name: "에코의 노래", maxLevel: 5, type: "buff" },
        { id: 2383, name: "하모나이즈", maxLevel: 5, type: "active" },
        { id: 2412, name: "레슨", maxLevel: 10, type: "passive" },
        { id: 2413, name: "메탈릭 사운드", maxLevel: 5, type: "active" },
        { id: 2414, name: "진동의 잔향", maxLevel: 5, type: "active" },
        { id: 2418, name: "서비어 레인스톰", maxLevel: 5, type: "active" },
        { id: 2422, name: "깊은 잠의 자장가", maxLevel: 5, type: "active" },
        { id: 2423, name: "서클 오브 네이쳐", maxLevel: 5, type: "active" },
        { id: 2426, name: "그레이트 에코", maxLevel: 5, type: "active" },
        { id: 2432, name: "전율의 멜로디", maxLevel: 5, type: "active" },
        { id: 2433, name: "비운의 노래", maxLevel: 5, type: "active" },
        { id: 5007, name: "프리그의 노래", maxLevel: 5, type: "buff" },
        { id: 5014, name: "풀 스로틀", maxLevel: 5, type: "buff" },
    ],

    // ================ 3차 직업: 원더러 ================
    "원더러": [
        { id: 2350, name: "스윙 댄스", maxLevel: 5, type: "buff" },
        { id: 2351, name: "연인들을 위한 심포니", maxLevel: 5, type: "buff" },
        { id: 2352, name: "달빛의 세레나데", maxLevel: 5, type: "buff" },
        { id: 2412, name: "레슨", maxLevel: 10, type: "passive" },
        { id: 2413, name: "메탈릭 사운드", maxLevel: 5, type: "active" },
        { id: 2414, name: "진동의 잔향", maxLevel: 5, type: "active" },
        { id: 2418, name: "서비어 레인스톰", maxLevel: 5, type: "active" },
        { id: 2422, name: "깊은 잠의 자장가", maxLevel: 5, type: "active" },
        { id: 2423, name: "서클 오브 네이쳐", maxLevel: 5, type: "active" },
        { id: 2425, name: "글루미 샤이니스", maxLevel: 5, type: "active" },
        { id: 2426, name: "그레이트 에코", maxLevel: 5, type: "active" },
        { id: 2432, name: "전율의 멜로디", maxLevel: 5, type: "active" },
        { id: 2433, name: "비운의 노래", maxLevel: 5, type: "active" },
        { id: 5007, name: "프리그의 노래", maxLevel: 5, type: "buff" },
        { id: 5014, name: "풀 스로틀", maxLevel: 5, type: "buff" },
    ],
};

// UI용 직업 트리 구조 (아이콘 포함)
export const JOB_TREE_UI = {
    "검사계열": [
        { name: "나이트 계열", steps: ["노비스", "검사", "기사", "룬나이트", "드래곤나이트"], icon: "swords" },
        { name: "크루세이더 계열", steps: ["노비스", "검사", "크루세이더", "로열가드", "임페리얼가드"], icon: "shield" },
    ],
    "마법사계열": [
        { name: "위자드 계열", steps: ["노비스", "마법사", "위자드", "워록", "아크메이지"], icon: "flame" },
        { name: "세이지 계열", steps: ["노비스", "마법사", "세이지", "소서러", "엘레멘탈마스터"], icon: "book" },
    ],
    "궁수계열": [
        { name: "헌터 계열", steps: ["노비스", "궁수", "헌터", "레인저", "윈드호크"], icon: "crosshair" },
        { name: "바드 계열", steps: ["노비스", "궁수", "바드", "민스트럴", "트루바두르"], icon: "music" },
        { name: "댄서 계열", steps: ["노비스", "궁수", "댄서", "원더러", "트루베르"], icon: "music" },
    ],
    "복사계열": [
        { name: "프리스트 계열", steps: ["노비스", "복사", "프리스트", "아크비숍", "카디날"], icon: "cross" },
        { name: "몽크 계열", steps: ["노비스", "복사", "몽크", "수라", "인퀴지터"], icon: "zap" },
    ],
    "상인계열": [
        { name: "블랙스미스 계열", steps: ["노비스", "상인", "블랙스미스", "미케닉", "마이스터"], icon: "hammer" },
        { name: "알케미스트 계열", steps: ["노비스", "상인", "알케미스트", "제네릭", "바이올로"], icon: "beaker" },
    ],
    "도둑계열": [
        { name: "어쌔신 계열", steps: ["노비스", "도둑", "어쌔신", "길로틴크로스", "쉐도우크로스"], icon: "skull" },
        { name: "로그 계열", steps: ["노비스", "도둑", "로그", "쉐도우체이서", "어비스체이서"], icon: "message" },
    ],
    "확장직업": [
        { name: "태권소년 계열", steps: ["태권소년", "권성", "성제"], icon: "star" },
        { name: "소울링커 계열", steps: ["태권소년", "소울링커", "소울리퍼"], icon: "sparkles" },
        { name: "닌자 계열", steps: ["닌자", "카게로우", "시라누이"], icon: "wind" },
        { name: "건슬링거 계열", steps: ["건슬링거", "리베리온", "나이트워치"], icon: "target" },
        { name: "도람족 계열", steps: ["소환사", "혼령사"], icon: "cat" },
    ],
};

