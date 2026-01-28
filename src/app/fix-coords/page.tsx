'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function FixCoordsPage() {
    const [places, setPlaces] = useState<any[]>([]);
    const [results, setResults] = useState<any[]>([]);
    const [status, setStatus] = useState('Idle');

    useEffect(() => {
        // Kakao SDK Load
        const script = document.createElement('script');
        script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_CLIENT_ID}&libraries=services&autoload=false`;
        script.async = true;

        script.onload = () => {
            window.kakao.maps.load(() => {
                setStatus('SDK Loaded');
                fetchPlaces();
            });
        };
        document.head.appendChild(script);
    }, []);

    const fetchPlaces = async () => {
        setStatus('Fetching Places...');
        const { data } = await supabase.from('places').select('*').gt('id', 0); // All places
        if (data) {
            setPlaces(data);
            geocodePlaces(data);
        }
    };

    // 거리 계산 함수 (Haversine formula)
    const getDistanceFromLatLonInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371; // Radius of the earth in km
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c * 1000; // Distance in meters
    };

    const geocodePlaces = async (list: any[]) => {
        setStatus(`Analyzing ${list.length} places with Kakao's native coordinate system...`);
        const geocoder = new window.kakao.maps.services.Geocoder();
        const ps = new window.kakao.maps.services.Places(); // 장소 검색 객체 추가

        const newResults: any[] = [];
        let updatedCount = 0;
        let totalDrift = 0;

        for (const place of list) {
            if (!place.address || place.address.length < 2) {
                newResults.push({ id: place.id, name: place.name, status: 'Skip (No Addr)', address: place.address });
                continue;
            }

            // Helper function for DB update
            const updateDB = async (newLat: number, newLng: number, source: string) => {
                const drift = place.lat ? getDistanceFromLatLonInKm(place.lat, place.lng, newLat, newLng) : 0;
                totalDrift += drift;

                if (!place.lat || drift > 5) {
                    const { error } = await supabase
                        .from('places')
                        .update({ lat: newLat, lng: newLng })
                        .eq('id', place.id);

                    if (!error) {
                        updatedCount++;
                        newResults.push({
                            id: place.id,
                            name: place.name,
                            status: `Fixed (${source}) 🛠️`,
                            drift: `${Math.round(drift)}m`,
                            old: `${place.lat?.toFixed(4)}, ${place.lng?.toFixed(4)}`,
                            new: `${newLat.toFixed(4)}, ${newLng.toFixed(4)}`
                        });
                    } else {
                        newResults.push({ id: place.id, name: place.name, status: 'DB Error', error: error.message });
                    }
                } else {
                    newResults.push({ id: place.id, name: place.name, status: 'Good ✅', drift: '0m' });
                }
            };

            await new Promise<void>((resolve) => {
                // 1. 주소 검색 시도
                geocoder.addressSearch(place.address, async (result: any, status: any) => {
                    if (status === window.kakao.maps.services.Status.OK) {
                        const { y, x } = result[0];
                        await updateDB(parseFloat(y), parseFloat(x), 'Addr');
                        setTimeout(resolve, 100);
                    } else {
                        // 2. 실패 시 장소(키워드) 검색 시도 (Fallback)
                        console.log(`Address failed for ${place.name}, trying keyword search...`);
                        ps.keywordSearch(place.name, async (data: any, status: any) => {
                            if (status === window.kakao.maps.services.Status.OK) {
                                // 검색 결과 중 첫 번째(가장 정확도 높음) 선택
                                const { y, x } = data[0];
                                await updateDB(parseFloat(y), parseFloat(x), 'Keyword');
                            } else {
                                console.error(`Failed to geocode: ${place.name} (${place.address})`);
                                newResults.push({
                                    id: place.id,
                                    name: place.name,
                                    status: 'Unknown ❌',
                                    address: place.address
                                });
                            }
                            setTimeout(resolve, 150);
                        });
                    }
                });
            });
        }
        setResults(newResults);
        setStatus(`Diagnostics Complete. Corrected ${updatedCount} locations. Total Drift Corrected: ${Math.round(totalDrift)}m`);
    };

    return (
        <div style={{ padding: 20 }}>
            <h1>Coordinate Fixer</h1>
            <p>Status: {status}</p>
            <textarea
                style={{ width: '100%', height: '500px', fontFamily: 'monospace' }}
                value={JSON.stringify(results, null, 2)}
                readOnly
            />
        </div>
    );
}
