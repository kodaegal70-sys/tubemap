#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json
import os
import re
import requests

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
    except: pass
    return env_vars

env = load_env()
YOUTUBE_API_KEY = env.get('YOUTUBE_API_KEY')

def get_best_review(video_url, store_name, category):
    video_id = video_url.split('v=')[-1].split('&')[0]
    url = "https://www.googleapis.com/youtube/v3/commentThreads"
    params = {'part': 'snippet', 'videoId': video_id, 'order': 'relevance', 'maxResults': 30, 'key': YOUTUBE_API_KEY}
    
    try:
        res = requests.get(url, params=params, timeout=10).json()
        if 'items' in res:
            store_kw = store_name.replace('점', '').split()
            menu_kw = category.replace(',', ' ').split()
            food_kw = ['맛', '꼭', '추천', '최고', '먹', '역시', '진짜', '예술', '맛집']
            
            for item in res['items']:
                comment = item['snippet']['topLevelComment']['snippet']['textDisplay']
                comment = re.sub(r'<[^>]+>', '', comment)
                if not re.search(r'[가-힣]', comment): continue
                
                has_store = any(kw in comment for kw in store_kw if len(kw) > 1)
                has_menu = any(kw in comment for kw in menu_kw if len(kw) > 1)
                has_food = any(kw in comment for kw in food_kw)
                
                # 조건: 상호/메뉴 언급 또는 음식 관련 키워드 + 긍정적 뉘앙스
                if (has_store or has_menu or has_food) and 5 < len(comment) <= 80:
                    clean_comment = re.sub(r'[^\w\s가-힣.,!?~]', '', comment).strip()
                    if len(clean_comment) > 5:
                        return clean_comment
    except: pass
    return category # Fallback

def update_existing_reviews():
    path = 'src/data/places.json'
    with open(path, 'r', encoding='utf-8') as f:
        places = json.load(f)
        
    print("🔄 기존 업체 리뷰 업데이트 시작...")
    for p in places:
        print(f"[{p['name']}] 업데이트 중...")
        new_review = get_best_review(p['source_video_url'], p['name'], p['category'])
        p['description'] = new_review
        print(f"  ✅ 결과: {p['description'][:40]}...")
        
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(places, f, ensure_ascii=False, indent=2)
    print("✨ 모든 리뷰 업데이트 완료!")

if __name__ == "__main__":
    update_existing_reviews()
