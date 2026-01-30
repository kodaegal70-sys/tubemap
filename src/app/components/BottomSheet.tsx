'use client';

import { useRef, useEffect, useState } from 'react';
import { useMobile } from '../contexts/MobileContext';
import styles from './BottomSheet.module.css';
import { Place } from '@/data/places';
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
  onClearFocus?: () => void;
}

export default function BottomSheet({
  places,
  allPlaces,
  onPlaceClick,
  focusedPlace,
  discoveryFilter,
  onDiscoveryFilterChange,
  onStateChange,
  onClearFocus,
}: Props) {
  // 상세카드 토글 핸들러
  const handlePlaceClick = (place: Place) => {
    if (focusedPlace?.id === place.id) {
      // 같은 장소 재클릭 시 리스트로 복귀
      if (onClearFocus) {
        onClearFocus();
      }
    } else {
      onPlaceClick(place);
    }
  };
  const focusedPlaceId = focusedPlace?.id;
  const { sheetState, setSheetState, sheetTab, setSheetTab } = useMobile();
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const isDragging = useRef(false);

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
    if (e.cancelable) e.preventDefault(); // 브라우저 스크롤/툴바 동작 방지
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

  // 데이터나 탭이 변경되면 페이지 리셋
  useEffect(() => {
    setCurrentPage(1);
  }, [places.length, sheetTab]);

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
            {discoveryFilter.selectedMedia.length > 0 && (
              <button
                className={styles.resetFilterButton}
                onClick={(e) => {
                  e.stopPropagation();
                  onDiscoveryFilterChange({ media: [] });
                }}
              >
                토글 해제
              </button>
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
                {(() => {
                  const totalPages = Math.ceil(places.length / ITEMS_PER_PAGE);
                  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
                  const paginatedPlaces = places.slice(startIndex, startIndex + ITEMS_PER_PAGE);

                  return (
                    <>
                      {paginatedPlaces.map(place => {
                        const isActive = focusedPlace && focusedPlace.id === place.id;
                        const mediaLabel = place.media_label || (place.media ? place.media.split('|')[0] : '');
                        const title = place.name;
                        const desc = place.best_comment || place.description;
                        const imageUrl = place.image_state === 'approved' ? place.image_url : null;

                        if (isActive) {
                          const youtubeQuery = `${place.name} ${place.channel_title || ''}`.trim();
                          const youtubeUrl = place.video_url || `https://www.youtube.com/results?search_query=${encodeURIComponent(youtubeQuery)}`;

                          // 네이버 검색: 업체명 + 지역(주소 앞 2단어)
                          const addressParts = place.address ? place.address.split(' ') : [];
                          const region = addressParts.slice(0, 2).join(' ');
                          const naverSearchQuery = `${place.name} ${region}`.trim();
                          const naverUrl = place.naver_url || `https://search.naver.com/search.naver?query=${encodeURIComponent(naverSearchQuery)}`;

                          const address = place.road_address || place.address;

                          return (
                            <div
                              key={place.id}
                              className={`${styles.item} ${styles.itemSelected}`}
                              onClick={() => handlePlaceClick(place)}
                            >
                              <div className={styles.itemInfo}>
                                <div className={styles.itemName}>{title}</div>

                                {imageUrl && (
                                  <div style={{ width: '100%', height: '160px', borderRadius: '8px', overflow: 'hidden', marginBottom: '10px' }}>
                                    <img src={imageUrl} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  </div>
                                )}
                                {!imageUrl && (
                                  <div style={{ width: '100%', height: '100px', borderRadius: '8px', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px', fontSize: '12px', color: '#888' }}>
                                    이미지 준비중
                                  </div>
                                )}

                                <div className={styles.itemMedia}>
                                  📺 {mediaLabel}
                                </div>
                                {address && (
                                  <div className={styles.itemRow}>
                                    <span>📍</span>
                                    <span>{address}</span>
                                  </div>
                                )}
                                {place.phone && place.phone.trim().length > 0 && (
                                  <div className={styles.itemRow}>
                                    <span>📞</span>
                                    <span>{place.phone}</span>
                                  </div>
                                )}
                                {desc && (
                                  <div className={styles.itemDesc} style={{ margin: '8px 0', fontStyle: 'italic' }}>“{desc}”</div>
                                )}
                                <div className={styles.detailActions}>
                                  <a
                                    href={youtubeUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={`${styles.detailButton} ${styles.youtubeButton}`}
                                  >
                                    영상 보기
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
                                      검색
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
                            className={styles.item}
                            onClick={() => handlePlaceClick(place)}
                          >
                            {imageUrl ? (
                              <div className={styles.itemImage}>
                                <img src={imageUrl} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              </div>
                            ) : (
                              <div className={styles.itemImage} style={{ background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#888' }}>
                                준비중
                              </div>
                            )}
                            <div className={styles.itemInfo}>
                              <div className={styles.itemName}>{title}</div>
                              <div className={styles.itemMedia}>
                                📺 {mediaLabel}
                              </div>
                              {desc && <div className={styles.itemDesc}>“{desc}”</div>}
                            </div>
                          </div>
                        );
                      })}

                      {/* 모바일 페이지네이션 UI */}
                      {totalPages > 1 && (
                        <div className={styles.pagination}>
                          <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className={styles.pageButton}
                          >
                            이전
                          </button>
                          <span className={styles.pageInfo}>
                            {currentPage} / {totalPages}
                          </span>
                          <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className={styles.pageButton}
                          >
                            다음
                          </button>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div >
            )}
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
          </div>
        )}
      </div>
    </div>
  );
}
