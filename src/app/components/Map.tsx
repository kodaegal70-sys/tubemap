'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Place } from '@/data/places';
import PlaceImage from './PlaceImage';

type Props = {
    places: Place[];
    focusedPlace?: Place | null;
    onMapMove?: (visiblePlaces: Place[]) => void;
    onMapStateChange?: (center: { lat: number; lng: number }, zoom: number) => void;
    onMarkerClick?: (place: Place) => void;
    onManualInteraction?: () => void;
    fitBoundsTrigger?: number;
    isMobile?: boolean;
    mobileSheetState?: 'peek' | 'half' | 'full';
    myLocation?: { lat: number; lng: number } | null;
    searchKeyword?: string;
};

declare global { interface Window { kakao: any; } }

const BASE_IMAGE_SRC = "/images/logo.png";
const ACTIVE_IMAGE_SRC = "/images/logo.png";

export default function MapComponent({ places, focusedPlace, onMapMove, onMapStateChange, onMarkerClick, onManualInteraction, fitBoundsTrigger, isMobile, mobileSheetState, myLocation, searchKeyword }: Props) {
    const mapRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isSdkLoaded, setIsSdkLoaded] = useState(false);

    // [STABILITY] 최신 props를 항상 참조할 수 있도록 Ref 사용
    const propsRef = useRef({ places, onMapMove, onManualInteraction, isMobile, mobileSheetState });
    useEffect(() => {
        propsRef.current = { places, onMapMove, onManualInteraction, isMobile, mobileSheetState };
    }, [places, onMapMove, onManualInteraction, isMobile, mobileSheetState]);

    const markersRef = useRef<Array<{ marker: any; place: Place }>>([]);
    const clustererRef = useRef<any>(null);
    const isProgrammaticMove = useRef(false);
    const [activePlaceId, setActivePlaceId] = useState<number | null>(null);

    // 1. SDK Loading - Map.tsx가 직접 스크립트 로드 (원래 패턴 복원)
    useEffect(() => {
        if (isSdkLoaded) return;
        if (typeof window === 'undefined') return;

        const appKey = process.env.NEXT_PUBLIC_KAKAO_MAP_CLIENT_ID;
        if (!appKey) {
            console.error('NEXT_PUBLIC_KAKAO_MAP_CLIENT_ID 가 설정되어 있지 않습니다.');
            return;
        }

        // 이미 SDK가 로드된 경우
        if (window.kakao && window.kakao.maps) {
            window.kakao.maps.load(() => {
                setIsSdkLoaded(true);
            });
            return;
        }

        // 스크립트 동적 로드
        const script = document.createElement('script');
        script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&libraries=services,clusterer&autoload=false`;
        script.async = true;
        script.onload = () => {
            if (window.kakao && window.kakao.maps) {
                window.kakao.maps.load(() => {
                    setIsSdkLoaded(true);
                });
            }
        };
        script.onerror = (e) => {
            console.error('Kakao SDK 스크립트 로드 실패:', e);
        };
        document.head.appendChild(script);
    }, [isSdkLoaded]);

    // 2. Map Initialization & Fixed Logic
    const calculateVisible = useCallback(() => {
        const map = mapRef.current;
        if (!map) return;
        const { places: latestPlaces, onMapMove: latestOnMapMove } = propsRef.current;
        if (!latestOnMapMove) return;

        // [심플] 카카오맵 bounds 기준으로 현재 화면 안의 핀만 계산
        const bounds = map.getBounds();
        if (!bounds) return;

        const visible = latestPlaces.filter((p) => {
            const latlng = new window.kakao.maps.LatLng(p.lat, p.lng);
            return bounds.contain(latlng);
        });

        latestOnMapMove(visible);
    }, []);

    useEffect(() => {
        if (!isSdkLoaded) return;
        let map = mapRef.current;

        if (!map) {
            if (!containerRef.current) return;
            try {
                map = new window.kakao.maps.Map(containerRef.current, {
                    center: new window.kakao.maps.LatLng(37.5665, 126.9780),
                    level: 5,
                });
                map.setDraggable(true);
                mapRef.current = map;
            } catch (error) {
                console.error('Failed to initialize map:', error);
                return;
            }
        }

        const handleIdle = () => {
            calculateVisible();
            if (!isProgrammaticMove.current && propsRef.current.onManualInteraction) {
                propsRef.current.onManualInteraction();
            }
            if (onMapStateChange) {
                const center = map.getCenter();
                onMapStateChange({ lat: center.getLat(), lng: center.getLng() }, map.getLevel());
            }
            setTimeout(() => { isProgrammaticMove.current = false; }, 300);
        };

        window.kakao.maps.event.addListener(map, 'idle', handleIdle);
        window.kakao.maps.event.addListener(map, 'click', () => {
            if (propsRef.current.onManualInteraction) propsRef.current.onManualInteraction();
        });
        window.kakao.maps.event.addListener(map, 'dragstart', () => {
            if (propsRef.current.onManualInteraction) propsRef.current.onManualInteraction();
        });

        calculateVisible();

        return () => {
            if (map) {
                window.kakao.maps.event.removeListener(map, 'idle', handleIdle);
                // click/dragstart는 간단히 정리하거나 무시 (이벤트가 많지 않으므로)
            }
        };
    }, [isSdkLoaded, onMapStateChange, calculateVisible]);

    // [중요] 필터 등으로 places가 변경되면 지도가 움직이지 않아도 가시성 재계산
    useEffect(() => {
        if (isSdkLoaded && mapRef.current) {
            calculateVisible();
        }
    }, [places, isSdkLoaded, calculateVisible]);

    // 3. Markers Management
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !isSdkLoaded) return;

        // 클러스터러 초기화
        if (!clustererRef.current) {
            clustererRef.current = new window.kakao.maps.MarkerClusterer({
                map,
                averageCenter: true,
                minLevel: 5, // 5 레벨 이하로 들어가면 개별 마커로 분해
                disableClickZoom: false,
            });
        }

        const clusterer = clustererRef.current;
        const baseMarkerImage = new window.kakao.maps.MarkerImage(BASE_IMAGE_SRC, new window.kakao.maps.Size(32, 32), { offset: new window.kakao.maps.Point(16, 30) });
        const activeMarkerImage = new window.kakao.maps.MarkerImage(ACTIVE_IMAGE_SRC, new window.kakao.maps.Size(44, 44), { offset: new window.kakao.maps.Point(22, 40) });

        // 기존 마커/클러스터 제거
        markersRef.current.forEach(({ marker }) => marker.setMap(null));
        markersRef.current = [];
        clusterer.clear();

        // 새 마커 생성
        const newMarkers: any[] = [];
        places.forEach(place => {
            const isActive = activePlaceId === place.id;
            const marker = new window.kakao.maps.Marker({
                position: new window.kakao.maps.LatLng(place.lat, place.lng),
                image: isActive ? activeMarkerImage : baseMarkerImage,
                zIndex: isActive ? 20 : 1,
            });

            // 마커 클릭 이벤트: 우측 패널 상세용 콜백만 호출 (지도 위 오버레이는 사용하지 않음)
            window.kakao.maps.event.addListener(marker, 'click', () => {
                if (onMarkerClick) onMarkerClick(place);
            });

            markersRef.current.push({ marker, place });
            newMarkers.push(marker);
        });

        // 클러스터러에 마커 적용
        if (newMarkers.length > 0) {
            clusterer.addMarkers(newMarkers);
        }
    }, [places, activePlaceId, onMarkerClick, isSdkLoaded]);

    const focusedPlaceId = focusedPlace?.id;
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !isSdkLoaded || !focusedPlace) {
            if (!focusedPlace) setActivePlaceId(null);
            return;
        }

        setActivePlaceId(focusedPlace.id);
        isProgrammaticMove.current = true;

        if (map.getLevel() > 4) map.setLevel(4);
        map.panTo(new window.kakao.maps.LatLng(focusedPlace.lat, focusedPlace.lng));

        // [MOBILE UX] 바텀시트 half에서 마커가 "상단 영역 중앙"에 오도록 Y 오프셋 적용
        const latestIsMobile = propsRef.current.isMobile;
        const latestSheetState = propsRef.current.mobileSheetState;
        if (latestIsMobile && latestSheetState === 'half' && containerRef.current) {
            const h = containerRef.current.clientHeight;
            const offsetY = Math.round(h * 0.17);
            setTimeout(() => {
                if (!mapRef.current) return;
                try {
                    mapRef.current.panBy(0, offsetY);
                } catch (e) {
                    // ignore
                }
            }, 250);
        }
    }, [focusedPlaceId, isSdkLoaded]);

    // 5. fitBounds
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !fitBoundsTrigger || places.length === 0 || !isSdkLoaded) return;
        const bounds = new window.kakao.maps.LatLngBounds();
        places.forEach(p => bounds.extend(new window.kakao.maps.LatLng(p.lat, p.lng)));
        map.setBounds(bounds);
    }, [fitBoundsTrigger, places, isSdkLoaded]);

    // 6. My Location
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !isSdkLoaded || !myLocation) return;
        isProgrammaticMove.current = true;
        map.setLevel(4);
        map.panTo(new window.kakao.maps.LatLng(myLocation.lat, myLocation.lng));
    }, [myLocation, isSdkLoaded]);

    // 7. Keyword Search & Move (지역명 검색 시 영역 이동)
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !isSdkLoaded || !searchKeyword || searchKeyword.trim() === '') return;

        console.log('Searching for keyword:', searchKeyword);
        const ps = new window.kakao.maps.services.Places();

        ps.keywordSearch(searchKeyword, (data: any, status: any) => {
            if (status === window.kakao.maps.services.Status.OK) {
                const bounds = new window.kakao.maps.LatLngBounds();
                let hasValidResults = false;

                // 검색 결과들을 포함하는 범위 계산
                for (let i = 0; i < data.length; i++) {
                    // 주소 검색 결과가 아닌 일반 장소 검색 결과 중에서도 지역명 필터링 가능
                    // 여기서는 모든 결과의 범위를 확장
                    bounds.extend(new window.kakao.maps.LatLng(data[i].y, data[i].x));
                    hasValidResults = true;
                }

                if (hasValidResults) {
                    isProgrammaticMove.current = true;
                    map.setBounds(bounds);

                    // 사용자가 요청한 대로 줌 레벨을 7로 고정
                    setTimeout(() => {
                        if (mapRef.current) mapRef.current.setLevel(7);
                    }, 100);
                }
            } else if (status === window.kakao.maps.services.Status.ZERO_RESULT) {
                // 장소 검색 결과가 없으면 주소 검색 시도
                const geocoder = new window.kakao.maps.services.Geocoder();
                geocoder.addressSearch(searchKeyword, (result: any, status: any) => {
                    if (status === window.kakao.maps.services.Status.OK) {
                        const bounds = new window.kakao.maps.LatLngBounds();
                        result.forEach((res: any) => {
                            bounds.extend(new window.kakao.maps.LatLng(res.y, res.x));
                        });
                        isProgrammaticMove.current = true;
                        map.setBounds(bounds);

                        // 주소 검색 시에도 줌 레벨을 7로 고정
                        setTimeout(() => {
                            if (mapRef.current) mapRef.current.setLevel(7);
                        }, 100);
                    }
                });
            }
        });
    }, [searchKeyword, isSdkLoaded]);

    return <div ref={containerRef} style={{ width: "100%", height: "100dvh" }} />;
}
