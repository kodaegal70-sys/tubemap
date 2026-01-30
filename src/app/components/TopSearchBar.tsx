'use client';

import { useState, useEffect, memo } from 'react';
import styles from './TopSearchBar.module.css';

type Props = {
    value?: string;
    onSearch: (keyword: string) => void;
    onCategoryToggle: (category: string) => void;
    selectedCategories: string[];
    onMyLocation?: () => void;
};

const TopSearchBar = memo(function TopSearchBar({ value = '', onSearch, onCategoryToggle, selectedCategories, onMyLocation }: Props) {
    const [text, setText] = useState(value);

    // 부모의 value가 바뀌면 내부 text도 동기화 (검색 초기화 등 대응)
    useEffect(() => {
        setText(value);
    }, [value]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            onSearch(text);
            e.currentTarget.blur(); // 키보드 닫기
        }
    };

    return (
        <div
            className={styles.searchWrapper}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
        >
            <div className={styles.searchBar}>
                <div className={styles.brand}>
                    <div className={styles.brandLogo} />
                    <div className={styles.brandText}>
                        <div className={styles.brandName}>Tube Map</div>
                        <div className={styles.brandSlogan}>유튜브 · 방송 맛집 지도</div>
                    </div>
                </div>
                <div className={styles.searchInputArea}>
                    <span className={styles.icon}>🔍</span>
                    <input
                        type="text"
                        className={styles.input}
                        placeholder="지역, 맛집 검색..."
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        inputMode="search"
                        enterKeyHint="search"
                        autoCorrect="off"
                        spellCheck={false}
                    />
                </div>
            </div>

            <div className={styles.chipScroll}>
                {['한식', '중식', '일식', '양식', '분식', '기타'].map(cat => (
                    <div
                        key={cat}
                        className={`${styles.chip} ${selectedCategories.includes(cat) ? styles.chipActive : ''}`}
                        onClick={() => onCategoryToggle(cat)}
                    >
                        {cat}
                    </div>
                ))}
            </div>

            {onMyLocation && (
                <div className={styles.myLocationRow}>
                    <button
                        type="button"
                        className={styles.myLocationButton}
                        onClick={onMyLocation}
                    >
                        📍 내 위치로 이동
                    </button>
                </div>
            )}
        </div>
    );
});

export default TopSearchBar;
