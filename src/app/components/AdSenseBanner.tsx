import React, { useEffect } from 'react';

const AdSenseBanner: React.FC = () => {
    useEffect(() => {
        try {
            // @ts-ignore
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (e) {
            console.error("AdSense push error", e);
        }
    }, []);

    return (
        <div style={{
            width: '100%',
            minHeight: '250px',
            marginTop: '20px',    // 12px 이상 확보
            marginBottom: '20px', // 12px 이상 확보
            textAlign: 'center',
            backgroundColor: '#f9f9f9', // 로딩 전 빈 공간 시각화 (선택사항)
            border: '1px solid #eee',
            overflow: 'hidden'
        }}>
            {/* 라벨: 광고 or Sponsored */}
            <div style={{
                fontSize: '10px',
                color: '#999',
                textAlign: 'right',
                padding: '4px 8px',
                borderBottom: '1px solid #eee'
            }}>
                광고
            </div>

            {/* Google AdSense Unit */}
            <ins className="adsbygoogle"
                style={{ display: 'block' }}
                data-ad-client="ca-pub-2499479542127705" // [UPDATED] 사용자 Client ID
                data-ad-slot="1234567890"               // [USER_ACTION] 여기에 실제 Slot ID 입력
                data-ad-format="auto"
                data-full-width-responsive="true"></ins>
        </div>
    );
};

export default AdSenseBanner;
