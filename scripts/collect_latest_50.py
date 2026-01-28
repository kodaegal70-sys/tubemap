import requests
import json
import time
import os
import urllib.request
import urllib.parse
import re

# API 설정
KAKAO_API_KEY = "c6088c2c7ec5f0e1ed1122ba613db0fb"
NAVER_CLIENT_ID = "Ug7csvlUDeTe1I72ehKQ"
NAVER_CLIENT_SECRET = "pqPjVw9kig"

EXCLUDE_CATEGORIES = ["슈퍼마켓", "대형마트", "지하철역", "기차역", "온천", "목욕탕", "사우나", "유식판매", "재건축", "모델하우스", "백화점", "면세점", "편의점", "테마거리", "관광안내소", "공원", "시장", "거리"]
FRANCHISE_KEYWORDS = ["스타벅스", "맥도날드", "리아", "킹", "써브웨이", "투썸", "파스쿠찌", "이디야", "메가커피", "컴포즈", "빽다방", "배스킨", "던킨", "파리바게뜨", "뚜레쥬르", "서가앤쿡", "아웃백", "빕스", "본죽", "한솥", "봉구스"]

def get_kakao_search(query: str):
    url = "https://dapi.kakao.com/v2/local/search/keyword.json"
    headers = {"Authorization": f"KakaoAK {KAKAO_API_KEY}"}
    params = {"query": query, "size": 15}
    try:
        res = requests.get(url, headers=headers, params=params)
        data = res.json()
        if not data.get('documents'): return []
        results = []
        for doc in data['documents']:
            results.append({
                "name": doc['place_name'],
                "lat": float(doc['y']), "lng": float(doc['x']),
                "address": doc['address_name'], "phone": doc.get('phone', ''),
                "category": doc.get('category_name', '').split('>')[-1].strip(),
                "road_address": doc.get('road_address_name', '')
            })
        return results
    except: return []

def verify_media_latest(name: str):
    # 최신성(2024)을 강조하여 검색
    query = f"2024 2025 맛집 {name} 방송 출연 유튜브"
    encText = urllib.parse.quote(query)
    url = f"https://openapi.naver.com/v1/search/blog?query={encText}&display=10&sort=sim"
    
    req = urllib.request.Request(url)
    req.add_header("X-Naver-Client-Id", NAVER_CLIENT_ID)
    req.add_header("X-Naver-Client-Secret", NAVER_CLIENT_SECRET)
    
    media = []
    try:
        res = urllib.request.urlopen(req)
        data = json.loads(res.read().decode('utf-8'))
        full_text = " ".join([i['title'] + i['description'] for i in data['items']]).replace('<b>', '').replace('</b>', '')
        
        keywords = {
            "백반기행": "식객 허영만의 백반기행", "생활의 달인": "생활의 달인", "맛있는 녀석들": "맛있는 녀석들",
            "생생정보": "생생정보", "쯔양": "쯔양 (유튜브)", "풍자": "풍자 또간집", "또간집": "풍자 또간집",
            "성시경": "성시경 먹을텐데", "백종원": "백종원 3대천왕", "히밥": "히밥 (유튜브)", "또간집": "풍자 또간집"
        }
        for k, v in keywords.items():
            if k in full_text: media.append(v)
    except: pass
    return "|".join(list(set(media)))

def collect_latest_50():
    print("🚀 [최신 고품질 맛집 50선 확충] 시작")
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    src_path = os.path.join(root_dir, 'src', 'data', 'places.json')
    
    with open(src_path, 'r', encoding='utf-8') as f:
        existing_places = json.load(f)
    
    seen_keys = set(f"{p['name']}_{p['address']}" for p in existing_places)
    last_id = max(p['id'] for p in existing_places) if existing_places else 0
    
    new_places = []
    
    # 최신 리스트 검색용 키워드 (지역별 노포 및 신규 핫플레이스)
    # 2024년 이후 주요 방송/유튜브 노출 지역
    search_queries = [
        "2024 성시경 먹을텐데 노포", "2024 백반기행 지역 맛집",
        "2025 맛있는녀석들 방영", "풍자 또간집 2024 추천",
        "제주도 최신 맛집 2024", "강릉 최신 맛집 2024", "전주 최신 맛집 2024"
    ]
    
    current_new_count = len([p for p in existing_places if p['id'] >= 575])
    target_total_new = 50
    need_count = target_total_new - current_new_count
    
    if need_count <= 0:
        print("✅ 이미 50개의 신규 데이터가 확보되었습니다.")
        return

    print(f"  💡 {need_count}개의 추가 데이터가 필요합니다.")

    for sq in search_queries:
        if len(new_places) >= need_count: break
        print(f"🔍 '{sq}' 기반 최신 후보군 추출 중...")
        # 네이버 블로그 검색을 통해 업체명 추출 시도
        encText = urllib.parse.quote(sq)
        url = f"https://openapi.naver.com/v1/search/blog?query={encText}&display=30"
        
        req = urllib.request.Request(url)
        req.add_header("X-Naver-Client-Id", NAVER_CLIENT_ID)
        req.add_header("X-Naver-Client-Secret", NAVER_CLIENT_SECRET)
        
        try:
            res = urllib.request.urlopen(req)
            data = json.loads(res.read().decode('utf-8'))
            for item in data['items']:
                if len(new_places) >= need_count: break
                text = item['title'] + " " + item['description']
                text = text.replace('<b>', '').replace('</b>', '')
                
                # 정규식으로 업체명 추정
                potential_names = re.findall(r'\[(.*?)\]|\"(.*?)\"|\'(.*?)\'|\【(.*?)\】', text)
                for groups in potential_names:
                    for name in groups:
                        if name and len(name) > 1 and len(name) < 15:
                            # [차단] 비음식점 또는 무의미한 이름
                            if any(x in name for x in ["또간집", "거리", "안내", "센터", "추천", "리스트"]): continue
                            
                            places = get_kakao_search(name)
                            for p in places:
                                if len(new_places) >= need_count: break
                                key = f"{p['name']}_{p['address']}"
                                if key in seen_keys: continue
                                if any(fk in p['name'] for fk in FRANCHISE_KEYWORDS): continue
                                
                                # 카테고리 무결성 체크
                                valid_cats = ['음식점', '한식', '중식', '일식', '양식', '카페', '베이커리', '순대', '국밥', '회', '갈비', '삼겹살']
                                if not any(vc in p['category'] for vc in valid_cats): continue

                                media = verify_media_latest(p['name'])
                                if media:
                                    last_id += 1
                                    p['id'] = last_id
                                    p['media'] = media
                                    p['description'] = f"{media}에 소개된 최신 핫플레이스 맛집"
                                    # 주소 분해
                                    addr_parts = p['address'].split(' ')
                                    p['addressProvince'] = addr_parts[0] if len(addr_parts) > 0 else ""
                                    p['addressCity'] = addr_parts[1] if len(addr_parts) > 1 else ""
                                    p['addressDistrict'] = addr_parts[2] if len(addr_parts) > 2 else ""
                                    p['naver_url'] = f"https://map.naver.com/p/search/{urllib.parse.quote(p['name'])}"
                                    p['image_url'] = ""
                                    
                                    new_places.append(p)
                                    seen_keys.add(key)
                                    print(f"  ✨ [{len(new_places) + current_new_count}/50] {p['name']} ({media})")
                                    time.sleep(0.1)
        except: pass
        
    # 결과 저장 (설명문 정제 포함)
    if new_places:
        with open(src_path, 'w', encoding='utf-8') as f:
            json.dump(existing_places + new_places, f, ensure_ascii=False, indent=2)
        print(f"\n✅ 최신 맛집 {len(new_places)}개 수집 완료.")
        # 업체명 리스트 출력
        print("\n--- 수집된 업체명 리스트 ---")
        for p in new_places:
            print(f"- {p['name']} ({p['addressCity']})")
    else:
        print("\n❌ 신규 수집된 데이터가 없습니다.")

if __name__ == "__main__":
    collect_latest_50()
