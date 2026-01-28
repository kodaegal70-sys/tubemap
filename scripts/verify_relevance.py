
import json
import os
import time
import urllib.request
import urllib.parse
import http.client

# API 설정
NAVER_CLIENT_ID = "Ug7csvlUDeTe1I72ehKQ"
NAVER_CLIENT_SECRET = "pqPjVw9kig"

def calculate_relevance_score(item, target_name, target_menu):
    score = 0
    title = item.get('title', '').replace('<b>', '').replace('</b>', '')
    snippet = item.get('description', '').replace('<b>', '').replace('</b>', '')
    link = item.get('link', '')
    
    # 1. 이름 매칭 (가장 중요)
    if target_name in title:
        score += 50
    elif target_name[:3] in title: # 이름 일부 매칭
        score += 20
        
    # 2. 메뉴/설명 매칭 (의미론적 고정)
    if target_menu and any(word in title or word in snippet for word in target_menu.split()):
        score += 30
        
    # 3. 신뢰 도메인 가중치 및 쇼핑 도메인 패널티
    if "naver.com" in link or "kakao.com" in link or "tistory.com" in link:
        score += 20
    if "shop" in link and "phinf.naver.net" in link:
        score -= 80 # 쇼핑/상품권 텍스트 이미지 강력 패널티 (ASIA v2.1)
        
    # 4. 부정 키워드 및 시각적 오염 필터링 (ASIA v2)
    # 4-1. 상업적 키워드 (무관용 배제)
    commercial_words = ["쿠팡", "쇼핑", "마켓", "스마트스토어", "배달", "택배", "선물세트", "할인", "이벤트"]
    if any(cw in title or cw in snippet for cw in commercial_words):
        score -= 100
        
    # 4-2. 포괄적/정보성 텍스트 (이름이 포함되어 있다면 패널티 완화)
    generic_text = ["맛집 5", "맛집 7", "맛집 10", "가볼만한곳", "리스트", "베스트", "랭킹", "정리", "모음"]
    if any(gt in title for gt in generic_text):
        if target_name in title:
            score -= 20 # 이름과 함께 있으면 약한 패널티
        else:
            score -= 80 # 이름 없이 리스트만 있으면 강한 패널티
        
    # 4-3. 기타 부정 키워드
    negative_words = ["프로필", "인물", "풍경", "지도", "대문", "다른가게", "광고"]
    if any(nw in title for nw in negative_words):
        score -= 100
        
    # 5. 현장성 가중치 (간판, 전경, 메뉴판 등)
    visual_anchor = ["간판", "전경", "입구", "메뉴판", "차림표", "식당", "노포"]
    if any(va in title for va in visual_anchor):
        score += 15
        
    return score

def get_verified_image(name, address_district, description, category):
    # ASIA 알고리즘: 적응형 쿼리 전략 (Adaptive Querying Flow)
    
    # 전략 1: 정밀 쿼리 (이름 + 지역 + 핵심키워드)
    keywords = description.split(':')[1].split(',')[0] if ':' in description else description[:10]
    queries = [
        f"{name} {address_district} {keywords} 대표사진",
        f"{name} {address_district} 맛집 음식",
        f"{name} {category} 대표이미지"
    ]
    
    best_overall_img = None
    max_overall_score = -1

    for i, q in enumerate(queries):
        encText = urllib.parse.quote(q)
        url = f"https://openapi.naver.com/v1/search/image?query={encText}&display=10&sort=sim"
        
        req = urllib.request.Request(url)
        req.add_header("X-Naver-Client-Id", NAVER_CLIENT_ID)
        req.add_header("X-Naver-Client-Secret", NAVER_CLIENT_SECRET)
        
        try:
            res = urllib.request.urlopen(req)
            data = json.loads(res.read().decode('utf-8'))
            
            for item in data.get('items', []):
                score = calculate_relevance_score(item, name, description)
                
                # 쿼리 차수에 따른 패널티 (정밀할수록 가점)
                score -= (i * 10) 
                
                # 해상도 체크
                try:
                    w, h = int(item.get('sizewidth', 0)), int(item.get('sizeheight', 0))
                    if w < 400 or h < 300: score -= 40
                    if w > 1000: score += 10 # 고해상도 가점
                except: pass
                
                if score > max_overall_score:
                    max_overall_score = score
                    best_overall_img = item.get('link')
            
            # 1차 쿼리에서 충분히 높은 점수(90+)가 나오면 즉시 종료
            if max_overall_score >= 90:
                break
                
        except: continue
        
    return best_overall_img, max_overall_score

def run_iqrg_verification():
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    path = os.path.join(root_dir, 'src', 'data', 'places.json')
    
    with open(path, 'r', encoding='utf-8') as f:
        places = json.load(f)
    
    print(f"🚀 [IQRG v3] 정밀 이미지 정화 시작 (대상: {len(places)}개)")
    
    replaced_count = 0
    confirmed_count = 0
    low_confidence_count = 0
    
    for i, p in enumerate(places):
        print(f"  🔍 [{i+1}/{len(places)}] {p['name']} 분석 중...")
        
        # ASIA v2 (Adjusted) 엔진으로 최적 이미지 검색
        new_img, score = get_verified_image(p['name'], p.get('addressCity', '') + " " + p.get('addressDistrict', ''), p['description'], p['category'])
        
        if new_img and score >= 85:
            if p['image_url'] != new_img:
                print(f"    ✨ 고품질 이미지 교체 (Score: {score})")
                p['image_url'] = new_img
                replaced_count += 1
            else:
                print(f"    ✅ 기존 이미지 무결성 확인 (Score: {score})")
                confirmed_count += 1
        elif new_img and score >= 60:
            print(f"    ⚠️ 중간 신뢰도 이미지 검출 (Score: {score}) - 기존 유지")
            confirmed_count += 1
        else:
            print(f"    ❗ 저신뢰 이미지 영역 (Best Score: {score}) - 원본 보존 및 검토 대상")
            low_confidence_count += 1
            
        time.sleep(0.1)

    with open(path, 'w', encoding='utf-8') as f:
        json.dump(places, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ IQRG v3 무결성 리포트")
    print(f"  - 무결성 확인: {confirmed_count}개")
    print(f"  - 고품질 교체: {replaced_count}개")
    print(f"  - 저신뢰/검토필요: {low_confidence_count}개")
    print(f"  - 총 {len(places)}개 업체 정보 보존 완료.")

if __name__ == "__main__":
    run_iqrg_verification()
