// Database Product Model
interface ProductModel {
  name:           string;
  code:           string;
  sku:            string;
  upc:            string;
  itemsPerPallet?: number;
  createdById:    number; 
  warehouseId:    number;
  createdOn:      Date;
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
export class Product {
  constructor(private root: any) { }
  
  // Depends on: userId, warehouseId
  // @returns ProductModel[]
  process(userId: number = 1, warehouseId: number, existingProducts = []): any {
    let results = [];
    let scannedProducts = {};
    let raw = {};
    let existingProductsDict = {};
    

    // Do we already have the right products?
    if (existingProducts && existingProducts.length > 0) {
      existingProducts.forEach(p => {
        let key = p.code + ' (' + p.name + ')';
        // Special handling for "empty"...
        if (!p.code && (p.inventoryItemType.toLowerCase() === "empty" || p.inventoryItemType.toLowerCase() === "unknown")) {
          key = p.inventoryItemType;
        }

        existingProductsDict[key] = p;
      });
    }

    // Expects schema v0.1 or greater. v0.2 is only supported officially.
    if (!this.root.items) throw (`OLD SCHEMA DETECTED: ${this.root.apiVersion} ABORTING`);
    
    let resultsHash = {};
    // Turn real products into modeled results
    this.root.items.forEach(p => {
      let name = inventoryItemMapping(p.inventoryItemType);
      let key = p.code + ' (' + name + ')';
      
      // Special handling for "empty"
      if (!p.code && (p.inventoryItemType.toLowerCase() === "empty" || p.inventoryItemType.toLowerCase() === "unknown")) {
        key = p.inventoryItemType;
      }
      
      // Only add product if it's not already in DB
      // Note: Special handling for "empty"
      if ((!existingProducts || !existingProductsDict[key]) && (p.code || (!p.code && (p.inventoryItemType.toLowerCase() === "empty" || p.inventoryItemType.toLowerCase() === "unknown")))) {
        resultsHash[key] = {
          name: name,
          code: p.code ? p.code : p.inventoryItemType,
          sku: p.sku ? p.sku : p.code,
          upc: p.upc ? p.upc : p.code,
          itemsPerPallet: p.productInfo && p.quantityPerCase ? p.productInfo.quantityPerCase : 1,
          createdById: userId,
          warehouseId: warehouseId,
          createdOn: p.verificationDate
        };

        console.log('NEW PRODUCT DETECTED: ', p.code + ' (' + p.inventoryItemType + ')');
      }
    });

    for (let key in resultsHash) {
      results.push(resultsHash[key]);
    }

    return results;
  }

  // Special renaming helper for inventoryItemType name remapping
  fixName = (name) => {
    if (name === "licensePlateNumber") {
      return "LPN";
    }
    return name;
  }
}