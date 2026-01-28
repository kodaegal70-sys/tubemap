# Project Handover Status Report
**Date:** 2026-01-28
**Subject:** Media Store Map Component & Navigation Logic

## 1. Core Architecture Changes (Map Component)
We have significantly refactored the Google/Kakao Map implementation to resolve persistent `removeChild` errors caused by conflicts between React's Virtual DOM and the Map SDK's direct DOM manipulation.

*   **Native SDK Adoption:** Removed `react-kakao-maps-sdk` library. The map is now implemented using the native Kakao Maps JavaScript SDK imperatively within `useEffect` hooks.
*   **File:** `src/app/components/Map.tsx`
*   **Key Logic:**
    *   **Initialization:** Map is initialized once in a `useEffect` using `mapRef` and `containerRef`.
    *   **Markers:** Markers are created/updated imperatively. We use `window.kakao.maps.Marker` directly inside a `useEffect` that listens to `places`.
    *   **Overlays:** Custom Overlays use `createRoot` (React Portals) to render React components (`<PlaceImage />`, etc.) inside the SDK's overlay container. This ensures complex UI works within the imperative map.
    *   **Event Handling:** Events like `click`, `dragstart`, `zoom_changed` are attached via `kakao.maps.event.addListener`.

## 2. Navigation & State Management
We shifted from local state (`useState`) to **URL-based state management** to support mobile "Back" button functionality and browser history.

*   **File:** `src/app/page.tsx`
*   **Mechanism:**
    *   **Selection:** Clicking a marker pushes `?placeId=123` to the URL.
    *   **State Sync:** A `useEffect` listens to `useSearchParams`. When the URL changes, it updates `focusedPlace` state.
    *   **Deselection:** Clicking the map background or pressing "Back" removes the query param (`router.push('?')`), which closes the bottom sheet/overlay.
    *   **Mobile Back Button:** Handled naturally by the browser's history stack via `next/navigation`.

## 3. Current Status & Features
*   **[Completed] Map Stability:** No more `removeChild` crashes during rapid zooming/panning or component updates.
*   **[Completed] Mobile Back Button:** Phone back button correctly closes the place detail view instead of exiting the app.
*   **[Completed] Interaction:**
    *   Clicking a marker opens details.
    *   Clicking an empty map area or dragging the map closes details.
*   **[Workaround] Markers:** Custom marker images (e.g., `logo.png`) were disappearing. Reverted to **Default Blue Pins** for visibility. Code for custom images exists but is commented out in `Map.tsx`.

## 4. Known Issues & Next Steps
1.  **Marker Customization:**
    *   Investigate why `/images/logo.png` was failing to render (path issue or image corruption).
    *   Uncomment the `image` property in `Map.tsx` once resolved.
2.  **Lint Errors:**
    *   `src/app/page.tsx`: Minor TypeScript error regarding `handleFilterChange` signature match. Functional but needs typing fix.
3.  **Clustering:**
    *   If the number of places grows, enable `MarkerClusterer` in `Map.tsx` (library is already loaded via script tag).

## 5. Key Files to Review
*   `src/app/page.tsx`: Main logic and URL integration.
*   `src/app/components/Map.tsx`: Imperative map logic.
*   `src/app/components/BottomSheet.tsx`: UI visibility handling (CSS-based toggle).
