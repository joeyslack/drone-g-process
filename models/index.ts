export interface MissionReport {
    droneId:                            string;
    finalDroneBatteryLevel:             number;
    deviceId:                           string;
    startTimestamp:                     Date;
    directoryName:                      string;
    warehouseId:                        string;
    initialDroneBatteryLevel:           number;
    images:                             Image[];
    warehouseLayout:                    WarehouseLayout;
    name:                               string;
    droneModel:                         string;
    id:                                 string;
    finalHostBatteryLevel:              number;
    apiVersion:                         string;
    endTimestamp:                       Date;
    scannedLocations:                   ScannedLocation[];
    initialHostBatteryLevel:            number;
    finalRadioControllerBatteryLevel:   number;
    scannedItems:                       ScannedItem[];
    initialRadioControllerBatteryLevel: number;
    userId:                             string;
}

export interface Image {
    detections: Detection[];
    filename:   Filename;
    timestamp:  Date;
    width:      number;
    height:     number;
    rois:       Rois[];
}

export interface Detection {
    points:     Array<number[]>;
    id:         string;
    className:  ClassName;
    confidence: number;
    code?:      string;
}

export enum ClassName {
    Barcode = "barcode",
    Box = "box",
}

export enum Filename {
    The20200226T0125520500HResDJI0014Jpg0000Jpg = "20200226T012552-0500/HRes_DJI_0014.jpg_0000.jpg",
    The20200226T0125520500HResDJI0015Jpg0001Jpg = "20200226T012552-0500/HRes_DJI_0015.jpg_0001.jpg",
    The20200226T0125520500HResDJI0016Jpg0002Jpg = "20200226T012552-0500/HRes_DJI_0016.jpg_0002.jpg",
    The20200226T0125520500HResDJI0017Jpg0003Jpg = "20200226T012552-0500/HRes_DJI_0017.jpg_0003.jpg",
    The20200226T0125520500HResDJI0018Jpg0004Jpg = "20200226T012552-0500/HRes_DJI_0018.jpg_0004.jpg",
    The20200226T0125520500HResDJI0019Jpg0005Jpg = "20200226T012552-0500/HRes_DJI_0019.jpg_0005.jpg",
    The20200226T0125520500HResDJI0020Jpg0006Jpg = "20200226T012552-0500/HRes_DJI_0020.jpg_0006.jpg",
    The20200226T0125520500HResDJI0021Jpg0007Jpg = "20200226T012552-0500/HRes_DJI_0021.jpg_0007.jpg",
}

export interface Rois {
    points:     Array<number[]>;
    locationId: LocationID;
    isMiniRoi:  boolean;
}

export enum LocationID {
    B570C9D9 = "b570c9d9",
    Cd7C71E8 = "cd7c71e8",
    D1C69B8B = "d1c69b8b",
    The4Aadbbd0 = "4aadbbd0",
    The4Ee26F9F = "4ee26f9f",
    The56774Cbd = "56774cbd",
    The6635D5Ce = "6635d5ce",
    The7Deb0677 = "7deb0677",
}

export interface ScannedItem {
    inventoryItemType:  InventoryItemType;
    clientLocationName: ClientLocationName;
    detectionId:        string;
    imageFilename:      Filename;
    locationId:         LocationID;
    code?:              string;
}

export enum ClientLocationName {
    Dx69A1 = "DX-69-A1",
    Dx69A3 = "DX-69-A3",
    Dx69B1 = "DX-69-B1",
    Dx69B3 = "DX-69-B3",
    Dx69D1 = "DX-69-D1",
    Dx69D3 = "DX-69-D3",
    Dx69F1 = "DX-69-F1",
    Dx69F3 = "DX-69-F3",
}

export enum InventoryItemType {
    Box = "box",
    LicensePlateNumber = "licensePlateNumber",
}

export interface ScannedLocation {
    isEmpty:         boolean;
    locationChanged: boolean;
    hasError:        boolean;
    locationId:      LocationID;
}

export interface WarehouseLayout {
    id:        string;
    name:      string;
    locations: Location[];
}

export interface Location {
    position:       number;
    id:             string;
    locationType:   LocationType;
    clientName:     string;
    hierarchyLevel: number;
    side:           Side;
    name:           string;
    parentId?:      string;
}

export enum LocationType {
    Aisle = "aisle",
    Bin = "bin",
    Rack = "rack",
}

export enum Side {
    Left = "left",
    Right = "right",
}

// Converts JSON strings to/from your types
// and asserts the results of JSON.parse at runtime
export class Convert {
    public static toMissionReport(json: string): MissionReport {
        return cast(JSON.parse(json), r("MissionReport"));
    }

    public static missionReportToJson(value: MissionReport): string {
        return JSON.stringify(uncast(value, r("MissionReport")), null, 2);
    }
}

function invalidValue(typ: any, val: any): never {
    throw Error(`Invalid value ${JSON.stringify(val)} for type ${JSON.stringify(typ)}`);
}

function jsonToJSProps(typ: any): any {
    if (typ.jsonToJS === undefined) {
        var map: any = {};
        typ.props.forEach((p: any) => map[p.json] = { key: p.js, typ: p.typ });
        typ.jsonToJS = map;
    }
    return typ.jsonToJS;
}

function jsToJSONProps(typ: any): any {
    if (typ.jsToJSON === undefined) {
        var map: any = {};
        typ.props.forEach((p: any) => map[p.js] = { key: p.json, typ: p.typ });
        typ.jsToJSON = map;
    }
    return typ.jsToJSON;
}

function transform(val: any, typ: any, getProps: any): any {
    function transformPrimitive(typ: string, val: any): any {
        if (typeof typ === typeof val) return val;
        return invalidValue(typ, val);
    }

    function transformUnion(typs: any[], val: any): any {
        // val must validate against one typ in typs
        var l = typs.length;
        for (var i = 0; i < l; i++) {
            var typ = typs[i];
            try {
                return transform(val, typ, getProps);
            } catch (_) {}
        }
        return invalidValue(typs, val);
    }

    function transformEnum(cases: string[], val: any): any {
        if (cases.indexOf(val) !== -1) return val;
        return invalidValue(cases, val);
    }

    function transformArray(typ: any, val: any): any {
        // val must be an array with no invalid elements
        if (!Array.isArray(val)) return invalidValue("array", val);
        return val.map(el => transform(el, typ, getProps));
    }

    function transformDate(typ: any, val: any): any {
        if (val === null) {
            return null;
        }
        const d = new Date(val);
        if (isNaN(d.valueOf())) {
            return invalidValue("Date", val);
        }
        return d;
    }

    function transformObject(props: { [k: string]: any }, additional: any, val: any): any {
        if (val === null || typeof val !== "object" || Array.isArray(val)) {
            return invalidValue("object", val);
        }
        var result: any = {};
        Object.getOwnPropertyNames(props).forEach(key => {
            const prop = props[key];
            const v = Object.prototype.hasOwnProperty.call(val, key) ? val[key] : undefined;
            result[prop.key] = transform(v, prop.typ, getProps);
        });
        Object.getOwnPropertyNames(val).forEach(key => {
            if (!Object.prototype.hasOwnProperty.call(props, key)) {
                result[key] = transform(val[key], additional, getProps);
            }
        });
        return result;
    }

    if (typ === "any") return val;
    if (typ === null) {
        if (val === null) return val;
        return invalidValue(typ, val);
    }
    if (typ === false) return invalidValue(typ, val);
    while (typeof typ === "object" && typ.ref !== undefined) {
        typ = typeMap[typ.ref];
    }
    if (Array.isArray(typ)) return transformEnum(typ, val);
    if (typeof typ === "object") {
        return typ.hasOwnProperty("unionMembers") ? transformUnion(typ.unionMembers, val)
            : typ.hasOwnProperty("arrayItems")    ? transformArray(typ.arrayItems, val)
            : typ.hasOwnProperty("props")         ? transformObject(getProps(typ), typ.additional, val)
            : invalidValue(typ, val);
    }
    // Numbers can be parsed by Date but shouldn't be.
    if (typ === Date && typeof val !== "number") return transformDate(typ, val);
    return transformPrimitive(typ, val);
}

function cast<T>(val: any, typ: any): T {
    return transform(val, typ, jsonToJSProps);
}

function uncast<T>(val: T, typ: any): any {
    return transform(val, typ, jsToJSONProps);
}

function a(typ: any) {
    return { arrayItems: typ };
}

function u(...typs: any[]) {
    return { unionMembers: typs };
}

function o(props: any[], additional: any) {
    return { props, additional };
}

function m(additional: any) {
    return { props: [], additional };
}

function r(name: string) {
    return { ref: name };
}

const typeMap: any = {
    "MissionReport": o([
        { json: "droneId", js: "droneId", typ: "" },
        { json: "finalDroneBatteryLevel", js: "finalDroneBatteryLevel", typ: 0 },
        { json: "deviceId", js: "deviceId", typ: "" },
        { json: "startTimestamp", js: "startTimestamp", typ: Date },
        { json: "directoryName", js: "directoryName", typ: "" },
        { json: "warehouseId", js: "warehouseId", typ: "" },
        { json: "initialDroneBatteryLevel", js: "initialDroneBatteryLevel", typ: 0 },
        { json: "images", js: "images", typ: a(r("Image")) },
        { json: "warehouseLayout", js: "warehouseLayout", typ: r("WarehouseLayout") },
        { json: "name", js: "name", typ: "" },
        { json: "droneModel", js: "droneModel", typ: "" },
        { json: "id", js: "id", typ: "" },
        { json: "finalHostBatteryLevel", js: "finalHostBatteryLevel", typ: 0 },
        { json: "apiVersion", js: "apiVersion", typ: "" },
        { json: "endTimestamp", js: "endTimestamp", typ: Date },
        { json: "scannedLocations", js: "scannedLocations", typ: a(r("ScannedLocation")) },
        { json: "initialHostBatteryLevel", js: "initialHostBatteryLevel", typ: 0 },
        { json: "finalRadioControllerBatteryLevel", js: "finalRadioControllerBatteryLevel", typ: 0 },
        { json: "scannedItems", js: "scannedItems", typ: a(r("ScannedItem")) },
        { json: "initialRadioControllerBatteryLevel", js: "initialRadioControllerBatteryLevel", typ: 0 },
        { json: "userId", js: "userId", typ: "" },
    ], false),
    "Image": o([
        { json: "detections", js: "detections", typ: a(r("Detection")) },
        { json: "filename", js: "filename", typ: r("Filename") },
        { json: "timestamp", js: "timestamp", typ: Date },
        { json: "width", js: "width", typ: 0 },
        { json: "height", js: "height", typ: 0 },
        { json: "rois", js: "rois", typ: a(r("Rois")) },
    ], false),
    "Detection": o([
        { json: "points", js: "points", typ: a(a(3.14)) },
        { json: "id", js: "id", typ: "" },
        { json: "className", js: "className", typ: r("ClassName") },
        { json: "confidence", js: "confidence", typ: 3.14 },
        { json: "code", js: "code", typ: u(undefined, "") },
    ], false),
    "Rois": o([
        { json: "points", js: "points", typ: a(a(3.14)) },
        { json: "locationId", js: "locationId", typ: r("LocationID") },
        { json: "isMiniRoi", js: "isMiniRoi", typ: true },
    ], false),
    "ScannedItem": o([
        { json: "inventoryItemType", js: "inventoryItemType", typ: r("InventoryItemType") },
        { json: "clientLocationName", js: "clientLocationName", typ: r("ClientLocationName") },
        { json: "detectionId", js: "detectionId", typ: "" },
        { json: "imageFilename", js: "imageFilename", typ: r("Filename") },
        { json: "locationId", js: "locationId", typ: r("LocationID") },
        { json: "code", js: "code", typ: u(undefined, "") },
    ], false),
    "ScannedLocation": o([
        { json: "isEmpty", js: "isEmpty", typ: true },
        { json: "locationChanged", js: "locationChanged", typ: true },
        { json: "hasError", js: "hasError", typ: true },
        { json: "locationId", js: "locationId", typ: r("LocationID") },
    ], false),
    "WarehouseLayout": o([
        { json: "id", js: "id", typ: "" },
        { json: "name", js: "name", typ: "" },
        { json: "locations", js: "locations", typ: a(r("Location")) },
    ], false),
    "Location": o([
        { json: "position", js: "position", typ: 0 },
        { json: "id", js: "id", typ: "" },
        { json: "locationType", js: "locationType", typ: r("LocationType") },
        { json: "clientName", js: "clientName", typ: "" },
        { json: "hierarchyLevel", js: "hierarchyLevel", typ: 0 },
        { json: "side", js: "side", typ: r("Side") },
        { json: "name", js: "name", typ: "" },
        { json: "parentId", js: "parentId", typ: u(undefined, "") },
    ], false),
    "ClassName": [
        "barcode",
        "box",
    ],
    "Filename": [
        "20200226T012552-0500/HRes_DJI_0014.jpg_0000.jpg",
        "20200226T012552-0500/HRes_DJI_0015.jpg_0001.jpg",
        "20200226T012552-0500/HRes_DJI_0016.jpg_0002.jpg",
        "20200226T012552-0500/HRes_DJI_0017.jpg_0003.jpg",
        "20200226T012552-0500/HRes_DJI_0018.jpg_0004.jpg",
        "20200226T012552-0500/HRes_DJI_0019.jpg_0005.jpg",
        "20200226T012552-0500/HRes_DJI_0020.jpg_0006.jpg",
        "20200226T012552-0500/HRes_DJI_0021.jpg_0007.jpg",
    ],
    "LocationID": [
        "b570c9d9",
        "cd7c71e8",
        "d1c69b8b",
        "4aadbbd0",
        "4ee26f9f",
        "56774cbd",
        "6635d5ce",
        "7deb0677",
    ],
    "ClientLocationName": [
        "DX-69-A1",
        "DX-69-A3",
        "DX-69-B1",
        "DX-69-B3",
        "DX-69-D1",
        "DX-69-D3",
        "DX-69-F1",
        "DX-69-F3",
    ],
    "InventoryItemType": [
        "box",
        "licensePlateNumber",
    ],
    "LocationType": [
        "aisle",
        "bin",
        "rack",
    ],
    "Side": [
        "left",
        "right",
    ],
};
