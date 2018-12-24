'use strict';

const iconv = require('iconv-lite');
const expect = require('expect.js');
const helper = require('../lib/helper');
const fs = require('fs');
const path = require('path');

describe('helper should success', function () {
  it('parse gbk string', async function () {
    const raw = fs.createReadStream(path.join(__dirname, './fixtures/gbk.txt'));
    const request = raw
      .pipe(iconv.decodeStream('utf8'))
      .pipe(iconv.encodeStream('gbk'));
    request.headers = { 'content-encoding': null };
    expect(await helper.parseGBK(request, 'gbk')).to.be('Hi，欢迎试用 ACM Node.js SDK');
  });

  it('get md5 string', function () {
    expect(helper.getMD5String(undefined)).to.be('');
    expect(helper.getMD5String(null)).to.be('');
    expect(helper.getMD5String(iconv.encode('Hi，欢迎试用 ACM Node.js SDK', 'gbk'))).to.be('ba86948113f9fb803de9f54a92cf3989');
  });

  it('encoding params', function () {
    expect(decodeURIComponent(helper.encodingParams({ k1: 'v1', k2: 'v2' }))).to.be('k1=v1&k2=v2');
  });

  it('decode body', function () {
    const d1 = helper.decodeBody('%6B%31=%76%31&%6B%32=%76%32', 'encode');
    expect(d1.k1).to.be('v1');
    expect(d1.k2).to.be('v2');

    const d2 = helper.decodeBody('k1=v1&k2=v2', 'form');
    expect(d2.k1).to.be('v1');
    expect(d2.k2).to.be('v2');

    try {
      helper.decodeBody('k1=v1&k2=v2', 'other');
    } catch (e) {
      expect(e.message).to.be('not support type other');
    }
  });

  it('validation', function () {
    expect(helper.isValid(undefined)).to.be(false);
    expect(helper.isValid(null)).to.be(false);
    expect(helper.isValid('abc')).to.be(true);
    expect(helper.isValid('DEF')).to.be(true);
    expect(helper.isValid('123')).to.be(true);
    expect(helper.isValid(':a_A-1.')).to.be(true);
    expect(helper.isValid(':a_A-1.+')).to.be(false);
  });

  it('check params', function () {
    let error = '';
    try {
      helper.checkParameters([':a_A-1.', 'aAc123'], '-----');
      helper.checkParameters(':a_A-1.', '-----');
      helper.checkParameters(':a_A-1.', '-----', 'aaaaa');
    } catch (e) {
      error = e.message;
    }
    expect(error).to.be('');
    try {
      helper.checkParameters([':a_A-1.', '+++++', '*****'], '-----');
    } catch (e) {
      error = e.message;
    }
    expect(error.includes('+++++')).to.be(true);
    expect(error.includes('*****')).to.be(true);
  });

  it('random array index', function () {
    const length = 10;
    const indexList = new Set();
    for (let i = 0; i < 10000; i++) {
      const randomIndex = helper.random(length);
      indexList.add(randomIndex);
    }
    expect(indexList.size).to.be(length);
  });
});