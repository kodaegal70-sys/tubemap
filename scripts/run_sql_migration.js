const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function runMigration() {
    // Try to find a direct connection string
    const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

    if (!connectionString) {
        console.error('❌ DB 연결 문자열을 찾을 수 없습니다. .env.local에 POSTGRES_URL 또는 DATABASE_URL이 있는지 확인해주세요.');
        process.exit(1);
    }

    console.log('🔌 데이터베이스 연결 중...');
    const client = new Client({
        connectionString: connectionString,
        ssl: { rejectUnauthorized: false } // Supabase requires SSL
    });

    try {
        await client.connect();

        const sqlPath = process.argv[2] ? path.resolve(process.argv[2]) : path.join(__dirname, 'v1.5_combined_schema.sql');
        console.log(`📄 SQL 파일 읽는 중: ${sqlPath}`);

        const sql = fs.readFileSync(sqlPath, 'utf-8');

        console.log('🚀 마이그레이션 실행 중...');
        await client.query(sql);

        console.log('✅ 마이그레이션이 성공적으로 완료되었습니다.');
    } catch (err) {
        console.error('❌ 마이그레이션 실패:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

runMigration();
