import { Side, StructureTypes } from '../models/constants';
// Database Bin Model
interface BinModel {
  name:           string;
  code:           string;
  position:       number;
  side:           number;
  clientLocation: string;
  structureId:    number;
  createdOn:      Date;
}

// Expects root json object
export class Bin {
  constructor(private root: any) { }

  // Depends on: userId
  // @returns BinModel[]
  process(userId: number = 1, structures): BinModel[] {
    let results = [];
    let bins = [];
    let hash = {};

    structures.forEach(s => {
      hash[s.code] = s;
    });
    
    // 1. Find structures with logic
    this.root.warehouseLayout.locations.forEach(item => {
      // Not a bin
      if (item.hierarchyLevel >= 2 && item.locationType === "bin") {
        bins.push(item);
      }
    });

    // 2. Map data to BinModel
    bins.forEach(b => {
      results.push({
        name: b.name,
        code: b.id,
        position: b.position,
        side: Side[b.side],
        clientLocation: b.clientName,
        structureId: hash[b.parentId].id,
        createdOn: new Date()
      })
    });

    return results;
  }

  // Pretify the location
  private prettyLocation(clientName: string) {
    // Only transform if not already "dashified"
    if (clientName.indexOf('-') === -1) {
      return (clientName && clientName.length) >= 6 ? clientName.match(/.{1,2}/g).join('-') : clientName;
    }
    
    return location;
  }
}