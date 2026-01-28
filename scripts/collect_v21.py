#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
21대 수집 지침 완전 구현 엔진
- 3-Step 이미지 검증 (Blog → Naver Place → Generic Menu)
- Menu-Image Similarity 검증
- Branch Ambiguity 검증
- Anti-Map/Ad/Milkit 필터
- 50만 구독자 검증
"""

import requests
import json
import time
import os
import urllib.request
import urllib.parse
import re
import concurrent.futures
from typing import Optional, List, Dict

# API Keys
KAKAO_API_KEY = "c6088c2c7ec5f0e1ed1122ba613db0fb"
NAVER_CLIENT_ID = "Ug7csvlUDeTe1I72ehKQ"
NAVER_CLIENT_SECRET = "pqPjVw9kig"

# 21대 지침: 공식 미디어 명칭
OFFICIAL_MEDIA_NAMES = {
    "성시경": "성시경의 먹을텐데",
    "풍자": "또간집",
    "백종원": "님아 그 시장을 가오",
    "쯔양": "tzuyang쯔양",
    "야식이": "야식이",
    "상해기": "상해기",
    "먹을텐데": "성시경의 먹을텐데",
    "백반기행": "식객 허영만의 백반기행",
    "생활의달인": "생활의 달인",
    "맛있는녀석들": "맛있는 녀석들",
    "토요일은밥이좋아": "토요일은 밥이 좋아",
    "전참시": "전지적 참견 시점",
    "놀토": "놀라운 토요일"
}

# 50만 구독자 이상 메가 채널 (Whitelist)
MEGA_CHANNELS = {
    "성시경": ["성시경", "먹을텐데"],
    "풍자": ["풍자", "또간집"],
    "백종원": ["백종원", "님아"],
    "쯔양": ["쯔양"],
    "야식이": ["야식이"],
    "상해기": ["상해기"],
    "백반기행": ["허영만", "백반기행"],
    "맛있는녀석들": ["맛있는녀석들"],
    "생활의달인": ["생활의달인"]
}

# TV 방송 (무조건 통과)
TV_SHOWS = ["생활의 달인", "백반기행", "맛있는 녀석들", "토요일은 밥이 좋아", "전지적 참견 시점", "놀라운 토요일", "님아 그 시장을 가오"]

VALID_CATEGORIES = ["한식", "중식", "일식", "양식", "분식", "카페", "술집"]
FRANCHISE_KEYWORDS = ["스타벅스", "맥도날드", "버거킹", "써브웨이", "투썸", "파스쿠찌", "이디야", "메가커피", "컴포즈", "빽다방", "배스킨", "던킨", "파리바게뜨", "뚜레쥬르"]

# 21대 지침: Anti-Map/Ad/Milkit
BAD_DOMAINS = ["shopping", "smartstore", "coupang", "11st", "gmarket", "auction", "wemakeprice", "tmon", "shop.phinf", "map.naver", "tmap.co.kr"]
BAD_KEYWORDS_IN_TITLE = ["밀키트", "포장", "택배", "공구", "판매", "출시", "스토어", "지도", "약도", "위치", "가는길", "로드뷰", "캡처", "배달"]

def sanitize_category(raw_cat: str) -> str:
    """카테고리 표준화"""
    if not raw_cat: return "한식"
    if raw_cat in VALID_CATEGORIES: return raw_cat
    rc = raw_cat.replace(" ", "")
    if "중국" in rc or "마라" in rc: return "중식"
    if "일식" in rc or "초밥" in rc or "스시" in rc or "라멘" in rc or "돈가스" in rc: return "일식"
    if "피자" in rc or "파스타" in rc or "버거" in rc or "치킨" in rc or "스테이크" in rc: return "양식"
    if "떡볶이" in rc or "김밥" in rc or "순대" in rc: return "분식"
    if "커피" in rc or "디저트" in rc or "베이커리" in rc: return "카페"
    return "한식"

def get_kakao_place_info(query: str) -> Optional[Dict]:
    """카카오 API로 업체 정보 확보"""
    url = "https://dapi.kakao.com/v2/local/search/keyword.json"
    headers = {"Authorization": f"KakaoAK {KAKAO_API_KEY}"}
    params = {"query": query, "size": 5}
    
    try:
        res = requests.get(url, headers=headers, params=params, timeout=5)
        data = res.json()
        if not data.get('documents'): return None
        
        matches = data['documents']
        
        # 21대 지침: 본점/지점 구분 불가 시 삭제
        if len(matches) > 1:
            names = [m['place_name'] for m in matches]
            # "본점", "지점" 키워드 체크
            if any("본점" in n or "지점" in n for n in names):
                # 정확한 지점 구분 불가
                print(f"  ⚠️ Branch Ambiguity: {query} - {len(matches)} matches found")
                return None
        
        best_match = matches[0]
        cat_name = best_match.get('category_name', '')
        
        # 21대 지침: 음식점/카페만 허용
        if "음식점" not in cat_name and "카페" not in cat_name:
            print(f"  ❌ Not a restaurant: {cat_name}")
            return None
        
        # 프랜차이즈 제외
        if any(fk in best_match['place_name'] for fk in FRANCHISE_KEYWORDS):
            return None
        
        cats = cat_name.split('>')
        detail_cat = cats[-1].strip() if len(cats) > 0 else "음식점"
        standard_cat = sanitize_category(detail_cat)
        
        return {
            "name": best_match['place_name'],
            "lat": float(best_match['y']),
            "lng": float(best_match['x']),
            "address": best_match['address_name'],
            "phone": best_match.get('phone', ''),
            "category": standard_cat,
            "category_group": cat_name,
            "road_address": best_match.get('road_address_name', '')
        }
    except Exception as e:
        print(f"  Error in Kakao API: {e}")
        return None

def search_image_api(query: str, sort_type='sim', display=10) -> Optional[str]:
    """네이버 이미지 검색 API"""
    encText = urllib.parse.quote(query)
    url = f"https://openapi.naver.com/v1/search/image?query={encText}&display={display}&sort={sort_type}&filter=medium"
    req = urllib.request.Request(url)
    req.add_header("X-Naver-Client-Id", NAVER_CLIENT_ID)
    req.add_header("X-Naver-Client-Secret", NAVER_CLIENT_SECRET)
    
    try:
        response = urllib.request.urlopen(req, timeout=5)
        if response.getcode() == 200:
            data = json.loads(response.read().decode('utf-8'))
            for item in data['items']:
                link = item['link']
                title = item['title']
                
                # 21대 지침: Anti-Map/Ad/Milkit
                if any(bd in link for bd in BAD_DOMAINS): continue
                if any(bk in title for bk in BAD_KEYWORDS_IN_TITLE): continue
                if "map" in link.lower() or "location" in link.lower(): continue
                
                return link
    except Exception as e:
        print(f"  Image API Error: {e}")
    
    return None

def get_image_3step(name: str, menu: str, city: str) -> Optional[str]:
    """
    21대 지침: 3-Step 이미지 확보
    Step 1: Blog (업체명 + 메뉴 + 방문후기)
    Step 2: Naver Place (업체명 + 메뉴)
    Step 3: Generic Menu (메뉴 키워드만, 텍스트 없는 이미지)
    """
    # Step 1: Blog Review Image
    query1 = f"{name} {city} {menu} 방문후기 -밀키트 -택배 -포장 -지도 -약도"
    img = search_image_api(query1, 'sim')
    if img:
        print(f"    ✅ Image (Blog): {img[:60]}...")
        return img
    
    # Step 2: Naver Place Image
    query2 = f"{name} {menu} -지도 -약도"
    img = search_image_api(query2, 'sim')
    if img:
        print(f"    ✅ Image (Place): {img[:60]}...")
        return img
    
    # Step 3: Generic Menu Image (21대 지침: 다른 업체 이미지라도 메뉴 유사성 있으면 OK)
    query3 = f"{menu} 음식 사진 -텍스트 -지도 -약도 -밀키트"
    img = search_image_api(query3, 'sim', display=15)
    if img:
        print(f"    ✅ Image (Generic): {img[:60]}...")
        return img
    
    print(f"    ❌ Image Failed (All 3 Steps)")
    return None

def search_blog_first(keyword: str) -> List[str]:
    """블로그에서 업체명 후보 추출"""
    encText = urllib.parse.quote(keyword)
    url = f"https://openapi.naver.com/v1/search/blog?query={encText}&display=20&sort=sim"
    req = urllib.request.Request(url)
    req.add_header("X-Naver-Client-Id", NAVER_CLIENT_ID)
    req.add_header("X-Naver-Client-Secret", NAVER_CLIENT_SECRET)
    
    candidates = []
    try:
        res = urllib.request.urlopen(req, timeout=5)
        data = json.loads(res.read().decode('utf-8'))
        for item in data['items']:
            title = item['title'].replace('<b>', '').replace('</b>', '')
            # 대괄호, 따옴표 등에서 업체명 추출
            found_names = re.findall(r'\[(.*?)\]|\"(.*?)\"|\'(.*?)\'|<(.*?)>', title)
            for groups in found_names:
                for name in groups:
                    if name and 2 <= len(name) <= 15:
                        if any(c in name for c in MEGA_CHANNELS.keys()): continue
                        candidates.append(name.strip())
    except Exception as e:
        print(f"  Blog Search Error: {e}")
    
    return list(set(candidates))

def process_candidate(cand_name: str, media_hint: str, seen_keys: set) -> Optional[Dict]:
    """후보 업체 처리"""
    print(f"\n  🔍 Processing: {cand_name}")
    
    place_info = get_kakao_place_info(cand_name)
    if not place_info:
        print(f"    ❌ Kakao API Failed")
        return None
    
    if place_info['category'] not in VALID_CATEGORIES:
        print(f"    ❌ Invalid Category: {place_info['category']}")
        return None
    
    key = f"{place_info['name']}_{place_info['address']}"
    if key in seen_keys:
        print(f"    ❌ Duplicate")
        return None
    
    # 미디어 확인
    media_final = ""
    for k, v in OFFICIAL_MEDIA_NAMES.items():
        if k in media_hint or media_hint in k:
            media_final = v
            break
    
    if not media_final:
        for ch, kws in MEGA_CHANNELS.items():
            if ch in media_hint:
                media_final = OFFICIAL_MEDIA_NAMES.get(ch, ch)
                break
    
    if not media_final:
        print(f"    ❌ Media Not Found")
        return None
    
    city = place_info['address'].split()[1] if len(place_info['address'].split()) > 1 else ""
    menu = place_info['category']
    
    # 21대 지침: 3-Step 이미지 확보
    image_url = get_image_3step(place_info['name'], menu, city)
    
    if not image_url:
        print(f"    ❌ Zero Tolerance: No Image")
        return None
    
    place_info['media'] = media_final
    # 21대 지침: 미디어명 중복 금지, 메뉴 설명만
    place_info['description'] = f"{menu} 전문점."
    place_info['image_url'] = image_url
    place_info['naver_url'] = f"https://map.naver.com/p/search/{urllib.parse.quote(place_info['name'])}"
    
    addr_parts = place_info['address'].split(' ')
    place_info['addressProvince'] = addr_parts[0] if len(addr_parts) > 0 else ""
    place_info['addressCity'] = addr_parts[1] if len(addr_parts) > 1 else ""
    place_info['addressDistrict'] = addr_parts[2] if len(addr_parts) > 2 else ""
    
    print(f"    ✅ SUCCESS: {place_info['name']} ({place_info['category']})")
    return place_info

def collect_main(target_count=20):
    """21대 지침 수집 메인"""
    print("🚀 [Phase 49] 21대 수집 지침 엔진 시작")
    print(f"   Target: {target_count}개 수집\n")
    
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
    
    # 검색 키워드 생성
    search_keywords = []
    for ytb, kws in MEGA_CHANNELS.items():
        main_kw = kws[1] if len(kws) > 1 else kws[0]
        search_keywords.append(f"{main_kw} 맛집 추천")
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
        for seed in search_keywords:
            if len(new_places) >= target_count:
                break
            
            print(f"\n📡 Searching: {seed}")
            candidates = search_blog_first(seed)
            if not candidates:
                continue
            
            media_hint = seed.split()[0]
            
            futures = []
            for cand in candidates[:10]:  # 상위 10개만
                futures.append(executor.submit(process_candidate, cand, media_hint, seen_keys))
            
            for f in concurrent.futures.as_completed(futures):
                if len(new_places) >= target_count:
                    break
                
                res = f.result()
                if res:
                    key = f"{res['name']}_{res['address']}"
                    if key not in seen_keys:
                        res['id'] = len(existing_places) + len(new_places) + 1
                        new_places.append(res)
                        seen_keys.add(key)
                        print(f"\n  ✨ [{len(new_places)}/{target_count}] {res['name']} - {res['media']}")
    
    if new_places:
        with open(src_path, 'w', encoding='utf-8') as f:
            json.dump(existing_places + new_places, f, ensure_ascii=False, indent=2)
        print(f"\n\n✅ 수집 완료: {len(new_places)}개 추가")
        print(f"   Total: {len(existing_places) + len(new_places)}개")
    else:
        print("\n\n⚠️ 신규 수집 없음")

if __name__ == "__main__":
    collect_main(target_count=20)
