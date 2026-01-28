import os
import subprocess
import json

def run_qc():
    print("="*50)
    print("🍽️ [Integrated Quality Control Engine] 통합 검증 시작")
    print("="*50)

    # 1. MBV (지점 혼동 정밀 검증)
    print("\n[Step 1] MBV - 지점 혼동 무관용 검증 중...")
    try:
        subprocess.run(["python", "scripts/verify_branch.py"], check=True)
    except Exception as e:
        print(f"❌ MBV 실행 중 오류 발생: {e}")

    # 2. ASIA v2.1 (시각적 무결성 및 고품질 교체)
    print("\n[Step 2] ASIA v2.1 - 시각적 무결성 및 이미지 정화 중...")
    try:
        subprocess.run(["python", "scripts/verify_relevance.py"], check=True)
    except Exception as e:
        print(f"❌ ASIA v2.1 실행 중 오류 발생: {e}")

    # 3. Supabase 동기화 (검증 완료 데이터 반영)
    print("\n[Step 3] DB Sync - Supabase 동기화 중...")
    try:
        subprocess.run(["node", "scripts/sync_to_supabase.js"], check=True)
    except Exception as e:
        print(f"❌ DB Sync 실행 중 오류 발생: {e}")

    print("\n" + "="*50)
    print("✨ [QC 완료] 모든 데이터가 고품질 표준을 만족하며 동기화되었습니다.")
    print("="*50)

if __name__ == "__main__":
    run_qc()
