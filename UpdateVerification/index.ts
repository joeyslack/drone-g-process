import {
  AzureFunction,
  Context,
  HttpRequest
} from "@azure/functions"
import { downloadFolder, downloadFile, getBlob, getBlobByPath, uploadFile } from '../storage';

const { Pool, Client } = require('pg');

const inventoryItemMapping = (inventoryItemName) => {
  const mappings = {
    "licensePlateNumber": "LPN",
    "box": "Box",
    "empty": "Empty"
  }

  return mappings.hasOwnProperty(inventoryItemName) ? mappings[inventoryItemName] : inventoryItemName;
} 

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise < void > {
  context.log('HTTP trigger function processed a request.');
  const name = (req.query.name || (req.body && req.body.name));
  const params = req.query || req.body;

  if (name) {
    //const change = req.query.change || (req.body && req.body.change);
    //const mission = req.query.mission;
    // console.log('UpdateVerification');
    // 1. Get exising mission_report
    const report: string = await getBlobByPath(`${params.mission}/mission_report.json`, params.container);
    let r = await JSON.parse(report);
    let changeCount = 0;

    if (r) {
      // 2. Iterate through update request
      let hash = {};

      //console.log(JSON.stringify(params.items), '--PITEMS-');
      let pitems = JSON.parse(params.items);
      if (!Array.isArray(pitems)) pitems = [pitems];
      pitems.forEach(e => {
        // Make sure it's actualy a useful item, with properties that we need
        // console.log('==GOOD====', e, '=good=');
        console.log(e, '--hash--');
        if (e.hasOwnProperty("productCode") && e.hasOwnProperty("binCode") && e.hasOwnProperty("productName")) {
          // hash[e.productCode + '_' + e.binCode + '_' + e.productName] = {...e, code: e.productCode, clientLocationName: e.binCode, inventoryItemType: e.productName };
          hash[e.productCode + '_' + e.binCode + '_' + e.productName] = {...e};
          console.log(e.productCode + '_' + e.binCode + '_' + e.productName, '=KEY=');
        }
        else {
          console.log(e, '=====FAILURE=');
        }
      });

      console.log(hash, '--hash--1');

      // 3. Replace items with newly updated
      r.items  = r.items.map((e) => {
        console.log(e.code + '_' + e.clientLocationName + '_' + inventoryItemMapping(e.inventoryItemType), '--miss--');
        if (e && hash[e.code + '_' + e.clientLocationName + '_' + inventoryItemMapping(e.inventoryItemType)]) {
          console.log('FOUND HASH:', hash[e.code + '_' + e.clientLocationName + '_' + inventoryItemMapping(e.inventoryItemType)], '--FOUNDHASH--');
          changeCount++;
          return {...e, ...hash[e.code + '_' + e.clientLocationName + '_' + inventoryItemMapping(e.inventoryItemType)] };
        }

        return e;
      });

      // 4. Upload to bucket, if we have a change
      if (changeCount > 0) {
        const v = await JSON.stringify(r);
        const result = await uploadFile(v, `${params.mission}/mission_report.json`, params.container);
        console.log('uploaded!!', result, '--result-');
      }
      else {
        // console.log('NOTHING CHANGED ' );
      }

      // Update DB. 
      // Update 2.0 -- DONT DO THIS. We should have updated the DB BEFORE doing this sync.... 
      // It's way too late to do it here, since the local db hasn't refreshed yet, dont rely on sync to show data.
      
      //  $sql = `UPDATE "inventory_item" SET `
      // const client = new Client();
      // client.connect();

      // client.query(`UPDATE "inventory_item" SET "verifiedRecord" = true, "verificationSource" = 'webUser', "verificationDate" = NOW()`, (one, two) => {
      //   console.log(one, two, pitems[0], '-itmes---');
      // });
    }

    context.res = {
      // status: 200, /* Defaults to 200 */
      // body: "File uploaded + " + `${params.mission}/mission_report.json`
      body: "Files uploaded: " + changeCount + " uploaded + " + "test/mission_report.json"
    };  
  } else {
    context.res = {
      status: 400,
      body: "Please pass a name on the query string or in the request body"
    };
  }
};

export default httpTrigger;