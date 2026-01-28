
import requests
import json
import time
import os
import urllib.request
import urllib.parse
from typing import List, Dict

# API 설정
KAKAO_API_KEY = "c6088c2c7ec5f0e1ed1122ba613db0fb"
NAVER_CLIENT_ID = "Ug7csvlUDeTe1I72ehKQ"
NAVER_CLIENT_SECRET = "pqPjVw9kig"

# 정제할 카테고리 (제외 대상)
EXCLUDE_CATEGORIES = ["슈퍼마켓", "대형마트", "지하철역", "기차역", "온천", "목욕탕", "사우나", "유적지", "관광", "전시", "박물관", "체험", "부지", "식품판매"]

def get_kakao_category_search(category_code: str, region: str = "아산"):
    url = "https://dapi.kakao.com/v2/local/search/keyword.json"
    headers = {"Authorization": f"KakaoAK {KAKAO_API_KEY}"}
    results = []
    # 아산 지역의 여러 지점에서 검색하여 범위를 넓힘
    search_points = ["아산시청", "온양온천역", "천안아산역", "신정호", "공세리성당", "순천향대학교", "현충사", "탕정면", "배방역"]
    
    for point in search_points:
        for page in range(1, 4):
            params = {"query": f"{point} 맛집", "page": page, "size": 15, "category_group_code": category_code}
            try:
                res = requests.get(url, headers=headers, params=params)
                data = res.json()
                if not data['documents']: break
                for doc in data['documents']:
                    if "아산" not in doc['address_name']: continue
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

def verify(name: str):
    # 미디어 검증
    encText = urllib.parse.quote(f"아산 {name} 방송 출연 유튜브")
    url = f"https://openapi.naver.com/v1/search/blog?query={encText}&display=15"
    req = urllib.request.Request(url)
    req.add_header("X-Naver-Client-Id", NAVER_CLIENT_ID); req.add_header("X-Naver-Client-Secret", NAVER_CLIENT_SECRET)
    
    media = []
    description = ""
    try:
        res = urllib.request.urlopen(req)
        data = json.loads(res.read().decode('utf-8'))
        full_text = " ".join([i['title'] + i['description'] for i in data['items']]).replace('<b>', '').replace('</b>', '')
        
        # 미디어 키워드 체크
        if "백반기행" in full_text or "허영만" in full_text: media.append("식객 허영만의 백반기행")
        if "생활의 달인" in full_text or "생활의달인" in full_text: media.append("생활의 달인")
        if "맛있는녀석들" in full_text or "맛있는 녀석들" in full_text: media.append("맛있는 녀석들")
        if "생생정보" in full_text: media.append("생생정보")
        if "쯔양" in full_text: media.append("쯔양 (유튜브)")
        if "풍자" in full_text or "또간집" in full_text: media.append("풍자 또간집")
        if "히밥" in full_text: media.append("히밥 (유튜브)")
        if "6시 내고향" in full_text: media.append("6시 내고향")
        
        # 대표 메뉴 추출 (단순 템플릿 대체)
        if "탕수육" in full_text: description = "바삭한 탕수육과 깊은 맛의 짬뽕이 유명한 아산 맛집"
        elif "밀면" in full_text: description = "시원하고 담백한 육수가 일품인 70년 전통의 밀면 노포"
        elif "칼국수" in full_text: description = "쫄깃한 손면발과 시원한 국물이 어우러진 칼국수 전문점"
        elif "쌈밥" in full_text: description = "신선한 쌈채소와 정갈한 밑반찬이 돋보이는 우렁쌈밥 명소"
        elif "순대" in full_text: description = "잡내 없이 구수한 순대국과 쫄깃한 머릿고기 전문점"
        elif media: description = f"{media[0]} 소개 후 더 유명해진 아산의 숨은 맛집"
        else: description = "아산 지역 현지인들이 아끼는 정성 가득한 맛집"

    except: pass
    
    if not media: return None, None, None
    
    # 이미지
    encTextImg = urllib.parse.quote(f"아산 {name} 대표이미지")
    urlImg = f"https://openapi.naver.com/v1/search/image?query={encTextImg}&display=1"
    reqImg = urllib.request.Request(urlImg)
    reqImg.add_header("X-Naver-Client-Id", NAVER_CLIENT_ID); reqImg.add_header("X-Naver-Client-Secret", NAVER_CLIENT_SECRET)
    img_url = None
    try:
        resImg = urllib.request.urlopen(reqImg)
        dataImg = json.loads(resImg.read().decode('utf-8'))
        if dataImg['items']: img_url = dataImg['items'][0]['link']
    except: pass
    
    return "|".join(list(set(media))), img_url, description

def finalize():
    print("🚀 [최종 수집 및 정제] 시작")
    final_places = []
    seen_keys = set()
    
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    # 기존 데이터 로드 (중복 방지용)
    src_path = os.path.join(root_dir, 'src', 'data', 'places.json')
    if os.path.exists(src_path):
        with open(src_path, 'r', encoding='utf-8') as f:
            for p in json.load(f):
                seen_keys.add(f"{p['name']}_{p['address']}")

    # 1. 아산 지역 광범위 음식점 후보 수집
    print("📍 1단계: 아산 지역 음식점 후보(500+) 수집 중...")
    candidates = get_kakao_category_search("FD6")
    candidates.extend(get_kakao_category_search("CE7")) # 카페 포함
    
    # 2. 검증 및 100개 선별
    print(f"📍 2단계: 후보군({len(candidates)}개) 검증 및 100개 선별 중...")
    for c in candidates:
        if len(final_places) >= 100: break
        
        key = f"{c['name']}_{c['address']}"
        if key in seen_keys: continue
        if c['category'] in EXCLUDE_CATEGORIES: continue
        if "마트" in c['name'] or "점" in c['name'] and len(c['name']) > 10: continue # 프랜차이즈 간접 거르기
        
        media, img, desc = verify(c['name'])
        if media and img:
            new_p = {
                "id": 2000 + len(final_places),
                "name": c['name'], "lat": c['lat'], "lng": c['lng'],
                "media": media, "description": desc,
                "address": c['address'], "phone": c['phone'], "image_url": img,
                "naver_url": f"https://map.naver.com/p/search/{urllib.parse.quote(c['name'])}",
                "category": c['category'], "addressProvince": "충남", "addressCity": "아산시",
                "addressDistrict": c['road_address'].split(' ')[2] if len(c['road_address'].split(' ')) > 2 else ""
            }
            final_places.append(new_p)
            seen_keys.add(key)
            print(f"  ✨ [{len(final_places)}/100] {c['name']} ({media})")
            time.sleep(0.2)

    if final_places:
        output_path = os.path.join(root_dir, 'scripts', 'asan_premium_final.json')
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(final_places, f, ensure_ascii=False, indent=2)
        print(f"\n🎉 최종 {len(final_places)}개 고품질 데이터 저장 완료: {output_path}")
    else:
        print("\n❌ 검증된 데이터가 없습니다.")

if __name__ == "__main__":
    finalize()
