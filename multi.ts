require('dotenv').config();
import { processJsonWithMappingsDelta } from './delta_mappings';
import { processJsonWithMappings } from './do_mappings';
const fs = require('fs')

export class TestMappings {
  
  master: processJsonWithMappings;
  delta: processJsonWithMappingsDelta;
 
  constructor() {
    this.master = new processJsonWithMappings;
    this.delta = new processJsonWithMappingsDelta;
   }

  async execute() {
    const path = __dirname + `/process_current/${process.env.AZURE_CONTAINER}/`;
    const dir = fs.opendirSync(path);
    let dirent;
    let i = 0;
    
    let reports = [];
    while ((dirent = await dir.readSync()) !== null) {
      // folders only
      if (dirent.name !== ".DS_Store") {
        let filePath = `${path + dirent.name}/mission_report.json`;
        
        if (i === 0) { 
          reports.push( () => this.master.go(filePath) );
        } 
        else { 
          reports.push( () => this.delta.go(filePath) );
        }
        
        i++;
      }      
    }

    var result = Promise.resolve();
    reports.forEach(task => {
      result = result.then(() => task());
    });
    
    return result;
  }
}

// Allow this class to be self-executing for direct execution
const test = new TestMappings;
test.execute();