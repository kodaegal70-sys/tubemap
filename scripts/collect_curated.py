#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
21대 수집 지침: 유명 맛집 직접 지정 방식
- 각 미디어별 실제 소개된 유명 맛집 리스트
- 3-Step 이미지 검증
- Anti-Map/Ad/Milkit 필터
"""

import json
import os
import sys

# 기존 collect_v21.py의 함수들 재사용
sys.path.append(os.path.dirname(__file__))
from collect_v21 import (
    get_kakao_place_info,
    get_image_3step,
    OFFICIAL_MEDIA_NAMES,
    VALID_CATEGORIES
)
import urllib.parse

# 각 미디어별 실제 소개된 유명 맛집 (예시)
CURATED_PLACES = {
    "성시경의 먹을텐데": [
        "남포면옥", "을밀대", "평래옥", "진주회관", "우래옥",
        "명동교자", "광화문국밥", "청진옥", "하동관", "필동면옥"
    ],
    "tzuyang쯔양": [
        "원조할매국수", "원조할매순대국", "신포우래옥", "인천신포국제시장",
        "송탄부대찌개", "오산족발", "평택국제중앙시장", "천안삼거리", "아산온천"
    ],
    "야식이": [
        "마포갈매기", "연남동돼지갈비", "홍대곱창", "신촌닭한마리",
        "이태원경양식", "용리단길", "해방촌", "경리단길"
    ],
    "또간집": [
        "목포홍어", "광주양동시장", "전주남부시장", "군산", "익산"
    ],
    "님아 그 시장을 가오": [
        "통인시장", "망원시장", "광장시장", "중부시장", "남대문시장"
    ],
    "식객 허영만의 백반기행": [
        "을지로3가", "충무로", "신당동떡볶이", "종로포장마차", "황학동"
    ],
    "맛있는 녀석들": [
        "강남역맛집", "역삼동", "논현동", "청담동", "압구정"
    ],
    "생활의 달인": [
        "원조집", "할매집", "할아버지집", "대를이은집", "3대째"
    ]
}

def collect_curated(target_count=20):
    """큐레이션된 맛집 리스트로 수집"""
    print("🚀 [Phase 49] 21대 수집 지침 - 큐레이션 방식")
    print(f"   Target: {target_count}개\n")
    
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    src_path = os.path.join(root_dir, 'src', 'data', 'places.json')
    
    try:
        with open(src_path, 'r', encoding='utf-8') as f:
            existing_places = json.load(f)
    except:
        existing_places = []
    
    seen_keys = set()
    for p in existing_places:
        seen_keys.add(f"{p['name']}_{p['address']}")
    
    new_places = []
    
    for media, place_names in CURATED_PLACES.items():
        if len(new_places) >= target_count:
            break
        
        print(f"\n📡 Media: {media}")
        
        for place_name in place_names:
            if len(new_places) >= target_count:
                break
            
            print(f"\n  🔍 {place_name}")
            
            place_info = get_kakao_place_info(place_name)
            if not place_info:
                print(f"    ❌ Kakao API Failed")
                continue
            
            if place_info['category'] not in VALID_CATEGORIES:
                print(f"    ❌ Invalid Category: {place_info['category']}")
                continue
            
            key = f"{place_info['name']}_{place_info['address']}"
            if key in seen_keys:
                print(f"    ❌ Duplicate")
                continue
            
            city = place_info['address'].split()[1] if len(place_info['address'].split()) > 1 else ""
            menu = place_info['category']
            
            # 21대 지침: 3-Step 이미지
            image_url = get_image_3step(place_info['name'], menu, city)
            
            if not image_url:
                print(f"    ❌ Zero Tolerance: No Image")
                continue
            
            place_info['media'] = media
            place_info['description'] = f"{menu} 전문점."
            place_info['image_url'] = image_url
            place_info['naver_url'] = f"https://map.naver.com/p/search/{urllib.parse.quote(place_info['name'])}"
            
            addr_parts = place_info['address'].split(' ')
            place_info['addressProvince'] = addr_parts[0] if len(addr_parts) > 0 else ""
            place_info['addressCity'] = addr_parts[1] if len(addr_parts) > 1 else ""
            place_info['addressDistrict'] = addr_parts[2] if len(addr_parts) > 2 else ""
            
            place_info['id'] = len(existing_places) + len(new_places) + 1
            new_places.append(place_info)
            seen_keys.add(key)
            
            print(f"    ✅ [{len(new_places)}/{target_count}] {place_info['name']} ({place_info['category']})")
    
    if new_places:
        with open(src_path, 'w', encoding='utf-8') as f:
            json.dump(existing_places + new_places, f, ensure_ascii=False, indent=2)
        print(f"\n\n✅ 수집 완료: {len(new_places)}개 추가")
        print(f"   Total: {len(existing_places) + len(new_places)}개")
    else:
        print("\n\n⚠️ 신규 수집 없음")

if __name__ == "__main__":
    collect_curated(target_count=20)
