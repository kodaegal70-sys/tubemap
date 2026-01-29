import { useEffect, useState } from 'react';

type Props = {
    type: 'SIDEBAR' | 'SIDEBAR_TOP' | 'FILTER' | 'MAP_BOTTOM';
    id: string;
};

export default function AdSlot({ type, id }: Props) {
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        // (window.adsbygoogle = window.adsbygoogle || []).push({});
    }, []);

    const getStyles = () => {
        switch (type) {
            case 'SIDEBAR':
            case 'SIDEBAR_TOP':
                return {
                    width: '100%',
                    minHeight: '100px',
                    margin: '0',
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
                    minHeight: '100px',
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
                    height: isExpanded ? '320px' : '90px',
                    background: 'rgba(255, 255, 255, 0.85)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    boxShadow: '0 -10px 40px rgba(0,0,0,0.12)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    fontSize: '12px',
                    color: '#333',
                    borderRadius: '24px 24px 0 0',
                    padding: '0',
                    transition: 'all 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    position: 'absolute',
                    bottom: '0',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 3000 // InfoBar(3500)보다는 낮게, 맵보다는 높게
                };
            default:
                return {};
        }
    };

    return (
        <div
            id={id}
            onMouseEnter={() => type === 'MAP_BOTTOM' && setIsExpanded(true)}
            onMouseLeave={() => type === 'MAP_BOTTOM' && setIsExpanded(false)}
            style={getStyles() as any}
        >
            {/* 상단 섹션: 항상 보이는 영역 */}
            <div style={{
                width: '100%',
                height: '90px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                background: isExpanded ? 'rgba(255,136,11,0.03)' : 'transparent'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        fontSize: '9px',
                        color: '#FA880B',
                        fontWeight: '900',
                        letterSpacing: '2px',
                        marginBottom: '6px',
                        textTransform: 'uppercase'
                    }}>
                        Premium Ad Channel
                    </div>
                    <div style={{
                        fontWeight: '800',
                        fontSize: '16px',
                        color: '#1a1a1a',
                        textShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}>
                        {type === 'MAP_BOTTOM' ? 'Tube Map Sponsor Exhibition' : 'Google AdSense'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#777', marginTop: '2px' }}>
                        {type === 'MAP_BOTTOM' ? (isExpanded ? '상세 정보를 확인 중입니다' : '마우스를 올리면 특별 혜택을 확인하실 수 있습니다') : '반응형 광고 영역'}
                    </div>
                </div>

                {type === 'MAP_BOTTOM' && (
                    <div style={{
                        position: 'absolute',
                        top: '15px',
                        right: '25px',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: isExpanded ? '#FA880B' : 'rgba(0,0,0,0.05)',
                        borderRadius: '50%',
                        color: isExpanded ? '#fff' : '#666',
                        fontSize: '10px',
                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'all 0.4s ease',
                    }}>
                        ▼
                    </div>
                )}
            </div>

            {/* 확장 섹션: 풍부한 컨텐츠 */}
            {type === 'MAP_BOTTOM' && (
                <div style={{
                    width: '100%',
                    opacity: isExpanded ? 1 : 0,
                    visibility: isExpanded ? 'visible' : 'hidden',
                    transform: isExpanded ? 'translateY(0)' : 'translateY(20px)',
                    transition: 'all 0.5s ease 0.1s',
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 40px 30px',
                    textAlign: 'center'
                }}>
                    <div style={{
                        width: '60px',
                        height: '2px',
                        background: '#eee',
                        marginBottom: '25px',
                        borderRadius: '1px'
                    }} />
                    <div style={{
                        fontWeight: '700',
                        fontSize: '17px',
                        marginBottom: '10px',
                        color: '#FA880B',
                        background: 'linear-gradient(90deg, #FA880B, #FFB74D)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        오늘의 추천 서비스 및 제휴 안내
                    </div>
                    <div style={{
                        fontSize: '13px',
                        color: '#555',
                        lineHeight: '1.7',
                        maxWidth: '520px',
                        marginBottom: '25px'
                    }}>
                        Tube Map과 함께하는 파트너사의 특별한 혜택을 만나보세요.
                        맛집 탐방의 수준을 한 단계 높여드리는 다양한 부가 서비스와
                        이벤트를 이곳에서 가장 먼저 안내해 드립니다.
                    </div>
                    <div style={{
                        padding: '12px 32px',
                        background: 'linear-gradient(135deg, #1a1a1a 0%, #333 100%)',
                        color: '#fff',
                        borderRadius: '30px',
                        fontSize: '13px',
                        fontWeight: '700',
                        boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
                        transition: 'transform 0.2s',
                    }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        혜택 자세히 보기
                    </div>
                </div>
            )}
        </div>
    );
}
