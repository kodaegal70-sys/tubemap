'use client';

export default function PrivacyPage() {
    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', fontFamily: 'Pretendard, sans-serif' }}>
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '20px' }}>개인정보처리방침</h1>
            <p style={{ color: '#666', marginBottom: '40px' }}>최종 수정일: 2026년 1월 27일</p>

            <section style={{ marginBottom: '40px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>1. 개인정보의 처리 목적</h2>
                <p style={{ lineHeight: '1.8', marginBottom: '12px' }}>
                    TubeMap은 맛집 정보를 지도에서 탐색할 수 있는 서비스를 제공합니다. 현재 TubeMap은 회원가입 기능이 없으며,
                    사용자의 개인정보를 최소한으로 처리하는 것을 원칙으로 합니다.
                </p>
                <ul style={{ lineHeight: '1.8', paddingLeft: '20px' }}>
                    <li>서비스 제공 및 안정적인 운영(오류/성능 확인 등)</li>
                    <li>광고 게재 및 서비스 운영 비용 충당(Google AdSense 등)</li>
                    <li>사용자 문의 대응</li>
                </ul>
            </section>

            <section style={{ marginBottom: '40px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>2. 현재 수집하는 정보</h2>
                <p style={{ lineHeight: '1.8', marginBottom: '12px' }}>
                    TubeMap은 현재 서비스 이용을 위해 사용자의 이름, 전화번호, 계정 정보 등 일반적인 개인정보를 직접 수집하지 않습니다.
                    다만 서비스 운영 과정에서 아래 정보가 자동으로 생성·처리될 수 있습니다.
                </p>
                <ul style={{ lineHeight: '1.8', paddingLeft: '20px' }}>
                    <li><strong>기술적 로그 정보(자동):</strong> IP 주소, 브라우저 종류, OS 정보, 접속 일시 등(호스팅/보안/오류 분석 목적)</li>
                    <li><strong>쿠키(자동):</strong> 서비스 이용 기록 및 광고 맞춤화를 위한 쿠키(제3자 광고 네트워크 포함)</li>
                </ul>
                <p style={{ lineHeight: '1.8', marginTop: '12px', color: '#666' }}>
                    ※ TubeMap은 현재 사용자의 위치 정보 및 검색 기록을 서버(DB)에 저장하지 않습니다.
                    지도 탐색을 위해 위치 권한을 요청하는 기능이 도입되더라도, 사용자의 위치는 사용자의 기기에서 일시적으로 활용될 수 있으며
                    별도 저장은 하지 않습니다.
                </p>
            </section>

            <section style={{ marginBottom: '40px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>3. 쿠키 및 광고 정책</h2>
                <p style={{ lineHeight: '1.8', marginBottom: '12px' }}>
                    Google을 포함한 제3자 제공업체는 사용자의 이전 웹사이트 방문 정보를 바탕으로 광고를 게재하기 위해 쿠키를 사용할 수 있습니다.
                    Google의 광고 쿠키 사용을 통해 Google 및 파트너사는 사용자의 본 사이트 및 다른 사이트 방문 정보를 토대로 맞춤 광고를 제공할 수 있습니다.
                    사용자는{' '}
                    <a
                        href="https://www.google.com/settings/ads"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#E53935', textDecoration: 'underline' }}
                    >
                        Google 광고 설정
                    </a>
                    에서 맞춤 광고를 거부할 수 있습니다.
                </p>
            </section>

            <section style={{ marginBottom: '40px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>4. 제3자 서비스 이용</h2>
                <p style={{ lineHeight: '1.8', marginBottom: '12px' }}>
                    TubeMap은 아래의 제3자 서비스를 이용할 수 있습니다. 각 서비스는 자체 개인정보처리방침을 따르며, 해당 정책을 확인하시기 바랍니다.
                </p>
                <ul style={{ lineHeight: '1.8', paddingLeft: '20px' }}>
                    <li><strong>Kakao Maps API:</strong> 지도 서비스 제공</li>
                    <li><strong>Supabase:</strong> 데이터베이스 및 백엔드 서비스</li>
                    <li><strong>YouTube API:</strong> 영상 콘텐츠 연동</li>
                    <li><strong>Google AdSense:</strong> 광고 게재</li>
                </ul>
            </section>

            <section style={{ marginBottom: '40px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>5. 향후 기능 도입 시 수집될 수 있는 정보</h2>
                <p style={{ lineHeight: '1.8' }}>
                    향후 “업체 정보 업로드(사장님 업로드)” 기능이 도입될 경우, 업로드 처리 및 연락을 위해 이메일 주소 등 최소한의 정보를
                    <strong> 별도 동의</strong> 후 수집할 수 있습니다. 수집 항목, 보관 기간, 이용 목적은 기능 도입 시 본 방침을 통해 고지하고,
                    필요한 경우 별도의 동의를 받습니다.
                </p>
            </section>

            <section style={{ marginBottom: '40px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>6. 보유 및 파기</h2>
                <p style={{ lineHeight: '1.8' }}>
                    TubeMap이 개인정보를 수집하는 경우, 수집 목적 달성 후 지체 없이 파기합니다. 다만 관계 법령에 따라 보관이 필요한 경우에는
                    법령에서 정한 기간 동안 보관할 수 있습니다.
                </p>
            </section>

            <section style={{ marginBottom: '40px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>7. 문의</h2>
                <p style={{ lineHeight: '1.8' }}>
                    개인정보 처리에 관한 문의사항은{' '}
                    <a href="/contact" style={{ color: '#E53935', textDecoration: 'underline' }}>
                        문의하기
                    </a>{' '}
                    페이지를 통해 연락 주시기 바랍니다.
                </p>
            </section>
        </div>
    );
}
