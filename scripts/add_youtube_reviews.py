#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
YouTube 댓글에서 인기 리뷰 한 줄 추출
- YouTube API로 댓글 수집
- 좋아요 많은 댓글 선택
- 간결하고 긍정적인 리뷰만
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
YOUTUBE_API_KEY = env.get('YOUTUBE_API_KEY')

def get_top_comment(video_id, store_name, category):
    """YouTube API로 인기 댓글 가져오기 (업체/메뉴 관련만)"""
    url = "https://www.googleapis.com/youtube/v3/commentThreads"
    params = {
        'part': 'snippet',
        'videoId': video_id,
        'order': 'relevance',  # 인기순
        'maxResults': 20,  # 더 많이 가져와서 필터링
        'key': YOUTUBE_API_KEY
    }
    
    try:
        response = requests.get(url, params=params, timeout=10)
        data = response.json()
        
        if 'items' in data and len(data['items']) > 0:
            # 업체명/메뉴 키워드 추출
            store_keywords = store_name.replace('점', '').split()
            menu_keywords = category.replace(',', ' ').split()
            
            # 음식 관련 키워드
            food_keywords = [
                '맛있', '맛', '음식', '먹', '메뉴', '요리', '식사',
                '양', '가격', '서비스', '친절', '분위기',
                '추천', '최고', '대박', '꼭', '진짜', '역시'
            ]
            
            for item in data['items']:
                comment = item['snippet']['topLevelComment']['snippet']['textDisplay']
                
                # HTML 태그 제거
                import re
                comment = re.sub(r'<[^>]+>', '', comment)
                
                # 영문만 있는 댓글 제외
                if not re.search(r'[가-힣]', comment):
                    continue
                
                # 업체명 또는 메뉴 언급 확인
                has_store = any(kw in comment for kw in store_keywords if len(kw) > 1)
                has_menu = any(kw in comment for kw in menu_keywords if len(kw) > 1)
                has_food = any(kw in comment for kw in food_keywords)
                
                # 업체/메뉴 언급 또는 음식 관련 키워드 필수
                if (has_store or has_menu or has_food):
                    # 긍정적 키워드 선호
                    positive_words = ['맛있', '좋', '최고', '대박', '꼭', '추천', '진짜', '역시']
                    is_positive = any(word in comment for word in positive_words)
                    
                    # 짧은 댓글 선호 (60자 이하)
                    if len(comment) <= 60:
                        # 이모지 제거
                        comment = re.sub(r'[^\w\s가-힣.,!?]', '', comment).strip()
                        
                        if comment and len(comment) >= 5:  # 너무 짧은 것도 제외
                            # 긍정적 댓글 우선
                            if is_positive:
                                return comment
                            # 긍정 키워드 없어도 관련성 있으면 수집
                            elif has_store or has_menu:
                                return comment
            
            # 관련 댓글 없으면 None
            return None
        
        return None
    
    except Exception as e:
        print(f"  ⚠️ 댓글 수집 실패: {e}")
        return None

def add_reviews():
    """YouTube 댓글 기반 리뷰 추가"""
    print("🔧 YouTube 댓글 기반 리뷰 추가 시작\n")
    
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    places_path = os.path.join(root_dir, 'src', 'data', 'places.json')
    sample_path = os.path.join(root_dir, 'youtube_sample_5.json')
    
    # 영상 ID 매핑
    with open(sample_path, 'r', encoding='utf-8') as f:
        sample_data = json.load(f)
    
    video_map = {}
    for item in sample_data:
        video_map[item['source']['video_url']] = item['source']['video_id']
    
    # places.json 로드
    with open(places_path, 'r', encoding='utf-8') as f:
        places = json.load(f)
    
    for place in places:
        video_url = place.get('source_video_url', '')
        video_id = video_map.get(video_url)
        
        if video_id:
            print(f"[{place['name']}]")
            print(f"  영상 ID: {video_id}")
            
            # 댓글 가져오기 (업체명/카테고리 전달)
            review = get_top_comment(video_id, place['name'], place['category'])
            
            if review:
                old_desc = place['description']
                place['description'] = review
                
                print(f"  ✅ 리뷰: {review}")
                print(f"  (이전: {old_desc})\n")
            else:
                # 댓글 없으면 대표 메뉴 추출
                category = place['category']
                # 쉼표로 구분된 메뉴 중 첫 번째
                menu = category.split(',')[0].strip()
                
                old_desc = place['description']
                place['description'] = menu
                
                print(f"  ⚠️ 댓글 없음 → 대표 메뉴: {menu}")
                print(f"  (이전: {old_desc})\n")
        else:
            print(f"[{place['name']}] ⚠️ 영상 ID 없음\n")
    
    # 저장
    with open(places_path, 'w', encoding='utf-8') as f:
        json.dump(places, f, ensure_ascii=False, indent=2)
    
    print(f"✅ 완료: {len(places)}개 리뷰 추가")

if __name__ == "__main__":
    add_reviews()
