# 시뮬레이터 데이터 백로그

## 목표
시뮬레이터를 "보이는 UI" 단계에서 끝내지 않고, 실제 계산이 가능한 제품으로 올리기 위한 작업 목록이다.

핵심 방향은 아래 3가지다.

1. 직업별 데미지 공식을 먼저 고정한다.
2. 장비 옵션을 사람이 읽는 설명이 아니라 계산 가능한 구조로 저장한다.
3. 스킬 퍼센트/타수/조건부 계수를 백엔드와 프론트에서 같은 기준으로 읽는다.

## 현재 확인된 상태

### 프론트
- `frontend/components/Simulator.tsx`
  - MVP 안내와 기본 물리 계산 엔진 연결 완료
  - 아직 실제 직업 공식/세트 효과/조건부 옵션은 부족함
- `frontend/components/DamageCalculator.tsx`
  - 장비/스킬/옵션 UI는 있으나 계산식이 분산돼 있음
  - `parsedData`, `parsedStats`, 수동 파싱 로직이 섞여 있음

### 백엔드
- `backend/src/main/java/com/ragnarok/ragspringbackend/entity/Skill.java`
  - 현재 저장 컬럼: 영문명, 한글명, 최대레벨, 데미지 퍼센트, 타수
- `backend/src/main/java/com/ragnarok/ragspringbackend/controller/SkillController.java`
  - 현재 컨트롤러가 주석 처리되어 있어 실서비스 API로는 비활성 상태
- `backend/src/main/java/com/ragnarok/ragspringbackend/service/SkillService.java`
  - 스킬 조회/검색 로직은 있으나 서비스 어노테이션이 꺼져 있음

## 1단계. 공식 고정

### 우선 직업
- 룬 나이트
- 아크 메이지

### 먼저 정해야 할 것
- 기본 공격력 산식
- 무기 ATK 반영 방식
- 크리티컬 배율
- 방어력/방무 반영 방식
- 스킬 퍼센트와 타수 적용 순서
- 원거리/근거리/보스/종족/크기 증뎀 반영 순서

### 산출물
- `docs/SIMULATOR_FORMULAS.md`
- 직업별 계산 함수

## 2단계. 장비 옵션 구조화

### 필요한 속성
- 기본 ATK / MATK
- STR / AGI / VIT / INT / DEX / LUK
- POW / STA / WIS / SPL / CON / CRT
- 근거리 증뎀 / 원거리 증뎀
- 보스 / 종족 / 크기 / 속성 증뎀
- 크리티컬 데미지
- 방무
- 스킬별 데미지 증가
- 제련 보너스
- 등급 보너스
- 세트 효과

### 정리 방향
- 설명문 파싱 의존도를 줄이고 `parsedData`를 기준 구조로 본다.
- `parsedStats`는 호환 계층으로만 남긴다.
- 조건부 효과는 `condition` 필드로 분리한다.

## 3단계. 스킬 데이터 확장

### 현재 부족한 것
- 속성
- 공격 타입(물리/마법)
- 단일/범위 구분
- 고정 타수 여부
- 직업 구분
- 스킬 레벨별 계수
- 추가 조건(버프, 스택, 장비 연동)

### 목표 스키마
- 영문 키
- 한글 이름
- 직업
- 최대 레벨
- 기본 퍼센트
- 레벨별 퍼센트
- 타수
- 공격 타입
- 속성
- 비고

## 바로 할 작업

1. `DamageCalculator.tsx`의 계산식과 `simulatorEngine.ts`를 합친다.
2. 스킬 API를 재활성화할지, 프론트 고정 데이터로 먼저 갈지 결정한다.
3. 룬 나이트 1개 스킬, 아크 메이지 1개 스킬을 기준 샘플로 완성한다.
4. 인기 장비 20개 정도의 `parsedData`를 검수해서 계산 가능한지 확인한다.
