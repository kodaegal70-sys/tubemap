import json
import os
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

def fix_specific_place(target_name):
    path = os.path.join('src', 'data', 'places.json')
    with open(path, 'r', encoding='utf-8') as f:
        places = json.load(f)
    
    for p in places:
        if p['name'] == target_name:
            print(f"🎯 {target_name} 이미지 정밀 수집 시작...")
            query = f"{target_name} 천안 생활의달인 칼국수 입구"
            encText = urllib.parse.quote(query)
            url = f"https://openapi.naver.com/v1/search/image?query={encText}&display=20&sort=sim"
            
            req = urllib.request.Request(url)
            req.add_header("X-Naver-Client-Id", NAVER_CLIENT_ID)
            req.add_header("X-Naver-Client-Secret", NAVER_CLIENT_SECRET)
            
            try:
                res = urllib.request.urlopen(req)
                data = json.loads(res.read().decode('utf-8'))
                
                for item in data.get('items', []):
                    link = item.get('link', '')
                    title = item.get('title', '')
                    # 쇼핑 도메인 강력 배제
                    if "shop" in link and "phinf" in link: continue
                    # 텍스트 위주 타이틀 배제
                    if any(gt in title for gt in ["맛집 5", "맛집 10", "추천"]): continue
                    
                    print(f"  ✅ 새 이미지 발견: {link}")
                    p['image_url'] = link
                    break
            except Exception as e:
                print(f"Error: {e}")
            
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(places, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    fix_specific_place("계명집")
