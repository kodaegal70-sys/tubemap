'use client';

import { useEffect, useRef, useState } from 'react';
import { Place } from '@/data/places';

type Props = {
    places: Place[];
    focusedPlace?: Place | null;
    onMapMove?: (visiblePlaces: Place[]) => void;
    onMapStateChange?: (center: { lat: number; lng: number }, zoom: number) => void;
    onMarkerClick?: (place: Place) => void;
    onManualInteraction?: () => void;
    fitBoundsTrigger?: number;
    isMobile?: boolean;
};

declare global { interface Window { naver: any; } }

export default function MapNaverComponent({ places, focusedPlace, onMapMove, onMapStateChange, onMarkerClick, onManualInteraction, fitBoundsTrigger, isMobile }: Props) {
    const mapRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isSdkLoaded, setIsSdkLoaded] = useState(false);
    const markersRef = useRef<any[]>([]);
    const [activePlaceId, setActivePlaceId] = useState<number | null>(null);

    // 1. SDK Loading
    useEffect(() => {
        const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;
        console.log('Naver Map Client ID:', clientId ? 'exists' : 'missing');
        
        if (!clientId) {
            console.error('Naver Map Client ID is missing');
            return;
        }
        if (window.naver && window.naver.maps) {
            console.log('Naver SDK already loaded');
            setIsSdkLoaded(true);
            return;
        }
        
        console.log('Loading Naver SDK...');
        const script = document.createElement('script');
        script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${clientId}`;
        script.async = true;
        script.onerror = (e) => {
            console.error('Failed to load Naver SDK:', e);
        };
        script.onload = () => {
            console.log('Naver SDK loaded successfully');
            setIsSdkLoaded(true);
        };
        document.head.appendChild(script);
    }, []);

    // 2. Map Initialization
    useEffect(() => {
        if (!isSdkLoaded || !containerRef.current || mapRef.current) return;

        console.log('Initializing Naver map...');
        try {
            const map = new window.naver.maps.Map(containerRef.current, {
                center: new window.naver.maps.LatLng(37.5665, 126.9780),
                zoom: 5,
            });
            mapRef.current = map;
            console.log('Naver map initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Naver map:', error);
            return;
        }
    }, [isSdkLoaded]);

    // 3. Markers Management
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        markersRef.current.forEach(m => m.setMap(null));
        markersRef.current = places.map(place => {
            const marker = new window.naver.maps.Marker({
                position: new window.naver.maps.LatLng(place.lat, place.lng),
                map: map,
            });
            window.naver.maps.Event.addListener(marker, 'click', () => {
                if (onMarkerClick) onMarkerClick(place);
            });
            return marker;
        });
    }, [places, onMarkerClick]);

    // 4. Focus Sync
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;
        if (!focusedPlace) {
            setActivePlaceId(null);
            return;
        }
        setActivePlaceId(focusedPlace.id);
        map.setCenter(new window.naver.maps.LatLng(focusedPlace.lat, focusedPlace.lng));
    }, [focusedPlace]);

    return <div ref={containerRef} style={{ width: "100%", height: "100dvh" }} />;
}
