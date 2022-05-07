require('dotenv').config();
import { processJsonWithMappingsDelta } from './delta_mappings';
import { processJsonWithMappings } from './do_mappings';
var path = require('path');
const filePath = __dirname + `/process_current/${process.env.TARGET_MISSION || process.argv[2]}/mission_report.json`;
const { Pool, Client } = require('pg');

// client.query('SELECT * FROM "warehouse"', (err, res) => {
//   console.log('one', res);
//   if (res && res.rows && res.rows[0]) {
//     new processJsonWithMappingsDelta(filePath);
//   }
//   else {
//     console.log('two', res);
//     new processJsonWithMappings(filePath);
//   }

//   client.end();
// });

// new processJsonWithMappings(filePath);
// client.end();

// export {};


export class TestMappings {
  master: processJsonWithMappings;
  delta: processJsonWithMappingsDelta;
  constructor() {
    this.master = new processJsonWithMappings;
    this.delta = new processJsonWithMappingsDelta;
   }

  async execute() {
    const client = new Client();
    client.connect(); 

    const res = await client.query('SELECT * FROM "warehouse"');
    if (res && res.rows && res.rows[0]) { 
      console.log('--Delta--');
      await this.delta.go(filePath); 
    } else { 
      console.log('--MASTER--');
      await this.master.go(filePath); 
    }

    return client.end();
  }
}

// Self executing so we can call this file directly.
const test = new TestMappings;
test.execute();