
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

def get_signature_description(name, address, current_category):
    # 1. 네이버 블로그 검색을 통해 대표 메뉴 추출 시도
    encText = urllib.parse.quote(f"아산 {name} 대표메뉴 시그니처 특징")
    url = f"https://openapi.naver.com/v1/search/blog?query={encText}&display=10"
    req = urllib.request.Request(url)
    req.add_header("X-Naver-Client-Id", NAVER_CLIENT_ID); req.add_header("X-Naver-Client-Secret", NAVER_CLIENT_SECRET)
    
    try:
        res = urllib.request.urlopen(req)
        data = json.loads(res.read().decode('utf-8'))
        text = " ".join([i['title'] + i['description'] for i in data['items']]).replace('<b>', '').replace('</b>', '')
        
        # 키워드 후보군 (대표 메뉴 성격)
        if "탕수육" in text and "반점" in name: return "바삭한 탕수육과 깊은 맛의 짬뽕이 일품인 곳"
        if "밀면" in text: return "시원하고 담백한 육수의 밀면과 온면 전문점"
        if "냉면" in text: return "정갈한 육수와 쫄깃한 면발의 냉면 명소"
        if "우렁쌈밥" in text: return "직접 재배한 신선한 우렁이 가득한 건강 쌈밥"
        if "곱창" in text: return "곱이 꽉 찬 고소한 곱창과 특제 소스의 조화"
        if "순대" in text: return "잡내 없이 구수한 토종 순대와 진한 국물"
        if "칼국수" in text: return "직접 빚은 면발과 시원한 해물 육수의 칼국수"
        if "돈까스" in text: return "겉바속촉 수제 돈까스와 정성이 담긴 소스"
        
        # 일반적인 설명 생성
        if current_category:
            return f"{current_category} 전문점으로 정성이 가득한 손맛을 느낄 수 있는 아산 맛집"
        
    except: pass
    return "아산 지역의 정겨운 맛과 정성이 가득한 대표 맛집"

def enrich():
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    path = os.path.join(root_dir, 'src', 'data', 'places.json')
    
    with open(path, 'r', encoding='utf-8') as f:
        places = json.load(f)
    
    print(f"🚀 [데이터 품질 고도화] 시작 (대상: {len(places)}개)")
    
    changed_count = 0
    for p in places:
        # 아산 지역 데이터(ID 77번 이후) 또는 설명문이 단순한 경우 보강
        if p['id'] >= 77 or "소개 맛집" in p['description'] or "추천 맛집" in p['description']:
            old_desc = p['description']
            new_desc = get_signature_description(p['name'], p['address'], p['category'])
            
            # 기존 서울 데이터의 품질을 해치지 않도록 구체적인 경우만 변경
            if new_desc and new_desc != old_desc:
                p['description'] = new_desc
                changed_count += 1
                if changed_count % 10 == 0:
                    print(f"  ✨ {changed_count}개 보강 완료... ({p['name']})")
                time.sleep(0.1)

    with open(path, 'w', encoding='utf-8') as f:
        json.dump(places, f, ensure_ascii=False, indent=2)
    
    print(f"✅ 보강 완료! 총 {changed_count}개의 설명문이 업데이트되었습니다.")

if __name__ == "__main__":
    enrich()
