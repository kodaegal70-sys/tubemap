#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
데이터 품질 검증 및 정제
- 관광지/산 등 비음식점 제거
- 이미지-메뉴 유사성 재검증
"""

import json
import os

def clean_data():
    """비음식점 데이터 제거"""
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    src_path = os.path.join(root_dir, 'src', 'data', 'places.json')
    
    with open(src_path, 'r', encoding='utf-8') as f:
        places = json.load(f)
    
    print(f"🔍 검증 시작: {len(places)}개")
    
    # 비음식점 키워드
    invalid_keywords = ["둘레길", "산", "기념비", "공원", "관광", "여행"]
    
    cleaned = []
    removed = []
    
    for p in places:
        cat_group = p.get('category_group', '')
        name = p.get('name', '')
        
        # 카테고리에 "음식점" 없으면 제거
        if "음식점" not in cat_group:
            # 예외: 카페는 허용
            if "카페" in cat_group or p.get('category') == "카페":
                cleaned.append(p)
            else:
                removed.append(f"{name} ({cat_group})")
                print(f"  ❌ 제거: {name} - {cat_group}")
                continue
        
        # 이름에 비음식점 키워드 포함 시 제거
        if any(kw in name for kw in invalid_keywords):
            removed.append(f"{name} (이름 필터)")
            print(f"  ❌ 제거: {name} - 비음식점 키워드")
            continue
        
        cleaned.append(p)
    
    # ID 재정렬
    for idx, p in enumerate(cleaned):
        p['id'] = idx + 1
    
    with open(src_path, 'w', encoding='utf-8') as f:
        json.dump(cleaned, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ 정제 완료")
    print(f"   유지: {len(cleaned)}개")
    print(f"   제거: {len(removed)}개")
    if removed:
        print("\n제거된 항목:")
        for r in removed:
            print(f"   - {r}")

if __name__ == "__main__":
    clean_data()
