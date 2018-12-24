'use strict';

const crypto = require('crypto');
const qs = require('querystring');

const { random } = require('utility');

const helper = require('./helper');
const UNITS = Symbol.for('#UNITS');

const LINE_SEPARATOR = String.fromCharCode(1);
const WORD_SEPARATOR = String.fromCharCode(2);

class ACMBase {
  constructor(config) {
    if (!config) {
      throw new Error('config must be passed in');
    }

    const endpoint = config.endpoint;
    if (!endpoint) {
      throw new Error('config.endpoint must be passed in');
    }
    this.__endpoint = endpoint;

    const namespace = config.namespace;
    if (!namespace) {
      throw new Error('config.namespace must be passed in');
    }
    this.__namespace = namespace;

    const accessKeyId = config.accessKey;
    if (!accessKeyId) {
      throw new Error('config.accessKeyId must be passed in');
    }
    this.__accessKeyId = accessKeyId;

    const secretKey = config.secretKey;
    if (!secretKey) {
      throw new Error('config.secretKey must be passed in');
    }
    this.secretKey = secretKey;

    this[UNITS] = null;
    this.__default_unit_server = '/diamond-server/diamond';

    this.__longpullingtimeout = config.longpullingtimeout || '30000';
  }

  async refreshServerList(options = {}, runtime = {}) {
    const unit = options.unit;
    const server = unit ? `/diamond-server/diamond-unit-${unit}?nofix=1` : `/diamond-server/diamond`;
    try {
      const list = await this.getServerList(server, runtime);
      this[UNITS] = list.split('\n').map(unit => unit.trim()).filter(unit => unit);
    } catch (e) {
      console.error(`refresh server list error: ${e}`);
    }
  }

  get units() {
    return this[UNITS];
  }

  set units(units) {
    this[UNITS] = units;
  }

  async __text(response) {
    const body = await helper.parseGBK(response);
    return String(body);
  }

  async __json(response) {
    const body = await helper.parseGBK(response);
    try {
      return JSON.parse(body);
    } catch (e) {
      throw new Error(`return value must be json: ${body}`);
    }
  }

  __default(par, def) {
    return par || def;
  }

  __default_number(par, def) {
    return !isNaN(par) && par !== null ? par : def;
  }

  __to_form(body) {
    return qs.stringify(body);
  }

  __to_string(data) {
    if (!Array.isArray(data)) {
      return '';
    }
    return data.join(WORD_SEPARATOR);
  }

  __encode(body) {
    return helper.encodingParams(body);
  }

  __to_bool(val) {
    return val.includes('OK');
  }

  __is_5xx(response) {
    return response.statusCode >= 500;
  }

  __to_array(val) {
    return val.split('\n').map(unit => unit.trim()).filter(unit => unit);
  }

  __content_length(request) {
    return Buffer.byteLength(request.body);
  }

  __get_host() {
    const list = this[UNITS];
    if (!Array.isArray(list) || !list.length) {
      throw new Error(`server list is empty!`);
    }
    const index = random(list.length);
    return list[index];
  }

  __get_timestamp() {
    return String(Date.now());
  }

  __get_signature(request, decode) {
    let data = {};
    if (request.query) {
      data = request.query;
    }
    if (request.body) {
      data = request.body;
      if (decode === 'encode' || decode === 'form') {
        data = helper.decodeBody(data, decode);
      }
    }
    let signStr = data.tenant || this.__namespace;
    if (data.group && data.tenant) {
      signStr = data.tenant + '+' + data.group;
    } else if (data.group) {
      signStr = data.group;
    }
    const { headers } = request;
    const signature = crypto.createHmac('sha1', this.secretKey)
      .update(signStr + '+' + headers.timestamp).digest()
      .toString('base64');
    return signature;
  }

  __parseProbe(value) {
    if (!value || typeof value !== 'object') {
      return '';
    }
    const tenant = this.__namespace;
    value.tenant = value.tenant || tenant;
    const probeUpdate = [];
    const { dataId, group, contentMD5 } = value;
    probeUpdate.push(dataId, WORD_SEPARATOR);
    probeUpdate.push(group, WORD_SEPARATOR);

    if (tenant) {
      probeUpdate.push(contentMD5, WORD_SEPARATOR);
      probeUpdate.push(tenant, LINE_SEPARATOR);
    } else {
      probeUpdate.push(contentMD5, LINE_SEPARATOR);
    }
    return { 'Probe-Modify-Request': probeUpdate.join('') };
  }
}

module.exports = ACMBase;
