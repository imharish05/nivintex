const sequelize = require('./config/db');

async function cleanIndexes() {
  try {
    const [tables] = await sequelize.query('SHOW TABLES');
    
    for (const tableObj of tables) {
      const tableName = Object.values(tableObj)[0];
      const [indexes] = await sequelize.query(`SHOW INDEX FROM ${tableName}`);
      
      const indexNames = indexes.map(i => i.Key_name);
      
      // Count duplicates like product_id, product_id_1, product_id_2
      // or similar naming conventions Sequelize uses
      console.log(`Table ${tableName} has ${indexNames.length} keys`);
      
      if (indexNames.length > 5) {
        console.log(`Checking table ${tableName} for duplicate keys...`);
        // Just regex match anything ending with a number like _2, _3
        // and drop it, OR group by column name
        const seenColumns = new Set();
        const toDrop = new Set();
        for (const idxInfo of indexes) {
          if (idxInfo.Key_name === 'PRIMARY') continue;
          
          if (seenColumns.has(idxInfo.Column_name)) {
            toDrop.add(idxInfo.Key_name);
          } else {
            seenColumns.add(idxInfo.Column_name);
          }
        }
        
        for (const dropIdx of toDrop) {
          console.log(`Dropping index ${dropIdx} from ${tableName}`);
          try {
            await sequelize.query(`ALTER TABLE ${tableName} DROP INDEX ${dropIdx}`);
          } catch(e) {
            console.error(`Failed to drop ${dropIdx}:`, e.message);
          }
        }
      }
    }
    console.log('Cleanup finished');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

cleanIndexes();
