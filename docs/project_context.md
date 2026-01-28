# Project Context & Design Philosophy

> **Note to AI Assistant**: Please read this file FIRST to understand the user's intent and project history.

## 1. Core Philosophy (User's Vision)
-   **"Discovery via Content"**: The map is not just a directory of restaurants; it is a tool for fans to "pilgrimage" locations seen in media (YouTube, TV, Drama).
-   **Media-First Navigation**: Users should be able to click "Sung Si-kyung's Eat" and see his path on the map, rather than just searching for "pork cutlet".
-   **Visuals Matter**: Images MUST be high-quality, close-up shots of food. No map screenshots or blurry store fronts.

## 2. Key Features Implemented
### A. Optimized Image Collection
-   **Strategy**: GPT Keywords ("Restaurant Name + Menu + Visual") -> Naver Image Search -> (Fallback) DALL-E 3.
-   **Result**: 25/25 Places secured with high-quality food photos. stored in `src/data/places.ts` and `public/images/places/`.

### B. Discovery Panel (Right Sidebar)
-   **Location**: Fixed Right Sidebar (Width ~300px).
-   **Function**: Lists media sources ranked by # of places (e.g., "Michelin Guide (15)", "Eat (5)").
-   **Search**: Includes a search bar to find specific shows or dramas.
-   **State**: Controlled by `FilterPanel.tsx` integrated in `page.tsx`.

## 3. User Preferences (Do Not Change)
-   **Language**: **Korean (한국어)** for all UI and communications.
-   **Layout**: Left (List) - Center (Map) - Right (Discovery).
-   **Strict Image Quality**: If an image is missing/bad, run `scripts/update_images.js` with the "Visual" prompt.

## 4. Pending / Next Steps
-   **Supabase Integration**: Currently using `DUMMY_PLACES`. Need to switch to real DB (`fetchPlaces` in `page.tsx`).
-   **Map Interaction**: improve marker clustering if data grows.
