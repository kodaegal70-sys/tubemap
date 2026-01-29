'use client';

import { useState, useMemo, useEffect } from 'react';
import styles from './FilterPanel.module.css';
import AdSlot from './AdSlot';
import { normalizeMediaName } from '@/lib/v3/utils/media';

type Props = {
    places: any[]; // 전체 장소 데이터
    onFilterChange: (filters: { media: string[] }) => void;
    selectedMediaFilters: string[]; // 추가
    isMobileMode?: boolean; // [NEW] 모바일 모드 여부
};

// 미디어 타입을 구분하기 위한 핵심 키워드 (분류용)
// 특정 채널명이 아니라 '성격'을 구분하는 키워드만 최소한으로 유지
const MEDIA_KEYWORDS = {
    YOUTUBE_TYPE: ['유튜브', '채널', 'TV', 'Studio', '또간집', '먹을텐데', '님아', '전대미문', '시즌', '로드', '세끼', '야식이', '입짧은햇님', '상해기', '웅이', '광마니', 'Hamzy'],
    BROADCAST_TYPE: ['방송', '프로그램', 'KBS', 'SBS', 'MBC', 'tvN', 'JTBC', '백반기행', '생생정보', '맛있는녀석들', '생활의달인', '전지적참견시점', '수요미식회', '골목식당', '3대천왕']
};

export default function FilterPanel({ places, onFilterChange, selectedMediaFilters, isMobileMode }: Props) {
    const [isOpen, setIsOpen] = useState(true);
    const [activeTab, setActiveTab] = useState<'ALL' | 'YOUTUBE' | 'BROADCAST'>('ALL');
    const [selectedMedia, setSelectedMedia] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const ITEMS_PER_PAGE = 10; // 사용자 요청에 따라 10개로 조정

    // 부모의 필터 상태와 동기화
    useEffect(() => {
        setSelectedMedia(selectedMediaFilters);
    }, [selectedMediaFilters]);

    // 필터나 탭이 바뀌면 첫 페이지로 리셋
    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, searchTerm]);

    // 데이터 분석 및 자동 분류 로직
    const { sortedMediaList, mediaTypeMap } = useMemo(() => {
        const counts: { [key: string]: number } = {};
        const typeMap: { [key: string]: 'YOUTUBE' | 'BROADCAST' | 'OTHER' } = {};

        places.forEach(p => {
            const mediaStr = p.media_label || p.media;
            if (!mediaStr) return; // 미디어 정보가 없으면 스킵
            const parts = mediaStr.split('|');
            const raw = normalizeMediaName(parts[0]?.trim()); // 정규화 적용
            if (!raw) return;

            counts[raw] = (counts[raw] || 0) + 1;

            // 이미 분류된 경우 스킵
            if (typeMap[raw]) return;

            // 1. 데이터 자체에 힌트가 있는지 (예: "성시경 (유튜브)")
            // 2. 키워드 매칭
            const lowerRaw = raw.toLowerCase();
            let identifiedType: 'YOUTUBE' | 'BROADCAST' | 'OTHER' = 'OTHER';

            if (MEDIA_KEYWORDS.YOUTUBE_TYPE.some(k => lowerRaw.includes(k.toLowerCase()))) {
                identifiedType = 'YOUTUBE';
            } else if (MEDIA_KEYWORDS.BROADCAST_TYPE.some(k => lowerRaw.includes(k.toLowerCase()))) {
                identifiedType = 'BROADCAST';
            } else {
                // 기본적으로 유명 유튜버 이름이 포함되면 유튜브로 간주 (보조)
                // 하지만 명시적이지 않으면 '기타'로 빠지거나 전체에서만 노출
                // 여기서는 편의상 기본값을 'BROADCAST'로 할지 'YOUTUBE'로 할지 결정해야 하는데,
                // 일단 데이터에 힌트가 없다면 'OTHER'로 두고 전체 탭에만 나오게 함.
                // 단, '성시경', '풍자' 등은 확실히 유튜브임.
                if (['성시경', '풍자', '쯔양', '히밥', '백종원'].some(name => lowerRaw.includes(name))) {
                    identifiedType = 'YOUTUBE';
                }
            }
            typeMap[raw] = identifiedType;
        });

        // 빈도수 내림차순 정렬
        const sorted = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
        return { sortedMediaList: sorted, mediaTypeMap: typeMap };
    }, [places]);

    // 카테고리별 필터링 + 검색어 필터링
    const filteredMediaList = useMemo(() => {
        let targets = sortedMediaList;

        // 1. 탭 필터 (동적 분류 기반)
        if (activeTab !== 'ALL') {
            targets = targets.filter(mediaName => mediaTypeMap[mediaName] === activeTab);
        }

        // 2. 검색어 필터
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
        // 10개만 노출되도록 자르기 (스크롤 영역은 유지하되 페이지당 단위는 15 유지할지 10으로 바꿀지 결정)
        // 유저가 "10개만 노출하여" 라고 했으므로 ITEMS_PER_PAGE도 10으로 조정하는 것이 직관적임
        return filteredMediaList.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredMediaList, currentPage, ITEMS_PER_PAGE]);


    const handleCheckboxChange = (media: string) => {
        let newSelected: string[];
        if (selectedMedia.includes(media)) {
            newSelected = [];
        } else {
            newSelected = [media];
        }
        setSelectedMedia(newSelected);
        // [MOD] 즉시 필터링하지 않고 '리스트 보기' 버튼 클릭 시에만 필터링하도록 변경
    };

    const handleApply = (media: string) => {
        onFilterChange({ media: [media.trim()] });
    };

    const handleReset = () => {
        setSelectedMedia([]);
        setSearchTerm('');
        onFilterChange({ media: [] });
    };

    return (
        <div className={isMobileMode ? styles.mobileWrapper : `${styles.filterPanel} ${!isOpen ? styles.closed : ''}`}>
            {/* 토글 버튼 (데스크톱 전용) */}
            {!isMobileMode && (
                <button className={styles.toggleBtn} onClick={() => setIsOpen(!isOpen)}>
                    {isOpen ? '▶' : '◀'}
                </button>
            )}

            {/* 내부 검색 박스 */}
            <div style={{ marginBottom: '4px' }}>
                <input
                    type="text"
                    placeholder="방송 프로그램/채널 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '12px 15px',
                        borderRadius: '10px',
                        border: 'none',
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        color: 'white',
                        fontSize: '14px',
                        outline: 'none'
                    }}
                    className="placeholder-white"
                />
                <style>{`
                    .placeholder-white::placeholder { color: rgba(255, 255, 255, 0.7); }
                `}</style>
            </div>

            {/* 탭 버튼 */}
            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${activeTab === 'ALL' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('ALL')}
                >전체</button>
                <button
                    className={`${styles.tab} ${activeTab === 'YOUTUBE' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('YOUTUBE')}
                >유튜브</button>
                <button
                    className={`${styles.tab} ${activeTab === 'BROADCAST' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('BROADCAST')}
                >방송</button>
            </div>

            <div className={styles.section}>
                <div className={styles.listContainer}>
                    {paginatedMediaList.length > 0 ? (
                        <>
                            {paginatedMediaList.map((media, index) => {
                                const overallIndex = (currentPage - 1) * ITEMS_PER_PAGE + index;
                                const count = places.filter(p => {
                                    const mediaStr = p.media_label || p.media;
                                    if (!mediaStr) return false;
                                    const mediaName = normalizeMediaName(mediaStr.split('|')[0]?.trim());
                                    return mediaName === media;
                                }).length;

                                return (
                                    <div key={media}>
                                        <label
                                            className={`${styles.checkboxParams} ${selectedMedia.includes(media) ? styles.selected : ''}`}
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
                                                    handleApply(media);
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
                        <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '13px', padding: '40px 0', textAlign: 'center' }}>
                            검색 결과가 없습니다.
                        </div>
                    )}
                </div>
            </div>

            {/* 페이지네이션 (리스트 하단) */}
            {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', padding: '0 0 10px 0' }}>
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        style={{
                            border: 'none', background: currentPage === 1 ? 'rgba(255,255,255,0.1)' : '#fff', cursor: currentPage === 1 ? 'default' : 'pointer',
                            padding: '5px 12px', borderRadius: '6px', fontSize: '12px', color: currentPage === 1 ? 'rgba(255,255,255,0.3)' : '#333'
                        }}
                    >◀</button>
                    <span style={{ display: 'flex', alignItems: 'center', fontSize: '13px', fontWeight: 'bold', color: 'white' }}>
                        {currentPage} / {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        style={{
                            border: 'none', background: currentPage === totalPages ? 'rgba(255,255,255,0.1)' : '#fff', cursor: currentPage === totalPages ? 'default' : 'pointer',
                            padding: '5px 12px', borderRadius: '6px', fontSize: '12px', color: currentPage === totalPages ? 'rgba(255,255,255,0.3)' : '#333'
                        }}
                    >▶</button>
                </div>
            )}

        </div>
    );
}
