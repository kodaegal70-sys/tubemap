import json
import os

def cleanup():
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    path = os.path.join(root_dir, 'src', 'data', 'places.json')
    
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # 프랜차이즈 키워드
    franchise = ["스타벅스", "맥도날드", "버거킹", "롯데리아"]
    
    initial_count = len(data)
    # 이름에 프랜차이즈가 포함된 항목 제거
    cleaned_data = [p for p in data if not any(f in p['name'] for f in franchise)]
    
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(cleaned_data, f, ensure_ascii=False, indent=2)
    
    print(f"✅ Cleanup 완료: {initial_count} -> {len(cleaned_data)} (제거됨: {initial_count - len(cleaned_data)})")

if __name__ == "__main__":
    cleanup()
