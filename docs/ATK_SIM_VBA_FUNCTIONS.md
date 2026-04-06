# KRO ATK 시뮬 VBA 추출 메모

## 상태
- 변환한 `Kro_ATK_Damage_Calc_Ver9.xlsx` 에는 일반 시트와 수식은 남아 있다.
- 하지만 `vbaProject.bin` 이 없어서 매크로 본체는 사라졌다.
- 따라서 매크로 로직은 반드시 원본 `Kro_ATK_Damage_Calc_Ver9.001.xls` 를 기준으로 본다.

## 확인 방법
- `oletools.olevba` 로 원본 `.xls` 에서 VBA를 직접 추출했다.
- 지금부터는 `xlsx` 양식 + `xls` VBA 로직을 같이 참고하면 된다.

## 현재 프로젝트에 바로 도움 되는 핵심 VBA 함수

### 1. 크기 패널티
`fnSizePenalty(Weapon, Size)`

- 무기 종류와 대상 크기에 따라 계수를 돌려준다.
- 현재 우리 계산기에도 이미 있는 구조와 매우 유사하다.
- 이 함수는 그대로 `weaponType × targetSize -> multiplier` 매핑으로 옮기면 된다.

### 2. 제련 ATK
`fnRefineATK(WeaponLevel, RefineValue)`

```vb
If WeaponLevel = 1 Then
    fnRefineATK = 2 * RefineValue
ElseIf WeaponLevel = 2 Then
    fnRefineATK = 3 * RefineValue
ElseIf WeaponLevel = 3 Then
    fnRefineATK = 5 * RefineValue
ElseIf WeaponLevel = 4 Then
    fnRefineATK = 7 * RefineValue
End If
```

- 무기 레벨 1~4까지만 정의되어 있다.
- 현재 어비스 체이서 무기는 레벨 5라서 이 규칙을 그대로 확정 적용하면 안 된다.
- 다만 `level 4 = 7` 을 임시 추론으로 쓰는 현재 방식은 이 VBA 구조와 일치한다.

### 3. 오버제련 ATK
`fnOverRefineATK(WeaponLevel, OverRefineValue, RefineValue)`

```vb
If RefineValue > OverRefineValue Then
    If WeaponLevel = 1 Then
        fnOverRefineATK = 3 * (RefineValue - OverRefineValue)
    ElseIf WeaponLevel = 2 Then
        fnOverRefineATK = 5 * (RefineValue - OverRefineValue)
    ElseIf WeaponLevel = 3 Then
        fnOverRefineATK = 8 * (RefineValue - OverRefineValue)
    ElseIf WeaponLevel = 4 Then
        fnOverRefineATK = 14 * (RefineValue - OverRefineValue)
    End If
End If
```

- 이 함수는 우리 계산기에 아직 없다.
- 다음 리팩터링에서 `overRefineAttack` 버킷을 반드시 따로 추가해야 한다.

### 4. 랜덤 ATK 범위
`fnMinRandomATK(WeaponATK, WeaponLevel, STR)`

```vb
fnMinRandomATK = (WeaponATK * (1 - 0.05 * WeaponLevel + (STR / 200)))
```

- 출력에서 `랜덤 타격 범위`가 있다는 사용자의 체감과 직접 연결된다.
- 평균값 비교 UI를 붙일 때 매우 중요하다.

### 5. 마스터리 ATK
`fnMasterySkill(...)`

- 검수련, 메이스 수련, 창 수련 같은 수련류를 별도 ATK로 반환한다.
- 즉 `Mastery ATK` 는 일반 장비 ATK와 분리하는 게 맞다.
- 우리 계산기 다음 단계에서 `masteryAttack` 버킷 분리 근거로 사용한다.

### 6. 장비 ATK 버프
`fnEquipATKBuff(...)`

- 밴딩, 실드 스펠, 인스피레이션, 파이팅 스피릿, 스트라이킹, 오딘의 힘 등을 장비 ATK 쪽으로 더한다.
- 즉 버프가 올려주는 ATK도 모두 같은 그룹이 아니라, 최소한 `장비 ATK 계열` 로 따로 모아야 한다.

### 7. 소비/기타 아이템 ATK
`fnEquipATKItem(item)`

- 맛대령, 무지개떡, 티르의 축복, PC방 버프, 캐논볼 같은 아이템 ATK를 별도 함수로 관리한다.
- 이것도 장비 설명 ATK와 합쳐지는 `equipmentAttack` 그룹에 가깝다.

### 8. 무기 ATK 배율형 버프
`fnWeaponATKPercentBuff(BuffSkill, SkillLevel, EDPElement, AttackerElement)`
`fnWeaponATKPercentBuff2(BuffSkill, SkillLevel)`

- 치명적인 독 부여처럼 `무기 데미지 %` 에 가까운 버프를 따로 다룬다.
- 즉 모든 `% 증뎀` 이 같은 자리에 들어가면 안 된다는 근거가 된다.

### 9. 스킬 고정 추가 ATK
`fnSkillATK(...)`

- 실드 부메랑, 실드 체인, 스파이럴 피어스처럼 스킬 전용 추가 공격력을 따로 다룬다.
- 어비스 체이서에서는 아직 직접 대응되는 스킬 고정식이 있는지 확인 필요하다.

### 10. 스킬 계수
`fnSkillPercent(...)`

- 마법 쪽 예시가 보이지만, 핵심은 `스킬 % 계수도 별도 함수` 로 관리한다는 점이다.
- 우리도 `스킬 계수`, `스킬 고정 보너스`, `스킬 증뎀` 을 분리하는 게 맞다.

### 11. 최종 추가 연산
`fnFinalAddSkill(...)`

- 어떤 스킬은 단순 `% * ATK` 만이 아니라, HP/SP/DEF/속성/내성 등 최종 추가식이 별도로 붙는다.
- 이건 장기적으로 `스킬별 개별 계산 함수` 가 필요하다는 근거다.

## 현재 프로젝트에 적용할 원칙

### 원칙 1
- `xlsx` 는 화면 양식과 입력/출력 배치 참고용으로만 쓴다.
- 실제 계산 순서는 원본 `.xls` 에서 추출한 VBA를 기준으로 본다.

### 원칙 2
- 아래 버킷은 별도로 유지한다.
  - statusAttack
  - weaponAttack
  - refineAttack
  - overRefineAttack
  - equipmentAttack
  - masteryAttack
  - traitAttack

### 원칙 3
- 무기 관련 `%`, 장비 증뎀, 스킬 증뎀, 속성/종족/크기/보스 증뎀은 하나로 뭉개지지 않게 한다.

### 원칙 4
- 레벨 5 무기 제련/오버제련 규칙은 이 VBA만으로 확정하지 않는다.
- 실측 로그로 따로 검증한다.

## 바로 다음 작업
1. `abyssChaserCalculator.ts` 에 `overRefineAttack` 버킷 추가
2. `masteryAttack` 존재 여부를 어비스 체이서 기준으로 검토
3. 랜덤 ATK 범위가 보이도록 평균/편차 비교 UI 추가
