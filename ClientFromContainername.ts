require('dotenv').config();
const { Pool, Client } = require('pg');

const ClientFromContainername = (containerPrefix) => {
  let connection = {};

  if (containerPrefix && process.env.containerPrefix + '_PGHOST') {
    connection = {
      host: containerPrefix + '_PGHOST',
      user: containerPrefix + '_PGUSER'
    }
  }

  console.log('XXX_CLIENT FROM CONTAINERNAME:::', connection);

  return new Client(connection);
}

export { ClientFromContainername }
/*
  
  const containerPrefix = `${context.bindingData.containername}`;
  if (containerPrefix && process.env.containerPrefix + '_PGHOST') {
    const connection = {
      host: containerPrefix + '_PGHOST',
      user: containerPrefix + '_PGUSER'
    }
  }

  */