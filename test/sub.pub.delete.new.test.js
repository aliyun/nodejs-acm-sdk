'use strict';

const expect = require('expect.js');
const ACMClient = require('../lib/acm');
const helper = require('../lib/helper');

describe('sub/pub/delete config should success', function () {
  const client = new ACMClient({
    endpoint: 'acm.aliyun.com',
    namespace: process.env.NAMESPACE,
    accessKeyId: process.env.ACCESS_KEY,
    accessKeySecret: process.env.SECRET_KEY,
    longpullingtimeout: 5 * 1000
  });

  const dataId = 'nodejs.demo.config-sub-pub-delete-test';
  const group = 'DEFAULT_GROUP';

  before(async function () {
    await client.refreshServerList();
  });

  it('subscribe config', async function () {
    // create resource
    await client.publishConfig(dataId, group, JSON.stringify({
      name: 'demo-test',
      value: 'subscribe test1',
      date: new Date()
    }), null, {});
    const rawConfig = await client.getConfig(dataId, group, null, {});
    const rawMD5 = helper.getMD5String(rawConfig);
    const request = {
      dataId,
      group,
      contentMD5: rawMD5
    };
    setTimeout(async function () {
      await client.publishConfig(dataId, group, JSON.stringify({
        name: 'demo-test',
        value: 'subscribe test2',
        date: new Date()
      }), null, {});
    }, 1000);
    const change = await client.subscribeConfig(request, {});
    expect(change).to.not.be('');
    // const newConfig = await await client.getConfig(dataId, group, null, {});
    // const newMD5 = helper.getMD5String(newConfig);
    // expect(newMD5 !== rawMD5).to.be(true);
    // delete resource
    await client.deleteConfig(dataId, group, null, {});
  });

  it('publish config', async function () {
    const publishconfig = await client.publishConfig(dataId, group, JSON.stringify({
      name: 'demo-test',
      value: 'publish test',
      date: new Date()
    }), null, {});
    expect(publishconfig).to.be(true);
    // delete resource
    await client.deleteConfig(dataId, group, null, {});
  });

  it('delete config', async function () {
    // create resource
    await client.publishConfig(dataId, group, JSON.stringify({
      name: 'demo-test',
      value: 'delete test',
      date: new Date()
    }), null, {});
    const deleteconfig = await client.deleteConfig(dataId, group, null, {});
    expect(deleteconfig).to.be(true);
  });
});