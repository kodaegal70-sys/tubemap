'use client';
import { useState, useEffect, useMemo } from 'react';
import styles from './Sidebar.module.css';
import { Place } from '@/data/places';
import AdSlot from './AdSlot';

type Props = {
    places: Place[];
    onPlaceClick: (place: Place) => void;
    onSearch: (keyword: string) => void;
    onMoveToCurrentLocation: () => void;
    onCategoryFilterChange?: (categories: string[]) => void; // 카테고리 필터 핸들러
    onGoBack?: () => void; // 이전으로 버튼
    canGoBack?: boolean; // 이전 히스토리 존재 여부
    selectedCategoryFilters?: string[]; // 부모로부터 전달받는 카테고리 필터 상태 (동기화용)
};

const ITEMS_PER_PAGE = 15;

export default function Sidebar({ places, onPlaceClick, onSearch, onMoveToCurrentLocation, onCategoryFilterChange, onGoBack, canGoBack, selectedCategoryFilters }: Props) {
    // 모바일에서는 기본적으로 닫힌 상태
    const [isOpen, setIsOpen] = useState(true);

    useEffect(() => {
        if (typeof window !== 'undefined' && window.innerWidth < 768) {
            setIsOpen(false);
        }
    }, []);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedCategories, setSelectedCategories] = useState<string[]>(selectedCategoryFilters || []); // 초기값 동기화

    // 부모의 카테고리 필터가 변경되면 내부 상태도 업데이트
    useEffect(() => {
        if (selectedCategoryFilters !== undefined) {
            setSelectedCategories(selectedCategoryFilters);
        }
    }, [selectedCategoryFilters]);

    const listRef = useMemo(() => {
        if (typeof window === 'undefined') return null;
        return { current: null as HTMLDivElement | null };
    }, []);

    // places 변경 시 첫 페이지로 리셋 및 스크롤 상단 이동
    useEffect(() => {
        setCurrentPage(1);
        const listElement = document.querySelector(`.${styles.list}`);
        if (listElement) {
            listElement.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [places]);

    const totalPages = Math.ceil(places.length / ITEMS_PER_PAGE);

    const paginatedPlaces = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return places.slice(start, start + ITEMS_PER_PAGE);
    }, [places, currentPage]);

    const handleSearchSubmit = () => {
        onSearch(searchTerm.trim());
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSearchSubmit();
    };

    return (
        <div className={styles.sidebar} style={{ transform: isOpen ? 'translateX(0)' : 'translateX(-100%)' }}>
            <button className={styles.toggleBtn} onClick={() => setIsOpen(!isOpen)}>
                {isOpen ? '◀' : '▶'}
            </button>

            <div className={styles.header}>
                <div className={styles.searchBox} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                        <input
                            type="text"
                            placeholder="지역, 맛집 검색..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className={styles.searchInput}
                            style={{ flex: 1 }}
                        />
                        <button onClick={handleSearchSubmit} className={styles.searchButton}>🔍</button>
                    </div>
                    {/* 내 위치 버튼 */}
                    <button
                        onClick={onMoveToCurrentLocation}
                        style={{
                            width: '100%',
                            padding: '10px',
                            backgroundColor: '#333',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            fontWeight: 'bold', fontSize: '14px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                    >
                        <span>🎯</span> 내 위치 주변 보기
                    </button>

                    {/* 카테고리 필터 */}
                    <div style={{ marginTop: '12px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#666', marginBottom: '8px' }}>🍽️ 음식 카테고리</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {['한식', '중식', '일식', '양식', '분식', '기타'].map(category => (
                                <button
                                    key={category}
                                    onClick={() => {
                                        const newCategories = selectedCategories.includes(category)
                                            ? selectedCategories.filter(c => c !== category)
                                            : [...selectedCategories, category];
                                        setSelectedCategories(newCategories);
                                        onCategoryFilterChange?.(newCategories);
                                    }}
                                    style={{
                                        padding: '6px 12px',
                                        fontSize: '12px',
                                        border: selectedCategories.includes(category) ? '2px solid #E53935' : '1px solid #ddd',
                                        background: selectedCategories.includes(category) ? '#FFE5E5' : 'white',
                                        color: selectedCategories.includes(category) ? '#E53935' : '#666',
                                        borderRadius: '16px',
                                        cursor: 'pointer',
                                        fontWeight: selectedCategories.includes(category) ? 'bold' : 'normal',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {category}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* 사이드바 상단 광고 영역 (고정) */}
            <AdSlot type="SIDEBAR_TOP" id="sidebar-ad-top" />

            {/* 이전 목록으로 버튼 */}
            {onGoBack && (
                <div style={{ padding: '12px 16px 0 16px' }}>
                    <button
                        onClick={onGoBack}
                        disabled={!canGoBack}
                        style={{
                            width: '100%',
                            padding: '12px',
                            backgroundColor: canGoBack ? '#4CAF50' : '#ccc',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: canGoBack ? 'pointer' : 'not-allowed',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            transition: 'all 0.2s',
                            boxShadow: canGoBack ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
                        }}
                    >
                        ⬅️ 이전 목록으로
                    </button>
                </div>
            )}

            <div className={styles.list}>
                {places.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
                        지도 화면 내에 맛집이 없어요.<br /><br />
                        지도를 축소하거나 이동해보세요!<br />
                        (검색으로도 찾을 수 있어요)
                    </div>
                ) : (
                    <>
                        {paginatedPlaces.map((place) => (
                            <div key={place.id} className={styles.item} onClick={() => onPlaceClick(place)}>
                                {/* 텍스트 영역 */}
                                <div className={styles.itemContent}>
                                    <div className={styles.itemName} style={{ fontSize: '18px', marginBottom: '4px' }}>{place.name}</div>
                                    <div style={{ fontSize: '13px', color: '#e53935', fontWeight: 'bold', marginBottom: '4px' }}>
                                        📺 {place.category === '촬영지' ? (place.media?.split('|')[0] || '') : (place.media?.split('|').join(', ') || '')}
                                    </div>
                                    {place.phone && place.phone.trim().length > 3 && (
                                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                                            📞 {place.phone}
                                        </div>
                                    )}
                                    <div className={styles.itemDesc} style={{ fontSize: '14px', color: '#666' }}>
                                        {place.description}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* 페이지네이션 컨트롤 */}
                        {totalPages > 1 && (
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', padding: '16px 0', borderTop: '1px solid rgba(255, 255, 255, 0.2)' }}>
                                <button
                                    onClick={() => {
                                        setCurrentPage(prev => Math.max(prev - 1, 1));
                                        const listElement = document.querySelector(`.${styles.list}`);
                                        if (listElement) listElement.scrollTo({ top: 0 });
                                    }}
                                    disabled={currentPage === 1}
                                    style={{
                                        border: 'none', background: currentPage === 1 ? 'rgba(255,255,255,0.1)' : '#fff', cursor: currentPage === 1 ? 'default' : 'pointer',
                                        padding: '5px 12px', borderRadius: '6px', fontSize: '12px', color: currentPage === 1 ? 'rgba(255,255,255,0.3)' : '#333'
                                    }}
                                >
                                    ◀
                                </button>
                                <span style={{ display: 'flex', alignItems: 'center', fontSize: '13px', fontWeight: 'bold', color: 'white' }}>
                                    {currentPage} / {totalPages}
                                </span>
                                <button
                                    onClick={() => {
                                        setCurrentPage(prev => Math.min(prev + 1, totalPages));
                                        const listElement = document.querySelector(`.${styles.list}`);
                                        if (listElement) listElement.scrollTo({ top: 0 });
                                    }}
                                    disabled={currentPage === totalPages}
                                    style={{
                                        border: 'none', background: currentPage === totalPages ? 'rgba(255,255,255,0.1)' : '#fff', cursor: currentPage === totalPages ? 'default' : 'pointer',
                                        padding: '5px 12px', borderRadius: '6px', fontSize: '12px', color: currentPage === totalPages ? 'rgba(255,255,255,0.3)' : '#333'
                                    }}
                                >
                                    ▶
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div >
    );
}
