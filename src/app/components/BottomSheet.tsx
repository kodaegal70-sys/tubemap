'use client';

import { useRef, useEffect, useState } from 'react';
import { useMobile } from '../contexts/MobileContext';
import styles from './BottomSheet.module.css';
import { Place } from '@/data/places';
import PlaceImage from './PlaceImage';
import DiscoveryPanel from './DiscoveryPanel';

interface Props {
  places: Place[];
  allPlaces: Place[];
  onPlaceClick: (place: Place) => void;
  focusedPlace: Place | null;
  discoveryFilter: {
    tab: 'ALL' | 'YOUTUBE' | 'BROADCAST';
    selectedMedia: string[];
    searchTerm: string;
  };
  onDiscoveryFilterChange: (filters: { media: string[] }) => void;
  onStateChange?: (state: 'peek' | 'half' | 'full') => void;
}

export default function BottomSheet({
  places,
  allPlaces,
  onPlaceClick,
  focusedPlace,
  discoveryFilter,
  onDiscoveryFilterChange,
  onStateChange,
}: Props) {
  // 상세카드 토글 핸들러
  const handlePlaceClick = (place: Place) => {
    if (focusedPlace?.id === place.id) {
      // 같은 장소 재클릭 시 리스트로 복귀
      onPlaceClick(null as any);
    } else {
      onPlaceClick(place);
    }
  };
  const focusedPlaceId = focusedPlace?.id;
  const { sheetState, setSheetState, sheetTab, setSheetTab } = useMobile();
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const isDragging = useRef(false);
  const [openInfoPanel, setOpenInfoPanel] = useState<'about' | 'privacy' | 'ads' | null>(null);

  // 스크롤 락: half/full일 때 body scroll lock
  useEffect(() => {
    if (sheetState === 'half' || sheetState === 'full') {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sheetState]);

  // 드래그 핸들러
  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    currentY.current = startY.current;
    isDragging.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    currentY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const deltaY = currentY.current - startY.current;

    if (deltaY < -10) {
      // 위로 드래그
      const nextState = sheetState === 'peek' ? 'half' : 'full';
      setSheetState(nextState);
      if (onStateChange) onStateChange(nextState);
    } else if (deltaY > 10) {
      // 아래로 드래그
      const nextState = sheetState === 'full' ? 'half' : 'peek';
      setSheetState(nextState);
      if (onStateChange) onStateChange(nextState);
    }
  };

  useEffect(() => {
    // focusedPlace가 처음 들어올 때만 half로 확장
    if (focusedPlace && sheetState === 'peek') {
      setSheetState('half');
    }
  }, [focusedPlaceId]); // focusedPlace 객체 대신 ID만 감시하여 불필요한 재실행 방지

  // 탭 제목 및 리스트 카운트
  const tabTitle = sheetTab === 'list' ? '리스트' : '디스커버리';
  const listCount = sheetTab === 'list' ? places.length : null;

  return (
    <div
      ref={sheetRef}
      className={`${styles.bottomSheetContainer} ${styles[sheetState]}`}
    >
      {/* 헤더 영역 */}
      <div
        className={styles.sheetHeader}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* 드래그 핸들 */}
        <div className={styles.dragHandle}>
          <div className={styles.handleBar} />
        </div>

        {/* 탭 + 타이틀 */}
        <div className={styles.headerTabsRow}>
          <div className={styles.headerTitle}>
            {tabTitle}
            {listCount !== null && (
              <span className={styles.countBadge}>{listCount}</span>
            )}
          </div>
          <div className={styles.handleTabs}>
            <button
              type="button"
              role="tab"
              aria-selected={sheetTab === 'list'}
              className={`${styles.handleTabButton} ${sheetTab === 'list' ? styles.handleTabActive : ''}`}
              onClick={() => setSheetTab('list')}
            >
              리스트
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={sheetTab === 'discovery'}
              className={`${styles.handleTabButton} ${sheetTab === 'discovery' ? styles.handleTabActive : ''}`}
              onClick={() => setSheetTab('discovery')}
            >
              디스커버리
            </button>
          </div>
        </div>

        {/* 본문 영역 */}
        <div className={styles.content}>
          {/* 탭 A: 리스트 */}
          {sheetTab === 'list' && (
            <div className={styles.panelContent}>
              {places.length === 0 ? (
                <div className={styles.emptyState}>
                  화면 내에 맛집이 없습니다.
                </div>
              ) : (
                <div className={styles.listContainer}>
                  {places.map(place => {
                    const isActive = focusedPlace && focusedPlace.id === place.id;

                    if (isActive) {
                      const [mediaChannelRaw, mediaProgramRaw] = place.media.split('|');
                      const mediaChannel = mediaChannelRaw?.trim() || '';
                      const mediaProgram = mediaProgramRaw?.trim() || '';
                      const youtubeQuery = `${place.name} ${mediaChannel || ''}`.trim();
                      const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(youtubeQuery)}`;
                      const naverUrl = place.naver_url && place.naver_url.trim().length > 0
                        ? place.naver_url
                        : `https://m.place.naver.com/search?q=${encodeURIComponent(place.name)}`;

                      return (
                        <div key={place.id} className={`${styles.item} ${styles.itemSelected}`}>
                          <div className={styles.itemImage}>
                            <PlaceImage src={place.image_url} alt={place.name} />
                          </div>
                          <div className={styles.itemInfo}>
                            <div className={styles.itemName}>{place.name}</div>
                            <div className={styles.itemMedia}>
                              📺 {mediaChannel || place.media}
                            </div>
                            {place.address && (
                              <div className={styles.itemRow}>
                                <span>📍</span>
                                <span>{place.address}</span>
                              </div>
                            )}
                            {place.phone && place.phone.trim().length > 0 && (
                              <div className={styles.itemRow}>
                                <span>📞</span>
                                <span>{place.phone}</span>
                              </div>
                            )}
                            {place.description && (
                              <div className={styles.itemDesc}>{place.description}</div>
                            )}
                            <div className={styles.detailActions}>
                              <a
                                href={youtubeUrl}
                                target="_blank"
                                rel="noreferrer"
                                className={`${styles.detailButton} ${styles.youtubeButton}`}
                              >
                                유튜브 보기
                              </a>
                              <a
                                href={naverUrl}
                                target="_blank"
                                rel="noreferrer"
                                className={`${styles.detailButton} ${styles.naverButton}`}
                              >
                                <span>
                                  네이버
                                  <br />
                                  플레이스
                                </span>
                              </a>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={place.id}
                        className={styles.placeCard}
                        onClick={() => handlePlaceClick(place)}
                      >
                        <div className={styles.itemImage}>
                          <PlaceImage src={place.image_url} alt={place.name} />
                        </div>
                        <div className={styles.itemInfo}>
                          <div className={styles.itemName}>{place.name}</div>
                          <div className={styles.itemMedia}>
                            📺 {place.media.split('|')[0]}
                          </div>
                          <div className={styles.itemDesc}>{place.description}</div>
                        </div>
                      </div>
                    );
                  })}
                </div >
              )}

              {/* 모바일 푸터 */}
              <div className={styles.mobileFooter}>
                <span className={styles.footerLabel}>Tube Map 안내</span>
                <button
                  type="button"
                  className={styles.footerLink}
                  onClick={() => setOpenInfoPanel('about')}
                >
                  서비스 소개
                </button>
                <span className={styles.footerDivider}>·</span>
                <button
                  type="button"
                  className={styles.footerLink}
                  onClick={() => setOpenInfoPanel('privacy')}
                >
                  개인정보
                </button>
                <span className={styles.footerDivider}>·</span>
                <button
                  type="button"
                  className={styles.footerLink}
                  onClick={() => setOpenInfoPanel('ads')}
                >
                  광고 안내
                </button>
              </div>
            </div>
          )}

          {/* 탭 B: 디스커버리 */}
          {sheetTab === 'discovery' && (
            <div className={styles.panelContent}>
              <DiscoveryPanel
                places={allPlaces}
                discoveryFilter={discoveryFilter}
                onDiscoveryFilterChange={onDiscoveryFilterChange}
              />

              {/* 모바일 푸터 */}
              <div className={styles.mobileFooter}>
                <span className={styles.footerLabel}>Tube Map 안내</span>
                <button
                  type="button"
                  className={styles.footerLink}
                  onClick={() => setOpenInfoPanel('about')}
                >
                  서비스 소개
                </button>
                <span className={styles.footerDivider}>·</span>
                <button
                  type="button"
                  className={styles.footerLink}
                  onClick={() => setOpenInfoPanel('privacy')}
                >
                  개인정보
                </button>
                <span className={styles.footerDivider}>·</span>
                <button
                  type="button"
                  className={styles.footerLink}
                  onClick={() => setOpenInfoPanel('ads')}
                >
                  광고 안내
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 정보 패널 모달 */}
        {openInfoPanel && (
          <div className={styles.infoBackdrop} onClick={() => setOpenInfoPanel(null)}>
            <div className={styles.infoPanel} onClick={(e) => e.stopPropagation()}>
              <div className={styles.infoPanelHeader}>
                <span className={styles.infoPanelTitle}>
                  {openInfoPanel === 'about' && 'Tube Map 서비스 소개'}
                  {openInfoPanel === 'privacy' && '개인정보 안내'}
                  {openInfoPanel === 'ads' && '광고 및 수익 구조 안내'}
                </span>
                <button
                  type="button"
                  className={styles.infoPanelClose}
                  onClick={() => setOpenInfoPanel(null)}
                >
                  ✕
                </button>
              </div>
              <div className={styles.infoPanelBody}>
                {openInfoPanel === 'about' && (
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
                {openInfoPanel === 'privacy' && (
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
                {openInfoPanel === 'ads' && (
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
              <div className={styles.infoPanelFooter}>
                <span>문의: </span>
                <a href="mailto:kodaegal70@gmail.com" className={styles.infoMailLink}>
                  kodaegal70@gmail.com
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
