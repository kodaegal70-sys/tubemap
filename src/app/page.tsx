'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState, useMemo, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MobileProvider } from './contexts/MobileContext';
import TopSearchBar from './components/TopSearchBar';
import RightPanel from './components/RightPanel';
import AdSlot from './components/AdSlot';
import MobileShell from './components/MobileShell';
import InfoBar from './components/InfoBar';
import { supabase } from '@/lib/supabaseClient';
import { Place, checkCategoryMatch } from '@/data/places';

const MapComponent = dynamic(() => import('./components/Map'), { ssr: false });

function DesktopLayout({
  allPlaces,
  filteredPlaces,
  sidebarPlaces,
  focusedPlace,
  activeMediaFilters,
  activeCategoryFilters,
  currentSearch,
  fitBoundsTrigger,
  restoreView,
  handleMapMove,
  onMapStateChange,
  handleManualInteraction,
  handleMarkerClick,
  handleFilterChange,
  setActiveCategoryFilters,
  setCurrentSearch,
  handleSearch,
  setFitBoundsTrigger,
  myLocation,
  searchKeyword,
  onMyLocation,
  rightPanelTab,
  setRightPanelTab,
  onClearFocus,
}: {
  allPlaces: Place[];
  filteredPlaces: Place[];
  sidebarPlaces: Place[];
  focusedPlace: Place | null;
  activeMediaFilters: string[];
  activeCategoryFilters: string[];
  currentSearch: string;
  fitBoundsTrigger: number;
  restoreView: { center: { lat: number; lng: number }; level: number; trigger: number } | null;
  handleMapMove: (visible: Place[]) => void;
  onMapStateChange: (center: { lat: number; lng: number }, zoom: number, isManual: boolean) => void;
  handleManualInteraction: () => void;
  handleMarkerClick: (p: Place) => void;
  handleFilterChange: (filters: { media: string[] }) => void;
  setActiveCategoryFilters: (categories: string[]) => void;
  setCurrentSearch: (search: string) => void;
  handleSearch: (search: string) => void;
  setFitBoundsTrigger: (trigger: number | ((prev: number) => number)) => void;
  myLocation: { lat: number; lng: number } | null;
  searchKeyword: string;
  onMyLocation: () => void;
  rightPanelTab: 'list' | 'discovery';
  setRightPanelTab: (tab: 'list' | 'discovery') => void;
  onClearFocus: () => void;
}) {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* 지도 */}
      <MapComponent
        places={filteredPlaces}
        focusedPlace={focusedPlace}
        onMapMove={handleMapMove}
        onMapStateChange={onMapStateChange}
        onManualInteraction={handleManualInteraction}
        onMarkerClick={handleMarkerClick}
        fitBoundsTrigger={fitBoundsTrigger}
        restoreView={restoreView}
        isMobile={false}
        myLocation={myLocation}
        searchKeyword={searchKeyword}
      />

      {/* 좌측 상단 플로팅 검색/카테고리 */}
      <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 1100 }}>
        <TopSearchBar
          value={currentSearch}
          onSearch={handleSearch}
          onCategoryToggle={(c: string) => {
            const isSelecting = !activeCategoryFilters.includes(c);
            if (isSelecting) {
              setRightPanelTab('list');
            }
            (setActiveCategoryFilters as any)((prev: string[]) =>
              prev.includes(c) ? prev.filter((x: string) => x !== c) : [...prev, c]
            );
          }}
          selectedCategories={activeCategoryFilters}
          onMyLocation={onMyLocation}
        />
      </div>

      {/* 우측 패널 */}
      <RightPanel
        places={sidebarPlaces}
        allPlaces={allPlaces}
        activeMediaFilters={activeMediaFilters}
        onPlaceClick={handleMarkerClick}
        onFilterChange={handleFilterChange}
        onClearFocus={onClearFocus}
        focusedPlace={focusedPlace}
        tab={rightPanelTab}
        onTabChange={setRightPanelTab}
      />

      <AdSlot type="MAP_BOTTOM" id="map-bottom-ad" />
    </div>
  );
}

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const placeIdParam = searchParams.get('placeId');

  const [allPlaces, setAllPlaces] = useState<Place[]>([]);
  const [activeMediaFilters, setActiveMediaFilters] = useState<string[]>([]);
  const [activeCategoryFilters, setActiveCategoryFilters] = useState<string[]>([]);
  const [visiblePlaces, setVisiblePlaces] = useState<Place[] | null>(null);
  const [focusedPlace, setFocusedPlace] = useState<Place | null>(null);
  const [currentSearch, setCurrentSearch] = useState<string>('');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [searchTrigger, setSearchTrigger] = useState(0);
  const [fitBoundsTrigger, setFitBoundsTrigger] = useState<number>(0);
  const [mounted, setMounted] = useState(false);
  const [isMobileView, setIsMobileView] = useState<boolean>(false);
  const [myLocation, setMyLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [rightPanelTab, setRightPanelTab] = useState<'list' | 'discovery'>('list');

  // [NEW] 지도 시점 복구용 상태
  const [lastManualView, setLastManualView] = useState<{ center: { lat: number; lng: number }; level: number } | null>(null);
  const [preFocusView, setPreFocusView] = useState<{ center: { lat: number; lng: number }; level: number } | null>(null);
  const [restoreView, setRestoreView] = useState<{ center: { lat: number; lng: number }; level: number; trigger: number } | null>(null);

  useEffect(() => {
    setMounted(true);
    const mql = window.matchMedia('(max-width: 768px)');
    const onChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobileView(e.matches);
    };
    onChange(mql);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  // [MAP STATE TRACKING] 사용자의 탐색 시점 기억 (상세 보기 진입 전 상태 보존)
  const handleMapStateChange = useCallback((center: { lat: number; lng: number }, level: number, isManual: boolean) => {
    // 상세 페이지가 아닐 때만 업데이트
    if (!placeIdParam) {
      // 1) 수동 조작이거나, 2) 아직 저장된 시점이 없다면(초기 로드 등) 저장
      if (isManual || !preFocusView) {
        setPreFocusView({ center, level });
      }
    }
  }, [placeIdParam, preFocusView]);

  useEffect(() => {
    if (!placeIdParam) {
      setFocusedPlace(null);
    } else if (allPlaces.length > 0) {
      const p = allPlaces.find(pl => pl.id.toString() === placeIdParam);
      if (p) {
        setFocusedPlace(p);
      }
    }
  }, [placeIdParam, allPlaces]);

  const filteredPlaces = useMemo(() => {
    return allPlaces.filter(p => {
      const mediaStr = p.channel_title;
      const mediaMatch = activeMediaFilters.length === 0 ||
        (mediaStr?.split(',').some(m => activeMediaFilters.includes(m.trim())) ?? false);
      const catMatch = checkCategoryMatch(p, activeCategoryFilters);
      return mediaMatch && catMatch;
    });
  }, [allPlaces, activeMediaFilters, activeCategoryFilters]);

  const sidebarPlaces = useMemo(() => {
    let base = filteredPlaces;
    if (currentSearch) {
      base = base.filter((p) => p.name.includes(currentSearch));
    }
    if (visiblePlaces !== null) {
      const visibleIds = new Set(visiblePlaces.map((p) => p.id));
      return base.filter((p) => visibleIds.has(p.id));
    }
    return base;
  }, [currentSearch, filteredPlaces, visiblePlaces]);

  const handleMapMove = useCallback((visible: Place[]) => {
    setVisiblePlaces(visible);
  }, []);

  const handleSearch = useCallback((keyword: string) => {
    const trimmed = keyword.trim();
    if (trimmed) {
      if (trimmed.length >= 2) {
        const scoredMatches = allPlaces
          .map(p => {
            let score = 0;
            const name = p.name.toLowerCase();
            const lowerTrimmed = trimmed.toLowerCase();
            if (name === lowerTrimmed) score = 100;
            else if (name.startsWith(lowerTrimmed)) score = 80;
            else if (name.includes(lowerTrimmed)) score = 50 + (lowerTrimmed.length * 2);
            return { place: p, score };
          })
          .filter(match => match.score > 0)
          .sort((a, b) => (b.score !== a.score ? b.score - a.score : a.place.name.length - b.place.name.length));

        if (scoredMatches.length > 0) {
          setCurrentSearch(trimmed);
          const bestMatch = scoredMatches[0].place;
          router.push(`?placeId=${bestMatch.id}`, { scroll: false });
          setSearchKeyword('');
          return;
        }
      }

      setCurrentSearch(trimmed);
      setSearchKeyword(trimmed);
      setSearchTrigger(prev => prev + 1);
    } else {
      // 검색어가 없으면 초기화
      setCurrentSearch('');
      setSearchKeyword('');
      router.replace('/', { scroll: false });
    }
  }, [allPlaces, router]);

  // [NEW] 지도 수동 조작 핸들러 (단순히 상세 보기만 닫음, 시점 복구 X)
  const handleManualMapInteraction = useCallback(() => {
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    // 상세 보기가 켜져있을 때만 닫기
    if (placeIdParam) {
      router.replace('/', { scroll: false });
    }
  }, [router, placeIdParam]);

  const handleBackToList = useCallback(() => {
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    // [RESTORATION] 버튼 클릭시에만 이전 시점으로 지도 되돌리기
    if (preFocusView) {
      setRestoreView({
        ...preFocusView,
        trigger: (restoreView?.trigger || 0) + 1
      });
    }

    setCurrentSearch('');
    setSearchKeyword('');
    router.replace('/', { scroll: false });
  }, [router, preFocusView, restoreView]);

  const handleMarkerClick = useCallback((p: Place) => {
    router.push(`?placeId=${p.id}`, { scroll: false });
  }, [router]);

  const handleFilterChange = (filters: { media: string[] }) => {
    setActiveMediaFilters(filters.media);
  };

  const handleMyLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setMyLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => console.error('geolocation error', err)
    );
  }, []);

  const ENABLE_OFFLINE_MODE = true;
  useEffect(() => {
    if (ENABLE_OFFLINE_MODE) {
      const fetchOfflineData = () => {
        fetch('/api/offline-places')
          .then(res => res.json())
          .then(raw => {
            if (Array.isArray(raw)) {
              setAllPlaces(raw.map(p => ({ ...p, id: p.id || p.kakao_place_id })));
            }
          })
          .catch(e => console.error("Live sync failed", e));
      };
      fetchOfflineData();
      const interval = setInterval(fetchOfflineData, 5000);
      return () => clearInterval(interval);
    }
  }, [supabase]);

  if (!mounted) return null;

  return (
    <MobileProvider>
      <main style={{ width: '100vw', height: '100dvh', position: 'relative', overflow: 'hidden', overscrollBehavior: 'none' }}>
        {!isMobileView && (
          <div className="hide-mobile" style={{ height: '100%' }}>
            <DesktopLayout
              allPlaces={allPlaces}
              filteredPlaces={filteredPlaces}
              sidebarPlaces={sidebarPlaces}
              focusedPlace={focusedPlace}
              activeMediaFilters={activeMediaFilters}
              activeCategoryFilters={activeCategoryFilters}
              currentSearch={currentSearch}
              fitBoundsTrigger={fitBoundsTrigger}
              restoreView={restoreView}
              handleMapMove={handleMapMove}
              onMapStateChange={handleMapStateChange}
              handleManualInteraction={handleManualMapInteraction}
              handleMarkerClick={handleMarkerClick}
              handleFilterChange={handleFilterChange}
              setActiveCategoryFilters={setActiveCategoryFilters}
              setCurrentSearch={setCurrentSearch}
              handleSearch={handleSearch}
              setFitBoundsTrigger={setFitBoundsTrigger}
              myLocation={myLocation}
              searchKeyword={searchKeyword}
              onMyLocation={handleMyLocation}
              rightPanelTab={rightPanelTab}
              setRightPanelTab={setRightPanelTab}
              onClearFocus={handleBackToList}
            />
          </div>
        )}

        {isMobileView && (
          <div className="hide-desktop" style={{ height: '100%' }}>
            <MobileShell
              allPlaces={allPlaces}
              currentSearch={currentSearch}
              onCurrentSearchChange={setCurrentSearch}
              searchTrigger={searchTrigger}
              onMapMove={handleMapMove}
              onManualInteraction={handleManualMapInteraction}
              onClearFocus={handleBackToList}
              restoreView={restoreView}
              onMapStateChange={handleMapStateChange}
            />
          </div>
        )}
      </main>
      <InfoBar />
    </MobileProvider>
  );
}

export default function Home() {
  return <Suspense><HomeContent /></Suspense>;
}
