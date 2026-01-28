'use client';

import { useEffect } from 'react';

type Props = {
    type: 'SIDEBAR' | 'SIDEBAR_TOP' | 'FILTER' | 'MAP_BOTTOM';
    id: string;
};

export default function AdSlot({ type, id }: Props) {
    // 실제 애드센스 적용 시 여기에 스크립트 로드 로직이 들어갑니다.
    useEffect(() => {
        // try {
        //     (window.adsbygoogle = window.adsbygoogle || []).push({});
        // } catch (e) { console.error(e); }
    }, []);

    const getStyles = () => {
        switch (type) {
            case 'SIDEBAR':
            case 'SIDEBAR_TOP':
                return {
                    width: '100%',
                    minHeight: '100px',
                    margin: '0', // 부모의 gap(10px)만 사용하도록 여백 제거 
                    backgroundColor: '#f9f9f9',
                    border: '1px dashed #ccc',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    color: '#999',
                    borderRadius: '8px'
                };
            case 'FILTER':
                return {
                    width: '100%',
                    minHeight: '100px', // Sidebar와 동일하게 100px로 통일
                    marginTop: '8px',
                    backgroundColor: 'white',
                    border: '1px solid #eee',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    color: '#333',
                    borderRadius: '12px'
                };
            case 'MAP_BOTTOM':
                return {
                    width: '728px',
                    maxWidth: '90vw',
                    height: '150px',
                    backgroundColor: 'white',
                    border: '1px solid #ddd',
                    boxShadow: '0 -4px 15px rgba(0,0,0,0.15)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    fontSize: '12px',
                    color: '#333',
                    borderRadius: '12px 12px 0 0',
                    padding: '0',
                    transition: 'all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)',
                    cursor: 'pointer',
                    overflow: 'hidden'
                };
            default:
                return {};
        }
    };

    return (
        <>
            <style>{`
                .ad-slot-hover:hover {
                    transform: translateY(0) !important;
                    box-shadow: 0 -12px 35px rgba(0,0,0,0.3) !important;
                }
            `}</style>
            <div
                id={id}
                className={`ad-container ${type === 'MAP_BOTTOM' ? 'ad-slot-hover' : ''}`}
                style={{
                    ...getStyles(),
                    transform: type === 'MAP_BOTTOM' ? 'translateY(60px)' : 'none'
                } as any}
            >
                {/* 1. 상단 광고 본체 (90px - 항상 노출됨) */}
                <div style={{
                    width: '100%',
                    height: type === 'MAP_BOTTOM' ? '90px' : '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#fff',
                    borderBottom: type === 'MAP_BOTTOM' ? '1px solid #eee' : 'none'
                }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', color: '#aaa', fontWeight: 'bold' }}>ADVERTISEMENT</div>
                        <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#FA880B' }}>
                            {type === 'MAP_BOTTOM' ? 'Google AdSense (Leaderboard)' : 'Google AdSense'}
                        </div>
                        <div style={{ fontSize: '11px', color: '#666' }}>
                            {type === 'MAP_BOTTOM' ? '배너 광고 영역 (728x90)' :
                                type === 'FILTER' ? '반응형 광고 영역 (약 300x80)' :
                                    '반응형 광고 영역 (약 300x100)'}
                        </div>
                    </div>
                </div>

                {/* 2. 하단 상세 영역 (60px - 마우스 오버 시 노출) */}
                {type === 'MAP_BOTTOM' && (
                    <div style={{
                        width: '100%',
                        height: '60px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#f8f9fa',
                        fontSize: '11px',
                        color: '#888',
                        padding: '0 20px',
                        textAlign: 'center'
                    }}>
                        마우스 오버 시 나타나는 광고 상세 정보 및 추가 링크 영역입니다.
                    </div>
                )}
            </div>
        </>
    );
}
