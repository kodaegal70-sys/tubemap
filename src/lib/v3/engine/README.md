
# TubeMap Engine v1.6 Developer Guide

이 문서는 **TubeMap Engine v1.6**의 데이터 수집 로직과 구조를 설명합니다.
다른 AI나 개발자가 이 프로젝트를 이어받을 때 **가장 먼저 참고해야 할 파일들**입니다.

## 📂 핵심 디렉토리: `src/lib/v3/engine/`

이 디렉토리에 **모든 핵심 로직**이 모여 있습니다.

### 1. `config.ts` (The Brain)
*   **역할:** 수집 타겟(유튜버, 방송), 검색 키워드, 그리고 **제외 키워드(Exclusions)**를 정의합니다.
*   **중요:** '맛집'이 아닌 영상(레시피, 밀키트, 포장, 집밥 등)을 걸러내는 **금칙어 리스트(`VIDEO_TITLE_EXCLUSIONS`)**가 이곳에 있습니다. 오탐(False Positive)이 발생하면 가장 먼저 이곳을 수정하세요.

### 2. `YouTubeCollector.ts` (The Eyes)
*   **역할:** YouTube API와 통신하고, 영상 제목/태그에서 **맛집 정보(후보군)**를 추출합니다.
*   **핵심 로직:**
    *   **Strict Filtering:** 설정된 키워드가 제목/태그에 없으면 `searchVideos` 단계에서 즉시 탈락시킵니다.
    *   **Exclusion Check:** `config.ts`의 금칙어가 있면 `getVideoDetails`에서 `null`을 반환하여 수집을 차단합니다.
    *   **Regex Extraction:** `l PlaceName`, `[PlaceName]` 등의 패턴을 사용하여 모호한 추측이 아닌 **확실한 텍스트**만 추출합니다.

### 3. `KakaoMatcher.ts` (The Verification)
*   **역할:** 추출된 후보군(이름 + 지역)이 **실존하는 장소인지** 카카오 로컬 API로 검증합니다.
*   **핵심 로직:**
    *   **Smart Scoring:** 이름 일치도(80점), 지역 일치(20점) 등을 종합하여 **60점 이상**만 합격시킵니다. (59점 이하는 과감히 버림)
    *   **Address Parsing:** 지번 주소와 도로명 주소를 모두 확보하여 DB에 저장합니다.

### 4. `TubeMapEngine.ts` (The Orchestrator)
*   **역할:** 위 모듈들을 조립하여 **전체 파이프라인(Step 1~10)**을 실행합니다.
*   **흐름:** `Search` -> `Filter` -> `Extract` -> `Match` -> `Image Check` -> `DB Save`
*   **이미지 정책:** 이미지가 없거나 404 에러가 나는 경우 `image_state = 'pending'`으로 저장하거나 아예 저장하지 않도록 제어합니다.

---

## 🛠️ 실행 및 데이터베이스

### 5. `scripts/run_engine_v1.6.ts` (Entry Point)
*   **역할:** 엔진을 실행하는 CLI 진입점입니다.
*   **사용법:**
    ```bash
    npx tsx scripts/run_engine_v1.6.ts --target="성시경"
    ```
*   특정 타겟을 지정하거나, 지정하지 않으면 랜덤 채널을 하나 골라 수집합니다.

### 6. `scripts/v1.6_engine_schema.sql` (Database Schema)
*   **역할:** 데이터베이스 테이블 구조(`places`, `processed_videos` 등)를 정의합니다.
*   **특징:**
    *   `processed_videos`: 이미 처리한 영상은 다시 수집하지 않도록 기록(Idempotency).
    *   `places`: 최종 검증된 장소 정보 저장. `media_label`, `video_url`, `best_comment` 등 v1.6 필드가 정의되어 있습니다.

---

## ✨ v1.6의 핵심 철학 (The "Evolution")
1.  **No Fake Data:** "어설픈 데이터 100개보다 확실한 데이터 1개가 낫다."
2.  **Strict Matches Only:** 모호하면 버립니다. (Regex 매칭 실패 시 재시도하지 않음)
3.  **Active Exclusion:** '레시피', '밀키트' 등은 발견 즉시 제외합니다.
