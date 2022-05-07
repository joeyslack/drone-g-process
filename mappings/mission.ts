// Database Mission Model
interface MissionModel {
  name: string,
  date: Date,
  directory: string,
  completedOn: Date,
  clientReference: string,
  createdById: number,
  warehouseId: number,
  createdOn: Date
}

// Expects root json object
export class Mission {
  constructor(private root: any) { }
  
  // Depends on: userId, targetMission, warehouseId
  // @returns Single result. 1 Mission per report
  process(userId: number = 1, warehouseId: number, targetMission: string): MissionModel {
    return {
      name: this.root.name,
      date: this.root.endTimestamp,
      directory: this.root.directoryName,
      completedOn: this.root.endTimestamp,
      clientReference: this.root.id || targetMission.split('/')[targetMission.split('/').length-2],
      createdById: userId,
      warehouseId: warehouseId,
      createdOn: new Date()
    };
  }
}