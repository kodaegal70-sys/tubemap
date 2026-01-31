
import { exec } from 'child_process';
console.log("Running test_curl.ps1 via Node exec...");
exec('powershell -ExecutionPolicy Bypass -File scripts/test_curl.ps1', (err, stdout, stderr) => {
    if (err) console.error("EXEC ERROR:", err);
    console.log('--- STDERR ---');
    console.log(stderr);
    console.log('--- END STDERR ---');
});
