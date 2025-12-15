package com.ragnarok.ragspringbackend.service;

import org.springframework.stereotype.Service;

@Service
public class CalculatorService {

    public int calculateDamage(int baseLevel, int str, int dex, int luk, 
                              int weaponAtk, int equipAtk, int skillPercent, int monsterDef) {
        try {
            // 라그나로크 데미지 공식 적용
            // 1. ATK 합산
            int statusAtk = str + (baseLevel / 4) + (dex / 5) + (luk / 5);
            int totalAtk = statusAtk + weaponAtk + equipAtk;

            // 2. 증뎀 곱하기 (스킬 배율)
            int modifiedAtk = totalAtk * (skillPercent / 100);

            // 3. 방어력 빼기
            int finalDamage = modifiedAtk - monsterDef;

            // 음수 데미지는 1로 처리
            if (finalDamage < 1) {
                finalDamage = 1;
            }

            return finalDamage;
        } catch (Exception e) {
            return 0;
        }
    }
}
