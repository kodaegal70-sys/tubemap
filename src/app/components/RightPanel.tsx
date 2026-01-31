'use client';

import styles from './RightPanel.module.css';
import { Place } from '@/data/places';
import FilterPanel from './FilterPanel';
import { useState, useEffect } from 'react';
import AdSlot from './AdSlot';

type Props = {
  places: Place[];
  allPlaces: Place[];
  activeMediaFilters: string[];
  onPlaceClick: (p: Place) => void;
  onFilterChange: (filters: { media: string[] }) => void;
  onClearFocus?: () => void;
  focusedPlace: Place | null;
  tab?: 'list' | 'discovery'; // 외부 제어용 추가
  onTabChange?: (tab: 'list' | 'discovery') => void; // 외부 제어용 추가
};

export default function RightPanel({
  places,
  allPlaces,
  activeMediaFilters,
  onPlaceClick,
  onFilterChange,
  onClearFocus,
  focusedPlace,
  tab: controlledTab,
  onTabChange,
}: Props) {
  const [internalTab, setInternalTab] = useState<'list' | 'discovery'>('list');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;
  const activeTab = controlledTab || internalTab;

  // 필터나 탭이 바뀌면 첫 페이지로 리셋
  useEffect(() => {
    setCurrentPage(1);
  }, [places.length, activeTab]);

  const handleTabChange = (newTab: 'list' | 'discovery') => {
    if (onTabChange) {
      onTabChange(newTab);
    } else {
      setInternalTab(newTab);
    }
  };


  return (
    <aside className={styles.rightPanel}>
      <div className={styles.header}>
        <div className={styles.title}>
          {activeTab === 'list' ? (
            <>
              리스트
              <span className={styles.countBadge}>{places.length}</span>
            </>
          ) : '디스커버리'}
          {activeMediaFilters.length > 0 && (
            <button
              className={styles.resetFilterButton}
              onClick={() => {
                onFilterChange({ media: [] });
                handleTabChange('list');
              }}
            >
              토글 해제
            </button>
          )}
        </div>
        <div className={styles.tabs}>
          <button
            type="button"
            className={`${styles.tabButton} ${activeTab === 'list' ? styles.tabActive : ''}`}
            onClick={() => handleTabChange('list')}
          >
            리스트
          </button>
          <button
            type="button"
            className={`${styles.tabButton} ${activeTab === 'discovery' ? styles.tabActive : ''}`}
            onClick={() => handleTabChange('discovery')}
          >
            디스커버리
          </button>
        </div>
      </div>

      <div className={styles.content}>
        {activeTab === 'list' ? (
          (() => {
            const filteredPlaces = places.filter((place) => !focusedPlace || focusedPlace.id !== place.id);
            const totalPages = Math.ceil(filteredPlaces.length / ITEMS_PER_PAGE);
            const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
            const paginatedPlaces = filteredPlaces.slice(startIndex, startIndex + ITEMS_PER_PAGE);

            return (
              <>
                <div className={styles.scrollArea}>
                  {/* 상세 카드 전용 이전 버튼 */}
                  {focusedPlace && onClearFocus && (
                    <div className={styles.backToListArea}>
                      <button className={styles.backToListButton} onClick={onClearFocus}>
                        이전 목록으로
                      </button>
                    </div>
                  )}

                  {/* 상세 카드 (핀/리스트 선택 시) */}
                  {focusedPlace && (() => {
                    const channelTitle = focusedPlace.channel_title;
                    const title = focusedPlace.name;
                    const address = focusedPlace.road_address || focusedPlace.address;
                    const phone = focusedPlace.phone;
                    const comment = focusedPlace.best_comment;
                    const videoThumbnailUrl = focusedPlace.video_thumbnail_url;

                    const firstChannel = channelTitle.split(',')[0]?.trim() || '';
                    const youtubeQuery = `${title} ${firstChannel}`.trim();
                    const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(youtubeQuery)}`;

                    // 네이버 검색: 업체명 + 지역(주소 앞 2단어 중 '도' 제외)
                    const addressParts = focusedPlace.address ? focusedPlace.address.split(' ') : [];
                    const regionParts = addressParts.slice(0, 3).filter(part => !part.endsWith('도'));
                    const region = regionParts.slice(0, 2).join(' ');
                    const naverSearchQuery = `${title} ${region}`.trim();
                    const naverUrl = `https://search.naver.com/search.naver?query=${encodeURIComponent(naverSearchQuery)}`;

                    return (
                      <div className={styles.detailCard}>
                        <div className={styles.detailTitle}>{title}</div>

                        {address && (
                          <div className={styles.detailRow}>
                            <span>📍</span>
                            <span>{address}</span>
                          </div>
                        )}

                        {phone && phone.trim().length > 0 && (
                          <div className={styles.detailRow}>
                            <span>📞</span>
                            <span>{phone}</span>
                          </div>
                        )}

                        <div className={styles.detailChannels}>
                          📺 {channelTitle}
                        </div>

                        {focusedPlace.menu_primary && (
                          <div className={styles.detailMenus}>
                            🍽️ {focusedPlace.menu_primary}
                          </div>
                        )}

                        {videoThumbnailUrl ? (
                          <div className={styles.detailImage}>
                            <img src={videoThumbnailUrl} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        ) : (
                          <div className={styles.detailImage} style={{ background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontSize: '12px' }}>
                            이미지 준비중
                          </div>
                        )}

                        {comment && (
                          <div className={styles.detailComment}>“{comment}”</div>
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
                            네이버 검색
                          </a>
                        </div>
                      </div>
                    );
                  })()}

                  {/* 리스트 */}
                  <div className={styles.listScroll}>
                    {places.length === 0 ? (
                      <div className={styles.empty}>
                        지도 화면 내에 표시할 맛집이 없습니다.
                        <br />
                        지도를 이동하거나 축소해 보세요.
                      </div>
                    ) : (
                      paginatedPlaces.map((place) => {
                        const channelTitle = place.channel_title;
                        const menuImageUrl = place.image_url;
                        const comment = place.best_comment;

                        return (
                          <div
                            key={place.id}
                            className={styles.placeCard}
                            onClick={() => onPlaceClick(place)}
                          >
                            <div className={styles.thumb}>
                              <img src={menuImageUrl || 'https://placehold.co/400x400/png?text=No+Image'} alt={place.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                            <div className={styles.info}>
                              <div className={styles.name}>{place.name}</div>
                              <div className={styles.channels}>📺 {channelTitle}</div>
                              <div className={styles.menus}>🍽️ {place.menu_primary}</div>
                              {comment && (
                                <div className={styles.commentSnippet}>“{comment}”</div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* 하단 고정 영역: 페이지네이션 + 광고 */}
                <div className={styles.fixedBottom}>
                  {totalPages > 1 && (
                    <div className={styles.pagination}>
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className={styles.pageButton}
                      >
                        ◀
                      </button>
                      <span className={styles.pageInfo}>
                        {currentPage} / {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className={styles.pageButton}
                      >
                        ▶
                      </button>
                    </div>
                  )}
                  <div className={styles.adWrapper}>
                    <AdSlot type="SIDEBAR_BOTTOM" id="ad-sidebar-list" />
                  </div>
                </div>
              </>
            );
          })()
        ) : (
          <div className={styles.discoveryWrapper}>
            <div className={styles.scrollArea}>
              <FilterPanel
                places={allPlaces}
                onFilterChange={(filters) => {
                  onFilterChange(filters);
                  if (filters.media.length > 0) {
                    handleTabChange('list');
                  }
                }}
                selectedMediaFilters={activeMediaFilters}
                isMobileMode={true}
              />
            </div>
            {/* 디스커버리 탭 하단 고정 광고 영역 */}
            <div className={styles.fixedBottom}>
              <div className={styles.adWrapper}>
                <AdSlot type="SIDEBAR_BOTTOM" id="ad-sidebar-discovery" />
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

