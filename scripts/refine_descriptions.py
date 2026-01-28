import json
import os
import time
import urllib.request
import urllib.parse
import re

# API 설정
NAVER_CLIENT_ID = "Ug7csvlUDeTe1I72ehKQ"
NAVER_CLIENT_SECRET = "pqPjVw9kig"

def get_menu_centric_description(name, location, category):
    query = f"{location} {name} 대표 메뉴 특징"
    encText = urllib.parse.quote(query)
    url = f"https://openapi.naver.com/v1/search/blog?query={encText}&display=10"
    
    req = urllib.request.Request(url)
    req.add_header("X-Naver-Client-Id", NAVER_CLIENT_ID)
    req.add_header("X-Naver-Client-Secret", NAVER_CLIENT_SECRET)
    
    try:
        res = urllib.request.urlopen(req)
        data = json.loads(res.read().decode('utf-8'))
        full_text = " ".join([i['title'] + i['description'] for i in data['items']]).replace('<b>', '').replace('</b>', '')
        
        # 1. 메뉴 키워드 추출 (자주 등장하는 음식 명칭)
        # 일반적인 음식 키워드 사전 (확장 가능)
        food_keywords = [
            "콩국수", "곰탕", "냉면", "우동", "육개장", "돼지국밥", "칼국수", "순대국", "쌈밥", "탕수육", "짬뽕", "짜장면",
            "삼겹살", "불고기", "비빔밥", "돈가스", "파스타", "피자", "초밥", "스테이크", "해장국", "감자탕", "아구찜", "해물탕",
            "떡볶이", "김밥", "족발", "보쌈", "치킨", "곱창", "막창", "장어", "회", "낙지", "샤브샤브", "훠궈"
        ]
        
        found_menus = []
        for menu in food_keywords:
            if menu in full_text and menu not in found_menus:
                found_menus.append(menu)

        # 2. 메뉴-업태 정합성 검증 (Semantic Match)
        # 업태별 나타날 수 없는 부적절한 메뉴 필터링
        invalid_combinations = {
            "커피전문점": ["탕수육", "짬뽕", "짜장면", "삼겹살", "해물탕", "족발", "곱창"],
            "카페": ["탕수육", "짬뽕", "짜장면", "삼겹살", "해물탕", "족발", "곱창"],
            "일식": ["짜장면", "짬뽕", "탕수육", "삼겹살", "순대국", "해장국"],
            "중식": ["초밥", "파스타", "피자", "스테이크", "순대국"],
            "한식": ["파스타", "피자", "스테이크", "초밥"]
        }
        
        filtered_menus = []
        forbidden = invalid_combinations.get(category, [])
        for m in found_menus:
            if m not in forbidden:
                filtered_menus.append(m)
        
        # 3. 설명문 조합 (표준 양식)
        if filtered_menus:
            main_menus = ", ".join(filtered_menus[:3]) # 최대 3개 노출
            desc = f"{main_menus} 중심의 {category} 전문점."
            
            # 특징 부연 (추출된 텍스트 중 긍정 수식어 활용)
            features = ["전통", "달인", "노포", "유명", "깔끔", "담백", "깊은 맛", "바삭한", "쫄깃한"]
            found_features = [f for f in features if f in full_text]
            if found_features:
                desc += f" {found_features[0]} 특징이 돋보이는 곳."
            else:
                desc += " 미디어가 인정한 품질을 자랑함."
            return desc
        else:
            return f"{category} 본연의 맛에 충실한 {location} 명소."
            
    except Exception as e:
        print(f"    ❌ Error for {name}: {e}")
        return None

def refine_all_descriptions():
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    path = os.path.join(root_dir, 'src', 'data', 'places.json')
    
    with open(path, 'r', encoding='utf-8') as f:
        places = json.load(f)
    
    print(f"🚀 [Description Refinement] 전수 조사 시작 (대상: {len(places)}개)")
    
    refined_count = 0
    for i, p in enumerate(places):
        # [품질 최적화] 이미 설명문이 풍부하거나 기존 검증 데이터는 건드리지 않음
        # "중심의" 라는 키워드가 들어있는 기존 정제 데이터도 스킵
        if p.get('description') and ("중심의" in p['description'] or "전문점" in p['description']):
            continue
            
        # 촬영지는 별도의 VSI 가이드를 따르므로 식당(Category != '촬영지')만 우선 적용
        if p.get('category') == '촬영지': continue
        
        print(f"  🔍 [{i+1}/{len(places)}] {p['name']} 메뉴 분석 중...")
        new_desc = get_menu_centric_description(p['name'], p.get('addressCity', '') + " " + p.get('addressDistrict', ''), p['category'])
        
        if new_desc:
            p['description'] = new_desc
            print(f"    ✨ 수정됨: {new_desc}")
        
        time.sleep(0.1)

    with open(path, 'w', encoding='utf-8') as f:
        json.dump(places, f, ensure_ascii=False, indent=2)
    
    print("\n✅ 모든 식당 데이터가 '메뉴 우선' 표준으로 리뉴얼되었습니다.")

if __name__ == "__main__":
    refine_all_descriptions()
