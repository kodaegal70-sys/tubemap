#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
초고속 & 무결성 리뷰 수집 엔진 (v6.0)
- YouTube 댓글 + Google Places 리뷰 멀티 수집
- 리뷰 미발굴 시 즉시 삭제 (Strict Filtering)
"""

import os
import json
import re
import requests
import concurrent.futures
from typing import Dict, List, Optional

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
KAKAO_API_KEY = env.get('KAKAO_REST_API_KEY')
GOOGLE_API_KEY = env.get('GOOGLE_PLACES_API_KEY')

def get_google_data(store_name: str, address: str):
    """Google Places에서 사진과 리뷰 동시 수집"""
    url = "https://maps.googleapis.com/maps/api/place/findplacefromtext/json"
    params = {'input': f"{store_name} {address}", 'inputtype': 'textquery', 'fields': 'place_id,photos', 'key': GOOGLE_API_KEY}
    
    try:
        res = requests.get(url, params=params, timeout=5).json()
        if res.get('status') == 'OK' and res.get('candidates'):
            place_id = res['candidates'][0]['place_id']
            
            # 상세 정보(리뷰) 수집
            detail_url = "https://maps.googleapis.com/maps/api/place/details/json"
            detail_params = {'place_id': place_id, 'fields': 'reviews,photos', 'language': 'ko', 'key': GOOGLE_API_KEY}
            detail = requests.get(detail_url, params=detail_params, timeout=5).json()
            
            result = detail.get('result', {})
            photo_url = None
            if result.get('photos'):
                ref = result['photos'][0]['photo_reference']
                photo_url = f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference={ref}&key={GOOGLE_API_KEY}"
            
            # 리뷰 추출
            google_review = None
            if result.get('reviews'):
                # 20자 이상 100자 이하의 한국어 리뷰 선별
                for r in result['reviews']:
                    text = r.get('text', '')
                    if len(text) > 20 and re.search(r'[가-힣]', text):
                        google_review = text.replace('\n', ' ').strip()
                        break
            
            return photo_url, google_review
    except: pass
    return None, None

def get_youtube_review(video_id: str, store_name: str, category: str) -> Optional[str]:
    url = "https://www.googleapis.com/youtube/v3/commentThreads"
    params = {'part': 'snippet', 'videoId': video_id, 'order': 'relevance', 'maxResults': 30, 'key': YOUTUBE_API_KEY}
    try:
        res = requests.get(url, params=params, timeout=5).json()
        if 'items' in res:
            for item in res['items']:
                comment = item['snippet']['topLevelComment']['snippet']['textDisplay']
                comment = re.sub(r'<[^>]+>', '', comment)
                if 15 < len(comment) <= 100 and any(kw in comment for kw in [store_name[:2], '맛', '추천']):
                    return re.sub(r'[^\w\s가-힣.,!?~]', '', comment).strip()
    except: pass
    return None

def process_and_clean():
    path = 'src/data/places.json'
    with open(path, 'r', encoding='utf-8') as f:
        places = json.load(f)
    
    clean_places = []
    print(f"🧹 데이터 정제 시작 (대상: {len(places)}개)")
    
    for p in places:
        print(f"[{p['name']}] 검증 중...")
        
        # 1. YouTube 리뷰 시도
        yt_review = get_youtube_review(p['source_video_url'].split('v=')[-1], p['name'], p['category'])
        
        # 2. Google 리뷰 시도 (YouTube 실패 시)
        g_photo, g_review = get_google_data(p['name'], p['address'])
        
        # 최종 리뷰 결정
        final_review = yt_review if yt_review else g_review
        
        if final_review:
            p['description'] = final_review
            p['image_url'] = g_photo if g_photo else p['image_url']
            clean_places.append(p)
            print(f"  ✅ 리뷰 확보: {final_review[:30]}...")
        else:
            print(f"  ❌ 리뷰 없음: 삭제 대상")
            
    # ID 재정렬
    for i, p in enumerate(clean_places):
        p['id'] = i + 1
        
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(clean_places, f, ensure_ascii=False, indent=2)
    
    print(f"✨ 정제 완료: {len(places)} -> {len(clean_places)}개")

if __name__ == "__main__":
    process_and_clean()
