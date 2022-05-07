require('dotenv').config();

var fs = require('fs');
var path = require('path');

var moment = require('moment');

// Azure Storage accessor
const { BlobServiceClient, StorageSharedKeyCredential } = require("@azure/storage-blob");
 
// Enter your storage account name and shared key
const account = process.env.AZURE_STORAGE_ACCOUNT;
const accountKey = process.env.AZURE_STORAGE_KEY;
 
// Use StorageSharedKeyCredential with storage account and account key
// StorageSharedKeyCredential is only avaiable in Node.js runtime, not in browsers
const sharedKeyCredential = new StorageSharedKeyCredential(account, accountKey);
const blobServiceClient = new BlobServiceClient(
  `https://${account}.blob.core.windows.net`,
  sharedKeyCredential
);

async function streamToString(readableStream) {
    return new Promise((resolve, reject) => {
      const chunks = [];
      readableStream.on("data", (data) => {
        chunks.push(data.toString());
      });
      readableStream.on("end", () => {
        resolve(chunks.join(""));
      });
      readableStream.on("error", reject);
    });
  }

// Show all containers in storage account
async function listContainers() {
  let i = 1;
  let iter = await blobServiceClient.listContainers();
  let results = [];
  for await (const container of iter) {
    console.log(`Container ${i++}: ${container.name}`);
    results.push(container);
  }

  return results;
}

// Show blobs in container
async function listBlobs(container: string = process.env.AZURE_CONTAINER) {
  const containerClient = blobServiceClient.getContainerClient(container); 
  let i = 1;
  let iter = await containerClient.listBlobsByHierarchy('/');
  let results = [];
  for await (const blob of iter) {
    // Folder
    // if (blob.kind === "prefix") {
    // }
    console.log(`Blob ${i++}: ${blob.name}`, blob.kind);
    results.push(blob);
  }

  return results;
}

async function downloadFolder(path: string, dest: string = __dirname + '/process_current/', container = process.env.AZURE_CONTAINER): Promise<any[]>{
  const containerClient = await blobServiceClient.getContainerClient(container);
  let i = 1;
  let hasMissionReport = false;
  let iter = await containerClient.listBlobsByHierarchy("/", { prefix: path + '/' });
  let results = [];
  
  if (!fs.existsSync(`${dest}${path}`)) {
    fs.mkdirSync(`${dest}${path}`, { recursive: true });
  }
  for await (const blob of iter) {
    console.log(`Blob ${i++}: ${blob.name}`, blob.kind, blob);
    // Make sure path is a full file
    if (blob.kind !== "prefix") {
      results.push(downloadFile(blob.name, `${dest}${blob.name}`));
    }
  }

  return await Promise.all(results);
}

// Works...
async function downloadFile(fromPath: string, toPath: string, container = process.env.AZURE_CONTAINER) {
  const containerClient = await blobServiceClient.getContainerClient(container);
  const blobClient = containerClient.getBlobClient(fromPath);
  console.log('downloadFile, from, to: ', fromPath, '------', toPath);
  
  if (!fs.existsSync(path.dirname(toPath))) {
    fs.mkdirSync(path.dirname(toPath), { recursive: true });
  }
  
  await blobClient.downloadToFile(toPath);

  return;
}

async function getBlob(file) {
  return await streamToString(file.readableStreamBody);
}

async function getBlobByPath(path, container = process.env.AZURE_CONTAINER): Promise<any> {
  const containerClient = blobServiceClient.getContainerClient(container);
  const blobClient = containerClient.getBlobClient(path);
  const downloadBlockBlobResponse = await blobClient.download();
  return await streamToString(downloadBlockBlobResponse.readableStreamBody);
}

// Upload
async function uploadFile(file, toPath: string, container = process.env.AZURE_CONTAINER) {
  if (!file) throw Error('uploadBlob requires: (file, toPath)');
  const containerClient = blobServiceClient.getContainerClient(container);
  console.log('\nUploading to Azure storage as blob:\n\t', toPath, Buffer.byteLength(file));
  const blockBlobClient = containerClient.getBlockBlobClient(toPath);
  // const s = JSON.parse(file);
  const uploadBlobResponse = await blockBlobClient.upload(file, Buffer.byteLength(file), {overwrite: true, metadata: {'modificationsource': 'webUser', 'modificationdate': moment().utc().format("YYYY-MM-DDTHH:mm:ss") + 'Z'}, blobHTTPHeaders: {blobContentType:'application/json'}});
  console.log("Blob was uploaded successfully. requestId: ", uploadBlobResponse.requestId);

  return uploadBlobResponse;
}

// listContainers();
// listBlobs();
// download();
// downloadFolder('20191227T055958-0500/');
// downloadFolder(process.argv[2]);
// downloadFile(process.argv[2], __dirname + '/process_current/test.json');

export { listContainers, listBlobs, downloadFolder, downloadFile, uploadFile, getBlob, getBlobByPath }