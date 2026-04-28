const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
let dbUrl = '';
try {
  const envContent = fs.readFileSync(path.resolve(__dirname, '.env.local'), 'utf8');
  const lines = envContent.split('\n');
  for (const line of lines) {
    if (line.startsWith('DATABASE_URL=')) {
      // Extract value, removing quotes if present
      dbUrl = line.replace('DATABASE_URL=', '').trim().replace(/^["']|["']$/g, '');
      break;
    }
  }
} catch (e) {
  console.error("Failed to read .env.local", e);
  process.exit(1);
}

if (!dbUrl) {
  console.error("No DATABASE_URL found in .env.local");
  process.exit(1);
}

async function main() {
  let connection;
  try {
    connection = await mysql.createConnection(dbUrl);
    console.log("Connected to database");

    const [rows] = await connection.query("SELECT id, footer FROM site_content LIMIT 1");
    if (!rows || rows.length === 0) {
      console.error("No site_content row found");
      return;
    }

    const row = rows[0];
    let footer = row.footer;
    
    let parsedFooter;
    if (typeof footer === 'string') {
      parsedFooter = JSON.parse(footer);
    } else {
      parsedFooter = footer;
    }

    if (parsedFooter && parsedFooter.links) {
      let updated = false;
      parsedFooter.links = parsedFooter.links.map(sec => {
        if (sec.title === 'Company' && sec.items) {
          const initialLen = sec.items.length;
          sec.items = sec.items.filter(item => item.label !== 'Press & Media');
          if (sec.items.length !== initialLen) updated = true;
        }
        return sec;
      });

      if (updated) {
        await connection.query("UPDATE site_content SET footer = ?, updated_at = NOW(3) WHERE id = ?", [JSON.stringify(parsedFooter), row.id]);
        console.log("Successfully removed 'Press & Media' from DB");
      } else {
        console.log("'Press & Media' not found in the DB footer links");
      }
    } else {
      console.log("Footer links structure not found in DB");
    }

  } catch (error) {
    console.error("Database operation failed:", error);
  } finally {
    if (connection) await connection.end();
  }
}

main();
