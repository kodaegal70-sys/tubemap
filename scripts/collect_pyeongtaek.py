import requests
import json
import time
import os
import urllib.request
import urllib.parse

# API 설정
KAKAO_API_KEY = "c6088c2c7ec5f0e1ed1122ba613db0fb"
NAVER_CLIENT_ID = "Ug7csvlUDeTe1I72ehKQ"
NAVER_CLIENT_SECRET = "pqPjVw9kig"

EXCLUDE_CATEGORIES = ["슈퍼마켓", "대형마트", "지하철역", "기차역", "온천", "목욕탕", "사우나", "유식판매", "재건축", "모델하우스", "백화점", "면세점", "편의점"]
FRANCHISE_KEYWORDS = ["스타벅스", "맥도날드", "리아", "킹", "써브웨이", "투썸", "파스쿠찌", "이디야", "메가커피", "컴포즈", "빽다방", "배스킨", "던킨", "파리바게뜨", "뚜레쥬르", "서가앤쿡", "아웃백", "빕스", "본죽", "한솥", "봉구스"]

def get_kakao_search(query: str, region: str = "평택"):
    url = "https://dapi.kakao.com/v2/local/search/keyword.json"
    headers = {"Authorization": f"KakaoAK {KAKAO_API_KEY}"}
    results = []
    
    # 평택 주요 거점
    search_points = ["평택시청", "평택역", "지제역", "서정리역", "송탄역", "팽성읍", "안중읍", "포승읍", "고덕동"]
    
    for point in search_points:
        for page in range(1, 4):
            params = {"query": f"{point} {query}", "page": page, "size": 15}
            try:
                res = requests.get(url, headers=headers, params=params)
                data = res.json()
                if not data['documents']: break
                for doc in data['documents']:
                    if "평택" not in doc['address_name']: continue
                    results.append({
                        "name": doc['place_name'],
                        "lat": float(doc['y']), "lng": float(doc['x']),
                        "address": doc['address_name'], "phone": doc.get('phone', ''),
                        "category": doc.get('category_name', '').split('>')[-1].strip(),
                        "road_address": doc.get('road_address_name', '')
                    })
                time.sleep(0.1)
            except: break
    return results

def verify_media(name: str):
    query_prefix = "평택 " + name
    query_suffix = " 방송 출연 맛집"
    encText = urllib.parse.quote(query_prefix + query_suffix)
    url = f"https://openapi.naver.com/v1/search/blog?query={encText}&display=15"
    
    req = urllib.request.Request(url)
    req.add_header("X-Naver-Client-Id", NAVER_CLIENT_ID)
    req.add_header("X-Naver-Client-Secret", NAVER_CLIENT_SECRET)
    
    media = []
    try:
        res = urllib.request.urlopen(req)
        data = json.loads(res.read().decode('utf-8'))
        full_text = " ".join([i['title'] + i['description'] for i in data['items']]).replace('<b>', '').replace('</b>', '')
        
        # 맛집 키워드
        keywords = {
            "백반기행": "식객 허영만의 백반기행", "생활의 달인": "생활의 달인", "맛있는 녀석들": "맛있는 녀석들",
            "생생정보": "생생정보", "쯔양": "쯔양 (유튜브)", "풍자": "풍자 또간집", "또간집": "풍자 또간집",
            "성시경": "성시경 먹을텐데", "백종원": "백종원 3대천왕"
        }
        for k, v in keywords.items():
            if k in full_text: media.append(v)
                
    except: pass
    return "|".join(list(set(media)))

def collect():
    print("🚀 [평택 통합 수집] 시작 (맛집 전문 모드)")
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    src_path = os.path.join(root_dir, 'src', 'data', 'places.json')
    
    with open(src_path, 'r', encoding='utf-8') as f:
        existing_places = json.load(f)
    
    seen_keys = set(f"{p['name']}_{p['address']}" for p in existing_places)
    last_id = max(p['id'] for p in existing_places) if existing_places else 0
    
    new_places = []
    
    # 1. 맛집 50선 수집 (프랜차이즈 제외 50개 달성 시도)
    print("🍱 맛집 수집 중 (프랜차이즈 차단 모드)...")
    rest_keywords = ["맛집", "노포", "방송출연", "식당", "카페"]
    rest_candidates = []
    for k in rest_keywords:
        rest_candidates.extend(get_kakao_search(k, "평택"))
    
    current_pt_rests = [p for p in existing_places if p.get('addressCity') == '평택시' and p.get('category') != '촬영지']
    total_needed = 50
    rest_count = len(current_pt_rests)
    print(f"  💡 현재 평택 식당: {rest_count}개. 부족분({total_needed - rest_count}개) 추가 수집 시작.")

    for c in rest_candidates:
        if rest_count >= 55: break
        key = f"{c['name']}_{c['address']}"
        if key in seen_keys: continue
        if c['category'] in EXCLUDE_CATEGORIES: continue
        if any(fk in c['name'] for fk in FRANCHISE_KEYWORDS): continue
        
        media = verify_media(c['name'], is_scenery=False)
        if media:
            rest_count += 1
            last_id += 1
            new_places.append({
                "id": last_id,
                "name": c['name'], "lat": c['lat'], "lng": c['lng'],
                "media": media,
                "description": f"{media}에 소개된 평택 맛집",
                "address": c['address'], "phone": c['phone'], "image_url": "",
                "naver_url": f"https://map.naver.com/p/search/{urllib.parse.quote(c['name'])}",
                "category": c['category'], "addressProvince": "경기", "addressCity": "평택시",
                "addressDistrict": c['road_address'].split(' ')[2] if len(c['road_address'].split(' ')) > 2 else ""
            })
            seen_keys.add(key)
            print(f"  🍱 [{rest_count}/50] {c['name']} ({media})")
            time.sleep(0.1)
            
    # 통합 저장
    with open(src_path, 'w', encoding='utf-8') as f:
        json.dump(existing_places + new_places, f, ensure_ascii=False, indent=2)
        
    print(f"\n🎉 평택 데이터 통합 수집 완료: 총 {len(new_places)}개 추가")

if __name__ == "__main__":
    collect()
