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


const inventoryItemMapping = (inventoryItemName) => {
  const mappings = {
    "licensePlateNumber": "LPN",
    "box": "Box",
    "empty": "Empty"
  }

  return mappings.hasOwnProperty(inventoryItemName) ? mappings[inventoryItemName] : inventoryItemName;
} 


export class UpdateVerification {
  constructor() {}
  
  async go (myBlob, context, missionRow, client = new Client()) {
    client.connect();
    let inventoryHash = {};

    const root = await JSON.parse(myBlob);
    root['items'].forEach(i => {
      inventoryHash[inventoryItemMapping(i.inventoryItemType) + '_' + i.code + '_' + (i.clientLocationName ? i.clientLocationName : '')] = {...i}
    });

    console.log(inventoryHash, '--ihash-');
    let insertPromises = [];
    
    return client.query(`SELECT * FROM "mission_inventory" WHERE "missionId" = '${missionRow.id}'`, (err, res) => {
      // console.log('query?', missionRow, res.rows, '----test--');
      if (res && res.rows && res.rows.length > 0) {
        res.rows.forEach(r => {
          //inventoryHash[r.productName + '_' + r.productCode + '_' + r.binId] = {...r}
          if (inventoryHash[r.productName + '_' + r.productCode + '_' + (r.binCode ? r.binCode : '')]) {
            // console.log('MMM', r, '--match--');
            const updated = inventoryHash[r.productName + '_' + r.productCode + '_' + (r.binCode ? r.binCode : '')];
            insertPromises.push(client.query(`UPDATE "inventory_item" SET "verifiedRecord" = '${updated.verifiedRecord}', "verificationSource" = '${updated.verificationSource}', "verificationDate" = '${updated.verificationDate}' WHERE id = '${r.inventoryId}'`));
          }
        });

        return Promise.all(insertPromises);
        // console.log(inventoryHash, '--inventoryHash--');
      }
    });
  }

}