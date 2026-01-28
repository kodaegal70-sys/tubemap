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
                {places.map(place => {
                  const isActive = focusedPlace && focusedPlace.id === place.id;

                  if (isActive) {
                    const [mediaChannelRaw, mediaProgramRaw] = place.media.split('|');
                    const mediaChannel = mediaChannelRaw?.trim() || '';
                    const mediaProgram = mediaProgramRaw?.trim() || '';
                    const youtubeQuery = `${place.name} ${mediaChannel || ''}`.trim();
                    const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(youtubeQuery)}`;

                    // 네이버 검색 URL: 업체명 + 지역명(주소 앞 2단어) 조합
                    const addressParts = place.address ? place.address.split(' ') : [];
                    const region = addressParts.slice(0, 2).join(' ');
                    const naverSearchQuery = `${place.name} ${region}`.trim();
                    const naverUrl = `https://search.naver.com/search.naver?query=${encodeURIComponent(naverSearchQuery)}`;

                    return (
                      <div
                        key={place.id}
                        className={`${styles.item} ${styles.itemSelected}`}
                        onClick={() => handlePlaceClick(place)}
                      >
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
