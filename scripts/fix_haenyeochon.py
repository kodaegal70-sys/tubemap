
import json
import os
import urllib.request
import urllib.parse
import time

# API Keys (Hardcoded for script)
KAKAO_API_KEY = "c6088c2c7ec5f0e1ed1122ba613db0fb"
NAVER_CLIENT_ID = "Ug7csvlUDeTe1I72ehKQ"
NAVER_CLIENT_SECRET = "pqPjVw9kig"

BAD_DOMAINS = ["shopping", "smartstore", "coupang", "11st", "gmarket", "auction", "wemakeprice", "tmon", "shop.phinf", "map.naver"]
BAD_KEYWORDS_IN_TITLE = ["밀키트", "포장", "택배", "공구", "판매", "출시", "스토어", "배달", "약도", "지도", "위치", "가는길", "로드뷰", "캡처"]

def search_image_api(query, sort_type='sim'):
    encText = urllib.parse.quote(query)
    # Display 10 to check more candidates
    url = f"https://openapi.naver.com/v1/search/image?query={encText}&display=10&sort={sort_type}&filter=medium" 
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
                # Strict Anti-Map / Anti-Ad Check
                if any(bd in link for bd in BAD_DOMAINS): 
                    print(f"Skipping Domain: {link}")
                    continue
                if any(bk in title for bk in BAD_KEYWORDS_IN_TITLE): 
                    print(f"Skipping Title: {title}")
                    continue
                
                # Check for "map" or "location" in URL too if possible
                if "map" in link or "location" in link:
                    print(f"Skipping Map URL: {link}")
                    continue
                    
                return link
    except Exception as e:
        print(f"Error: {e}")
    return None

def fix_haenyeochon():
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    src_path = os.path.join(root_dir, 'src', 'data', 'places.json')
    
    with open(src_path, 'r', encoding='utf-8') as f:
        places = json.load(f)
        
    target = None
    for p in places:
        if "해녀촌" in p['name']: # Search partial name if exact match fails
            target = p
            break
            
    if not target:
        print("❌ '해녀촌' 관련 데이터를 찾을 수 없습니다.")
        return

    print(f"🔍 Found: {target['name']} ({target['address']})")
    print(f"   Current Image: {target.get('image_url')}")
    
    # New Query
    # Explicitly exclude map terms in query
    city = target.get('addressCity', '')
    if not city and target.get('address'):
        city = target['address'].split()[1]
        
    query = f"{target['name']} {city} 음식 -지도 -약도 -위치 -캡처 -로드뷰 -밀키트"
    print(f"   Searching with: {query}")
    
    new_img = search_image_api(query, 'sim')
    
    if new_img:
        print(f"   ✅ New Image Found: {new_img}")
        target['image_url'] = new_img
        
        with open(src_path, 'w', encoding='utf-8') as f:
            json.dump(places, f, ensure_ascii=False, indent=2)
            
        print("💾 Saved to places.json")
    else:
        print("❌ No better image found. Deleting entry as per Zero Tolerance.")
        # Remove from places
        places = [p for p in places if p['id'] != target['id']]
        with open(src_path, 'w', encoding='utf-8') as f:
            json.dump(places, f, ensure_ascii=False, indent=2)
        print("🗑️ Deleted entry.")

if __name__ == "__main__":
    fix_haenyeochon()
