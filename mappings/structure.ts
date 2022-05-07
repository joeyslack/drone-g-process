import { Side, StructureTypes } from '../models/constants';
// Database Structure Model
interface StructureModel {
  strutureType:       number;
  code:               string;
  title:              string;
  level:              string;
  side:               number;
  position:           number;
  parentStructureId?: number;
  createdById:        number;
  warehouseId:        number;
  createdOn:          Date;
}

// Expects root json object
export class Structure {
  constructor(private root: any) { }
  
  // Depends on: userId, warehouseId
  // @returns StructureModel[]
  process(userId: number = 1, warehouseId: number): StructureModel[] {
    let results = [];
    let structures = [];
    
    // 1. Find structures with logic
    this.root.warehouseLayout.locations.forEach(item => {
      // Not a bin
      if (item.hierarchyLevel < 2 && item.locationType != "bin") {
        structures.push(item);
      }
    });

    // 2. Map data to StructureModel
    structures.forEach(s => {
      results.push({
        structureType: StructureTypes[s.locationType],
        code: s.id,
        title: s.name,
        level: s.hierarchyLevel + 1,
        side: Side[s.side],
        position: s.position,
        // parentStructureId: s.parentId || null,
        createdById: userId,
        warehouseId: warehouseId,
        createdOn: new Date()
      })
    });

    return results;
  }

  // Specialized processor for udpating Parent Id. Assumes 'process' already ran
  // Injects results from `process` and other basic deps.
  // Updates the parentId relations, since circular reltions would break otherwise if not existing yet
  updateParentId(userId: number = 1, warehouseId: number, insertedStructures: any) {
    let results = [];
    let structures = [];    
    let codeHash = {};

    insertedStructures.forEach(element => {
      codeHash[element.code] = element;
    });

    this.root.warehouseLayout.locations.forEach(item => {
      // Not a bin
      if (item.hierarchyLevel < 2 && item.locationType != "bin" && item.parentId) {
        // let p = hashmap[item.parentId];
        results.push({id: codeHash[item.id].id, parentStructureId: codeHash[item.parentId].id});
      }
    });

    return results;
  }
}