'use client';

export default function PrivacyPage() {
    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', fontFamily: 'Pretendard, sans-serif' }}>
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '20px' }}>개인정보처리방침</h1>
            <p style={{ color: '#666', marginBottom: '40px' }}>최종 수정일: 2026년 1월 27일</p>

            <section style={{ marginBottom: '40px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>1. 개인정보의 수집 및 이용 목적</h2>
                <p style={{ lineHeight: '1.8', marginBottom: '12px' }}>
                    TubeMap은 다음과 같은 목적으로 개인정보를 수집하고 이용합니다:
                </p>
                <ul style={{ lineHeight: '1.8', paddingLeft: '20px' }}>
                    <li>서비스 제공 및 맞춤형 콘텐츠 추천</li>
                    <li>사용자 위치 기반 맛집 정보 제공</li>
                    <li>서비스 개선 및 통계 분석</li>
                    <li>광고 게재 및 마케팅 활용</li>
                </ul>
            </section>

            <section style={{ marginBottom: '40px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>2. 수집하는 개인정보 항목</h2>
                <p style={{ lineHeight: '1.8', marginBottom: '12px' }}>
                    TubeMap은 다음과 같은 정보를 수집할 수 있습니다:
                </p>
                <ul style={{ lineHeight: '1.8', paddingLeft: '20px' }}>
                    <li><strong>위치 정보:</strong> 사용자의 현재 위치 (사용자 동의 시)</li>
                    <li><strong>검색 기록:</strong> 맛집 검색어 및 클릭 기록</li>
                    <li><strong>기기 정보:</strong> IP 주소, 브라우저 종류, OS 정보</li>
                    <li><strong>쿠키:</strong> 서비스 이용 기록 및 광고 맞춤화를 위한 쿠키</li>
                </ul>
            </section>

            <section style={{ marginBottom: '40px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>3. 쿠키 및 광고 정책</h2>
                <p style={{ lineHeight: '1.8', marginBottom: '12px' }}>
                    본 서비스는 Google AdSense를 통해 광고를 게재하며, 이 과정에서 쿠키가 사용될 수 있습니다.
                    Google은 사용자의 관심사에 맞는 광고를 제공하기 위해 쿠키를 사용하며, 사용자는
                    <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" style={{ color: '#E53935', textDecoration: 'underline' }}> Google 광고 설정</a>
                    에서 맞춤 광고를 거부할 수 있습니다.
                </p>
            </section>

            <section style={{ marginBottom: '40px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>4. 제3자 서비스 제공</h2>
                <p style={{ lineHeight: '1.8', marginBottom: '12px' }}>
                    TubeMap은 다음과 같은 제3자 서비스를 이용합니다:
                </p>
                <ul style={{ lineHeight: '1.8', paddingLeft: '20px' }}>
                    <li><strong>Kakao Maps API:</strong> 지도 서비스 제공</li>
                    <li><strong>Supabase:</strong> 데이터베이스 및 백엔드 서비스</li>
                    <li><strong>YouTube API:</strong> 영상 콘텐츠 연동</li>
                    <li><strong>Naver Search API:</strong> 이미지 검색 및 정보 수집</li>
                    <li><strong>Google AdSense:</strong> 광고 게재</li>
                </ul>
                <p style={{ lineHeight: '1.8', marginTop: '12px' }}>
                    각 서비스는 자체 개인정보처리방침을 따르며, 해당 정책을 확인하시기 바랍니다.
                </p>
            </section>

            <section style={{ marginBottom: '40px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>5. 개인정보의 보유 및 이용 기간</h2>
                <p style={{ lineHeight: '1.8' }}>
                    수집된 개인정보는 서비스 제공 기간 동안 보유되며, 사용자가 삭제를 요청하거나
                    서비스 이용이 종료된 경우 지체 없이 파기됩니다.
                </p>
            </section>

            <section style={{ marginBottom: '40px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>6. 사용자의 권리</h2>
                <p style={{ lineHeight: '1.8' }}>
                    사용자는 언제든지 자신의 개인정보에 대한 열람, 수정, 삭제를 요청할 수 있으며,
                    위치 정보 수집 동의를 철회할 수 있습니다.
                </p>
            </section>

            <section style={{ marginBottom: '40px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>7. 문의</h2>
                <p style={{ lineHeight: '1.8' }}>
                    개인정보 처리에 관한 문의사항은 <a href="/contact" style={{ color: '#E53935', textDecoration: 'underline' }}>문의하기</a> 페이지를 통해 연락 주시기 바랍니다.
                </p>
            </section>
        </div>
    );
}
