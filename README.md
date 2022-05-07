# Gather.ai Mission Processor

Process incoming `mission_report.json` into `postgres` compatible SQL inserts.

Designed to retrieve mission reports via Azure Storage API, and processed via mappings into sequential insert statements.

This package includes `Azure Triggrr` functionality, meaning it can listen to changes on `Azure Storage` containers, and take actions. In our case, we listen to `in` file writes, and run the processor at that time.

## Prerequisits

`npm install`

You'll require Azure credentials to retreive from bucket.

Environment file for connected client resource.

More Coming...

## Usage

Process current data: `npm run process:current`
TODO: Update this... 

## Testing Locally

Use `VSCode` with `Azure Functions Extenion`. Use the `Debug` functionality to test deployments locally.

## Deploys

EASY MODE, USE: `npm run deploy:prod`

### More info

The `Azure Functions Extension` is helpful for debugging applications, however is broken for production deployments. Use `func azure functionapp publish gather-upload-functions` to deploy functions to production. This will build locally and deploy built package, hopefully remote system has all depdendencies required. We can pass a `--build remote` flag, howver, this is currently broken on Azure (April 1, 2020), as remote builds cannot find the `tsc` lib, as it doesn't seem to be included globally. See: `https://github.com/microsoft/vscode-azurefunctions/issues/1983`. Just go ahead and use `npm run deploy:prod` (as above) and save yourself the headdache until issue is resolved. 

## Logging

Logging console to loggly: https://gatherai.loggly.com/search?terms=tag:Winston-NodeJS&from=-20m&until=now&source_group=&newtab=1#terms=tag:Winston-NodeJS&from=2020-04-08T21:34:39.839Z&until=2020-04-08T21:54:39.839Z&source_group=