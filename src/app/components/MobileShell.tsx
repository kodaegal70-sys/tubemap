'use client';

import { useEffect, useMemo, useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMobile, DiscoveryFilter } from '../contexts/MobileContext';
import { Place } from '@/data/places';
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

  // URL 파라미터와 동기화
  useEffect(() => {
    if (!placeIdParam) {
      setSelectedPlaceId(null);
      setSheetState('peek');
    } else if (allPlaces.length > 0) {
      const p = allPlaces.find(pl => pl.id.toString() === placeIdParam);
      if (p) {
        setSelectedPlaceId(p.id);
        setSheetState('half');
      }
    }
  }, [placeIdParam, allPlaces, setSelectedPlaceId, setSheetState]);

  // 필터링된 장소 계산
  const filteredPlaces = useMemo(() => {
    return allPlaces.filter(p => {
      // 카테고리 필터
      const catMatch = categoryFilter.length === 0 || categoryFilter.includes(p.category || '기타');

      // 디스커버리 필터 (미디어)
      const mediaMatch = discoveryFilter.selectedMedia.length === 0 ||
        discoveryFilter.selectedMedia.includes(p.media.split('|')[0]);

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
    setSheetState('half');
    router.replace('/', { scroll: false });
  }, [setSelectedPlaceId, setSheetState, router]);

  // 검색 핸들러
  const handleSearch = useCallback(async (keyword: string) => {
    if (keyword.trim()) {
      const filtered = filteredPlaces.filter(p =>
        p.name.includes(keyword) ||
        p.address?.includes(keyword) ||
        p.description?.includes(keyword)
      );

      // 검색 결과가 있으면 첫 번째 장소 선택
      if (filtered.length > 0) {
        setPlaces(filtered);
        const firstPlace = filtered[0];
        setSelectedPlaceId(firstPlace.id);
        setSheetState('half');
        router.push(`?placeId=${firstPlace.id}`, { scroll: false });
      } else {
        // 검색 결과가 없으면 Kakao 지오코딩으로 지역 검색
        try {
          // 먼저 주소 검색 시도
          let response = await fetch(
            `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(keyword)}`,
            {
              headers: {
                Authorization: `KakaoAK 4f9be0b1a37f4ccb4512a300a3f067a6`,
              },
            }
          );
          let data = await response.json();

          console.log('주소 검색 결과:', data);

          // 주소 검색 결과가 없으면 키워드 검색 시도
          if (!data.documents || data.documents.length === 0) {
            response = await fetch(
              `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(keyword)}`,
              {
                headers: {
                  Authorization: `KakaoAK 4f9be0b1a37f4ccb4512a300a3f067a6`,
                },
              }
            );
            data = await response.json();
            console.log('키워드 검색 결과:', data);
          }

          if (data.documents && data.documents.length > 0) {
            const location = data.documents[0];
            // 가상의 Place 객체 생성
            const virtualPlace: Place = {
              id: -1,
              name: location.address_name || location.place_name || keyword,
              lat: parseFloat(location.y),
              lng: parseFloat(location.x),
              address: location.address_name || location.road_address_name || '',
              category: '기타',
              media: '검색 결과',
              description: `${keyword} 검색 결과`,
              image_url: '',
              naver_url: '',
              phone: '',
            };

            console.log('가상 Place 생성:', virtualPlace);

            // 가상 Place를 리스트에 추가하고 선택
            setPlaces([virtualPlace]);
            setSelectedPlaceId(virtualPlace.id);
            setSheetState('half');
          } else {
            setPlaces([]);
            alert('검색 결과가 없습니다.');
          }
        } catch (error) {
          console.error('지오코딩 실패:', error);
          setPlaces([]);
          alert('검색 중 오류가 발생했습니다.');
        }
      }
    } else {
      // 검색어가 없으면 필터링된 장소 사용
      setPlaces(filteredPlaces.slice(0, 50));
    }
  }, [filteredPlaces, setPlaces, setSelectedPlaceId, setSheetState, router]);

  // 카테고리 토글
  const handleCategoryToggle = useCallback((category: string) => {
    setCategoryFilter(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  }, [setCategoryFilter]);

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

  return (
    <div style={{ width: '100vw', height: '100dvh', position: 'relative', overflow: 'hidden' }}>
      {/* 지도 - 항상 배경에 고정 */}
      <MapComponent
        places={filteredPlaces}
        focusedPlace={focusedPlace}
        onMapMove={handleMapMove}
        onManualInteraction={onManualInteraction}
        onMarkerClick={handleMarkerClick}
        fitBoundsTrigger={0}
        isMobile={true}
        mobileSheetState={sheetState}
        myLocation={myLocation}
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
