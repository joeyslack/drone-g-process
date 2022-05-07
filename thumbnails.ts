require('dotenv').config();

const stream = require('stream');
const Jimp = require('jimp/es');

const {
  StorageSharedKeyCredential,
  BlobServiceClient
} = require("@azure/storage-blob");

// const sharedKeyCredential = new SharedKeyCredential(
//   accountName,
//   accessKey);
// const pipeline = StorageURL.newPipeline(sharedKeyCredential);
// const serviceURL = new ServiceURL(
//   `https://${accountName}.blob.core.windows.net`,
//   pipeline
// );

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

function ImageResize(context, eventGridEvent, inputBlob): Promise<any> {
  let promises = [];

  // const aborter = Aborter.timeout(30 * ONE_MINUTE);
  const widthInPixels = 100;
  // const contentType = context.bindingData.data.contentType;
  // const blobUrl = context.bindingData.data.url;
  // const blobName = blobUrl.slice(blobUrl.lastIndexOf("/")+1);

  return Jimp.read(inputBlob).then(thumbnail => {
    return thumbnail.resize(widthInPixels, Jimp.MIME_JPEG).getBufferAsync(Jimp.MIME_JPEG);
  }).then(buffer => {
    const containerClient = blobServiceClient.getContainerClient('testresize'); 
    const blockBlobClient = containerClient.getBlockBlobClient("${context.bindingData.blobname}\/thumbnails\/LRes_${context.bindingData.imagename}");
    return blockBlobClient.upload(buffer, buffer.length); 
  });

    
   

    // thumbnail.getBuffer(Jimp.MIME_JPG, async (err, buffer) => {

    //   const readStream = stream.PassThrough();
    //   readStream.end(buffer);

    //   // //      "path": "testresize/{blobname}/{imagename}.jpg",

    //   // const serviceURL = `https://${account}.blob.core.windows.net/testresize/${context.bindingData.blobname}/${context.bindingData.imagename}__resize.jpg`;

    //   // const containerURL = ContainerURL.fromServiceURL(serviceURL, containerName);
    //   // const blockBlobURL = BlockBlobURL.fromContainerURL(containerURL, blobName);

    //   const containerClient = blobServiceClient.getContainerClient('testresize'); 
    //   const blockBlobClient = containerClient.getBlockBlobClient("${context.bindingData.blobname}/thumbnails/LRes_${context.bindingData.imagename}.jpg");
      
    //   // promises.push(blockBlobClient.upload(buffer, buffer.length));

    //   try {
    //     // return await blockBlobClient.upload(buffer, buffer.length);
    //     return 'done';
    //   } catch (err) {
    //     console.log('ERROR ZZZ', err);
    //   }

    //   // // return await blockBlobClient.upload(buffer, buffer.length);
    //   // try {   
    //   //   const uploadBlobResponse = await blockBlobClient.upload(buffer, buffer.length);
    //   // } catch (err) {
    //   //   context.log(err.message);
    //   // } finally {        
    //   //   ret
    //   // }

    //   // return await blockBlobClient.upload(buffer, buffer.length);

    //   // return new Promise()
    // });
  // });
  // }).then(() => {
  //   return Promise.all(promises);
  // }, (err) => {
  //   context.log(err);
  //   context.done();
  // });
};

export { ImageResize }