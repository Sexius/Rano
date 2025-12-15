# Quick Fix: 백엔드 재시작 가이드

## 문제 진단
- ✅ SkillController.java 파일 존재
- ❌ `/api/skills` 엔드포인트 404 에러
- 💡 **원인**: 백엔드가 새 컨트롤러를 로드하지 못함

## 해결 방법

### 방법 1: 백엔드 재시작 (추천)
```powershell
# 1. 현재 실행 중인 백엔드 종료 (Ctrl+C)
# 2. 재시작
cd e:\RAG\rano-spring-backend
mvnw clean spring-boot:run
```

### 방법 2: 빠른 재시작
```powershell
cd e:\RAG
stop_app.bat
start_app.bat
```

## 재시작 후 확인
```powershell
# API 테스트
Invoke-WebRequest -Uri "http://localhost:8080/api/skills"
```

성공하면 JSON 데이터가 보여야 합니다.

## 재시작 없이 확인하는 방법
브라우저 개발자 도구 (F12) → Console 탭에서:
```javascript
fetch('http://localhost:8080/api/skills')
  .then(r => r.json())
  .then(d => console.log('스킬 개수:', d.length))
```

---

**중요**: `mvnw clean spring-boot:run`을 실행해야 새로 만든 컨트롤러가 컴파일되고 로드됩니다!
