import json
import os
import time
import urllib.request
import urllib.parse

# .env.local 환경 변수 로드
def load_env():
    env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env.local')
    if os.path.exists(env_path):
        with open(env_path, 'r', encoding='utf-8') as f:
            for line in f:
                if '=' in line and not line.startswith('#'):
                    key, value = line.strip().split('=', 1)
                    os.environ[key] = value

load_env()
NAVER_CLIENT_ID = os.environ.get("NAVER_CLIENT_ID")
NAVER_CLIENT_SECRET = os.environ.get("NAVER_CLIENT_SECRET")

def search_media_branch(name, media):
    """미디어와 업체명을 조합하여 실제 노출된 지점을 검색 분석"""
    query = f"{media} {name} 지점 위치"
    encText = urllib.parse.quote(query)
    url = f"https://openapi.naver.com/v1/search/blog?query={encText}&display=5"
    
    req = urllib.request.Request(url)
    req.add_header("X-Naver-Client-Id", NAVER_CLIENT_ID)
    req.add_header("X-Naver-Client-Secret", NAVER_CLIENT_SECRET)
    
    try:
        res = urllib.request.urlopen(req)
        data = json.loads(res.read().decode('utf-8'))
        snippets = [item.get('description', '').replace('<b>', '').replace('</b>', '') for item in data.get('items', [])]
        titles = [item.get('title', '').replace('<b>', '').replace('</b>', '') for item in data.get('items', [])]
        combined_text = " ".join(titles + snippets)
        return combined_text
    except Exception as e:
        print(f"Error searching for {name}: {e}")
        return ""

def verify_mbv():
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    path = os.path.join(root_dir, 'src', 'data', 'places.json')
    
    with open(path, 'r', encoding='utf-8') as f:
        places = json.load(f)
    
    print(f"🚀 [MBV Engine] 지점 정밀 검증 시작 (대상: {len(places)}개)")
    
    to_delete = []
    
    for p in places:
        # 1. 지명/지점명이 포함된 경우만 정밀 검증 대상으로 추출
        if any(word in p['name'] for word in ["본점", "점", "안산", "천안", "서울"]):
            print(f"  🔍 분석 중: {p['name']} ({p['media']})")
            
            # 미디어 노출 텍스트 분석
            context = search_media_branch(p['name'], p['media'])
            
            if not context:
                print(f"    ⚠️ [파악 불가] 검색 결과 없음 -> 배제 대상")
                to_delete.append(p['id'])
                continue
            
            # 주소 정보 (동/구) 추출
            addr = p.get('address', '')
            district = p.get('addressDistrict', '')
            
            # 컨텍스트에 현재 주소 키워드가 포함되어 있는지 확인
            found_match = False
            if district and district in context:
                found_match = True
            
            # '본점' 키워드 매칭 확인
            if "본점" in p['name'] and "본점" in context:
                found_match = True
            
            if found_match:
                print(f"    ✅ [검증 성공] 미디어 노출 위치 일치 확인")
            else:
                # 파악이 안 되거나 주소가 다른 경우
                print(f"    ❌ [검증 실패/파악 불가] 일치 정보 미검출 -> 배제 대상")
                to_delete.append(p['id'])
                
            time.sleep(0.1) # API 속도 조절

    # 최종 결과 보고 및 삭제 실행
    print(f"\n🗑️ [MBV 결과] 총 {len(to_delete)}개 항목 배제 결정")
    new_places = [p for p in places if p['id'] not in to_delete]
    
    # 작업 전 백업
    with open(path + '.bak', 'w', encoding='utf-8') as f:
        json.dump(places, f, ensure_ascii=False, indent=2)

    with open(path, 'w', encoding='utf-8') as f:
        json.dump(new_places, f, ensure_ascii=False, indent=2)
    
    print(f"✅ 데이터 정리 완료! (잔여 데이터: {len(new_places)}개)")
    return to_delete

if __name__ == "__main__":
    verify_mbv()
