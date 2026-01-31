
import { spawn, exec } from 'child_process';

const url = "https://place.map.kakao.com/main/v/16737435";

function testSpawn() {
    console.log("[Test] Testing EXEC with powershell shell option...");
    // Standard CMD syntax
    const curlCmd = `curl.exe -s -H "User-Agent: Mozilla/5.0" "${url}"`;

    // exec default uses cmd.exe on Windows
    const child = exec(curlCmd, (error, stdout, stderr) => {
        console.log(`[Exec] Finished.`);
        if (stderr) console.log("[Exec] STDERR:", stderr);
        try {
            const data = JSON.parse(stdout);
            if (data.basicInfo) {
                console.log("✅ [Exec] JSON PARSE SUCCESS! Name:", data.basicInfo.placenamefull);
            } else {
                console.log("❌ [Exec] JSON VALID BUT CONTENT MISSING");
            }
        } catch (e) {
            console.log("❌ [Exec] JSON PARSE FAILED!");
            console.log("Body Start:", stdout.substring(0, 200));
        }
    });

    return;
}

testSpawn();
