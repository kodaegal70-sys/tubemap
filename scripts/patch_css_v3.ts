
import * as fs from 'fs';
import * as path from 'path';

const filePath = path.join(process.cwd(), 'src/app/components/RightPanel.module.css');
let content = fs.readFileSync(filePath, 'utf8');

// 1. .info 클래스에 min-width: 0 추가 (Flexbox 텍스트 생략의 필수조건)
content = content.replace(/(\.info\s*\{[^}]*)/, (match) => {
    if (!match.includes('min-width: 0;')) {
        return match + '    min-width: 0;\n';
    }
    return match;
});

// 2. .placeCard 레이아웃 안정화
content = content.replace(/(\.placeCard\s*\{[^}]*)/, (match) => {
    if (!match.includes('box-sizing: border-box;')) {
        return match + '    width: 100%;\n    box-sizing: border-box;\n    overflow: hidden;\n';
    }
    return match;
});

// 3. 텍스트 요소들 (ellipsis 적용)
const textClasses = ['.name', '.menus', '.channels', '.detailTitle', '.detailComment', '.commentSnippet'];
textClasses.forEach(cls => {
    const regex = new RegExp('(\\' + cls + '\\s*\\{[^}]*)', 'g');
    content = content.replace(regex, (match) => {
        // 이미 엘립시스가 있으면 패스
        if (match.includes('text-overflow: ellipsis;')) {
            // 보강만 함 (nowrap 등)
            let m = match;
            if (!m.includes('white-space:')) m += '    white-space: nowrap;\n';
            if (!m.includes('overflow: hidden;')) m += '    overflow: hidden;\n';
            return m;
        }
        return match + '    overflow: hidden;\n    text-overflow: ellipsis;\n    white-space: nowrap;\n';
    });
});

// 4. commentSnippet과 detailComment는 여러줄일 수 있으므로 nowrap 제거하고 line-clamp 사용
// 하지만 사용자가 '...'을 원하므로 1줄로 강제하는 것이 가장 확실함 (이번에는 1줄로 통일)
// 만약 3줄을 원하면 line-clamp를 유지하되 width 제약이 필수. 
// 일단 사용자가 '기본카드 밖으로 나오는 것'을 극도로 싫어하므로 1줄 ellipsis 정책 사용.

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ RightPanel.module.css V3 Patched Successfully!');
