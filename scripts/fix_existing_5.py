#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
기존 5개 데이터를 요구사항대로 수정
1. Google Places API로 이미지 추가
2. 템플릿 기반 한 문장 생성
"""

import json
import os
import requests

# .env.local 직접 파싱
def load_env():
    env_path = os.path.join(os.path.dirname(__file__), '..', '.env.local')
    env_vars = {}
    try:
        with open(env_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    env_vars[key] = value
    except:
        pass
    return env_vars

env = load_env()
GOOGLE_API_KEY = env.get('GOOGLE_PLACES_API_KEY')

def get_google_photo(store_name, address):
    """Google Places API로 사진 가져오기"""
    url = "https://maps.googleapis.com/maps/api/place/findplacefromtext/json"
    params = {
        'input': f"{store_name} {address}",
        'inputtype': 'textquery',
        'fields': 'place_id,photos',
        'key': GOOGLE_API_KEY
    }
    
    try:
        response = requests.get(url, params=params, timeout=10)
        data = response.json()
        
        if data.get('status') == 'OK' and data.get('candidates'):
            candidate = data['candidates'][0]
            
            if candidate.get('photos'):
                photo_ref = candidate['photos'][0]['photo_reference']
                photo_url = f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference={photo_ref}&key={GOOGLE_API_KEY}"
                print(f"  ✅ {store_name}: 이미지 확보")
                return photo_url
            else:
                print(f"  ⚠️ {store_name}: 이미지 없음")
                return None
        else:
            print(f"  ❌ {store_name}: Google Places 매칭 실패")
            return None
    except Exception as e:
        print(f"  ❌ {store_name}: 오류 - {e}")
        return None

def generate_one_liner(store_name, category, video_title):
    """템플릿 기반 한 문장 생성"""
    # 특징 키워드 추출
    positive_words = {
        '맛있': '맛있다',
        '유명': '유명하다',
        '최고': '최고',
        '대박': '대박',
        '인기': '인기',
        '전통': '전통',
        '수제': '수제'
    }
    
    feature = '맛있다'
    for word, desc in positive_words.items():
        if word in video_title:
            feature = desc
            break
    
    # 템플릿
    text = f"{store_name}은(는) {category}로 유명하고, {feature}고 자주 언급돼요."
    return text

def fix_existing_data():
    """기존 5개 데이터 수정"""
    print("🔧 기존 5개 데이터 수정 시작\n")
    
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    input_path = os.path.join(root_dir, 'youtube_sample_5.json')
    output_path = os.path.join(root_dir, 'src', 'data', 'places.json')
    
    with open(input_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    places = []
    
    for idx, item in enumerate(data):
        source = item['source']
        place = item['place']
        
        print(f"\n[{idx+1}/5] {place['store_name']}")
        
        # 1. Google Places 이미지
        image_url = get_google_photo(place['store_name'], place['address'])
        
        # 2. 한 문장 생성
        video_title = source.get('video_url', '').split('v=')[-1]  # 임시
        description = generate_one_liner(
            place['store_name'],
            place['category'],
            "맛있는"  # 기본값
        )
        
        # 주소 파싱
        addr_parts = place['address'].split()
        
        place_record = {
            "id": idx + 1,
            "name": place['store_name'],
            "lat": place['lat'],
            "lng": place['lng'],
            "media": source['channel_name'],
            "description": description,
            "address": place['address'],
            "phone": place.get('phone', ''),
            "image_url": image_url,
            "naver_url": f"https://map.naver.com/p/search/{place['store_name']}",
            "category": place['category'],
            "addressProvince": addr_parts[0] if len(addr_parts) > 0 else "",
            "addressCity": addr_parts[1] if len(addr_parts) > 1 else "",
            "addressDistrict": addr_parts[2] if len(addr_parts) > 2 else "",
            "category_group": "",
            "road_address": "",
            "source_video_url": source['video_url']
        }
        
        places.append(place_record)
    
    # 저장
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(places, f, ensure_ascii=False, indent=2)
    
    print(f"\n\n✅ 수정 완료: {len(places)}개")
    print(f"   저장: {output_path}")
    
    # 통계
    with_image = sum(1 for p in places if p['image_url'])
    print(f"\n📊 통계:")
    print(f"   이미지 있음: {with_image}개")
    print(f"   이미지 없음: {len(places) - with_image}개")

if __name__ == "__main__":
    fix_existing_data()
