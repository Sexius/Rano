# RANO Deployment

## Overview
- Frontend: React (Vercel)
- Backend: Spring Boot (Render)
- Source of Truth: GitHub

---

## Frontend Deployment
- Root Directory: frontend
- Install Command: npm install
- Build Command: npm run build
- Output Directory: dist

### Frontend Environment Variables
- VITE_API_URL: backend API base URL

### Frontend Rules
- frontend는 backend API만 호출한다.
- 외부 데이터 API를 직접 호출하지 않는다.
- API 키는 frontend에 저장하지 않는다.

---

## Backend Deployment
- Root Directory: backend
- Build Tool: Maven (pom.xml 및 Dockerfile 기준)
- Start Command: 프로젝트 설정에 따름 (java -jar ...)
- Health Check: 별도 actuator 미사용 (기존 API 엔드포인트로 확인)

### Backend Environment Variables
- SPRING_PROFILES_ACTIVE=prod
- SPRING_DATASOURCE_URL=...
- SPRING_DATASOURCE_USERNAME=...
- SPRING_DATASOURCE_PASSWORD=...
- SPRING_JPA_DIALECT=...
- 기타 API 키는 환경변수로만 관리

### Backend Rules
- 외부 API 호출 및 데이터 처리는 backend에서만 수행한다.
- API 키는 코드에 하드코딩하지 않는다.

---

## Git Strategy
- main: 배포 기준 브랜치
- 기능 작업은 별도 브랜치에서 진행
- 배포 전 로컬 빌드 검증 필수

---

## Verification Checklist

### Frontend
- npm install
- npm run build
- VITE_API_URL 확인
- API key 노출 여부 확인

### Backend
- mvn clean package
- 로컬 실행 확인
- 환경변수 설정 확인
- DB 연결 확인

---

## Deployment Policy
- 로컬에서 재현되지 않은 수정은 배포하지 않는다.
- 배포 문제는 로그 → 검색 → 근거 → 수정 순으로 처리한다.
- 한 번에 하나의 문제만 수정한다.