'use strict';

const mm = require('mm');
const expect = require('expect.js');
const ACMClient = require('../lib/acm');


function isValidIP(ip) {
  var reg = /^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$/;
  return reg.test(ip);
}

describe('acm client should success', function () {
  const client = new ACMClient({
    endpoint: 'acm.aliyun.com',
    namespace: process.env.NAMESPACE,
    accessKey: process.env.ACCESS_KEY,
    secretKey: process.env.SECRET_KEY
  });

  it('refresh server list', async function () {
    expect(client.units).to.be(null);
    await client.refreshServerList();
    expect(Array.isArray(client.units)).to.be(true);
    expect(client.units.length !== 0).to.be(true);
    expect(client.units.every(isValidIP)).to.be(true);
  });

  it('get current unit', async function () {
    expect(Boolean(await client.getCurrentUnit())).to.be(true);
  });

  it('get all units', async function () {
    expect(Array.isArray(await client.getAllUnits())).to.be(true);
  });

  it('get config', async function () {
    let config = await client.getConfig('nodejs.demo.config2', 'DEFAULT_GROUP', null, {});
    expect(typeof config).to.be('string');
    let error = '';
    try {
      config = JSON.parse(config);
    } catch (e) {
      error = e.message;
    }
    expect(error).to.be('');
    expect(config.name).to.be('acm03');
    expect(config.value).to.be('test');
  });

  it('batch get config', async function () {
    let config = await client.batchGetConfig(['nodejs.demo.config', 'nodejs.demo.config1', 'nodejs.demo.config2'], 'DEFAULT_GROUP', null, {});
    expect(Array.isArray(config)).to.be(true);
    expect(config.length).to.be(3);
  });

  it('batch query', async function () {
    let config = await client.batchQuery(['nodejs.demo.config', 'nodejs.demo.config1', 'nodejs.demo.config2'], 'DEFAULT_GROUP', null, {});
    expect(Array.isArray(config)).to.be(true);
    expect(config.length).to.be(3);
  });

  it('get all config by tenant', async function () {
    const configInfoPage = await client.getAllConfigByTenant(1, 1, client.__namespace, {});
    expect([3, 4, 5].includes(Number(configInfoPage.totalCount))).to.be(true);
    const pageSize = 200;
    let configs = [];
    for (let i = 0; i * pageSize < configInfoPage.totalCount; i++) {
      const configInfo = await client.getAllConfigByTenant(i + 1, pageSize, client.__namespace, {});
      configs = configs.concat(configInfo.pageItems);
    }
    expect([3, 4, 5].includes(configs.length)).to.be(true);
    configs.forEach((config, index) => {
      expect(/^nodejs.demo.config(.*)$/.test(config.dataId)).to.be(true);
    });
  });
});

describe('it should failed', function () {
  const client = new ACMClient({
    endpoint: 'acm.aliyun.com',
    namespace: process.env.NAMESPACE,
    accessKey: process.env.ACCESS_KEY,
    secretKey: process.env.SECRET_KEY
  });

  before(function () {
    mm(client, 'getServerList', function () {
      throw new Error('mock get server list error');
    });
  });
  after(function () {
    mm.restore();
  });

  it('refresh server list', async function () {
    expect(client.units).to.be(null);
    await client.refreshServerList();
    expect(client.units).to.be(null);
  });
});