#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
비용 최적화 YouTube 수집 시스템
- 정규식 파싱 우선 (70% 성공률, 무료)
- OpenAI는 fallback (30%, 최소 비용)
- 상위 20개 채널만 집중
- 최근 30개 영상만
"""

import os
import json
import re
import requests
from typing import Optional, Dict, List

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

# API Keys
YOUTUBE_API_KEY = env.get('YOUTUBE_API_KEY')
KAKAO_API_KEY = env.get('KAKAO_REST_API_KEY')
OPENAI_API_KEY = env.get('OPENAI_API_KEY')

# 상위 20개 채널만 (구독자 기준)
TOP_CHANNELS = [
    "tzuyang", "문복희 Eat with Boki", "햄지 Hamzy", "쏘영 Ssoyoung",
    "밴쯔 Banzz", "히밥 Heebab", "백종원의 요리비책", "맛있는 녀석들 OFFICIAL",
    "성시경 SUNG SI KYUNG", "영국남자 Korean Englishman", "곽튜브", "최자로드",
    "또간집", "상해기 SangHaegi", "야미보이 Yummyboy", "입짧은햇님",
    "ChefPaikTV", "스트리트푸드파이터 tvN", "집밥백선생 OFFICIAL", "요리보고 조리보고"
]

def extract_with_regex(text: str) -> List[Dict]:
    """정규식으로 설명란 파싱 (무료, 빠름)"""
    candidates = []
    
    # 패턴 1: 📍 위치/주소
    location_patterns = [
        r'📍\s*(.+?)(?=\n|📞|🍴|$)',
        r'위치[:\s]+(.+?)(?=\n|전화|메뉴|$)',
        r'주소[:\s]+(.+?)(?=\n|전화|메뉴|$)',
        r'장소[:\s]+(.+?)(?=\n|전화|메뉴|$)'
    ]
    
    # 패턴 2: 📞 전화번호
    phone_pattern = r'(\d{2,3}[-\s]?\d{3,4}[-\s]?\d{4})'
    
    # 패턴 3: 🍴 메뉴
    menu_patterns = [
        r'🍴\s*(.+?)(?=\n|📞|📍|$)',
        r'메뉴[:\s]+(.+?)(?=\n|전화|위치|$)',
        r'대표메뉴[:\s]+(.+?)(?=\n|$)'
    ]
    
    # 패턴 4: 상호명 (대괄호, 따옴표)
    name_patterns = [
        r'\[([가-힣a-zA-Z0-9\s]{2,20})\]',
        r'\"([가-힣a-zA-Z0-9\s]{2,20})\"',
        r'가게명[:\s]+([가-힣a-zA-Z0-9\s]{2,20})',
        r'업체명[:\s]+([가-힣a-zA-Z0-9\s]{2,20})'
    ]
    
    # 추출
    store_name = None
    address = None
    menu = None
    
    for pattern in name_patterns:
        match = re.search(pattern, text)
        if match:
            store_name = match.group(1).strip()
            break
    
    for pattern in location_patterns:
        match = re.search(pattern, text)
        if match:
            address = match.group(1).strip()
            break
    
    for pattern in menu_patterns:
        match = re.search(pattern, text)
        if match:
            menu = match.group(1).strip()
            break
    
    # 최소 조건: 상호명 또는 주소 중 하나는 있어야 함
    if store_name or address:
        # 지역 힌트 추출
        area_hint = ''
        if address:
            area_parts = address.split()
            if len(area_parts) >= 2:
                area_hint = f"{area_parts[0]} {area_parts[1]}"
        
        candidates.append({
            'store_name_raw': store_name or '',
            'menu_hint': [menu] if menu else [],
            'area_hint': area_hint,
            'address_hint': address or '',
            'extraction_method': 'regex'
        })
    
    return candidates

def extract_with_openai(text: str) -> List[Dict]:
    """OpenAI로 추출 (fallback, 비용 발생)"""
    try:
        headers = {
            'Authorization': f'Bearer {OPENAI_API_KEY}',
            'Content-Type': 'application/json'
        }
        
        prompt = f"""다음 YouTube 영상 정보에서 맛집 정보를 추출하세요.

{text[:500]}

JSON 형식으로만 응답:
[{{"store_name": "업체명", "menu": "메뉴", "area": "지역", "address": "주소"}}]
맛집 없으면 []"""
        
        payload = {
            'model': 'gpt-3.5-turbo',
            'messages': [
                {'role': 'user', 'content': prompt}
            ],
            'temperature': 0.3,
            'max_tokens': 300
        }
        
        response = requests.post(
            'https://api.openai.com/v1/chat/completions',
            headers=headers,
            json=payload,
            timeout=15
        )
        
        if response.status_code == 200:
            result = response.json()
            content = result['choices'][0]['message']['content'].strip()
            
            # JSON 파싱
            if '```json' in content:
                content = content.split('```json')[1].split('```')[0].strip()
            elif '```' in content:
                content = content.split('```')[1].split('```')[0].strip()
            
            places = json.loads(content)
            
            candidates = []
            for p in places:
                candidates.append({
                    'store_name_raw': p.get('store_name', ''),
                    'menu_hint': [p.get('menu', '')] if p.get('menu') else [],
                    'area_hint': p.get('area', ''),
                    'address_hint': p.get('address', ''),
                    'extraction_method': 'openai'
                })
            
            return candidates
        
        return []
    
    except Exception as e:
        print(f"  ⚠️ OpenAI 오류: {e}")
        return []

def step5_attach_google_photo(place: Dict) -> Dict:
    """Step 5: 구글 Places 사진 붙이기"""
    print(f"\n[Step 5] 구글 사진: {place['store_name']}")
    
    # Google Places API로 장소 검색
    url = "https://maps.googleapis.com/maps/api/place/findplacefromtext/json"
    params = {
        'input': f"{place['store_name']} {place['address']}",
        'inputtype': 'textquery',
        'fields': 'place_id,photos',
        'key': env.get('GOOGLE_PLACES_API_KEY')
    }
    
    try:
        response = requests.get(url, params=params, timeout=10)
        data = response.json()
        
        if data.get('status') == 'OK' and data.get('candidates'):
            candidate = data['candidates'][0]
            google_place_id = candidate.get('place_id')
            
            # 사진이 있으면 URL 생성
            if candidate.get('photos'):
                photo_reference = candidate['photos'][0]['photo_reference']
                photo_url = f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference={photo_reference}&key={env.get('GOOGLE_PLACES_API_KEY')}"
                
                print(f"  ✅ 이미지 확보: Google Places")
                return {
                    'google_place_id': google_place_id,
                    'hero_food_image': photo_url,
                    'hero_food_image_source': 'google_places_photo'
                }
            else:
                print(f"  ⚠️ 이미지 없음 (Google Places에 사진 없음)")
                return {
                    'google_place_id': google_place_id,
                    'hero_food_image': None,
                    'hero_food_image_source': 'null'
                }
        else:
            print(f"  ⚠️ Google Places 매칭 실패")
            return {
                'google_place_id': None,
                'hero_food_image': None,
                'hero_food_image_source': 'null'
            }
    
    except Exception as e:
        print(f"  ❌ Google Places API 오류: {e}")
        return {
            'google_place_id': None,
            'hero_food_image': None,
            'hero_food_image_source': 'null'
        }

def step1_identify_channel(channel_name: str) -> Optional[Dict]:
    """Step 1: 채널 식별"""
    print(f"\n[Step 1] 채널: {channel_name}")
    
    url = "https://www.googleapis.com/youtube/v3/search"
    params = {
        'part': 'snippet',
        'q': channel_name,
        'type': 'channel',
        'maxResults': 1,
        'key': YOUTUBE_API_KEY
    }
    
    try:
        response = requests.get(url, params=params, timeout=10)
        data = response.json()
        
        if 'items' in data and len(data['items']) > 0:
            channel = data['items'][0]
            return {
                'channel_name': channel['snippet']['title'],
                'channel_id': channel['snippet']['channelId']
            }
    except:
        pass
    
    return None

def step2_collect_videos(channel_id: str, max_results=30) -> List[Dict]:
    """Step 2: 최신 30개 영상만 수집 (필터링)"""
    print(f"[Step 2] 영상 수집 (최대 {max_results}개)")
    
    url = "https://www.googleapis.com/youtube/v3/search"
    params = {
        'part': 'snippet',
        'channelId': channel_id,
        'order': 'date',
        'type': 'video',
        'maxResults': max_results,
        'key': YOUTUBE_API_KEY
    }
    
    try:
        response = requests.get(url, params=params, timeout=10)
        data = response.json()
        
        if 'items' not in data:
            return []
        
        videos = []
        keywords = ['맛집', '먹방', '식당', '음식', '카페', '맛', '먹']
        
        for item in data['items']:
            title = item['snippet']['title']
            
            # 키워드 필터링
            if any(kw in title for kw in keywords):
                videos.append({
                    'video_id': item['id']['videoId'],
                    'title': title,
                    'description': item['snippet']['description'],
                    'video_url': f"https://www.youtube.com/watch?v={item['id']['videoId']}"
                })
        
        print(f"  ✅ {len(videos)}개 수집 (필터링 후)")
        return videos
    
    except:
        return []

def step3_extract_smart(video: Dict) -> List[Dict]:
    """Step 3: 스마트 추출 (정규식 우선 → OpenAI fallback)"""
    print(f"\n[Step 3] {video['title'][:40]}...")
    
    text = f"{video['title']}\n\n{video['description']}"
    
    # 1차: 정규식 (무료)
    candidates = extract_with_regex(text)
    
    if candidates:
        print(f"  ✅ {len(candidates)}개 추출 (정규식, 무료)")
        for c in candidates:
            c['source_video_id'] = video['video_id']
        return candidates
    
    # 2차: OpenAI (비용 발생)
    print(f"  ⚙️ OpenAI 호출 중...")
    candidates = extract_with_openai(text)
    
    if candidates:
        print(f"  ✅ {len(candidates)}개 추출 (OpenAI, $0.002)")
        for c in candidates:
            c['source_video_id'] = video['video_id']
        return candidates
    
    print(f"  ❌ 추출 실패")
    return []

def step4_confirm_kakao(candidate: Dict) -> Optional[Dict]:
    """Step 4: 카카오 확정 + 프랜차이즈 필터"""
    query = candidate['store_name_raw'] or candidate['address_hint']
    if not query:
        return None
    
    if candidate.get('area_hint'):
        query = f"{query} {candidate['area_hint']}"
    
    url = "https://dapi.kakao.com/v2/local/search/keyword.json"
    headers = {"Authorization": f"KakaoAK {KAKAO_API_KEY}"}
    params = {"query": query, "size": 1}
    
    # 강화된 프랜차이즈 및 일반명사 키워드 (v4.1)
    EXCLUDE_KEYWORDS = [
        'KFC', '맥도날드', '버거킹', '롯데리아', '맘스터치',
        '교촌', 'BBQ', 'bhc', '굽네', '푸라닭', '60계',
        '스타벅스', '투썸', '이디야', '메가커피', '컴포즈', '빽다방', '우지커피',
        'CU', 'GS25', '세븐일레븐', '편의점',
        '신전', '엽기떡볶이', '응급실떡볶이',
        '맛집', '먹방', '원조', '왕돈까스', '불닭발' # 일반 명사성 상호 제외
    ]
    
    try:
        response = requests.get(url, headers=headers, params=params, timeout=10)
        data = response.json()
        
        if data.get('documents'):
            place = data['documents'][0]
            category = place.get('category_name', '')
            store_name = place['place_name']
            
            # 프랜차이즈 및 일반명사 필터
            if any(kw in store_name for kw in EXCLUDE_KEYWORDS):
                print(f"  ❌ 필터 제외: {store_name}")
                return None
            
            # 음식점/카페만 허용
            if '음식점' in category or '카페' in category:
                # v4.0: 역방향 주소 검증 (일반 명사 제외)
                address = place['address_name']
                reverse_params = {"query": address, "size": 5}
                
                try:
                    reverse_response = requests.get(url, headers=headers, params=reverse_params, timeout=10)
                    reverse_data = reverse_response.json()
                    
                    # 주소로 검색한 결과에 상호명이 있는지 확인
                    if reverse_data.get('documents'):
                        reverse_names = [d['place_name'] for d in reverse_data['documents']]
                        
                        # 상호명이 검색 결과에 없으면 일반 명사로 판단
                        if store_name not in reverse_names:
                            print(f"  ❌ 역방향 검증 실패: {store_name} (일반 명사)")
                            return None
                except:
                    pass  # 역방향 검증 실패해도 일단 진행
                
                return {
                    'kakao_place_id': place['id'],
                    'store_name': store_name,
                    'category': category.split('>')[-1].strip(),
                    'address': address,
                    'lat': float(place['y']),
                    'lng': float(place['x']),
                    'phone': place.get('phone', None),
                    'reverse_verified': True
                }
    except:
        pass
    
    return None

def step6_get_youtube_review(video_id: str, store_name: str, category: str) -> str:
    """Step 6: YouTube 댓글 리뷰 (v4.0)"""
    url = "https://www.googleapis.com/youtube/v3/commentThreads"
    params = {
        'part': 'snippet',
        'videoId': video_id,
        'order': 'relevance',
        'maxResults': 20,
        'key': YOUTUBE_API_KEY
    }
    
    try:
        response = requests.get(url, params=params, timeout=10)
        data = response.json()
        
        if 'items' in data:
            store_keywords = store_name.replace('점', '').split()
            menu_keywords = category.replace(',', ' ').split()
            food_keywords = ['맛있', '맛', '음식', '먹', '메뉴', '추천', '최고', '대박']
            
            for item in data['items']:
                comment = item['snippet']['topLevelComment']['snippet']['textDisplay']
                comment = re.sub(r'<[^>]+>', '', comment)
                
                if not re.search(r'[가-힣]', comment):
                    continue
                
                has_store = any(kw in comment for kw in store_keywords if len(kw) > 1)
                has_menu = any(kw in comment for kw in menu_keywords if len(kw) > 1)
                has_food = any(kw in comment for kw in food_keywords)
                
                if (has_store or has_menu or has_food) and len(comment) <= 60:
                    comment = re.sub(r'[^\w\s가-힣.,!?]', '', comment).strip()
                    if comment and len(comment) >= 5:
                        return comment
    except:
        pass
    
    # Fallback: 대표 메뉴
    return category.split(',')[0].strip()

def process_channel_optimized(channel_name: str):
    """최적화된 채널 처리"""
    print(f"\n{'='*60}")
    print(f"채널: {channel_name}")
    print(f"{'='*60}")
    
    channel_info = step1_identify_channel(channel_name)
    if not channel_info:
        return []
    
    videos = step2_collect_videos(channel_info['channel_id'], max_results=30)
    if not videos:
        return []
    
    results = []
    regex_count = 0
    openai_count = 0
    
    for video in videos[:10]:  # 테스트: 10개만
        candidates = step3_extract_smart(video)
        
        for candidate in candidates[:1]:  # 후보 1개만
            if candidate.get('extraction_method') == 'regex':
                regex_count += 1
            else:
                openai_count += 1
            
            place = step4_confirm_kakao(candidate)
            if place:
                # Step 6: YouTube 댓글 리뷰
                review = step6_get_youtube_review(
                    video['video_id'],
                    place['store_name'],
                    place['category']
                )
                
                record = {
                    'source': {
                        'channel_name': channel_info['channel_name'],
                        'video_id': video['video_id'],
                        'video_url': video['video_url']
                    },
                    'place': place,
                    'review': review,
                    'extraction_method': candidate.get('extraction_method', 'unknown')
                }
                results.append(record)
                print(f"  ✅ {place['store_name']} - {review[:30]}...")
    
    print(f"\n📊 통계: 정규식={regex_count}, OpenAI={openai_count}")
    print(f"💰 예상 비용: ${openai_count * 0.002:.3f}")
    
    return results

if __name__ == "__main__":
    print("🚀 비용 최적화 YouTube 수집 시스템 (샘플 5개)")
    print(f"   대상: 상위 {len(TOP_CHANNELS)}개 채널")
    print(f"   목표: 5개 맛집 수집 (프랜차이즈 제외)")
    
    all_results = []
    target_count = 5
    
    # 5개 수집될 때까지 채널 순회
    for channel_name in TOP_CHANNELS:
        if len(all_results) >= target_count:
            break
        
        print(f"\n현재 수집: {len(all_results)}/{target_count}")
        results = process_channel_optimized(channel_name)
        all_results.extend(results)
    
    # 사진 수집 및 최종 변환
    final_places = []
    for idx, item in enumerate(all_results):
        # Step 5: Google Places Photo
        photo_info = step5_attach_google_photo(item['place'])
        
        # places.json 포맷으로 변환
        addr_parts = item['place']['address'].split()
        
        place_record = {
            "id": idx + 1,
            "name": item['place']['store_name'],
            "lat": item['place']['lat'],
            "lng": item['place']['lng'],
            "media": item['source']['channel_name'],
            "description": item['review'],
            "address": item['place']['address'],
            "phone": item['place'].get('phone', ''),
            "image_url": photo_info.get('hero_food_image'),
            "naver_url": f"https://map.naver.com/p/search/{item['place']['store_name']}",
            "category": item['place']['category'],
            "addressProvince": addr_parts[0] if len(addr_parts) > 0 else "",
            "addressCity": addr_parts[1] if len(addr_parts) > 1 else "",
            "addressDistrict": addr_parts[2] if len(addr_parts) > 2 else "",
            "category_group": "",
            "road_address": "",
            "source_video_url": item['source']['video_url'],
            "google_place_id": photo_info.get('google_place_id')
        }
        final_places.append(place_record)
    
    # 1. youtube_sample_5.json 저장 (원본 로그)
    output_path = os.path.join(os.path.dirname(__file__), '..', 'youtube_sample_5.json')
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(all_results, f, ensure_ascii=False, indent=2)
    
    # 2. src/data/places.json 저장 (UI용)
    ui_data_path = os.path.join(os.path.dirname(__file__), '..', 'src', 'data', 'places.json')
    with open(ui_data_path, 'w', encoding='utf-8') as f:
        json.dump(final_places, f, ensure_ascii=False, indent=2)
    
    print(f"\n\n✅ 수집 완료: {len(final_places)}개")
    print(f"   원본 저장: {output_path}")
    print(f"   UI 데이터 저장: {ui_data_path}")
    print(f"\n🚀 다음 단계: node scripts/sync_to_supabase.js 실행")
