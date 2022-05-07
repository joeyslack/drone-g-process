import { AzureFunction, Context } from "@azure/functions"
import { ImageResize } from "../thumbnails";

const blobTrigger: AzureFunction = async function (context: Context, myBlob: any): Promise<void> {
  context.log("Blob trigger function processed blob \n Name:", context.bindingData.blobname, "\n Blob Size:", myBlob.length, "Bytes");
  // context.log("aaa");
  // context.log(context.bindingData);
  return await ImageResize(context, null, myBlob);
  // ImageResize(context, null, myBlob);a
  // return new Promise((res) => {
  //   console.log('ok nice');
  //   res();
  // });

 // context.done();

};


export default blobTrigger;


