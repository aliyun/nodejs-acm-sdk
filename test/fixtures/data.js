'use strict';

const { ACMClient } = require('../../lib/');
const client = new ACMClient({
  endpoint: 'acm.aliyun.com',
  namespace: process.env.NAMESPACE,
  accessKey: process.env.ACCESS_KEY,
  secretKey: process.env.SECRET_KEY,
  requestTimeout: 6000,
  longpullingtimeout: 5 * 1000
});

/**
 * create test data
 */
async function createTestData() {
  await client.publishSingle('nodejs.demo.config', 'DEFAULT_GROUP', JSON.stringify({ name: 'acm01', value: 'test' }));
  await client.publishSingle('nodejs.demo.config1', 'DEFAULT_GROUP', JSON.stringify({ name: 'acm02', value: 'test' }));
  await client.publishSingle('nodejs.demo.config2', 'DEFAULT_GROUP', JSON.stringify({ name: 'acm03', value: 'test' }));
}

createTestData();