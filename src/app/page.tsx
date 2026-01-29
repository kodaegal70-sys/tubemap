'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState, useMemo, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MobileProvider } from './contexts/MobileContext';
import TopSearchBar from './components/TopSearchBar';
import RightPanel from './components/RightPanel';
import MobileShell from './components/MobileShell';
import InfoBar from './components/InfoBar';
import { supabase } from '@/lib/supabaseClient';
import { Place, DUMMY_PLACES, checkCategoryMatch } from '@/data/places';

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
  handleMapMove,
  handleManualInteraction,
  handleMarkerClick,
  handleFilterChange,
  setActiveCategoryFilters,
  setCurrentSearch,
  setFitBoundsTrigger,
  myLocation,
  searchKeyword,
  handleSearch,
  onMyLocation,
  rightPanelTab,
  setRightPanelTab,
}: {
  allPlaces: Place[];
  filteredPlaces: Place[];
  sidebarPlaces: Place[];
  focusedPlace: Place | null;
  activeMediaFilters: string[];
  activeCategoryFilters: string[];
  currentSearch: string;
  fitBoundsTrigger: number;
  handleMapMove: (visible: Place[]) => void;
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
}) {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* 지도 */}
      <MapComponent
        places={filteredPlaces}
        focusedPlace={focusedPlace}
        onMapMove={handleMapMove}
        onManualInteraction={handleManualInteraction}
        onMarkerClick={handleMarkerClick}
        fitBoundsTrigger={fitBoundsTrigger}
        isMobile={false}
        myLocation={myLocation}
        searchKeyword={searchKeyword}
      />

      {/* 좌측 상단 플로팅 검색/카테고리 (직방식 상단 패널) */}
      <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 1100 }}>
        <TopSearchBar
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

      {/* 우측 관통 패널 (리스트 / 디스커버리 탭) */}
      <RightPanel
        places={sidebarPlaces}
        allPlaces={allPlaces}
        activeMediaFilters={activeMediaFilters}
        onPlaceClick={handleMarkerClick}
        onFilterChange={handleFilterChange}
        focusedPlace={focusedPlace}
        tab={rightPanelTab}
        onTabChange={setRightPanelTab}
      />
    </div>
  );
}

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const placeIdParam = searchParams.get('placeId');

  const [allPlaces, setAllPlaces] = useState<Place[]>(DUMMY_PLACES);
  const [activeMediaFilters, setActiveMediaFilters] = useState<string[]>([]);
  const [activeCategoryFilters, setActiveCategoryFilters] = useState<string[]>([]);
  const [visiblePlaces, setVisiblePlaces] = useState<Place[] | null>(null);
  const [focusedPlace, setFocusedPlace] = useState<Place | null>(null);
  const [currentSearch, setCurrentSearch] = useState<string>('');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [fitBoundsTrigger, setFitBoundsTrigger] = useState<number>(0);
  const [mounted, setMounted] = useState(false);
  const [isMobileView, setIsMobileView] = useState<boolean>(false);
  const [myLocation, setMyLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [rightPanelTab, setRightPanelTab] = useState<'list' | 'discovery'>('list');

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

  // [URL -> State] 상세 정보 동기화
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

  // [FILTER] 마커 표시용 필터링
  const filteredPlaces = useMemo(() => {
    return allPlaces.filter(p => {
      const mediaStr = p.media_label || p.media;
      const mediaMatch = activeMediaFilters.length === 0 ||
        (mediaStr?.split(',').some(m => activeMediaFilters.includes(m.split('|')[0]?.trim())) ?? false);
      const catMatch = checkCategoryMatch(p, activeCategoryFilters);
      return mediaMatch && catMatch;
    });
  }, [allPlaces, activeMediaFilters, activeCategoryFilters]);

  // [LIST SYNC] 리스트 표시용
  // - "현재 지도 화면 안에 보이는 핀"과 리스트 개수가 항상 일치하도록 구성
  const sidebarPlaces = useMemo(() => {
    // 1) 필터 + 검색 적용
    let base = filteredPlaces;
    if (currentSearch) {
      base = base.filter((p) => p.name.includes(currentSearch));
    }

    // 2) 지도 화면 안에 있는 핀만 리스트에 노출 (개수 1:1 일치)
    if (visiblePlaces !== null) {
      const visibleIds = new Set(visiblePlaces.map((p) => p.id));
      return base.filter((p) => visibleIds.has(p.id));
    }

    // 아직 visible 정보가 없으면 필터/검색 결과 전체 노출
    return base;
  }, [currentSearch, filteredPlaces, visiblePlaces]);

  const handleMapMove = useCallback((visible: Place[]) => {
    setVisiblePlaces(visible);
  }, []);

  // 스마트 검색 핸들러 (모바일과 동일한 로직)
  const handleSearch = useCallback((keyword: string) => {
    const trimmed = keyword.trim();
    if (trimmed) {
      if (trimmed.length >= 2) {
        // 1) 전체 데이터(allPlaces)에서 상호명 검색 점수 계산
        const scoredMatches = allPlaces
          .map(p => {
            let score = 0;
            const name = p.name.toLowerCase();
            const lowerTrimmed = trimmed.toLowerCase();

            if (name === lowerTrimmed) {
              score = 100; // 정확히 일치
            } else if (name.startsWith(lowerTrimmed)) {
              score = 80; // 검색어로 시작
            } else if (name.includes(lowerTrimmed)) {
              score = 50 + (lowerTrimmed.length * 2); // 포함됨 (매칭 길이에 따른 가산점)
            }

            return { place: p, score };
          })
          .filter(match => match.score > 0)
          .sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            // 점수가 같으면 상호명이 짧은 것 우선 (정확도)
            return a.place.name.length - b.place.name.length;
          });

        if (scoredMatches.length > 0) {
          // 업체명 매칭이 있으면 해당 리스트 필터 적용 및 최상위 업체 자동 선택
          setCurrentSearch(trimmed);
          const bestMatch = scoredMatches[0].place;

          router.push(`?placeId=${bestMatch.id}`, { scroll: false });

          // 업체가 발견되었으므로 지도의 "지역/외부 검색(searchKeyword)"은 수행하지 않음
          setSearchKeyword('');
          return;
        }
      }

      // 2) 업체명 일치가 없거나 검색어가 짧은 경우 (지역 검색 혹은 주소 검색)
      setCurrentSearch(trimmed);
      setSearchKeyword(trimmed);
    } else {
      // 검색어가 없으면 초기화
      setCurrentSearch('');
      setSearchKeyword('');
      router.replace('/', { scroll: false });
    }
  }, [allPlaces, router]);

  // [INTERACTION] 수동 조작 시 즉시 상세 및 검색 해제 (탐색 모드로 복원)
  const handleManualInteraction = useCallback(() => {
    if (placeIdParam || currentSearch || searchKeyword) {
      setCurrentSearch('');
      setSearchKeyword('');
      router.replace('/', { scroll: false });
    }
  }, [placeIdParam, currentSearch, searchKeyword, router]);

  const handleMarkerClick = useCallback((p: Place) => {
    router.push(`?placeId=${p.id}`, { scroll: false });
  }, [router]);

  const handleFilterChange = (filters: { media: string[] }) => {
    setActiveMediaFilters(filters.media);
    if (filters.media.length > 0) {
      setFitBoundsTrigger(prev => prev + 1);
    }
  };

  const handleMyLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMyLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => {
        console.error('geolocation error', err);
      },
    );
  }, []);

  useEffect(() => {
    if (supabase) {
      supabase.from('places').select('*').then(({ data }) => {
        if (data && data.length > 0) setAllPlaces(data);
      });
    }
  }, [supabase]);

  if (!mounted) return null;

  return (
    <MobileProvider>
      <main style={{ width: '100vw', height: '100dvh', position: 'relative', overflow: 'hidden' }}>
        {/* 데스크톱 레이아웃 (조건부 마운트) */}
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
              handleMapMove={handleMapMove}
              handleManualInteraction={handleManualInteraction}
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
            />
          </div>
        )}

        {/* 모바일 레이아웃 (조건부 마운트) */}
        {isMobileView && (
          <div className="hide-desktop" style={{ height: '100%' }}>
            <MobileShell
              allPlaces={allPlaces}
              onMapMove={handleMapMove}
              onManualInteraction={handleManualInteraction}
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
