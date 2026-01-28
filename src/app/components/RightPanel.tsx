'use client';

import styles from './RightPanel.module.css';
import { Place } from '@/data/places';
import PlaceImage from './PlaceImage';
import FilterPanel from './FilterPanel';
import { useState } from 'react';

type Props = {
  places: Place[];
  allPlaces: Place[];
  activeMediaFilters: string[];
  onPlaceClick: (p: Place) => void;
  onFilterChange: (filters: { media: string[] }) => void;
  focusedPlace: Place | null;
};

export default function RightPanel({
  places,
  allPlaces,
  activeMediaFilters,
  onPlaceClick,
  onFilterChange,
  focusedPlace,
}: Props) {
  const [tab, setTab] = useState<'list' | 'discovery'>('list');

  return (
    <aside className={styles.rightPanel}>
      <div className={styles.header}>
        <div className={styles.title}>
          {tab === 'list' ? '리스트' : '디스커버리'}
          {activeMediaFilters.length > 0 && (
            <button
              className={styles.resetFilterButton}
              onClick={() => {
                onFilterChange({ media: [] });
                setTab('list');
              }}
            >
              토글 해제
            </button>
          )}
        </div>
        <div className={styles.tabs}>
          <button
            type="button"
            className={`${styles.tabButton} ${tab === 'list' ? styles.tabActive : ''}`}
            onClick={() => setTab('list')}
          >
            리스트
          </button>
          <button
            type="button"
            className={`${styles.tabButton} ${tab === 'discovery' ? styles.tabActive : ''}`}
            onClick={() => setTab('discovery')}
          >
            디스커버리
          </button>
        </div>
      </div>

      <div className={styles.content}>
        {tab === 'list' ? (
          <>
            {/* 상세 카드 (핀/리스트 선택 시) */}
            {focusedPlace && (() => {
              const [mediaChannelRaw, mediaProgramRaw] = focusedPlace.media.split('|');
              const mediaChannel = mediaChannelRaw?.trim() || '';
              const mediaProgram = mediaProgramRaw?.trim() || '';
              const youtubeQuery = `${focusedPlace.name} ${mediaChannel || ''}`.trim();
              const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
                youtubeQuery,
              )}`;

              // 네이버 검색 URL: 업체명 + 지역명(주소 앞 2단어) 조합
              const addressParts = focusedPlace.address ? focusedPlace.address.split(' ') : [];
              const region = addressParts.slice(0, 2).join(' ');
              const naverSearchQuery = `${focusedPlace.name} ${region}`.trim();
              const naverUrl = `https://search.naver.com/search.naver?query=${encodeURIComponent(naverSearchQuery)}`;

              return (
                <div className={styles.detailCard}>
                  <div className={styles.detailTitle}>{focusedPlace.name}</div>

                  {focusedPlace.address && (
                    <div className={styles.detailRow}>
                      <span>📍</span>
                      <span>{focusedPlace.address}</span>
                    </div>
                  )}

                  {focusedPlace.phone && focusedPlace.phone.trim().length > 0 && (
                    <div className={styles.detailRow}>
                      <span>📞</span>
                      <span>{focusedPlace.phone}</span>
                    </div>
                  )}

                  <div className={styles.detailMedia}>
                    📺 {mediaChannel || focusedPlace.media}
                  </div>

                  {focusedPlace.image_url && (
                    <div className={styles.detailImage}>
                      <PlaceImage src={focusedPlace.image_url} alt={focusedPlace.name} />
                    </div>
                  )}

                  {focusedPlace.description && (
                    <div className={styles.detailDesc}>{focusedPlace.description}</div>
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
                places.map((place) => {
                  const mediaLabel = place.media.split('|')[0];
                  const isActive = focusedPlace && focusedPlace.id === place.id;
                  return (
                    <div
                      key={place.id}
                      className={`${styles.placeCard} ${isActive ? styles.placeCardActive : ''}`}
                      onClick={() => onPlaceClick(place)}
                    >
                      {place.image_url && (
                        <div className={styles.thumb}>
                          <PlaceImage src={place.image_url} alt={place.name} />
                        </div>
                      )}
                      <div className={styles.info}>
                        <div className={styles.name}>{place.name}</div>
                        <div className={styles.mediaLabel}>📺 {mediaLabel}</div>
                        {place.description && (
                          <div className={styles.desc}>{place.description}</div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        ) : (
          <div className={styles.discoveryWrapper}>
            <FilterPanel
              places={allPlaces}
              onFilterChange={(filters) => {
                onFilterChange(filters);
                if (filters.media.length > 0) {
                  setTab('list');
                }
              }}
              selectedMediaFilters={activeMediaFilters}
              isMobileMode={true}
            />
          </div>
        )}
      </div>
    </aside>
  );
}

