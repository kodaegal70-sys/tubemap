import requests
import json
import time
import os
import urllib.request
import urllib.parse
import re
import concurrent.futures

# API Keys
KAKAO_API_KEY = "c6088c2c7ec5f0e1ed1122ba613db0fb"
NAVER_CLIENT_ID = "Ug7csvlUDeTe1I72ehKQ"
NAVER_CLIENT_SECRET = "pqPjVw9kig"

# 18대 지침: 정확한 미디어 명칭 매핑
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

# 15대 / 18대 지침: 구독자 50만 이상 메가 채널 (Whitelist)
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

VALID_CATEGORIES = ["음식점", "한식", "중식", "일식", "양식", "분식", "뷔페", "술집", "카페"]
FRANCHISE_KEYWORDS = ["스타벅스", "맥도날드", "리아", "킹", "써브웨이", "투썸", "파스쿠찌", "이디야", "메가커피", "컴포즈", "빽다방", "배스킨", "던킨", "파리바게뜨", "뚜레쥬르", "서가앤쿡", "아웃백", "빕스", "본죽", "한솥", "봉구스", "BBQ", "BHC", "교촌"]

BAD_DOMAINS = ["shopping", "smartstore", "coupang", "11st", "gmarket", "auction", "wemakeprice", "tmon", "shop.phinf", "map.naver", "tmap.co.kr"]
BAD_KEYWORDS_IN_TITLE = ["밀키트", "포장", "택배", "공구", "판매", "출시", "스토어", "지도", "약도", "위치", "가는길", "로드뷰", "캡처"]

def sanitize_category(raw_cat):
    if not raw_cat: return "한식" 
    if raw_cat in ["한식", "중식", "일식", "양식", "분식", "카페", "술집"]: return raw_cat
    rc = raw_cat.replace(" ", "")
    if "중국" in rc or "마라" in rc: return "중식"
    if "일식" in rc or "초밥" in rc or "스시" in rc or "라멘" in rc or "돈가스" in rc: return "일식"
    if "피자" in rc or "파스타" in rc or "버거" in rc or "치킨" in rc or "패스트푸드" in rc or "스테이크" in rc or "레스토랑" in rc: return "양식"
    if "떡볶이" in rc or "김밥" in rc or "순대" in rc or "튀김" in rc: return "분식"
    if "커피" in rc or "디저트" in rc or "베이커리" in rc or "제과" in rc: return "카페"
    return "한식"

def get_kakao_place_info(query):
    url = "https://dapi.kakao.com/v2/local/search/keyword.json"
    headers = {"Authorization": f"KakaoAK {KAKAO_API_KEY}"}
    params = {"query": query, "size": 3} 
    try:
        res = requests.get(url, headers=headers, params=params)
        data = res.json()
        if not data.get('documents'): return None
        matches = data['documents']
        best_match = matches[0]
        cat_name = best_match.get('category_name', '')
        if any(exc in cat_name for exc in ["슈퍼마켓", "대형마트", "편의점"]): return None
        if any(fk in best_match['place_name'] for fk in FRANCHISE_KEYWORDS): return None
        cats = cat_name.split('>')
        detail_cat = cats[-1].strip() if len(cats) > 0 else "음식점"
        standard_cat = sanitize_category(detail_cat)
        return {
            "name": best_match['place_name'],
            "lat": float(best_match['y']), "lng": float(best_match['x']),
            "address": best_match['address_name'], "phone": best_match.get('phone', ''),
            "category": standard_cat, 
            "category_group": cat_name,
            "road_address": best_match.get('road_address_name', '')
        }
    except: return None

def search_blog_first(keyword):
    encText = urllib.parse.quote(keyword)
    url = f"https://openapi.naver.com/v1/search/blog?query={encText}&display=20&sort=sim"
    req = urllib.request.Request(url)
    req.add_header("X-Naver-Client-Id", NAVER_CLIENT_ID)
    req.add_header("X-Naver-Client-Secret", NAVER_CLIENT_SECRET)
    candidates = []
    try:
        res = urllib.request.urlopen(req)
        data = json.loads(res.read().decode('utf-8'))
        for item in data['items']:
            title = item['title'].replace('<b>', '').replace('</b>', '')
            found_names = re.findall(r'\[(.*?)\]|\"(.*?)\"|\'(.*?)\'|\<(.*?)\>', title)
            for groups in found_names:
                for name in groups:
                    if name and 2 <= len(name) <= 15:
                         if any(c in name for c in MEGA_CHANNELS.keys()): continue
                         candidates.append(name.strip())
    except: pass
    return list(set(candidates))

def get_representative_menu(place_name, kaka_cat, city):
    return kaka_cat

def search_image_api(query, sort_type='sim'):
    encText = urllib.parse.quote(query)
    url = f"https://openapi.naver.com/v1/search/image?query={encText}&display=5&sort={sort_type}&filter=medium" 
    req = urllib.request.Request(url)
    req.add_header("X-Naver-Client-Id", NAVER_CLIENT_ID)
    req.add_header("X-Naver-Client-Secret", NAVER_CLIENT_SECRET)
    try:
        response = urllib.request.urlopen(req)
        if response.getcode() == 200:
            data = json.loads(response.read().decode('utf-8'))
            for item in data['items']:
                link = item['link']
                title = item['title']
                # 21대 지침: Anti-Ad Check
                if any(bd in link for bd in BAD_DOMAINS): continue
                if any(bk in title for bk in BAD_KEYWORDS_IN_TITLE): continue
                return link
    except: pass
    return None

def get_best_image_18_step(name, menu, city):
    # 21대 지침: "방문후기" 키워드 추가 + Anti-Ad
    query1 = f"{name} {city} {menu} 방문후기 -밀키트 -택배 -포장 -스토어" 
    img = search_image_api(query1, 'sim')
    if img: return img
    
    query2 = f"{name} {menu} 방문후기 -밀키트"
    img = search_image_api(query2, 'sim')
    if img: return img
    
    return None

def process_candidate(cand_name, media_hint, seen_keys, existing_count):
    place_info = get_kakao_place_info(cand_name)
    if not place_info: return None
    
    if place_info['category'] not in ["한식", "중식", "일식", "양식", "분식", "카페", "술집"]:
        return None 
    
    key = f"{place_info['name']}_{place_info['address']}"
    if key in seen_keys: return None

    media_final = ""
    for k, v in OFFICIAL_MEDIA_NAMES.items():
        if k in media_hint or media_hint in k:
            media_final = v; break
            
    if not media_final: 
        for ch, kws in MEGA_CHANNELS.items():
            if ch in media_hint: 
                media_final = OFFICIAL_MEDIA_NAMES.get(ch, ch)
                break
    if not media_final: return None 

    city = place_info['address'].split()[1] if len(place_info['address'].split())>1 else ""
    menu = place_info['category'] 
    
    image_url = get_best_image_18_step(place_info['name'], menu, city)
    
    if not image_url:
        print(f"  ❌ {place_info['name']}: 이미지 검증 실패 (Zero Tolerance)")
        return None 
    
    place_info['media'] = media_final
    place_info['description'] = f"{menu} 전문점."
    
    place_info['image_url'] = image_url
    place_info['naver_url'] = f"https://map.naver.com/p/search/{urllib.parse.quote(place_info['name'])}"
    
    addr_parts = place_info['address'].split(' ')
    place_info['addressProvince'] = addr_parts[0] if len(addr_parts) > 0 else ""
    place_info['addressCity'] = addr_parts[1] if len(addr_parts) > 1 else ""
    place_info['addressDistrict'] = addr_parts[2] if len(addr_parts) > 2 else ""
    
    return place_info

def collect_main():
    print("🚀 [Phase 42] 21대 지침 수집 엔진 (이미지 무결성 강화)")
    
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
    
    search_keywords = []
    for ytb, kws in MEGA_CHANNELS.items():
        main_kw = kws[1] if len(kws) > 1 else kws[0]
        search_keywords.append(f"{main_kw} 맛집 추천")

    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
        for seed in search_keywords:
            if len(new_places) >= 5: break 
            
            candidates = search_blog_first(seed)
            if not candidates: continue
            media_hint = seed.split()[0]
            
            futures = []
            for cand in candidates:
                futures.append(executor.submit(process_candidate, cand, media_hint, seen_keys, len(new_places)))
            
            for f in concurrent.futures.as_completed(futures):
                res = f.result()
                if res:
                    key = f"{res['name']}_{res['address']}"
                    if key not in seen_keys:
                        res['id'] = len(existing_places) + len(new_places) + 1
                        new_places.append(res)
                        seen_keys.add(key)
                        print(f"  ✨ [New] {res['name']} ({res['category']}) - IMG OK")

    if new_places:
        with open(src_path, 'w', encoding='utf-8') as f:
            json.dump(existing_places + new_places, f, ensure_ascii=False, indent=2)
        print(f"\n✅ 신규 {len(new_places)}개 추가 수집 완료.")
    else:
        print("\n✅ 신규 수집 없음 (기존 데이터 유지).")
        
if __name__ == "__main__":
    collect_main()
