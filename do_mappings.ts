// Global env vars. PG env vars allow client.connect
require('dotenv').config();
const fs = require('fs');

// Connect to sql-staging
const { Pool, Client } = require('pg');


// Use custom sql generator
import { SqlInsertGenerator, BatchSqlUpdateGenerator } from './sql-generator';

// Model Mappings...
import { Warehouse } from './mappings/warehouse';
import { Mission } from './mappings/mission';
import { Product } from './mappings/product';
import { Structure } from './mappings/structure';
import { Bin } from './mappings/bin';
import { MissionBin } from './mappings/mission_bin';
import { InventoryGallery } from './mappings/inventory_gallery';
import { InventoryItem } from './mappings/inventory_item';
import { exists } from 'fs';
import { promises } from 'dns';

var winston = require('winston');
var {Loggly} = require('winston-loggly-bulk');
// const console = new winston.transports.Console();
// winston.add(console);
winston.add(new Loggly({
  token: "537dd1ba-0fab-4bc4-b233-c6fd66356332",
  subdomain: "gatherai",
  tags: ["Winston-NodeJS"],
  json: true
}));

var _log = (message, context, level='info') => {
  if (winston) winston.log(level, JSON.stringify(message));
  if (context) { return context.log(JSON.stringify(message)) }
  console.log(JSON.stringify(message));
}

export class processJsonWithMappings {
  constructor() {}
  
  async go (targetMission = process.argv[2], targetWarehouse = process.argv[3], callback = null, client = new Client()) {
    client.connect();
    _log(['MASTER :::', targetMission, 'DBHOST:', process.env.PGHOST], null);
    if (!targetMission) throw ('TARGET MISSION REQUIRED');

    // Read file
    const currentMission = fs.readFileSync(targetMission, 'utf8');
    const currentWarehouse = fs.readFileSync(targetWarehouse, 'utf8');
    // Create Object from file
    const root = JSON.parse(currentMission);
    const warehouseRoot = JSON.parse(currentWarehouse);

    let insertPromises = [];
    // Constants? Setting as variables so we can override if needed as we go
    // TODO: Make this come from DB instead of initial commit?f
    let userId = 1;
    let warehouseId = 1;
    let missionId = 1;
    let binResults = [];
    let mbResults = [];
    let productResults = [];
    let productsNameMap = [];
    let galleriesResults = [];
    let structureResults = [];

    await client.query('BEGIN');

    // 1. Warehouse (depends on: userId)
    const warehouse = new Warehouse(root, warehouseRoot).process(userId);
    return client.query(new SqlInsertGenerator("warehouse", warehouse)).then(res => {
      warehouseId = res.rows[0].id;
      // 2. Mission (depends on: userId, warehouseId, targetMission)
      const mission = new Mission(root).process(userId, warehouseId, targetMission);
      return client.query(new SqlInsertGenerator("mission", mission))
    }).then(res => {
      // Store inserted row in global
      missionId = res.rows[0].id;
      
      // 3. Product (depends on: userId, warehouseId)
      // TODO: check existing products before inserting these.... maybe return DB ids, and compare in a hash before insert?
      const products = new Product(root).process(userId, warehouseId);
      let productInserts = products.map((product) => {
        return client.query(new SqlInsertGenerator("product", product));
      });
      
      // Satisfy all product inserts
      return Promise.all(productInserts);
    }).then(results => {
      // Reduce to get row results, and store in global var
      productResults = results.map(value => {
        return value.rows[0];
      });

      // 4. Structure (depends on: userId, warehouseId)
      const structures = new Structure(root).process(userId, warehouseId);
      let structureInserts = structures.map(structure => {
        return client.query(new SqlInsertGenerator("structure", structure));
      });
      
      return Promise.all(structureInserts);
    }).then(results => {
      // Reduce to get row results
      structureResults = results.map(value => {
        return value.rows[0];
      });
      
      // Update structures with appropriate parentId (now that all strcutures were INSERTED above)
      const structures = new Structure(root).updateParentId(userId, warehouseId, structureResults);
      return client.query(new BatchSqlUpdateGenerator("structure", structures)['text']);
    }).then(results => {
      // 5. Bin (depends on: userId, structures)
      const bins = new Bin(root).process(userId, structureResults);
      let binInserts = bins.map((bin) => {
        return client.query(new SqlInsertGenerator("bin", bin))
      });

      return Promise.all(binInserts);
    }).then(results => {
      // Reduce to get row results
      binResults = results.map(value => {
        return value.rows[0];
      });

      // 6. Mission_Bin (depends on: userId, missionId, bins)
      const mbins = new MissionBin(root).process(userId, missionId, binResults);
      let mbinInserts = [];
      Object.keys(mbins).forEach(key => {
        mbinInserts.push( client.query(new SqlInsertGenerator("mission_bin", mbins[key])) );
      });

      return Promise.all(mbinInserts);
    }).then(results => {
      // Reduce to get row results
      mbResults = results.map(value => {
        return value.rows[0];
      });

      // 7. Inventory_Gallery (depends on: userId)
      const inventoryGalleries = new InventoryGallery(root).process(userId);
      let igInserts = [];
      Object.keys(inventoryGalleries).forEach(key => {
        igInserts.push( client.query(new SqlInsertGenerator("inventory_gallery", inventoryGalleries[key])) );
      });

      return Promise.all(igInserts);
    }).then(results => {
      // Reduce to get row results
      galleriesResults = results.map(value => {
        return value.rows[0];
      });

      // 8. Inventory_items (depends on: userId, targetMission, product, galleries, bins, missionbins)
      const inventoryItems = new InventoryItem(root).process(userId, missionId, productResults, galleriesResults, binResults, mbResults);
      let iiInserts = [];
      Object.keys(inventoryItems).forEach(key => {
        iiInserts.push( client.query(new SqlInsertGenerator("inventory_item", inventoryItems[key])) );
      });

      return Promise.all(iiInserts);
    }).then(results => {
      _log([`----- ALL JSON -> SQL COMPLETE! Data is LIVE on dbhost: ${process.env.PGHOST} -----`], null);

      // Execute logging callback - if not in test folder
      if (callback && process.env.AZURE_CONTAINER !== "test") {
        return callback().then(response => {
          if (response && response.ts) {
            return response.ts;
          }
        });
      }
      
      return client.query('COMMIT');
    }).then(res => {
      return client.end();
    });
  }

  // Optional query helper, so we can switch logging on/off
  // TODO: Implement this
  executeQuery = function(query, debug = false) {
    if (debug) {
      console.log(query);
    }
  }
}