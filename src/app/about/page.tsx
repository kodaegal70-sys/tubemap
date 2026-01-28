'use client';

export default function AboutPage() {
    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', fontFamily: 'Pretendard, sans-serif' }}>
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '20px' }}>TubeMap 소개</h1>

            <section style={{ marginBottom: '40px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>우리의 미션</h2>
                <p style={{ lineHeight: '1.8', fontSize: '18px', color: '#333' }}>
                    "유튜브에 소개된 맛집을 지도로 쉽게 찾자"
                </p>
                <p style={{ lineHeight: '1.8', marginTop: '16px' }}>
                    TubeMap은 유튜브 먹방, 맛집 소개 영상에 등장한 맛집들을 한눈에 볼 수 있는
                    지도 기반 서비스입니다. 수요미식회, 식객 허영만, 쯔양, 히밥 등 인기 유튜버와
                    방송 프로그램에서 소개된 검증된 맛집 정보를 제공합니다.
                </p>
            </section>

            <section style={{ marginBottom: '40px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>주요 기능</h2>
                <ul style={{ lineHeight: '2', paddingLeft: '20px' }}>
                    <li><strong>지도 기반 탐색:</strong> 내 주변 또는 원하는 지역의 유명 맛집을 지도에서 바로 확인</li>
                    <li><strong>미디어 필터링:</strong> 좋아하는 유튜버나 방송 프로그램별로 맛집 필터링</li>
                    <li><strong>상세 정보 제공:</strong> 주소, 전화번호, 대표 메뉴, 소개 영상 링크 제공</li>
                    <li><strong>실시간 검색:</strong> 맛집 이름이나 지역으로 빠른 검색</li>
                </ul>
            </section>

            <section style={{ marginBottom: '40px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>데이터 출처</h2>
                <p style={{ lineHeight: '1.8', marginBottom: '12px' }}>
                    TubeMap의 맛집 정보는 다음과 같은 공개 소스에서 수집됩니다:
                </p>
                <ul style={{ lineHeight: '1.8', paddingLeft: '20px' }}>
                    <li>유튜브 공개 영상 및 방송 프로그램</li>
                    <li>Naver Maps 및 Kakao Maps 공개 정보</li>
                    <li>공개된 블로그 및 리뷰 사이트</li>
                </ul>
                <p style={{ lineHeight: '1.8', marginTop: '12px' }}>
                    모든 정보는 정확성을 위해 지속적으로 검증되고 업데이트됩니다.
                </p>
            </section>

            <section style={{ marginBottom: '40px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>기술 스택</h2>
                <p style={{ lineHeight: '1.8' }}>
                    TubeMap은 최신 웹 기술을 활용하여 빠르고 안정적인 서비스를 제공합니다:
                </p>
                <ul style={{ lineHeight: '1.8', paddingLeft: '20px', marginTop: '12px' }}>
                    <li><strong>Frontend:</strong> Next.js, React, TypeScript</li>
                    <li><strong>Map:</strong> Kakao Maps SDK</li>
                    <li><strong>Backend:</strong> Supabase</li>
                    <li><strong>APIs:</strong> YouTube API, Naver Search API</li>
                </ul>
            </section>

            <section style={{ marginBottom: '40px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>문의</h2>
                <p style={{ lineHeight: '1.8' }}>
                    서비스 개선 제안, 맛집 정보 추가 요청, 오류 신고 등은
                    <a href="/contact" style={{ color: '#E53935', textDecoration: 'underline', marginLeft: '4px' }}>문의하기</a>
                    페이지를 통해 연락 주시기 바랍니다.
                </p>
            </section>

            <div style={{ marginTop: '60px', padding: '20px', background: '#f9f9f9', borderRadius: '8px', textAlign: 'center' }}>
                <p style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>맛있는 여행, TubeMap과 함께하세요! 🍽️</p>
                <p style={{ color: '#666' }}>© 2026 TubeMap. All rights reserved.</p>
            </div>
        </div>
    );
}
