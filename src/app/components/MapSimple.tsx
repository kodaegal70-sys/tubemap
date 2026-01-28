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

export default function MapSimpleComponent({ places, focusedPlace, onMarkerClick, onMapMove }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (onMapMove) {
            onMapMove(places);
        }
    }, [places, onMapMove]);

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100dvh",
                backgroundColor: '#f0f0f0',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column'
            }}
        >
            <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>
                🗺️ 지도 영역
            </div>
            <div style={{ fontSize: '16px', color: '#666', marginBottom: '30px' }}>
                {places.length}개의 장소가 있습니다
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px', maxWidth: '800px' }}>
                {places.slice(0, 6).map(place => (
                    <div
                        key={place.id}
                        onClick={() => onMarkerClick?.(place)}
                        style={{
                            padding: '10px',
                            backgroundColor: focusedPlace?.id === place.id ? '#007bff' : '#fff',
                            border: '1px solid #ddd',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            textAlign: 'center'
                        }}
                    >
                        <div style={{ fontWeight: 'bold' }}>{place.name}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>{place.category}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
