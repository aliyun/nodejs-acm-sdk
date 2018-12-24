'use strict';

const EventEmitter = require('events');

const ACMBaseClient = require('./acm');
const helper = require('./helper');
const SUBSCRIBE_CONFIG = Symbol.for('#SUNSCRIBE_CONFIG');
const FORMAT_KEY = Symbol.for('#FORMAT_KEY');
const SUBSCRIBELIST = Symbol.for('#SUBSCRIBELIST');

class ACMClient extends EventEmitter {
  constructor(config) {
    super();
    this.client = new ACMBaseClient(config);
    this[SUBSCRIBE_CONFIG] = new Map();
    this[SUBSCRIBELIST] = new Map();
    this.unit = config.unit || 'CURRENT_UNIT';
    this.defaultRuntimeOptions = { timeout: 10000, ignoreSSL: false };
  }

  /**
   * @description 获取配置
   * @param {String} dataId - id of the data
   * @param {String} group - group name of the data
   * @param {Object} options
   *   - {String} unit - which unit you want to connect, default is current unit
   *   - {String} tenant - namespace
   * @return {String} value
   */
  async getConfig(dataId, group, options = {}) {
    helper.checkParameters(dataId, group);
    await this.client.refreshServerList(options);
    return this.client.getConfig(dataId, group, options.tenant, this.defaultRuntimeOptions);
  }

  /**
   * @description 获取租户命名空间下所有配置
   */
  async getConfigs() {
    await this.client.refreshServerList();
    const runtimeOptions = this.defaultRuntimeOptions;
    const defaultNamespace = this.client.__namespace;
    const configInfoPage = await this.client.getAllConfigByTenant(1, 1, defaultNamespace, runtimeOptions);
    const total = configInfoPage.totalCount;
    const pageSize = 200;
    let configs = [];
    for (let i = 0; i * pageSize < total; i++) {
      const configInfo = await this.client.getAllConfigByTenant(i + 1, pageSize, defaultNamespace, this.defaultRuntimeOptions);
      configs = configs.concat(configInfo.pageItems);
    }
    return configs;
  }

  /**
   * 订阅
   * @param {Object} reg
   *   - {String} dataId - id of the data you want to subscribe
   *   - {String} [group] - group name of the data
   *   - {String} [unit] - which unit you want to connect, default is current unit
   * @param {Function} listener - listener
   * @return {DiamondClient} self
   */
  async subscribe(reg, listener) {
    const { dataId, group } = reg;
    helper.checkParameters(dataId, group);
    const key = this[FORMAT_KEY](dataId, group);
    this.on(key, listener);

    let cachedData = this[SUBSCRIBE_CONFIG].get(key);
    if (cachedData && cachedData.md5) {
      process.nextTick(() => listener(cachedData.content));
    } else {
      // 判断是否已经存在长轮询客户端，真正的订阅客户端只需要一个即可
      const info = this[SUBSCRIBELIST].get(key);
      if (info) {
        info.count++;
        this[SUBSCRIBELIST].set(key, info);
        return;
      }
      this[SUBSCRIBELIST].set(key, { count: 1 });

      // 第一次直接去取数据
      const content = await this.getConfig(dataId, group);
      cachedData = {
        dataId,
        group,
        content,
        md5: helper.getMD5String(content)
      };
      this[SUBSCRIBE_CONFIG].set(key, cachedData);
      this.emit(key, content);
      // 开启长轮询
      while (true) {
        // 判断是否需要关闭轮询
        const info = this[SUBSCRIBELIST].get(key);
        if (!info || !info.count) {
          break;
        }
        const rawData = this[SUBSCRIBE_CONFIG].get(key);
        const request = {
          dataId,
          group,
          contentMD5: rawData.md5
        };
        const change = await this.client.subscribeConfig(request, {
          timeout: 40000,
          ignoreSSL: false
        });
        if (change) {
          const newContent = await this.getConfig(dataId, group);
          const newMD5 = helper.getMD5String(newContent);
          // md5 不一样，表示确实更新了
          if (rawData.md5 !== newMD5) {
            const newData = rawData;
            newData.content = newContent;
            newData.md5 = newMD5;
            this[SUBSCRIBE_CONFIG].set(key, newData);
            this.emit(key, newContent);
          }
        }
      }
    }
    return this;
  }

  /**
   * 退订
   * @param {Object} reg
   *   - {String} dataId - id of the data you want to subscribe
   *   - {String} [group] - group name of the data
   *   - {String} [unit] - which unit you want to connect, default is current unit
   * @param {Function} listener - listener
   * @return {DiamondClient} self
   */
  unSubscribe(reg, listener) {
    const { dataId, group } = reg;
    helper.checkParameters(dataId, group);
    const key = this[FORMAT_KEY](dataId, group);
    if (listener) {
      const rawListeners = this.listenerCount(key);
      this.removeListener(key, listener);
      const nowListeners = this.listenerCount(key);
      const info = this[SUBSCRIBELIST].get(key);
      if (info) {
        // 保证是真实清空一个 listener 对应一个订阅者 count
        info.count -= rawListeners - nowListeners;
        // 订阅者清空至 0 了
        if (info.count === 0) {
          this[SUBSCRIBELIST].delete(key);
        } else {
          this[SUBSCRIBELIST].set(key, info);
        }
      }
    } else {
      this.removeAllListeners(key);
      this[SUBSCRIBELIST].delete(key);
    }
  }

  /**
   * 获取 listener
   * @param {Object} reg
   *   - {String} dataId - id of the data you want to subscribe
   *   - {String} [group] - group name of the data
   *   - {String} [unit] - which unit you want to connect, default is current unit
   * @return listeners
   */
  getListener(req) {
    const { dataId, group } = req;
    helper.checkParameters(dataId, group);
    const key = this[FORMAT_KEY](dataId, group);
    return this._events[key];
  }

  /**
   * 发布配置
   * @param {String} dataId - id of the data
   * @param {String} group - group name of the data
   * @param {String} content - config value
   * @param {Object} options
   *   - {Stirng} unit - which unit you want to connect, default is current unit
   *   - {String} tenant - namespace
   * @return {Boolean} success
   */
  async publishSingle(dataId, group, content, options = {}) {
    helper.checkParameters(dataId, group);
    await this.client.refreshServerList(options);
    return await this.client.publishConfig(dataId, group, content, options.tenant, this.defaultRuntimeOptions);
  }

  /**
   * 删除配置
   * @param {String} dataId - id of the data
   * @param {String} group - group name of the data
   * @param {Object} options
   *   - {Stirng} unit - which unit you want to connect, default is current unit
   *   - {String} tenant - namespace
   * @return {Boolean} success
   */
  async remove(dataId, group, options = {}) {
    helper.checkParameters(dataId, group);
    await this.client.refreshServerList(options);
    return await this.client.deleteConfig(dataId, group, options.tenant, this.defaultRuntimeOptions);
  }

  /**
   * 批量获取配置
   * @param {Array} dataIds - data id array
   * @param {String} group - group name of the data
   * @param {Object} options
   *   - {Stirng} unit - which unit you want to connect, default is current unit
   *   - {String} tenant - namespace
   * @return {Array} result
   */
  async batchGetConfig(dataIds, group, options = {}) {
    helper.checkParameters(dataIds, group);
    await this.client.refreshServerList(options);
    return await this.client.batchGetConfig(dataIds, group, options.tenant, this.defaultRuntimeOptions);
  }

  /**
   * 批量查询
   * @param {Array} dataIds - data id array
   * @param {String} group - group name of the data
   * @param {Object} options
   *   - {Stirng} unit - which unit you want to connect, default is current unit
   *   - {String} tenant - namespace
   * @return {Object} result
   */
  async batchQuery(dataIds, group, options = {}) {
    helper.checkParameters(dataIds, group);
    await this.client.refreshServerList(options);
    return await this.client.batchQuery(dataIds, group, options.tenant, this.defaultRuntimeOptions);
  }

  // /**
  //  * 将配置发布到所有单元
  //  * @param {String} dataId - id of the data
  //  * @param {String} group - group name of the data
  //  * @param {String} content - config value
  //  * @return {Boolean} success
  //  */
  // async publishToAllUnit(dataId, group, content) {
  //   helper.checkParameters(dataId, group);
  //   const units = await this.client.getAllUnits();
  //   await Promise.all(units.map((unit) => {
  //     return this.publishSingle(dataId, group, content, { unit });
  //   }));

  //   return true;
  // }

  // /**
  //  * 将配置从所有单元中删除
  //  * @param {String} dataId - id of the data
  //  * @param {String} group - group name of the data
  //  * @return {Boolean} success
  //  */
  // async removeToAllUnit(dataId, group) {
  //   helper.checkParameters(dataId, group);
  //   const units = await this.client.getAllUnits();
  //   await Promise.all(units.map((unit) => {
  //     return this.remove(dataId, group, { unit });
  //   }));
  //   return true;
  // }

  [FORMAT_KEY](dataId, group) {
    return `${dataId}@${group}@${this.unit}`;
  }
}

module.exports = ACMClient;
