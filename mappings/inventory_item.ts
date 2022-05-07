import { Side, StructureTypes } from '../models/constants';
import { symlink } from 'fs';
// Database InventoryItem Model
interface InventoryItemModel {
  code: string,
  barCodeText: string,
  productId: number,
  missionBinId: number,
  inventoryGalleryId: number,
  createdById: number,
  createdOn: Date
}

const inventoryItemMapping = (inventoryItemName) => {
  const mappings = {
    "licensePlateNumber": "LPN",
    "box": "Box",
    "empty": "Empty"
  }

  return mappings.hasOwnProperty(inventoryItemName) ? mappings[inventoryItemName] : inventoryItemName;
} 

// Expects root json object
export class InventoryItem {
  constructor(private root: any) { }
  
  // Depends on: userId, targetMission, products, galleries, bins, mbins
  // @returns InventoryItem[]
  process(userId: number, missionId: number, productResults: any[], galleries: any[], bins: any[], mbins: any[]): {} {
    let results = [];
    let gallery = {};
    let productsHash = {};
    let binHash = {};
    let mbinHash = {};
    let gHash = {};

    // JSON Version stuff...
    // let missionItemsKey = this.root.hasOwnProperty('gtMissionItems') ? 'gtMissionItems' : 'scannedItems';
    let missionItemsKey = 'items';

    productResults.forEach(p => {
      productsHash[p.code + ' (' + inventoryItemMapping(p.name) + ')'] = p;
    });

    bins.forEach(b => {
      binHash[b.code] = b;
    });

    mbins.forEach(mb => {
      mbinHash[missionId + '_' + mb.binId] = mb;
    });

    galleries.forEach(g => {
      gHash[g.fileName] = g;
    });

    this.root[missionItemsKey].forEach(item => {
      // Special handling for "empty"
      if (!item.code && (item.inventoryItemType.toLowerCase() === "empty" || item.inventoryItemType.toLowerCase() === "unknown")) {
        item.code = item.inventoryItemType;
        item.productInfo.quantityPerCase = 0;
      }
      
      let key = item.code + ' (' + inventoryItemMapping(item.inventoryItemType) + ')';
      // Valid item, and must NOT be wmsOnly
      if (productsHash[key] && gHash[item.imageFilename] && (item.recordType !== "wmsOnly")) {   
        let bin = binHash[item.locationId];      
        let product = productsHash[key];

        if (bin && bin.id && mbinHash[missionId + '_' + bin.id]) {
          results.push({
            code: inventoryItemMapping(item.inventoryItemType),
            barCodeText: inventoryItemMapping(item.inventoryItemType),
            productId: product && product.id ? product.id : null,
            missionBinId: mbinHash[missionId + '_' + bin.id].id,
            inventoryGalleryId: gHash[item.imageFilename].id,
            createdById: userId,
            createdOn: item.verificationDate || new Date(),
            condition: item.productInfo?.condition ? item.productInfo.condition : "",
            quantity: item.productInfo?.quantityPerCase ? item.productInfo.quantityPerCase : 1,
            correctness: item.correctness && item.correctness === true,
            verificationDate: item.verificationDate,
            verifiedRecord: item.verifiedRecord || false,
            verificationSource: item.verificationSource || null,
            uuid: item.inventoryItemId ? item.inventoryItemId: null
          });
        }
      }
      else if (item.recordType !== "wmsOnly" && item.code) {
        console.error('NO PRODUCT FOUND FOR ITEM: ', item, key, '$$$$$$$$$$$$$$$$', productsHash[key], '()()()()', gHash[item.imageFilename], item.imageFilename);
      }
    });
    
    console.log('INVENTORY ITEMS ADDED: ', results.length);
    return results;
  }
}