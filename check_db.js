const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

let dbUrl = '';
const envContent = fs.readFileSync(path.resolve(__dirname, '.env.local'), 'utf8');
for (const line of envContent.split('\n')) {
  if (line.startsWith('DATABASE_URL=')) {
    dbUrl = line.replace('DATABASE_URL=', '').trim().replace(/^["']|["']$/g, '');
    break;
  }
}

async function main() {
  const connection = await mysql.createConnection(dbUrl);
  const [rows] = await connection.query("SELECT footer FROM site_content LIMIT 1");
  await connection.end();

  if (!rows.length) { console.log("No row found"); return; }

  let footer = rows[0].footer;
  if (typeof footer === 'string') footer = JSON.parse(footer);

  console.log("socialLinks in DB:", JSON.stringify(footer.socialLinks, null, 2));
}

main().catch(console.error);
