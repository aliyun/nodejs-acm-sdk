'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const expect = require('expect.js');
const ACMClient = require('../lib/acm');
const url = require('url');
const helper = require('../lib/helper');

const router = {
  'GET::/diamond-server/config.co?dataId=nodejs.demo.config2&group=DEFAULT_GROUP&tenant=namespace': JSON.stringify({ name: 'demo2', test1: '0' }),
  'POST::/diamond-server/config.co?method=batchGetConfig': JSON.stringify([{}, {}, {}]),
  'POST::/diamond-server/admin.do?method=batchQuery': JSON.stringify([{}, {}, {}]),
  'GET::/diamond-server/basestone.do?pageNo=1&pageSize=1&method=getAllConfigByTenant&tenant=namespace': JSON.stringify({ totalCount: 3, pageNumber: 1, pagesAvailable: 1, pageItems: [{}, {}, {}] }),
  'GET::/diamond-server/basestone.do?pageNo=1&pageSize=200&method=getAllConfigByTenant&tenant=namespace': JSON.stringify({ totalCount: 3, pageNumber: 1, pagesAvailable: 1, pageItems: [{}, {}, {}] }),
  'POST::/diamond-server/basestone.do?method=syncUpdateAll': 'OK',
  'POST::/diamond-server/datum.do?method=deleteAllDatums': 'OK',
  '/diamond-server/config.co': ''
};

async function createServer(retry) {
  let httpServer, httpsServer;
  let cache = {};
  await new Promise(function (resolve, reject) {
    httpServer = http.createServer(function (req, res) {
      if (cache[req.url] && cache[req.url] % retry === 0) {
        res.end('localhost:8443');
        cache[req.url] = null;
      } else {
        cache[req.url] ? (cache[req.url]++) : (cache[req.url] = 1);
        res.writeHead(500);
        res.end('failed');
      }
    });
    httpServer.listen(8080, resolve);
  });

  const options = {
    key: fs.readFileSync(path.join(__dirname, './keys/server-key.pem')),
    cert: fs.readFileSync(path.join(__dirname, './keys/server-cert.pem'))
  };
  await new Promise(function (resolve, reject) {
    httpsServer = https.createServer(options, (req, res) => {
      const parse = url.parse(req.url);
      if (cache[req.url] && cache[req.url] % retry === 0) {
        res.writeHead(200);
        res.end(router[`${req.method}::${parse.path}`]);
        cache[req.url] = null;
      } else {
        cache[req.url] ? (cache[req.url]++) : (cache[req.url] = 1);
        res.writeHead(500);
        res.end('failed');
      }
    });
    httpsServer.listen(8443, resolve);
  });

  return { httpServer, httpsServer };
}

describe('http retry should success', function () {
  const client = new ACMClient({
    endpoint: 'localhost',
    namespace: 'namespace',
    accessKey: 'access_key',
    secretKey: 'secret_key'
  });

  let httpServer, httpsServer;
  let retry = 2;
  before(async function () {
    const servers = await createServer(retry);
    httpServer = servers.httpServer;
    httpsServer = servers.httpsServer;
  });
  after(function () {
    httpServer && httpServer.close();
    httpsServer && httpsServer.close();
  });

  it(`get units should success after retry ${retry} times`, async function () {
    // with no backoff_period
    expect(client.units).to.be(null);
    await client.refreshServerList();
    expect(Array.isArray(client.units)).to.be(true);
    expect(client.units.length !== 0).to.be(true);
    client.units = null;
    // with backoff_period
    expect(client.units).to.be(null);
    await client.refreshServerList({}, { backoff_policy: 'fixed', backoff_period: 10 });
    expect(Array.isArray(client.units)).to.be(true);
    expect(client.units.length !== 0).to.be(true);
  });

  it(`get config should success after retry ${retry} times`, async function () {
    // with no backoff_period
    let config = await client.getConfig('nodejs.demo.config2', 'DEFAULT_GROUP', null, {});
    expect(typeof config).to.be('string');
    let error = '';
    try {
      config = JSON.parse(config);
    } catch (e) {
      error = `json parse error with origin string [${config}]`;
    }
    expect(error).to.be('');
    expect(config.name).to.be('demo2');
    expect(Number(config.test1)).to.be(0);
    // with backoff_period
    config = await client.getConfig('nodejs.demo.config2', 'DEFAULT_GROUP', null, { backoff_policy: 'fixed', backoff_period: 10 });
    expect(typeof config).to.be('string');
    error = '';
    try {
      config = JSON.parse(config);
    } catch (e) {
      error = `json parse error with origin string [${config}]`;
    }
    expect(error).to.be('');
    expect(config.name).to.be('demo2');
    expect(Number(config.test1)).to.be(0);
  });

  it(`batch get config should success after retry ${retry} times`, async function () {
    // with no backoff_period
    let config = await client.batchGetConfig(['nodejs.demo.config', 'nodejs.demo.config1', 'nodejs.demo.config2'], 'DEFAULT_GROUP', null, {});
    expect(Array.isArray(config)).to.be(true);
    expect(config.length).to.be(3);
    // with backoff_period
    config = await client.batchGetConfig(['nodejs.demo.config', 'nodejs.demo.config1', 'nodejs.demo.config2'], 'DEFAULT_GROUP', null, { backoff_policy: 'fixed', backoff_period: 10 });
    expect(Array.isArray(config)).to.be(true);
    expect(config.length).to.be(3);
  });

  it(`batch query should success after retry ${retry} times`, async function () {
    // with no backoff_period
    let config = await client.batchQuery(['nodejs.demo.config', 'nodejs.demo.config1', 'nodejs.demo.config2'], 'DEFAULT_GROUP', null, {});
    expect(Array.isArray(config)).to.be(true);
    expect(config.length).to.be(3);
    // with backoff_period
    config = await client.batchQuery(['nodejs.demo.config', 'nodejs.demo.config1', 'nodejs.demo.config2'], 'DEFAULT_GROUP', null, { backoff_policy: 'fixed', backoff_period: 10 });
    expect(Array.isArray(config)).to.be(true);
    expect(config.length).to.be(3);
  });

  it(`get all config by tenant should success after retry ${retry} times`, async function () {
    // with no backoff_period
    let configInfoPage = await client.getAllConfigByTenant(1, 1, client.__namespace, {});
    expect(Number(configInfoPage.totalCount)).to.be(3);
    let pageSize = 200;
    let configs = [];
    for (let i = 0; i * pageSize < configInfoPage.totalCount; i++) {
      const configInfo = await client.getAllConfigByTenant(i + 1, pageSize, client.__namespace, {});
      configs = configs.concat(configInfo.pageItems);
    }
    expect(configs.length).to.be(3);
    // with backoff_period
    configInfoPage = await client.getAllConfigByTenant(1, 1, client.__namespace, {});
    expect(Number(configInfoPage.totalCount)).to.be(3);
    pageSize = 200;
    configs = [];
    for (let i = 0; i * pageSize < configInfoPage.totalCount; i++) {
      const configInfo = await client.getAllConfigByTenant(i + 1, pageSize, client.__namespace, { backoff_policy: 'fixed', backoff_period: 10 });
      configs = configs.concat(configInfo.pageItems);
    }
    expect(configs.length).to.be(3);
  });

  it(`publish config should success after retry ${retry} times`, async function () {
    // with no backoff_period
    let publishconfig = await client.publishConfig('nodejs.demo.config2', 'DEFAULT_GROUP', JSON.stringify({
      name: 'demo-test',
      value: 'publish test',
      date: new Date()
    }), null, {});
    expect(publishconfig).to.be(true);
    // with backoff_period
    publishconfig = await client.publishConfig('nodejs.demo.config2', 'DEFAULT_GROUP', JSON.stringify({
      name: 'demo-test',
      value: 'publish test',
      date: new Date()
    }), null, { backoff_policy: 'fixed', backoff_period: 10 });
    expect(publishconfig).to.be(true);
  });

  it(`delete config should success after retry ${retry} times`, async function () {
    // with no backoff_period
    let deleteconfig = await client.deleteConfig('nodejs.demo.config2', 'DEFAULT_GROUP', null, {});
    expect(deleteconfig).to.be(true);
    // with backoff_period
    deleteconfig = await client.deleteConfig('nodejs.demo.config2', 'DEFAULT_GROUP', null, { backoff_policy: 'fixed', backoff_period: 10 });
    expect(deleteconfig).to.be(true);
  });

  it(`subscribe config should success after retry ${retry} times`, async function () {
    // with no backoff_period
    let rawConfig = await client.getConfig('nodejs.demo.config2', 'DEFAULT_GROUP', null, {});
    let rawMD5 = helper.getMD5String(rawConfig);
    let request = { dataId: 'nodejs.demo.config2', group: 'DEFAULT_GROUP', contentMD5: rawMD5 };
    let change = await client.subscribeConfig(request, {});
    expect(change).to.be('');
    // with backoff_period
    rawConfig = await client.getConfig('nodejs.demo.config2', 'DEFAULT_GROUP', null, {});
    rawMD5 = helper.getMD5String(rawConfig);
    request = { dataId: 'nodejs.demo.config2', group: 'DEFAULT_GROUP', contentMD5: rawMD5 };
    change = await client.subscribeConfig(request, { backoff_policy: 'fixed', backoff_period: 10 });
    expect(change).to.be('');
  });
});