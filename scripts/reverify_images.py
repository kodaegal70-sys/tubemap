import json
import urllib.request
import urllib.parse
import os
import time

# API Keys
NAVER_CLIENT_ID = "Ug7csvlUDeTe1I72ehKQ"
NAVER_CLIENT_SECRET = "pqPjVw9kig"

BAD_DOMAINS = ["shopping", "smartstore", "coupang", "11st", "gmarket", "auction", "wemakeprice", "tmon", "shop.phinf"]
BAD_KEYWORDS_IN_TITLE = ["밀키트", "포장", "택배", "공구", "판매", "출시", "스토어"]

def validate_and_replace_image(place):
    name = place['name']
    menu = place.get('category', '맛집') # Use category or description hint
    
    # Check current image
    curr_url = place.get('image_url', '')
    if any(bd in curr_url for bd in BAD_DOMAINS):
        print(f"  ⚠️ [Ad Detected] {name}: URL({curr_url}) contains shopping domain.")
    
    # Re-search with strict query
    # Query: "{Name} {Menu} 방문 -밀키트 -택배"
    query = f"{name} {menu} 방문후기 -밀키트 -택배 -포장"
    
    encText = urllib.parse.quote(query)
    url = f"https://openapi.naver.com/v1/search/image?query={encText}&display=3&sort=sim&filter=medium"
    
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
                
                # Check Bad Domains
                if any(bd in link for bd in BAD_DOMAINS): continue
                # Check Bad Title Keywords
                if any(bk in title for bk in BAD_KEYWORDS_IN_TITLE): continue
                
                # If pass, return this High Quality Image
                return link
    except Exception as e:
        print(f"  Error searching for {name}: {e}")
        
    return None

def main():
    print("🚀 [Phase 42] 이미지 품질(반-밀키트) 무결성 재검증 시작")
    
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    src_path = os.path.join(root_dir, 'src', 'data', 'places.json')
    
    with open(src_path, 'r', encoding='utf-8') as f:
        places = json.load(f)
        
    valid_places = []
    ids = 1
    
    for p in places:
        new_img = validate_and_replace_image(p)
        if new_img:
            if new_img != p.get('image_url'):
                print(f"  ✨ [Updated] {p['name']}: 이미지 교체 완료")
            p['image_url'] = new_img
            p['id'] = ids
            valid_places.append(p)
            ids += 1
        else:
            print(f"  ❌ [Deleted] {p['name']}: 순수 방문기 이미지 확보 실패 (Zero Tolerance)")
            
    # Save
    with open(src_path, 'w', encoding='utf-8') as f:
        json.dump(valid_places, f, ensure_ascii=False, indent=2)
        
    print(f"\n✅ 검증 완료. 총 {len(places)} -> {len(valid_places)}개 유지.")

if __name__ == "__main__":
    main()
