import { Side, StructureTypes } from '../models/constants';
// Database InventoryGallery Model
interface InventoryGalleryModel {
  inventoryItemId: number,
  imagePath: string,
  thumbnailPath: string,
  captureTime: Date,
  fileName: string,
  createdById: number,
  createdOn: Date
}

// Expects root json object
export class InventoryGallery {
  constructor(private root: any) { }
  
  // Depends on: userId
  // @returns InventoryGallery[]
  process(userId: number): {} {
    let results = [];
    let gallery = {};
    let missionItemsKey = 'items';

    this.root[missionItemsKey].forEach(item => {
      if ((item.hasOwnProperty('code') && item.code.length > 0) || (item.inventoryItemType && (item.inventoryItemType === "empty" || item.inventoryItemType === "unknown"))) {
        gallery[item.imageFilename] = {
          inventoryItemId: 0,
          imagePath: 'https://gatheraisync.blob.core.windows.net/' +  (process.env.AZURE_CONTAINER || 'test') + '/' + item.imageFilename,
          thumbnailPath: 'https://gatheraisync.blob.core.windows.net/' + (process.env.AZURE_CONTAINER || 'test') + '/' + this.thumbnailPath(item.imageFilename),
          captureTime: item.verificationDate || this.root.endTimestamp,
          fileName: item.imageFilename,
          createdById: userId,
          createdOn: new Date()
        }  
      }
    });

    return gallery;
  }

  thumbnailPath(path) {
    return path;
    // return path.replace('.jpg', '_small.jpg');
  }
}

