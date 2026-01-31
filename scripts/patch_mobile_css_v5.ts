
import * as fs from 'fs';
import * as path from 'path';

const filePath = path.join(process.cwd(), 'src/app/components/BottomSheet.module.css');
let content = fs.readFileSync(filePath, 'utf8');

// 1. 지도 간섭 해결: .bottomSheetContainer의 touch-action 제거
// touch-action: pan-y 가 있으면 pointer-events: none 이어도 일부 브라우저에서 제스처를 먹을 수 있음
content = content.replace(/(\.bottomSheetContainer\s*\{[^}]*)touch-action:\s*pan-y;\s*/, '$1');

// 2. 텍스트 넘침 해결: .itemInfo에 width: 100% 추가 (flex child가 부모 너비를 알도록)
// min-width: 0은 이미 있지만 width: 100% 도 명시하면 안전함.
content = content.replace(/(\.itemInfo\s*\{[^}]*)/, (match) => {
    let newBlock = match;
    if (!newBlock.includes('width: 100%;')) {
        newBlock = newBlock.replace(/(\.itemInfo\s*\{)/, '$1width: 100%;\n  ');
    }
    return newBlock;
});

// 3. 텍스트 요소들 (.itemName, .itemMenus, .itemChannels)에 display: block 및 width: 100% 강제
// inline-flex 등이 섞여있으면 ellipsis가 안먹힐 수 있음.
const textClasses = ['.itemName', '.itemMenus', '.itemChannels'];
textClasses.forEach(cls => {
    const regex = new RegExp('(\\' + cls + '\\s*\\{[^}]*)', 'g');
    content = content.replace(regex, (match) => {
        let m = match;
        // display: block 추가 (기존 display 속성이 있다면 덮어쓰거나 앞에 추가, CSS는 뒤에 쓴게 이김)
        if (!m.includes('display: block;')) {
            m = m + '  display: block;\n';
        }
        if (!m.includes('width: 100%;')) {
            m = m + '  width: 100%;\n';
        }
        return m;
    });
});

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ BottomSheet.module.css V5 Patched Successfully!');
