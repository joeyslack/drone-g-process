export enum RowStatus {
  Created = 1,
  Modified = 2,
  Deleted = 3
}

export enum Side {
  left = 1,
  right = 2,
  unknown = 0,
}

export enum StructureTypes {
  aisle = 1,
  rack = 2,
  bin = -1,
  unknown = 0
}

export enum MissionStatus {
  Scheduled = 1, 
  InFlight = 2, 
  OnHold = 3, 
  Completed = 4, 
  Aborted = 5, 
  Failed = 6
}

export enum SetupUser {
  Admin = 1
}

export enum MemberType {
  Admin = 1,
  Manager = 2,
  Member = 3
}