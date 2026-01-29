'use client';

import { useState } from 'react';
import styles from './InfoBar.module.css';

type Panel = 'about' | 'privacy' | 'terms' | 'ads' | null;

export default function InfoBar() {
  const [openPanel, setOpenPanel] = useState<Panel>(null);

  const handleToggle = (panel: Panel) => {
    setOpenPanel(prev => (prev === panel ? null : panel));
  };

  const close = () => setOpenPanel(null);

  return (
    <>
      <div className={styles.bar}>
        <span className={styles.barLabel}>Tube Map 안내</span>
        <button
          type="button"
          className={styles.linkButton}
          onClick={() => handleToggle('about')}
        >
          서비스 소개
        </button>
        <span className={styles.divider}>·</span>
        <button
          type="button"
          className={styles.linkButton}
          onClick={() => handleToggle('privacy')}
        >
          개인정보
        </button>
        <span className={styles.divider}>·</span>
        <button
          type="button"
          className={styles.linkButton}
          onClick={() => handleToggle('terms')}
        >
          이용약관
        </button>
        <span className={styles.divider}>·</span>
        <a href="/contact" className={styles.linkButton} style={{ textDecoration: 'none' }}>
          문의하기
        </a>
      </div>

      {openPanel && (
        <div className={styles.backdrop} onClick={close}>
          <div
            className={styles.panel}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.panelHeader}>
              <span className={styles.panelTitle}>
                {openPanel === 'about' && 'Tube Map 서비스 소개'}
                {openPanel === 'privacy' && '개인정보처리방칭 안내'}
                {openPanel === 'terms' && '이용약관 안내'}
                {openPanel === 'ads' && '광고 및 수익 구조 안내'}
              </span>
              <button
                type="button"
                className={styles.closeButton}
                onClick={close}
              >
                ✕
              </button>
            </div>
            <div className={styles.panelBody}>
              {openPanel === 'about' && (
                <>
                  <p>
                    Tube Map은 유튜브·TV 방송 등 대중 미디어에 소개된 맛집 정보를 한곳에 모아,
                    사용자가 지도에서 쉽게 탐색하고 비교할 수 있도록 돕는 서비스입니다.
                  </p>
                  <p>
                    방송과 실제 매장 정보(영업시간, 가격, 메뉴 등)는 시점에 따라 달라질 수 있으므로,
                    방문 전에는 반드시 매장 전화, 공식 홈페이지, 네이버/카카오 지도 등을 통해
                    최신 정보를 다시 확인하시길 권장드립니다.
                  </p>
                </>
              )}
              {openPanel === 'privacy' && (
                <>
                  <p>
                    현재 Tube Map은 회원가입 기능을 제공하지 않으며, 이름·연락처 등
                    개인을 식별할 수 있는 정보를 서비스 내에서 직접 수집하지 않습니다.
                  </p>
                  <p>
                    서비스 품질 개선과 광고 제공을 위해 Google Analytics, Google AdSense 등
                    제3자 쿠키가 사용될 수 있으며, 이 과정에서 수집되는 정보는 개별 사용자를
                    직접 식별하지 않는 통계·광고 목적에 한해 사용됩니다.
                  </p>
                </>
              )}
              {openPanel === 'terms' && (
                <>
                  <p>
                    Tube Map은 맛집 정보를 지도에서 쉽게 탐색할 수 있는 무료 웹 서비스입니다.
                    본 서비스는 정보 제공 목적으로만 운영되며, 상업적 목적으로 데이터를 무단 수집(크롤링 등)하는 행위를 금지합니다.
                  </p>
                  <p>
                    자세한 약관은 <a href="/terms" style={{ color: '#0366d6', textDecoration: 'underline' }}>이용약관 전문 페이지</a>에서 확인하실 수 있습니다.
                  </p>
                </>
              )}
              {openPanel === 'ads' && (
                <>
                  <p>
                    Tube Map은 향후 Google AdSense 등 디스플레이 광고를 통해 수익을 창출할 수 있으며,
                    광고 영역은 &quot;ADVERTISEMENT&quot; 등의 문구로 명확히 구분하여 표시합니다.
                  </p>
                  <p>
                    광고 노출 여부와 내용은 광고 플랫폼의 정책과 알고리즘에 의해 자동으로 결정되며,
                    Tube Map은 특정 업체나 메뉴를 유료로 우대 노출하지 않습니다.
                  </p>
                </>
              )}
            </div>
            <div className={styles.panelFooter}>
              <div className={styles.disclosure}>
                본 서비스는 공개된 정보(YouTube, Kakao 등)를 기반으로 장소 정보를 정리·제공합니다.
                상표 및 콘텐츠의 권리는 각 소유자에게 있습니다. 요청 시 수정/삭제 처리합니다.
              </div>
              <div className={styles.contactInfo}>
                <span>문의: </span>
                <a href="mailto:kodaegal70@gmail.com" className={styles.mailLink}>
                  kodaegal70@gmail.com
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

