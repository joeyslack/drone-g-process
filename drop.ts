// Global env vars. PG env vars allow client.connect
require('dotenv').config();
const fs = require('fs');

// Connect to sql-staging
const { Pool, Client } = require('pg');
const client = new Client();
client.connect();

client.query(`
DROP VIEW IF EXISTS "mission_inventory", "mission_structure", "vw_mission_bin" CASCADE;
DROP TABLE IF EXISTS "inventory_item", "inventory_gallery", "mission_bin", "bin", "structure", "product", "mission", "warehouse", "typeorm_metadata" CASCADE;

`).then(d => {
  console.log('TABLES DELETED');
  client.end();
  return true;
}, (error) => {
  console.error(error);
});

export {}




// // Global env vars. PG env vars allow client.connect
// require('dotenv').config();
// const fs = require('fs');

// // Connect to sql-staging
// const { Pool, Client } = require('pg');
// const client = new Client();
// client.connect();

// client.query(`
//   DELETE FROM "inventory_item";
//   DELETE FROM "inventory_gallery";
//   DELETE FROM "mission_bin";
//   DELETE FROM "bin";
//   DELETE FROM "structure";
//   DELETE FROM "product";
//   DELETE FROM "mission";
//   DELETE FROM "warehouse";
// `).then(d => {
//   console.log('Database cleaned');
//   client.end();
//   return true;
// }, (error) => {
//   console.log(error);
// });

// export {}