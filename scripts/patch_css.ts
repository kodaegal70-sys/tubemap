
import * as fs from 'fs';
import * as path from 'path';

const filePath = path.join(process.cwd(), 'src/app/components/RightPanel.module.css');
let content = fs.readFileSync(filePath, 'utf8');

// 1. .name 클래스 수정
content = content.replace(/(\.name\s*\{[^}]*margin-bottom:\s*2px;)/, '$1\n    word-break: break-all;\n    overflow-wrap: break-word;');

// 2. .commentSnippet 클래스 수정 (ellipsis 보존)
content = content.replace(/(\.commentSnippet\s*\{[^}]*text-overflow:\s*ellipsis;)/, '$1\n    word-break: break-all;\n    overflow-wrap: break-word;');

// 3. .detailCard 클래스 수정 (flex-shrink 제거 및 너비 고정)
content = content.replace(/flex-shrink:\s*0;/, 'width: 100%;\n    box-sizing: border-box;\n    overflow: hidden;');

// 4. .detailTitle 클래스 수정
content = content.replace(/(\.detailTitle\s*\{[^}]*color:\s*#222;)/, '$1\n    word-break: break-all;\n    overflow-wrap: break-word;');

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ RightPanel.module.css patched successfully!');
