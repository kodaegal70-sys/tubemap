#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
YouTube 수집 결과를 places.json 형식으로 변환
"""

import json
import os

def convert_youtube_to_places(input_path, output_path):
    """YouTube 수집 결과를 places.json 형식으로 변환"""
    
    with open(input_path, 'r', encoding='utf-8') as f:
        youtube_data = json.load(f)
    
    places = []
    
    for idx, item in enumerate(youtube_data):
        source = item['source']
        place = item['place']
        
        # 주소 파싱
        addr_parts = place['address'].split()
        
        place_record = {
            "id": idx + 1,
            "name": place['store_name'],
            "lat": place['lat'],
            "lng": place['lng'],
            "media": source['channel_name'],
            "description": item.get('one_liner', {}).get('text', f"{place['category']} 전문점."),
            "address": place['address'],
            "phone": place.get('phone', ''),
            "image_url": item.get('media', {}).get('hero_food_image'),
            "naver_url": f"https://map.naver.com/p/search/{place['store_name']}",
            "category": place['category'],
            "addressProvince": addr_parts[0] if len(addr_parts) > 0 else "",
            "addressCity": addr_parts[1] if len(addr_parts) > 1 else "",
            "addressDistrict": addr_parts[2] if len(addr_parts) > 2 else "",
            "category_group": "",
            "road_address": "",
            "source_video_url": source['video_url'],
            "extraction_method": item.get('extraction_method', 'unknown')
        }
        
        places.append(place_record)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(places, f, ensure_ascii=False, indent=2)
    
    print(f"✅ 변환 완료: {len(places)}개")
    print(f"   입력: {input_path}")
    print(f"   출력: {output_path}")
    
    return places

if __name__ == "__main__":
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    input_path = os.path.join(root_dir, 'youtube_sample_5.json')
    output_path = os.path.join(root_dir, 'src', 'data', 'places.json')
    
    places = convert_youtube_to_places(input_path, output_path)
    
    print("\n수집된 맛집:")
    for p in places:
        print(f"  - {p['name']} ({p['addressCity']}) - {p['media']}")
