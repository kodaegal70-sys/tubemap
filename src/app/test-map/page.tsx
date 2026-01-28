'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

export default function TestMapPage() {
    const mapRef = useRef<HTMLDivElement>(null);
    const [status, setStatus] = useState('스크립트 로딩 전');
    const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;

    const initMap = () => {
        setStatus('스크립트 로드 완료. 지도 초기화 시도...');

        if (!window.naver || !window.naver.maps) {
            setStatus('오류: window.naver 객체를 찾을 수 없습니다.');
            return;
        }

        try {
            const map = new window.naver.maps.Map(mapRef.current, {
                center: new window.naver.maps.LatLng(37.5666805, 126.9784147),
                zoom: 15,
            });
            setStatus('지도 초기화 성공! (지도가 보이면 인증 성공입니다)');
            console.log('Test Map initialized:', map);
        } catch (err: any) {
            setStatus(`지도 초기화 실패: ${err.message}`);
            console.error('Map init error:', err);
        }
    };

    return (
        <div style={{ padding: 20 }}>
            <h1>네이버 지도 API 진단 페이지</h1>
            <p><strong>현재 상태:</strong> {status}</p>
            <p><strong>Client ID:</strong> {clientId}</p>

            {/* 네이버 지도 Native SDK 직접 로드 */}
            <Script
                strategy="afterInteractive"
                src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${clientId}`}
                onReady={initMap}
                onError={() => setStatus('스크립트 로드 실패 (네트워크 또는 차단 문제)')}
            />

            <div
                ref={mapRef}
                style={{
                    width: '100%',
                    height: '400px',
                    backgroundColor: '#f0f0f0',
                    marginTop: 20,
                    border: '1px solid #ccc'
                }}
            >
                지도가 여기에 표시됩니다.
            </div>
        </div>
    );
}
