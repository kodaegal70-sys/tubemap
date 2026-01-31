'use client';

import { useEffect, useMemo, useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMobile, DiscoveryFilter } from '../contexts/MobileContext';
import { Place, DUMMY_PLACES, checkCategoryMatch } from '@/data/places';
import { normalizeMediaName } from '@/lib/v3/utils/media';
import TopSearchBar from './TopSearchBar';
import BottomSheet from './BottomSheet';
import AdSlot from './AdSlot';

const MapComponent = dynamic(() => import('./Map'), { ssr: false });

interface MobileShellProps {
  allPlaces: Place[];
  currentSearch: string;
  onCurrentSearchChange?: (val: string) => void;
  searchTrigger?: number;
  onMapMove: (visible: Place[]) => void;
  onManualInteraction?: () => void;
  onClearFocus?: () => void; // [NEW] '이전 목록으로' 전용 핸들러
  restoreView?: { center: { lat: number; lng: number }; level: number; trigger: number } | null;
  onMapStateChange?: (center: { lat: number; lng: number }, zoom: number, isManual: boolean) => void;
}

export default function MobileShell({
  allPlaces,
  currentSearch,
  searchTrigger: parentSearchTrigger,
  onMapMove,
  onManualInteraction,
  onClearFocus,
  restoreView,
  onMapStateChange,
}: MobileShellProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const placeIdParam = searchParams.get('placeId');

  const {
    sheetState,
    setSheetState,
    sheetTab,
    setSheetTab,
    selectedPlaceId,
    setSelectedPlaceId,
    categoryFilter,
    setCategoryFilter,
    discoveryFilter,
    setDiscoveryFilter,
    places,
    setPlaces,
  } = useMobile();

  const [myLocation, setMyLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [searchTrigger, setSearchTrigger] = useState<number>(0);

  // 부모의 searchTrigger와 동기화
  useEffect(() => {
    if (parentSearchTrigger !== undefined) {
      setSearchTrigger(parentSearchTrigger);
    }
  }, [parentSearchTrigger]);


  // URL 파라미터와 동기화
  useEffect(() => {
    if (!placeIdParam) {
      setSelectedPlaceId(null);
      // [FIX] 업체 선택 해제 시 시트 상태를 강제로 'peek'으로 바꾸지 않음.
      // 사용자가 보고 있던 'half'나 'full' 높이를 유지하도록 함.
    } else if (allPlaces.length > 0) {
      const p = allPlaces.find(pl => pl.id.toString() === placeIdParam);
      if (p) {
        setSelectedPlaceId(p.id);
        // 업체가 선택될 때 'peek' 상태라면 최소 'half'까지는 올려줌 (UX)
        if (sheetState === 'peek') {
          setSheetState('half');
        }
      }
    }
  }, [placeIdParam, allPlaces, setSelectedPlaceId, setSheetState]);
  const [fitBoundsTrigger, setFitBoundsTrigger] = useState(0);

  // 필터링된 장소 계산
  const filteredPlaces = useMemo(() => {
    return allPlaces.filter(p => {
      // 카테고리 필터 (보완된 유틸리티 사용)
      const catMatch = checkCategoryMatch(p, categoryFilter);

      // 디스커버리 필터 (미디어)
      const mediaStr = p.channel_title;
      const mediaMatch = discoveryFilter.selectedMedia.length === 0 ||
        (mediaStr?.split(',').some(m => {
          const rawMedia = m.trim();
          return discoveryFilter.selectedMedia.includes(rawMedia);
        }) ?? false);

      return catMatch && mediaMatch;
    });
  }, [allPlaces, categoryFilter, discoveryFilter.selectedMedia]);

  // 지도 이동 핸들러
  const handleMapMove = useCallback((visible: Place[]) => {
    // 지도에 보이는 장소를 places에 설정 (리스트 탭일 때만)
    if (sheetTab === 'list') {
      setPlaces(visible);
    }
    onMapMove(visible);
  }, [setPlaces, onMapMove, sheetTab]);

  // 필터 변경 시 처리 (필요한 경우 여기에 추가 로직 작성 가능하지만, 현재는 onMapMove에 의존)

  // 마커 클릭 핸들러
  const handleMarkerClick = useCallback((place: Place) => {
    setSelectedPlaceId(place.id);
    setSheetState('half');
    router.push(`?placeId=${place.id}`, { scroll: false });
  }, [setSelectedPlaceId, setSheetState, router]);

  // 장소 클릭 핸들러 (리스트에서)
  const handlePlaceClick = useCallback((place: Place) => {
    setSelectedPlaceId(place.id);
    setSheetState('half');
    router.push(`?placeId=${place.id}`, { scroll: false });
  }, [setSelectedPlaceId, setSheetState, router]);

  // 포커스 해제 핸들러 (이전 목록으로 버튼 대응)
  const handleClearFocus = useCallback(() => {
    if (onClearFocus) {
      // 부모(page.tsx)의 handleBackToList를 호출하여 시점 복구와 상태 초기화를 통합 실행
      onClearFocus();
    } else {
      setSelectedPlaceId(null);
      setSearchKeyword('');
      router.replace('/', { scroll: false });
    }
  }, [setSelectedPlaceId, router, onClearFocus]);

  // 검색 핸들러
  const handleSearch = useCallback((keyword: string) => {
    const trimmed = keyword.trim();
    if (trimmed) {
      // 1) 전체 데이터(allPlaces)에서 업체명 우선 필터링
      const nameMatches = allPlaces.filter(p => p.name.includes(trimmed));
      const otherMatches = allPlaces.filter(p =>
        !p.name.includes(trimmed) &&
        (p.address?.includes(trimmed) || p.best_comment?.includes(trimmed))
      );

      const allResults = [...nameMatches, ...otherMatches];

      if (nameMatches.length > 0) {
        // 업체명 매칭이 있으면 해당 리스트를 보여주고 최적의 업체 자동 선택
        setPlaces(allResults);

        const bestMatch = [...nameMatches].sort((a, b) => {
          if (a.name === trimmed) return -1;
          if (b.name === trimmed) return 1;
          return a.name.length - b.name.length;
        })[0];

        setSelectedPlaceId(bestMatch.id);
        router.push(`?placeId=${bestMatch.id}`, { scroll: false });

        // [중요] 업체가 발견되었으므로 지도의 "지역/외부 검색(searchKeyword)"은 수행하지 않음 (간섭 차단)
        setSearchKeyword('');
      } else {
        // 업체명 일치가 없는 경우 (지역 검색 혹은 주소 검색)
        if (otherMatches.length > 0) {
          setPlaces(allResults);
        } else {
          setPlaces([]);
        }

        // [중요] 지역 검색을 위해 기존 선택된 업체 해제 및 키워드 설정
        setSelectedPlaceId(null);
        setSearchKeyword(trimmed);
        setSearchTrigger(prev => prev + 1);
      }

      setSheetState('half');
    } else {
      // 검색어가 없으면 초기화
      setPlaces(filteredPlaces.slice(0, 50));
      setSearchKeyword('');
      setSelectedPlaceId(null);
      router.replace('/', { scroll: false });
    }
  }, [allPlaces, filteredPlaces, setPlaces, setSelectedPlaceId, setSheetState, setSearchKeyword, router]);

  // 카테고리 토글
  const handleCategoryToggle = useCallback((category: string) => {
    const isSelecting = !categoryFilter.includes(category);

    if (isSelecting) {
      // [UX] 카테고리 선택 시 자동으로 리스트 탭으로 전환 (순수 함수 밖에서 실행)
      setSheetTab('list');
      setSheetState('half');
    }

    setCategoryFilter(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  }, [categoryFilter, setCategoryFilter, setSheetTab, setSheetState, setFitBoundsTrigger]);

  // 디스커버리 필터 변경
  const handleDiscoveryFilterChange = useCallback((filters: { media: string[] }) => {
    setDiscoveryFilter((prev: DiscoveryFilter): DiscoveryFilter => ({
      ...prev,
      selectedMedia: filters.media,
    }));
    // 적용 후 BottomSheet를 half로 변경하고 리스트 탭으로 전환
    setSheetState('half');
    setSheetTab('list');
  }, [setDiscoveryFilter, setSheetState, setSheetTab]);

  const handleSheetStateChange = useCallback((state: 'peek' | 'half' | 'full') => {
    // 수동으로 시트를 내렸을 때 (peek 상태가 되었을 때)
    if (state === 'peek' && placeIdParam) {
      setSelectedPlaceId(null);
      router.replace('/', { scroll: false });
    }
  }, [placeIdParam, router, setSelectedPlaceId]);

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

  // 선택된 장소 찾기
  const focusedPlace = useMemo(() => {
    if (selectedPlaceId === null) return null;
    return allPlaces.find(p => p.id === selectedPlaceId) || null;
  }, [selectedPlaceId, allPlaces]);

  // 수동 조작 시 키보드 닫기 및 검색 상태 유지 (유저 피드백 반영)
  const handleInternalManualInteraction = useCallback(() => {
    // 키보드 닫기
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    // searchKeyword를 초기화하지 않음 (글자 유지)
    if (onManualInteraction) onManualInteraction();
  }, [onManualInteraction]);

  return (
    <div style={{ width: '100vw', height: '100dvh', position: 'relative', overflow: 'hidden' }}>
      <AdSlot type="MOBILE_TOP" id="mobile-top-ad" />
      <div style={{ height: '60px', width: '100%', pointerEvents: 'none' }} />
      {/* 지도 - 항상 배경에 고정 */}
      <MapComponent
        places={filteredPlaces}
        focusedPlace={focusedPlace}
        onMapMove={handleMapMove}
        onMapStateChange={onMapStateChange}
        onManualInteraction={onManualInteraction}
        onMarkerClick={handleMarkerClick}
        fitBoundsTrigger={fitBoundsTrigger}
        restoreView={restoreView}
        isMobile={true}
        mobileSheetState={sheetState}
        myLocation={myLocation}
        searchKeyword={searchKeyword}
        searchTrigger={searchTrigger}
      />

      {/* 상단 검색바 + 카테고리 칩 */}
      <TopSearchBar
        value={currentSearch}
        onSearch={handleSearch}
        onCategoryToggle={handleCategoryToggle}
        selectedCategories={categoryFilter}
        onMyLocation={handleMyLocation}
      />

      <BottomSheet
        places={places}
        allPlaces={allPlaces}
        onPlaceClick={handlePlaceClick}
        focusedPlace={focusedPlace}
        discoveryFilter={discoveryFilter}
        onDiscoveryFilterChange={handleDiscoveryFilterChange}
        onStateChange={handleSheetStateChange}
        onClearFocus={handleClearFocus}
      />
    </div>
  );
}
