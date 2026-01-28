'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { Place } from '@/data/places';

export type SheetState = 'peek' | 'half' | 'full';
export type SheetTab = 'list' | 'discovery';

export interface DiscoveryFilter {
  tab: 'ALL' | 'YOUTUBE' | 'BROADCAST';
  selectedMedia: string[];
  searchTerm: string;
}

interface MobileContextType {
  // BottomSheet 상태
  sheetState: SheetState;
  setSheetState: (state: SheetState | ((prev: SheetState) => SheetState)) => void;
  sheetTab: SheetTab;
  setSheetTab: (tab: SheetTab | ((prev: SheetTab) => SheetTab)) => void;

  // 선택된 장소
  selectedPlaceId: number | null;
  setSelectedPlaceId: (id: number | null | ((prev: number | null) => number | null)) => void;

  // 카테고리 필터
  categoryFilter: string[];
  setCategoryFilter: (categories: string[] | ((prev: string[]) => string[])) => void;

  // 디스커버리 필터
  discoveryFilter: DiscoveryFilter;
  setDiscoveryFilter: (filter: DiscoveryFilter | ((prev: DiscoveryFilter) => DiscoveryFilter)) => void;

  // 현재 표시할 장소 리스트
  places: Place[];
  setPlaces: (places: Place[]) => void;
}

const MobileContext = createContext<MobileContextType | undefined>(undefined);

export function MobileProvider({ children }: { children: ReactNode }) {
  const [sheetState, setSheetState] = useState<SheetState>('peek');
  const [sheetTab, setSheetTab] = useState<SheetTab>('list');
  const [selectedPlaceId, setSelectedPlaceId] = useState<number | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [discoveryFilter, setDiscoveryFilter] = useState<DiscoveryFilter>({
    tab: 'ALL',
    selectedMedia: [],
    searchTerm: '',
  });
  const [places, setPlaces] = useState<Place[]>([]);

  return (
    <MobileContext.Provider
      value={{
        sheetState,
        setSheetState,
        sheetTab,
        setSheetTab,
        selectedPlaceId,
        setSelectedPlaceId,
        categoryFilter,
        setCategoryFilter,
        discoveryFilter,
        setDiscoveryFilter,
        places,
        setPlaces,
      }}
    >
      {children}
    </MobileContext.Provider>
  );
}

export function useMobile() {
  const context = useContext(MobileContext);
  if (!context) {
    throw new Error('useMobile must be used within MobileProvider');
  }
  return context;
}
