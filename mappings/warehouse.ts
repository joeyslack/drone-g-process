import { exitCode } from "process";

// Database Warehouse Model
interface WarehouseModel {
  code:        number;
  name:        string;
  address:     string;
  directory:   string;
  createdById: number;
  createdOn:   Date;
}

// Expects root json object
export class Warehouse {
  constructor(
    private root: any,
    private warehouse: any
  ) {}
  
  // Depends on valid userId, should be passed when processed, or defaults to 1
  // @returns Single result. 1 Warehouse per 1 Mission
  process(userId: number = 1): WarehouseModel {
    this.warehouse.locations.forEach(e => {
      // Handle root warehouse only
      if (e.hierarchyLevel && e.hierarchyLevel === 0) {
        return {
          code: e.id,
          name: e.name,
          address: e.name,
          directory: this.root.userId.replace(/_/g,'-'),
          createdById: userId,
          createdOn: new Date()
        }
      }
    });

    return;
  }
}