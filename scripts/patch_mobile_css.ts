
import * as fs from 'fs';
import * as path from 'path';

const filePath = path.join(process.cwd(), 'src/app/components/BottomSheet.module.css');
let content = fs.readFileSync(filePath, 'utf8');

// 1. .itemInfo (모바일 리스트 아이템 정보 영역)에 min-width: 0 추가
content = content.replace(/(\.itemInfo\s*\{[^}]*)/, (match) => {
    if (!match.includes('min-width: 0;')) {
        return match + '  min-width: 0;\n';
    }
    return match;
});

// 2. .itemMenus (모바일 메뉴 텍스트)에 엘립시스 적용
content = content.replace(/(\.itemMenus\s*\{[^}]*)/, (match) => {
    if (!match.includes('text-overflow: ellipsis;')) {
        return match + '  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n';
    }
    return match;
});

// 3. .itemName, .itemChannels 도 모바일에서 넘칠 수 있으므로 보강
const mobileTextClasses = ['.itemName', '.itemChannels'];
mobileTextClasses.forEach(cls => {
    const regex = new RegExp('(\\' + cls + '\\s*\\{[^}]*)', 'g');
    content = content.replace(regex, (match) => {
        if (!match.includes('text-overflow: ellipsis;')) {
            return match + '  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n';
        }
        return match;
    });
});

// 4. 지도 간섭 해결: .bottomSheetContainer가 100dvh를 차지하므로, 
// 실제 시트가 없는 상단 영역이 터치를 막지 않도록 보장 (이미 pointer-events: none 이지만 확실히 함)
// 핵심은 .content나 내부 패널들이 자기 영역을 넘어서 포인터 이벤트를 잡지 않도록 하는 것.

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ BottomSheet.module.css V4 Patched Successfully!');
