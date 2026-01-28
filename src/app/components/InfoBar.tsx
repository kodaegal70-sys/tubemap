'use client';

import { useState } from 'react';
import styles from './InfoBar.module.css';

type Panel = 'about' | 'privacy' | 'ads' | null;

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
          onClick={() => handleToggle('ads')}
        >
          광고 안내
        </button>
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
                {openPanel === 'privacy' && '개인정보 안내'}
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
              <span>문의: </span>
              <a href="mailto:kodaegal70@gmail.com" className={styles.mailLink}>
                kodaegal70@gmail.com
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

