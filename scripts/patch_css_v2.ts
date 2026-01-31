
import * as fs from 'fs';
import * as path from 'path';

const filePath = path.join(process.cwd(), 'src/app/components/RightPanel.module.css');
let content = fs.readFileSync(filePath, 'utf8');

// 이전에 오적용된 .fixedBottom 복구 (flex-shrink: 0; 이 사라지고 width: 100% 로 된 부분)
content = content.replace(/(\.fixedBottom\s*\{[^}]*)width: 100%;\n    box-sizing: border-box;\n    overflow: hidden;/, '$1flex-shrink: 0;');

// 1. .name 클래스 (중복 방지 체크)
if (!content.includes('word-break: break-all;') || !content.includes('.name')) {
    // 이미 반영됐을 수 있으므로 패스하거나 정밀하게
}

// 2. .detailCard 클래스 수정 (정밀하게 클래스명부터 매칭)
content = content.replace(/(\.detailCard\s*\{[^}]*)flex-shrink:\s*0;/, '$1width: 100%;\n    box-sizing: border-box;\n    overflow: hidden;');

// 3. .detailTitle 도 이미 반영된 것은 패스

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ RightPanel.module.css re-patched more accurately!');
