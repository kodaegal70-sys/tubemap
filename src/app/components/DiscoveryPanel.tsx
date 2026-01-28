'use client';

import { useState, useMemo, useEffect } from 'react';
import styles from './DiscoveryPanel.module.css';

interface Props {
  places: any[];
  discoveryFilter: {
    tab: 'ALL' | 'YOUTUBE' | 'BROADCAST';
    selectedMedia: string[];
    searchTerm: string;
  };
  onDiscoveryFilterChange: (filters: { media: string[] }) => void;
}

const MEDIA_KEYWORDS = {
  YOUTUBE_TYPE: ['유튜브', '채널', 'TV', 'Studio', '또간집', '먹을텐데', '님아', '전대미문', '시즌', '로드', '세끼', '야식이', '입짧은햇님', '상해기', '웅이', '광마니', 'Hamzy'],
  BROADCAST_TYPE: ['방송', '프로그램', 'KBS', 'SBS', 'MBC', 'tvN', 'JTBC', '백반기행', '생생정보', '맛있는녀석들', '생활의달인', '전지적참견시점', '수요미식회', '골목식당', '3대천왕']
};

export default function DiscoveryPanel({ places, discoveryFilter, onDiscoveryFilterChange }: Props) {
  const [activeTab, setActiveTab] = useState<'ALL' | 'YOUTUBE' | 'BROADCAST'>(discoveryFilter.tab);
  const [selectedMedia, setSelectedMedia] = useState<string[]>(discoveryFilter.selectedMedia);
  const [searchTerm, setSearchTerm] = useState(discoveryFilter.searchTerm);
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 10;

  // 부모의 필터 상태와 동기화
  useEffect(() => {
    setActiveTab(discoveryFilter.tab);
    setSelectedMedia(discoveryFilter.selectedMedia);
    setSearchTerm(discoveryFilter.searchTerm);
  }, [discoveryFilter]);

  // 필터나 탭이 바뀌면 첫 페이지로 리셋
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm]);

  // 데이터 분석 및 자동 분류 로직
  const { sortedMediaList, mediaTypeMap } = useMemo(() => {
    const counts: { [key: string]: number } = {};
    const typeMap: { [key: string]: 'YOUTUBE' | 'BROADCAST' | 'OTHER' } = {};

    places.forEach(p => {
      const parts = p.media.split('|');
      const raw = parts[0]?.trim(); // 안전하게 trim 적용
      if (!raw) return;

      counts[raw] = (counts[raw] || 0) + 1;

      if (typeMap[raw]) return;

      const lowerRaw = raw.toLowerCase();
      let identifiedType: 'YOUTUBE' | 'BROADCAST' | 'OTHER' = 'OTHER';

      if (MEDIA_KEYWORDS.YOUTUBE_TYPE.some(k => lowerRaw.includes(k.toLowerCase()))) {
        identifiedType = 'YOUTUBE';
      } else if (MEDIA_KEYWORDS.BROADCAST_TYPE.some(k => lowerRaw.includes(k.toLowerCase()))) {
        identifiedType = 'BROADCAST';
      } else {
        if (['성시경', '풍자', '쯔양', '히밥', '백종원'].some(name => lowerRaw.includes(name))) {
          identifiedType = 'YOUTUBE';
        }
      }
      typeMap[raw] = identifiedType;
    });

    const sorted = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
    return { sortedMediaList: sorted, mediaTypeMap: typeMap };
  }, [places]);

  // 카테고리별 필터링 + 검색어 필터링
  const filteredMediaList = useMemo(() => {
    let targets = sortedMediaList;

    if (activeTab !== 'ALL') {
      targets = targets.filter(mediaName => mediaTypeMap[mediaName] === activeTab);
    }

    if (searchTerm.trim()) {
      targets = targets.filter(media =>
        media.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return targets;
  }, [sortedMediaList, mediaTypeMap, activeTab, searchTerm]);

  const totalPages = Math.ceil(filteredMediaList.length / ITEMS_PER_PAGE);

  const paginatedMediaList = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredMediaList.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredMediaList, currentPage]);

  const handleCheckboxChange = (media: string) => {
    let newSelected: string[];
    if (selectedMedia.includes(media)) {
      newSelected = [];
    } else {
      newSelected = [media];
    }
    setSelectedMedia(newSelected);
  };

  const handleApply = (media: string) => {
    onDiscoveryFilterChange({ media: [media] }); // 선택된 미디어를 명시적으로 전달
  };

  const handleReset = () => {
    setSelectedMedia([]);
    setSearchTerm('');
    onDiscoveryFilterChange({ media: [] });
  };

  return (
    <div className={styles.discoveryPanel}>
      {/* 검색 input */}
      <div className={styles.searchBox}>
        <input
          type="text"
          placeholder="채널/프로그램 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {/* 탭 (전체/유튜브/방송) */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'ALL' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('ALL')}
        >
          전체
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'YOUTUBE' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('YOUTUBE')}
        >
          유튜브
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'BROADCAST' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('BROADCAST')}
        >
          방송
        </button>
      </div>

      {/* 미디어 리스트 */}
      <div className={styles.section}>
        <div className={styles.listContainer}>
          {paginatedMediaList.length > 0 ? (
            <>
              {paginatedMediaList.map((media, index) => {
                const overallIndex = (currentPage - 1) * ITEMS_PER_PAGE + index;
                const count = places.filter(p => {
                  const mediaName = p.media.split('|')[0]?.trim();
                  return mediaName === media;
                }).length;

                return (
                  <div key={media}>
                    <label
                      className={`${styles.checkboxItem} ${selectedMedia.includes(media) ? styles.selected : ''}`}
                      onClick={() => handleCheckboxChange(media)}
                    >
                      <div className={styles.rank} style={{ color: overallIndex < 3 ? '#FA880B' : '#999' }}>
                        {overallIndex + 1}
                      </div>
                      <div className={styles.mediaTitle}>
                        {media}
                      </div>
                      <span className={styles.tag}>
                        {count}곳
                      </span>
                    </label>

                    {/* 선택된 경우 바로 아래에 리스트 보기 버튼 노출 */}
                    {selectedMedia.includes(media) && (
                      <button
                        className={styles.inlineApplyButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApply(media); // 현재 루프의 media를 직접 전달
                        }}
                      >
                        리스트 보기
                      </button>
                    )}
                  </div>
                );
              })}
            </>
          ) : (
            <div className={styles.emptyState}>
              검색 결과가 없습니다.
            </div>
          )}
        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={styles.pageButton}
            >
              ◀
            </button>
            <span className={styles.pageInfo}>
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={styles.pageButton}
            >
              ▶
            </button>
          </div>
        )}
      </div>

      {/* 하단 고정 버튼 제거 (항목별 인라인 버튼으로 대체) */}

    </div>
  );
}
