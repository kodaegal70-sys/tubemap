#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
기존 5개 데이터의 설명 문장을 개선
- 업체명 중복 제거
- 자연스러운 조사 사용
- 다양한 템플릿
"""

import json
import os

def generate_natural_description(store_name, category, address):
    """자연스럽고 다양한 설명 문장 생성"""
    
    # 지역 추출
    addr_parts = address.split()
    region = addr_parts[1] if len(addr_parts) > 1 else addr_parts[0]
    
    # 카테고리별 다양한 템플릿
    templates = [
        f"{category} 전문점으로, 현지에서 인기가 많아요.",
        f"{region}에서 {category}로 유명한 곳이에요.",
        f"{category}를 맛볼 수 있고, 자주 언급되는 맛집이에요.",
        f"현지인들이 자주 찾는 {category} 맛집이에요.",
        f"{category}가 대표 메뉴이고, 방송에 소개된 곳이에요.",
    ]
    
    # 업체명 기반으로 템플릿 선택 (일관성 유지)
    template_idx = sum(ord(c) for c in store_name) % len(templates)
    return templates[template_idx]

def fix_descriptions():
    """설명 문장 개선"""
    print("🔧 설명 문장 개선 시작\n")
    
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    path = os.path.join(root_dir, 'src', 'data', 'places.json')
    
    with open(path, 'r', encoding='utf-8') as f:
        places = json.load(f)
    
    for place in places:
        old_desc = place['description']
        new_desc = generate_natural_description(
            place['name'],
            place['category'],
            place['address']
        )
        
        place['description'] = new_desc
        
        print(f"✅ {place['name']}")
        print(f"   이전: {old_desc}")
        print(f"   개선: {new_desc}\n")
    
    # 저장
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(places, f, ensure_ascii=False, indent=2)
    
    print(f"✅ 완료: {len(places)}개 문장 개선")

if __name__ == "__main__":
    fix_descriptions()
