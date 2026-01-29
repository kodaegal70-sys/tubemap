'use client';

import { useEffect, useMemo, useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMobile, DiscoveryFilter } from '../contexts/MobileContext';
import { Place, DUMMY_PLACES, checkCategoryMatch } from '@/data/places';
import { normalizeMediaName } from '@/lib/v3/utils/media';
import TopSearchBar from './TopSearchBar';
import BottomSheet from './BottomSheet';

const MapComponent = dynamic(() => import('./Map'), { ssr: false });

interface MobileShellProps {
  allPlaces: Place[];
  onMapMove: (visible: Place[]) => void;
  onManualInteraction: () => void;
}

export default function MobileShell({ allPlaces, onMapMove, onManualInteraction }: MobileShellProps) {
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
      const mediaStr = p.media_label || p.media;
      const mediaMatch = discoveryFilter.selectedMedia.length === 0 ||
        (mediaStr?.split(',').some(m => {
          const rawMedia = m.split('|')[0]?.trim();
          const normalized = normalizeMediaName(rawMedia);
          return discoveryFilter.selectedMedia.includes(normalized);
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

  // 필터 변경 시 places 업데이트 (리스트 탭일 때만)
  useEffect(() => {
    if (sheetTab === 'list') {
      // 필터링된 장소 중 일부를 표시 (최대 50개)
      setPlaces(filteredPlaces.slice(0, 50));
    }
  }, [filteredPlaces, sheetTab, setPlaces]);

  // 탭 변경 시 places 업데이트
  useEffect(() => {
    if (sheetTab === 'list') {
      // 리스트 탭으로 전환 시 필터링된 장소 표시
      setPlaces(filteredPlaces.slice(0, 50));
    }
  }, [sheetTab, filteredPlaces, setPlaces]);

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

  // 포커스 해제 핸들러 (토글용)
  const handleClearFocus = useCallback(() => {
    setSelectedPlaceId(null);
    router.replace('/', { scroll: false });
  }, [setSelectedPlaceId, router]);

  // 검색 핸들러
  const handleSearch = useCallback((keyword: string) => {
    const trimmed = keyword.trim();
    if (trimmed) {
      // 1) 전체 데이터(allPlaces)에서 업체명 우선 필터링
      const nameMatches = allPlaces.filter(p => p.name.includes(trimmed));
      const otherMatches = allPlaces.filter(p =>
        !p.name.includes(trimmed) &&
        (p.address?.includes(trimmed) || p.description?.includes(trimmed))
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
    setFitBoundsTrigger(prev => prev + 1); // 지도 영역 자동 조정 트리거
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

  // 수동 조작 시 로컬 검색 상태도 초기화
  const handleInternalManualInteraction = useCallback(() => {
    setSearchKeyword('');
    if (onManualInteraction) onManualInteraction();
  }, [onManualInteraction]);

  return (
    <div style={{ width: '100vw', height: '100dvh', position: 'relative', overflow: 'hidden' }}>
      {/* 지도 - 항상 배경에 고정 */}
      <MapComponent
        places={filteredPlaces}
        focusedPlace={focusedPlace}
        onMapMove={handleMapMove}
        onMarkerClick={handleMarkerClick}
        onManualInteraction={handleInternalManualInteraction}
        fitBoundsTrigger={fitBoundsTrigger}
        isMobile={true}
        mobileSheetState={sheetState}
        myLocation={myLocation}
        searchKeyword={searchKeyword}
      />

      {/* 상단 검색바 + 카테고리 칩 */}
      <TopSearchBar
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
