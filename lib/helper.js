'use strict';

const crypto = require('crypto');
const assert = require('assert');
const qs = require('querystring');

const urlencode = require('urlencode');
const iconv = require('iconv-lite');
const { $read } = require('@alicloud/http-core-sdk');

const sep = '&';
const eq = '=';
const REG_VALID_CHAR = /^[a-z0-9A-Z_.\-:]+$/;

exports.parseGBK = async function (stream) {
  const buf = await $read(stream);
  return iconv.decode(buf, 'gbk');
};

exports.getMD5String = function (val) {
  if (val === null || val === undefined) {
    return '';
  }
  const md5 = crypto.createHash('md5');
  md5.update(iconv.encode(val, 'gbk'));
  return md5.digest('hex');
};

exports.encodingParams = function (data) {
  return qs.stringify(data, sep, eq, {
    encodeURIComponent(str) {
      return urlencode.encode(str, 'gbk');
    },
  });
};

exports.decodeBody = function (data, type) {
  if (type === 'encode') {
    let raw = qs.parse(data, sep, eq, {
      decodeURIComponent(str) {
        return urlencode.decode(str, 'gbk');
      }
    });
    return raw;
  } else if (type === 'form') {
    return qs.parse(data);
  }
  throw new Error(`not support type ${type}`);
};

exports.isValid = function (val) {
  return !!(val && REG_VALID_CHAR.test(val));
};

exports.checkParameters = function (dataIds, group, datumId) {
  if (Array.isArray(dataIds)) {
    const invalidDataIds = dataIds.filter(function (dataId) {
      return !exports.isValid(dataId);
    });
    assert(invalidDataIds.length === 0, `[dataId] only allow digital, letter and symbols in [ "_", "-", ".", ":" ], but got ${invalidDataIds}`);
  } else {
    assert(dataIds && exports.isValid(dataIds), `[dataId] only allow digital, letter and symbols in [ "_", "-", ".", ":" ], but got ${dataIds}`);
  }
  assert(group && exports.isValid(group), `[group] only allow digital, letter and symbols in [ "_", "-", ".", ":" ], but got ${group}`);
  if (datumId) {
    assert(exports.isValid(datumId), `[datumId] only allow digital, letter and symbols in [ "_", "-", ".", ":" ], but got ${datumId}`);
  }
};

exports.random = function (length) {
  return Math.floor(Math.random() * length);
};
