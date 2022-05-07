import { AzureFunction, Context } from "@azure/functions"
import { downloadFolder, downloadFile, getBlob } from '../storage';
import { processJsonWithMappingsDelta } from '../delta_mappings';
import { processJsonWithMappings } from '../do_mappings';
import { UpdateVerification } from '../verification';
import { ClientFromContainername } from '../ClientFromContainername';

const fs = require('fs')
var path = require('path');
var winston = require('winston');
var { Loggly } = require('winston-loggly-bulk');
// const console = new winston.transports.Console();
// winston.add(console);
winston.add(new Loggly({
  token: "537dd1ba-0fab-4bc4-b233-c6fd66356332",
  subdomain: "gatherai",
  tags: ["Winston-NodeJS"],
  json: true
}));

// const filePath = __dirname + `/process_current/${process.env.TARGET_MISSION || process.argv[2]}/mission_report.json`;
const { Pool, Client } = require('pg');
const master = new processJsonWithMappings;
const delta = new processJsonWithMappingsDelta;
let processor = delta;
let thread = null;

const blobTrigger: AzureFunction = async function (context: Context, myBlob: any): Promise<void> {
  console.log('CLIENT FROM CONTAINERNAME:::', context.bindingData.containername, context.bindingData);
  let client = new Client();
  if (context.bindingData.containername) {
    client = ClientFromContainername(context.bindingData.containername);
  }
 
  client.connect();

  // Verification changes? Mission directory has already been processed?
  client.query(`SELECT id FROM "mission" WHERE directory = '${context.bindingData.blobname}' LIMIT 1`, function(err, res) {
    // console.log(res, "--result");
    if (err) console.log(err, '---ERROR');
    
    // 1. Has this mission already been processed at least once? Is it in the database?
    if (res && res.rows && res.rows.length > 0) {
      console.log('verification');
      console.log(context.bindingData.metadata, '---metadata?');

      // 2. Does file have metadata set?
      // Does file have metadata? Last updated by app
      if (context.bindingData.metadata && context.bindingData.metadata.hasOwnProperty('modificationsource') && context.bindingData.metadata.modificationsource.startsWith('app')) {
        // const missionReport = JSON.parse(myBlob);
        const updateVertification = new UpdateVerification;
        return updateVertification.go(myBlob, context, res.rows[0]).then(a => {
          // console.log(a, 'upodateVerificationCallback');
          return context.done();
        });
      }

      // Finish event loop, we are done   
      return context.done();
    }
  });

  // Master run or delta?
  client.query('SELECT * FROM "warehouse" LIMIT 1', function(err, res) {
    if (!res || !res.rows || res.rows.length === 0) {   
      processor = master;
    }
  });

  // // context.log("Blob trigger function processed blob \n Name:", context.bindingData.blobname, "\n Blob Size:", myBlob.length, "Bytes");
  // _log(["Blob trigger function processed blob \n Name:", context.bindingData.blobname, "\n Blob Size:", myBlob.length, "Bytes"], context);
  // // Download file
  // const filePath = __dirname + `/process_current/${context.bindingData.blobTrigger}`;
  // await downloadFile(context.bindingData.blobname + '/mission_report.json', filePath);
  // _log([`File downloaded: ${filePath}`], context);
  // // Run processor
  // const payload = JSON.stringify({ text: "`Azure Blob Trigger`: File downloaded: " + context.bindingData.blobTrigger, ...(thread ? {"thread_ts": thread} : {}) });
  // return processor.go(filePath).then(res => {
  //    _log([`File downloaded: ${'./process_current/' + context.bindingData.blobTrigger}`], context);
  //   fetch('https://hooks.slack.com/services/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', { 
  //     method: 'POST',
  //     headers: { 'Content-type': 'application/json' },
  //     body: payload
  //   }).then(res => {
  //     // if (res && res.ts) {
  //     //   thread = res.ts;
  //     //   console.log('thread!!', thread); 
  //     // }
  //     return true;
  //   });
  // });
  
  // Maybe delete/cleanup folders after comlete?
  // TODO: Should we store a record of already completed files? Check on this...
  // ...
  // return;
};

var _log = (message, context, level='info') => {
  if (winston) winston.log(level, JSON.stringify(message));
  if (context) { return context.log(JSON.stringify(message)) }
  console.log(JSON.stringify(message));
}

export default blobTrigger;
