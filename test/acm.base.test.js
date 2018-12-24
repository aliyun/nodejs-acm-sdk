'use strict';

const fs = require('fs');
const path = require('path');
const iconv = require('iconv-lite');
const expect = require('expect.js');
const ACMBaseClient = require('../lib/acm_base');

const WORD_SEPARATOR = String.fromCharCode(2);

function isValidIP(ip) {
  var reg = /^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$/;
  return reg.test(ip);
}

describe('acm base client should success', function () {
  it('init acm base client constructor', async function () {
    // check config
    let error = '';
    try {
      new ACMBaseClient({
        endpoint: 'acm.aliyun.com',
        namespace: 'xxxxxx',
        accessKey: 'xxxxxx',
        secretKey: 'xxxxxx',
      });
    } catch (e) {
      error = e.message;
    }
    expect(error).to.be('');
    try {
      new ACMBaseClient();
    } catch (e) {
      error = e.message;
    }
    expect(error).to.be('config must be passed in');
    try {
      new ACMBaseClient({});
    } catch (e) {
      error = e.message;
    }
    expect(error).to.be('config.endpoint must be passed in');
    try {
      new ACMBaseClient({ endpoint: 'acm.aliyun.com' });
    } catch (e) {
      error = e.message;
    }
    expect(error).to.be('config.namespace must be passed in');
    try {
      new ACMBaseClient({
        endpoint: 'acm.aliyun.com',
        namespace: 'xxxxxx'
      });
    } catch (e) {
      error = e.message;
    }
    expect(error).to.be('config.accessKeyId must be passed in');
    try {
      new ACMBaseClient({
        endpoint: 'acm.aliyun.com',
        namespace: 'xxxxxx',
        accessKey: 'xxxxxx',
      });
    } catch (e) {
      error = e.message;
    }
    expect(error).to.be('config.secretKey must be passed in');
  });

  const client = new ACMBaseClient({
    endpoint: 'acm.aliyun.com',
    namespace: process.env.NAMESPACE,
    accessKey: process.env.ACCESS_KEY,
    secretKey: process.env.SECRET_KEY
  });

  it('parse response as gbk string', async function () {
    const raw = fs.createReadStream(path.join(__dirname, './fixtures/gbk.txt'));
    const request = raw
      .pipe(iconv.decodeStream('utf8'))
      .pipe(iconv.encodeStream('gbk'));
    request.headers = { 'content-encoding': null };
    expect(await client.__text(request)).to.be('Hi，欢迎试用 ACM Node.js SDK');
  });

  it('parse response as json', async function () {
    // valid json
    const valid = fs.createReadStream(path.join(__dirname, './fixtures/valid_json.txt'));
    const request1 = valid
      .pipe(iconv.decodeStream('utf8'))
      .pipe(iconv.encodeStream('gbk'));
    request1.headers = { 'content-encoding': null };
    const josn1 = await client.__json(request1);
    expect(josn1.k1).to.be('v1');
    expect(josn1.k2).to.be('v2');

    // invalid json
    const invalid = fs.createReadStream(path.join(__dirname, './fixtures/invalid_json.txt'));
    const request2 = invalid
      .pipe(iconv.decodeStream('utf8'))
      .pipe(iconv.encodeStream('gbk'));
    request2.headers = { 'content-encoding': null };
    let error = '';
    try {
      await client.__json(request2);
    } catch (e) {
      error = e.message;
    }
    expect(error).to.be('return value must be json: {k1:v1,k2:v2}');
  });

  it('return correct value', function () {
    // string
    expect(client.__default('value', 'default')).to.be('value');
    expect(client.__default(undefined, 'default')).to.be('default');
    expect(client.__default(null, 'default')).to.be('default');

    // number
    expect(client.__default_number(0, 3)).to.be(0);
    expect(client.__default_number(1, 3)).to.be(1);
    expect(client.__default_number(undefined, 3)).to.be(3);
    expect(client.__default_number(null, 3)).to.be(3);
  });

  it('return form value', function () {
    expect(client.__to_form({ k1: 'v1', k2: 'v2' })).to.be('k1=v1&k2=v2');
  });

  it('return string value', function () {
    expect(client.__to_string({ k1: 'v1', k2: 'v2' })).to.be('');
    expect(client.__to_string(['e1', 'e2', 'e3'])).to.be(['e1', 'e2', 'e3'].join(WORD_SEPARATOR));
  });

  it('return string value', function () {
    expect(client.__to_string({ k1: 'v1', k2: 'v2' })).to.be('');
    expect(client.__to_string(['e1', 'e2', 'e3'])).to.be(['e1', 'e2', 'e3'].join(WORD_SEPARATOR));
  });

  it('return bool value', function () {
    expect(client.__to_bool('xxxxx')).to.be(false);
    expect(client.__to_bool('OK')).to.be(true);
  });

  it('return array value', function () {
    const str = '192.168.10.1\n 192.168.10.2\n 192.168.10.3 \n192.168.10.4';
    const units = client.__to_array(str);
    expect(units.every(isValidIP)).to.be(true);
  });

  it('encode params', function () {
    expect(decodeURIComponent(client.__encode({ k1: 'v1', k2: 'v2' }))).to.be('k1=v1&k2=v2');
  });

  it('response 5xx', function () {
    expect(client.__is_5xx({ statusCode: 499 })).to.be(false);
    expect(client.__is_5xx({ statusCode: 500 })).to.be(true);
    expect(client.__is_5xx({ statusCode: 501 })).to.be(true);
  });

  it('get content length', function () {
    const body = '欢迎试用 ACM Node.js SDK';
    expect(client.__content_length({ body })).to.be(28);
  });

  it('get correct host', function () {
    let error = '';
    // success;
    client.units = ['192.168.1.1', '192.168.1.2', '192.168.1.3'];
    let clients = [];
    for (let i = 0; i < 100; i++) {
      let tmpClient = client.__get_host();
      if (!clients.includes(tmpClient)) {
        clients.push(tmpClient);
      }
    }
    expect(clients.length).to.be(client.units.length);
    expect(clients.every(cli => client.units.includes(cli))).to.be(true);
    expect(client.units.every(cli => clients.includes(cli))).to.be(true);

    // failed
    try {
      client.units = '192.168.1.1';
      client.__get_host();
    } catch (e) {
      error = e.message;
    }
    expect(error).to.be('server list is empty!');
    try {
      client.units = [];
      client.__get_host();
    } catch (e) {
      error = e.message;
    }
    expect(error).to.be('server list is empty!');
  });

  it('get timestamp', function () {
    expect(typeof client.__get_timestamp()).to.be('string');
  });

  it('get signature', function () {
    expect(typeof client.__get_signature({ query: { k1: 'v1', k2: 'v1' }, headers: {} })).to.be('string');
    expect(typeof client.__get_signature({ body: { k1: 'v1', k2: 'v2' }, headers: {} }, 'encode')).to.be('string');
    expect(typeof client.__get_signature({ body: { k1: 'v1', k2: 'v3' }, headers: {} }, 'form')).to.be('string');
    expect(typeof client.__get_signature({ query: { group: 'g1' }, headers: {} })).to.be('string');
    expect(typeof client.__get_signature({ query: { group: 'g1', tenant: 't1' }, headers: {} })).to.be('string');
  });

  it('parse prob', function () {
    // success
    expect(typeof client.__parseProbe({ dataId: 'd', group: 'g', contentMD5: 'cm' })['Probe-Modify-Request']).to.be('string');
    client.__namespace = ''; // with no default namespace should still output
    expect(typeof client.__parseProbe({ dataId: 'd', group: 'g', contentMD5: 'cm' })['Probe-Modify-Request']).to.be('string');
    // failed
    expect(client.__parseProbe(null)).to.be('');
    expect(client.__parseProbe(undefined)).to.be('');
    expect(client.__parseProbe('string')).to.be('');
    expect(client.__parseProbe(false)).to.be('');
    expect(client.__parseProbe(123)).to.be('');
  });
});