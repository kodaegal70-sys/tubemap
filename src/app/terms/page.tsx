'use client';

export default function TermsPage() {
    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', fontFamily: 'Pretendard, sans-serif' }}>
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '20px' }}>이용약관</h1>
            <p style={{ color: '#666', marginBottom: '40px' }}>최종 수정일: 2026년 1월 27일</p>

            <section style={{ marginBottom: '40px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>1. 서비스 소개</h2>
                <p style={{ lineHeight: '1.8' }}>
                    TubeMap은 유튜브에 소개된 맛집을 지도 기반으로 쉽게 찾을 수 있도록 돕는 무료 웹 서비스입니다.
                    본 약관은 서비스 이용과 관련된 권리, 의무 및 책임사항을 규정합니다.
                </p>
            </section>

            <section style={{ marginBottom: '40px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>2. 서비스 이용</h2>
                <p style={{ lineHeight: '1.8', marginBottom: '12px' }}>
                    사용자는 다음 사항을 준수해야 합니다:
                </p>
                <ul style={{ lineHeight: '1.8', paddingLeft: '20px' }}>
                    <li>서비스를 불법적이거나 부적절한 목적으로 사용하지 않을 것</li>
                    <li>타인의 권리를 침해하거나 명예를 훼손하지 않을 것</li>
                    <li>서비스의 정상적인 운영을 방해하지 않을 것</li>
                    <li>자동화된 수단(크롤링, 스크래핑 등)으로 데이터를 무단 수집하지 않을 것</li>
                </ul>
            </section>

            <section style={{ marginBottom: '40px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>3. 콘텐츠 저작권</h2>
                <p style={{ lineHeight: '1.8', marginBottom: '12px' }}>
                    본 서비스에 게재된 맛집 정보, 이미지, 설명문 등의 콘텐츠는 다음과 같은 출처에서 수집되었습니다:
                </p>
                <ul style={{ lineHeight: '1.8', paddingLeft: '20px' }}>
                    <li>공개된 유튜브 영상 및 방송 프로그램 정보</li>
                    <li>Naver 검색 API를 통한 공개 이미지</li>
                    <li>Kakao Maps 및 Naver Maps의 공개 정보</li>
                </ul>
                <p style={{ lineHeight: '1.8', marginTop: '12px' }}>
                    모든 콘텐츠의 저작권은 원저작자에게 있으며, 본 서비스는 정보 제공 목적으로만 사용됩니다.
                    저작권 침해 우려가 있는 경우 <a href="/contact" style={{ color: '#E53935', textDecoration: 'underline' }}>문의하기</a>를 통해 알려주시면 즉시 조치하겠습니다.
                </p>
            </section>

            <section style={{ marginBottom: '40px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>4. 면책 조항</h2>
                <p style={{ lineHeight: '1.8', marginBottom: '12px' }}>
                    TubeMap은 다음 사항에 대해 책임을 지지 않습니다:
                </p>
                <ul style={{ lineHeight: '1.8', paddingLeft: '20px' }}>
                    <li>맛집 정보의 정확성, 최신성, 완전성</li>
                    <li>사용자가 서비스를 통해 방문한 맛집에서 발생한 문제</li>
                    <li>제3자 서비스(Kakao Maps, YouTube 등)의 오류 또는 중단</li>
                    <li>사용자 간 또는 사용자와 제3자 간의 분쟁</li>
                </ul>
                <p style={{ lineHeight: '1.8', marginTop: '12px' }}>
                    본 서비스는 "있는 그대로(AS-IS)" 제공되며, 사용자는 자신의 책임 하에 서비스를 이용합니다.
                </p>
            </section>

            <section style={{ marginBottom: '40px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>5. 서비스 변경 및 중단</h2>
                <p style={{ lineHeight: '1.8' }}>
                    TubeMap은 사전 통지 없이 서비스의 전부 또는 일부를 변경하거나 중단할 수 있습니다.
                    서비스 중단으로 인한 손해에 대해서는 책임을 지지 않습니다.
                </p>
            </section>

            <section style={{ marginBottom: '40px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>6. 약관의 변경</h2>
                <p style={{ lineHeight: '1.8' }}>
                    본 약관은 필요에 따라 변경될 수 있으며, 변경된 약관은 본 페이지에 게시됩니다.
                    변경 후 서비스를 계속 이용하는 경우 변경된 약관에 동의한 것으로 간주됩니다.
                </p>
            </section>

            <section style={{ marginBottom: '40px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>7. 준거법 및 관할</h2>
                <p style={{ lineHeight: '1.8' }}>
                    본 약관은 대한민국 법률에 따라 해석되며, 서비스 이용과 관련된 분쟁은
                    관할 법원의 관할에 따릅니다.
                </p>
            </section>
        </div>
    );
}
