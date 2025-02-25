이 프로젝트는 "TMT" (Taking My Time)라는 웹 애플리케이션으로, 다음과 같은 특징을 가지고 있습니다:

1. **기술 스택**:

   - Next.js 15.1.7을 기반으로 구축
   - TypeScript를 사용하여 타입 안정성 확보
   - TailwindCSS로 스타일링
   - Radix UI 등 모던 React 컴포넌트 라이브러리 활용

2. **프로젝트 구조**:

   - Next.js의 최신 app 디렉토리 구조 채택
   - MDX를 통한 콘텐츠 관리 시스템 구현
   - 페이지 전환 애니메이션을 위한 view transitions 적용
   - API 라우트 구현 (`/app/api` 디렉토리)

3. **주요 기능과 도구**:

   - GitHub 연동 (Octokit 사용)
   - 코드 구문 강조 기능 (rehype-pretty-code와 Shiki 사용)
   - Geist Mono와 Pretendard 커스텀 폰트 적용
   - ESLint, Prettier, TypeScript 등 개발 도구 설정
   - 개발 환경에서 Turbopack 사용

4. **배포**:
   - Vercel 플랫폼에 배포됨 (https://taking-my-time.vercel.app/)

이 프로젝트는 현대적인 웹 개발 기술과 best practices를 따르는 개인 블로그나 포트폴리오 성격의 웹사이트로 보입니다. 특히 콘텐츠 표현과 사용자 경험에 중점을 둔 것으로 보이며, 최신 웹 기술들을 적극적으로 활용하고 있습니다.

---

프로젝트를 더 자세히 분석한 내용을 공유드리겠습니다:

1. **애플리케이션 구조와 디자인**:

   - 한국어를 기본 언어로 사용 (`<html lang="ko">`)
   - Pretendard와 Geist Mono 폰트를 커스텀 폰트로 사용
     - Pretendard: 본문용 산세리프 폰트 (45-920 웨이트)
     - Geist Mono: 코드 표시용 모노스페이스 폰트 (100-900 웨이트)
   - 반응형 레이아웃 구현 (모바일 최적화)
   - 최대 콘텐츠 너비를 60ch로 제한하여 가독성 최적화
   - 다크모드 지원 (`bg-background`, `text-foreground` 클래스 사용)

2. **주요 기능**:

   - 페이지 전환 애니메이션 (`next-view-transitions` 사용)
   - GitHub 이슈 기반의 콘텐츠 관리 시스템
     - `/p` 경로에서 포스트 관리
     - GitHub API를 통한 이미지 처리 (`/api/github-image/`)
   - SEO 최적화 (메타데이터 설정)
     - 기본 타이틀: "TMT"
     - 설명: "Too many thoughts"

3. **개발 환경과 도구**:

   - Next.js의 최신 기능 활용
     - App Router
     - Server Components
     - Turbopack
   - 타입 안정성
     - TypeScript strict 모드
     - 엄격한 타입 체크 (`Readonly` 타입 사용)
   - 스타일링
     - TailwindCSS 사용
     - CSS 유틸리티 함수 (`cn`)로 클래스 조합 최적화

4. **코드 품질과 유지보수**:

   - ESLint와 Prettier로 코드 품질 관리
   - Import 순서 자동 정렬 (`@ianvs/prettier-plugin-sort-imports`)
   - 패키지 버전 관리 (`patchedDependencies` 사용)

5. **성능 최적화**:

   - 폰트 최적화 (`display: "swap"`)
   - 이미지 최적화 (GitHub 이미지 프록시)
   - 클라이언트 사이드 네비게이션
   - 페이지 전환 애니메이션

6. **접근성과 사용자 경험**:
   - 시맨틱 HTML 구조
   - 외부 링크에 대한 보안 속성 적용 (`rel="noopener noreferrer"`)
   - 반응형 디자인
   - 부드러운 전환 효과 (`transition-colors`)

이 프로젝트는 개인 블로그나 생각을 기록하는 플랫폼으로 보이며, GitHub 이슈를 CMS(Content Management System)로 활용하는 독특한 접근 방식을 취하고 있습니다. 최신 웹 개발 기술과 best practices를 적극적으로 도입하여 사용자 경험과 개발자 경험 모두를 고려한 것이 특징입니다.

특정 부분에 대해 더 자세히 알고 싶으신 점이 있으시다면 말씀해 주세요!
