
import json
import os

def check():
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    path = os.path.join(root_dir, 'src', 'data', 'places.json')
    
    if not os.path.exists(path):
        print(f"❌ 파일을 찾을 수 없습니다: {path}")
        return

    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    errors = []
    seen_keys = set()
    seen_ids = set()

    print(f"🔍 총 {len(data)}개의 데이터를 검사합니다...")

    for i, p in enumerate(data):
        name = p.get('name', 'N/A')
        address = p.get('address', 'N/A')
        key = f"{name}_{address}"
        
        # 1. 중복 체크
        if key in seen_keys:
            errors.append(f"❌ 중복 발생: {name} ({address})")
        seen_keys.add(key)

        # 2. ID 중복 및 순서 체크
        if p.get('id') in seen_ids:
            errors.append(f"❌ ID 중복: {p.get('id')} ({name})")
        seen_ids.add(p.get('id'))

        # 3. 필수 필드 체크 (이미지, 미디어)
        if not p.get('image_url') or p.get('image_url').strip() == "":
            errors.append(f"🖼️ 이미지 누락: {name}")
        if not p.get('media') or p.get('media').strip() == "":
            errors.append(f"📺 미디어 정보 누락: {name}")
        
        # 4. 좌표 유효성
        if not p.get('lat') or not p.get('lng'):
            errors.append(f"📍 좌표 누락: {name}")

    if errors:
        print("\n--- 검사 결과: 오류 발견 ---")
        for e in errors:
            print(e)
        print(f"\n총 {len(errors)}개의 문제가 발견되었습니다.")
    else:
        print("\n✅ 모든 데이터가 품질 기준을 통과했습니다!")

if __name__ == "__main__":
    check()
