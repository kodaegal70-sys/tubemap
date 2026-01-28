import json
import urllib.request
import urllib.parse
import os
import time

NAVER_CLIENT_ID = "Ug7csvlUDeTe1I72ehKQ"
NAVER_CLIENT_SECRET = "pqPjVw9kig"

BAD_DOMAINS = ["shopping", "smartstore", "coupang", "11st", "gmarket", "auction", "tmon", "shop.phinf"]
BAD_KEYWORDS_IN_TITLE = ["밀키트", "포장", "택배", "공구", "판매", "출시", "스토어", "게임", "이벤트", "증정", "텀블러", "광고", "다운로드", "사전예약"]

TARGETS = {
    "고도식 잠실점": ["고도식 잠실 알등심", "고도식 잠실 고기집"],
    "브뤼셀프라이": ["브뤼셀프라이 경주 감자튀김", "브뤼셀프라이 황리단길 먹거리"]
}

def search_strict(query):
    encText = urllib.parse.quote(query)
    # Using 'sim' to ensure relevance to strict query
    url = f"https://openapi.naver.com/v1/search/image?query={encText}&display=10&sort=sim&filter=medium"
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
                if any(bd in link for bd in BAD_DOMAINS): continue
                if any(bk in title for bk in BAD_KEYWORDS_IN_TITLE): continue
                # Additional heuristic: Prefer blog images
                if "blog" in link or "post" in link:
                    return link
            # Fallback: if no blog image, take first non-bad one
            for item in data['items']:
                link = item['link']
                title = item['title']
                if any(bd in link for bd in BAD_DOMAINS): continue
                if any(bk in title for bk in BAD_KEYWORDS_IN_TITLE): continue
                return link
    except: pass
    return None

def main():
    print("🚀 [Phase 43] 특정 업체(고도식, 브뤼셀프라이) 이미지 초정밀 교체")
    
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    src_path = os.path.join(root_dir, 'src', 'data', 'places.json')
    
    with open(src_path, 'r', encoding='utf-8') as f:
        places = json.load(f)
        
    updated = False
    for p in places:
        if p['name'] in TARGETS:
            queries = TARGETS[p['name']]
            new_img = None
            for q in queries:
                new_img = search_strict(q)
                if new_img: 
                    print(f"  ✨ Found strict image for {p['name']} with query '{q}'")
                    break
            
            if new_img and new_img != p.get('image_url'):
                p['image_url'] = new_img
                updated = True
                print(f"  ✅ Replaced Image for {p['name']}")
            elif not new_img:
                 print(f"  ❌ Failed to find clean image for {p['name']}")

    if updated:
        with open(src_path, 'w', encoding='utf-8') as f:
            json.dump(places, f, ensure_ascii=False, indent=2)
        print("\n💾 Changes saved.")
    else:
        print("\nNo changes made.")

if __name__ == "__main__":
    main()
