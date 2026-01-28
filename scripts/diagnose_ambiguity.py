
import json
import os
import urllib.request
import urllib.parse
import time

# API 설정
NAVER_CLIENT_ID = "Ug7csvlUDeTe1I72ehKQ"
NAVER_CLIENT_SECRET = "pqPjVw9kig"

def get_relevance_details(name, address_district, description, category):
    # ASIA 알고리즘 기반 정밀 분석
    keywords = description.split(':')[1].split(',')[0] if ':' in description else description[:10]
    query = f"{name} {address_district} {keywords} 맛집"
    encText = urllib.parse.quote(query)
    url = f"https://openapi.naver.com/v1/search/image?query={encText}&display=10"
    
    req = urllib.request.Request(url)
    req.add_header("X-Naver-Client-Id", NAVER_CLIENT_ID)
    req.add_header("X-Naver-Client-Secret", NAVER_CLIENT_SECRET)
    
    try:
        res = urllib.request.urlopen(req)
        data = json.loads(res.read().decode('utf-8'))
        
        max_score = 0
        best_title = ""
        
        for item in data.get('items', []):
            title = item.get('title', '').replace('<b>', '').replace('</b>', '')
            score = 0
            if name in title: score += 50
            if any(word in title for word in keywords.split()): score += 30
            
            if score > max_score:
                max_score = score
                best_title = title
        
        return max_score, best_title
    except:
        return -1, "Error"

def list_ambiguous():
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    path = os.path.join(root_dir, 'src', 'data', 'places.json')
    
    with open(path, 'r', encoding='utf-8') as f:
        places = json.load(f)
    
    print("🔍 [IQRG Diagnostics] 모호한 데이터(Score 30~80) 추출 중...")
    ambiguous = []
    
    for p in places:
        score, title = get_relevance_details(p['name'], p.get('addressDistrict', ''), p['description'], p['category'])
        
        # 스코어가 낮거나(30~80), 검색 타이틀과 업체명이 완벽히 일치하지 않는 경우
        if 0 <= score < 90:
            ambiguous.append({
                "id": p['id'],
                "name": p['name'],
                "score": score,
                "current_image": p['image_url'],
                "search_context": title
            })
        time.sleep(0.05)

    # 결과 저장
    output_path = os.path.join(root_dir, 'scripts', 'ambiguous_report.json')
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(ambiguous, f, ensure_ascii=False, indent=2)
    
    print(f"✅ 분석 완료! 총 {len(ambiguous)}개의 모호한 데이터가 발견되었습니다.")
    print(f"📄 리포트 저장 위치: {output_path}")

if __name__ == "__main__":
    list_ambiguous()
