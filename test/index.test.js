'use strict';

const expect = require('expect.js');
const ACMClient = require('../lib/');

describe('acm export client should success', function () {
  const client = new ACMClient({
    endpoint: 'acm.aliyun.com',
    namespace: process.env.NAMESPACE,
    accessKey: process.env.ACCESS_KEY,
    secretKey: process.env.SECRET_KEY,
    requestTimeout: 6000,
    longpullingtimeout: 5 * 1000
  });

  const dataId = 'nodejs.demo.config-index-test';
  const group = 'DEFAULT_GROUP';

  it('get config', async function () {
    let config = await client.getConfig('nodejs.demo.config2', 'DEFAULT_GROUP');
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

  it('get all config', async function () {
    const allconfig = await client.getAllConfigInfo();
    expect(Array.isArray(allconfig)).to.be(true);
    expect([3, 4, 5].includes(allconfig.length)).to.be(true);
  });

  it('subscribe config', async function () {
    // create resource
    const t1 = new Date();
    await client.publishSingle(dataId, group, JSON.stringify({
      name: 'demo-test',
      value: 'subscribe test1',
      date: t1
    }));
    let pub = false;
    setTimeout(async function () {
      await client.publishSingle(dataId, group, JSON.stringify({
        name: 'demo-test',
        value: 'subscribe test3',
        date: new Date()
      }));
      pub = true;
    }, 1000);
    let newConfig = await new Promise(resolve => {
      const timer = setTimeout(() => {
        resolve('');
        client.unSubscribe({ dataId, group });
      }, 5000);
      // subscribe twice only start one while loop
      client.subscribe({ dataId, group }, function (data) {
        if (pub) {
          resolve(data);
          timer && clearTimeout(timer);
        }
      });
      client.subscribe({ dataId, group }, function (data) {
        if (pub) {
          resolve(data);
          timer && clearTimeout(timer);
        }
      });
    });
    newConfig = JSON.parse(newConfig);
    expect(newConfig).not.to.be('');
    expect(newConfig.date !== t1).to.be(true);

    // subscribe the 3 times
    let newConfig2 = await new Promise(resolve => {
      const timer = setTimeout(() => {
        resolve('');
        client.unSubscribe({ dataId, group });
      }, 5000);
      client.subscribe({ dataId, group }, function (data) {
        resolve(data);
        timer && clearTimeout(timer);
        client.unSubscribe({ dataId, group });
      });
    });
    newConfig2 = JSON.parse(newConfig2);
    expect(newConfig2.date === newConfig.date).to.be(true);

    // delete resource
    await client.remove(dataId, group);
  });

  it('remove subscribe listeners', async function () {
    const listener = () => { };
    const reg = { dataId: `${dataId}-01`, group };
    client.subscribe(reg, listener);
    client.subscribe(reg, listener);
    let nowListeners = client.getListener(reg);
    expect(Array.isArray(nowListeners)).to.be(true);
    expect(nowListeners.length).to.be(2);
    client.unSubscribe(reg, listener);
    nowListeners = client.getListener(reg);
    expect(typeof nowListeners).to.be('function');
    client.unSubscribe(reg, listener);
    client.unSubscribe(reg, listener);
    nowListeners = client.getListener({ dataId, group });
    expect(nowListeners).to.be(undefined);
  });

  it('batch get config', async function () {
    const configs = await client.batchGetConfig(['nodejs.demo.config', 'nodejs.demo.config1', 'nodejs.demo.config2'], 'DEFAULT_GROUP');
    expect(configs.length).to.be(3);
  });

  it('batch query', async function () {
    const queries = await client.batchQuery(['nodejs.demo.config', 'nodejs.demo.config1', 'nodejs.demo.config2'], 'DEFAULT_GROUP');
    expect(queries.length).to.be(3);
  });
});