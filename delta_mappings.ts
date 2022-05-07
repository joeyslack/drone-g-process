// Global env vars. PG env vars allow client.connect
require('dotenv').config();
const fs = require('fs');

// Connect to sql-staging
const { Pool, Client } = require('pg');
const client = new Client();

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

export class processJsonWithMappingsDelta {
  constructor() {}
  
  async go (targetMission = process.argv[2], callback = null, client = new Client()) {
    client.connect();
    _log(['DELTA. TARGET MISSION:::', targetMission, 'DBHOST:', process.env.PGHOST], null);
    if (!targetMission) throw ('TARGET MISSION REQUIRED');
    
    // Read file
    const currentMission = fs.readFileSync(targetMission, 'utf8');
    // Create Object from file
    const root = JSON.parse(currentMission);

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

    // 1. Warehouse (depends on: userId)
    const warehouse = new Warehouse(root).process(userId);
    return client.query('SELECT * FROM "warehouse"').then(res => {
      warehouseId = res.rows[0].id;
      // 2. Mission (depends on: userId, warehouseId, targetMission)
      const mission = new Mission(root).process(userId, warehouseId, targetMission);
      return client.query(new SqlInsertGenerator("mission", mission))
    }).then(res => {
      // Store inserted row in global
      missionId = res.rows[0].id;
      return client.query('SELECT * FROM "product" WHERE "warehouseId" = ' + warehouseId);
    }).then(res => {
      // 3. Product (depends on: userId, warehouseId)
      const products = new Product(root).process(userId, warehouseId, res.rows);
      let productInserts = products.map((product) => {
        return client.query(new SqlInsertGenerator("product", product));
      });
      
      // Satisfy all product inserts
      return Promise.all(productInserts);
    }).then(results => {
      // Reduce to get row results, and store in global var
      return client.query('SELECT * FROM "product" WHERE "warehouseId" = ' + warehouseId);
    }).then(results => {
      productResults = results.rows;

      // 4. Structure (depends on: userId, warehouseId)
      /*const structures = new Structure(root).process(userId, warehouseId);
      let structureInserts = structures.map(structure => {
        return client.query(new SqlInsertGenerator("structure", structure));
      });*/
      
      return client.query('SELECT * FROM "structure" WHERE "warehouseId" = ' + warehouseId)
    }).then(res => {
      structureResults = res.rows;
      return client.query('SELECT * FROM "bin"')
    }).then(results => {
      binResults = results.rows;

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

      return client.end();
    });
  } // constructor
}