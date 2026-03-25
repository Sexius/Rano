\# RANO Architecture



\## Overview

\- Frontend: React (Vercel 배포)

\- Backend: Spring Boot (Render 또는 Railway 배포)

\- Repository: GitHub



\---



\## Frontend Responsibilities

\- UI 렌더링

\- 사용자 입력 처리

\- API 호출

\- 데이터 표시



\---



\## Backend Responsibilities

\- 외부 데이터 수집 (크롤링/파싱)

\- 데이터 가공 및 저장

\- API 제공



\---



\## API Rules

\- 모든 비즈니스 데이터 요청은 backend를 통해서만 처리한다.

\- frontend는 외부 데이터 API를 직접 호출하지 않는다.

\- API 키가 필요한 서비스 호출은 반드시 backend에서 처리한다.

\- 정적 자산(CDN 이미지, 폰트 등)의 직접 로딩은 허용할 수 있다.

\- 단, 정적 자산의 외부 의존성이 문제를 일으키면 backend proxy 또는 자체 호스팅으로 전환한다.

\- API 응답 구조는 임의로 변경하지 않는다.

\---



\## Folder Rules

\- frontend 관련 수정은 /frontend 폴더 내에서만 한다

\- backend 관련 수정은 /backend 폴더 내에서만 한다

\- 서로의 코드를 침범하지 않는다



\---



\## Critical Rules

\- 기존 구조를 임의로 변경하지 않는다

\- 불필요한 리팩토링 금지

\- 기능 수정 시 영향 범위를 최소화한다

