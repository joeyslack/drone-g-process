import { Side, StructureTypes } from '../models/constants';
// Database MissionBin Model
interface MissionBinModel {
  isSelected?: boolean,
  isScanned: boolean,
  isChanged: boolean,
  hasError: boolean,
  notes?: string,
  scannedOn: Date,
  binId: number,
  missionId: number,
  createdById: number,
  createdOn: Date
}

// Expects root json object
export class MissionBin {
  constructor(private root: any) { }
  
  // Depends on: userId, missionId, binResults
  // @returns BinModel[]
  process(userId: number, missionId: number, bins: any[]): {} {
    let results = [];
    let mbins = {};

    // 1. Iterate on each bin from injected query result
    bins.forEach(bin => {
      // Assign bin to bin.code keyed hashmap, so it can be looked up later with locationId
      mbins[bin.code] = {
        isSelected: false,
        isScanned: false,
        isChanged: false,
        hasError: false,
        notes: '',
        scannedOn: this.root.endTimestamp,
        binId: bin.id,
        missionId: missionId,
        createdById: userId,
        createdOn: new Date()
      };
    });
    
    // Iterate on scannedLocations, update mbin based on locationId
    this.root.scannedLocations.forEach(sl => {
      if (mbins[sl.locationId]) {
        mbins[sl.locationId].isScanned = true;
        mbins[sl.locationId].isChanged = sl.locationChanged; // Currently hard coded in ios export 
        mbins[sl.locationId].hasError = sl.hasError; // Currently hard coded in ios export
      }
    });

    return mbins;
  }
}