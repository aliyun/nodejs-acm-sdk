'use strict';

const {
  $send,
  $allowRetry,
  $getBackoffTime,
  $sleep,
  $retryError,
  $unableRetryError
} = require('@alicloud/http-core-sdk');
const ACMBase = require('./acm_base');

class ACMClient extends ACMBase {
  constructor(config) {
    super(config);
  }

  /**
   * @description 获取 ACM 服务列表
   * @param server 获取 ACM 服务列表地址的服务器地址
   */
  async getServerList(server, runtime) {
    const $runtime = {
      timeout: 3000,
      timeouted: 'retry',
      retry: {
        retryable: true,
        policy: 'simple',
        'max-attempts': this.__default_number(runtime['max-attempts'], 3),
      },
      backoff: {
        policy: this.__default(runtime.backoff_policy, 'no'),
        period: this.__default_number(runtime.backoff_period, 1),
      },
    };

    var $lastRequest;
    var $now = Date.now();
    for (var $retryTimes = 0; $allowRetry($runtime.retry, $retryTimes, $now); $retryTimes++) {
      if ($retryTimes > 0) {
        const $backoffTime = $getBackoffTime($runtime.backoff, $retryTimes);
        if ($backoffTime > 0) {
          await $sleep($backoffTime);
        }
      }

      try {
        const $request = {};
        $request.port = '8080';
        $request.method = 'GET';
        $request.pathname = this.__default(server, this.__default_unit_server);
        $request.headers = {
          host: this.__endpoint,
        };
        $lastRequest = $request;
        const $response = await $send($request, $runtime);

        if (this.__is_5xx($response)) {
          throw $retryError($request, $response);
        }

        return await this.__text($response);
      } catch (ex) {
        if (ex.retryable) {
          continue;
        }
        throw ex;
      }
    }

    throw $unableRetryError($lastRequest);
  }

  /**
   * @description 获取当前机器所在单元
   */
  async getCurrentUnit() {
    const $request = {};
    $request.port = '8080';
    $request.method = 'GET';
    $request.pathname = '/env';
    $request.headers = {
      host: this.__endpoint,
    };
    const $response = await $send($request);

    return await this.__text($response);
  }

  /**
   * @description 获取当前机器所在单元
   */
  async getAllUnits() {
    const $request = {};
    $request.port = '8080';
    $request.method = 'GET';
    $request.pathname = '/diamond-server/unit-list';
    $request.query = {
      nofix: '1',
    };
    $request.headers = {
      host: this.__endpoint,
    };
    const $response = await $send($request);

    var text = await this.__text($response);
    return this.__to_array(text);
  }

  /**
   * @description 获取 ACM 上的配置
   * @param dataId 配置 ID
   * @param group 配置分组
   * @param tenant 租户信息，对应 ACM 的命名空间字段
   */
  async getConfig(dataId, group, tenant, runtime) {
    const $runtime = {
      timeout: 10000,
      timeouted: 'retry',
      retry: {
        retryable: true,
        policy: 'simple',
        'max-attempts': this.__default_number(runtime['max-attempts'], 3),
      },
      backoff: {
        policy: this.__default(runtime.backoff_policy, 'no'),
        period: this.__default_number(runtime.backoff_period, 1),
      },
      ignoreSSL: false,
    };

    var $lastRequest;
    var $now = Date.now();
    for (var $retryTimes = 0; $allowRetry($runtime.retry, $retryTimes, $now); $retryTimes++) {
      if ($retryTimes > 0) {
        const $backoffTime = $getBackoffTime($runtime.backoff, $retryTimes);
        if ($backoffTime > 0) {
          await $sleep($backoffTime);
        }
      }

      try {
        const $request = {};
        $request.protocol = 'https';
        $request.method = 'GET';
        $request.pathname = '/diamond-server/config.co';
        $request.query = {
          dataId: dataId,
          group: group,
          tenant: this.__default(tenant, this.__namespace),
        };
        $request.headers = {
          host: this.__get_host(),
          'spas-accesskey': this.__accessKeyId,
          timestamp: this.__get_timestamp(),
        };
        $request.headers['spas-signature'] = this.__get_signature($request, '');
        $lastRequest = $request;
        const $response = await $send($request, $runtime);

        if (this.__is_5xx($response)) {
          throw $retryError($request, $response);
        }

        return await this.__text($response);
      } catch (ex) {
        if (ex.retryable) {
          continue;
        }
        throw ex;
      }
    }

    throw $unableRetryError($lastRequest);
  }

  /**
   * @description 获取 ACM 上的配置
   * @param dataId 配置 ID
   * @param group 配置分组
   * @param tenant 租户信息，对应 ACM 的命名空间字段
   */
  async batchGetConfig(dataIds, group, tenant, runtime) {
    const $runtime = {
      timeout: 10000,
      timeouted: 'retry',
      retry: {
        retryable: true,
        policy: 'simple',
        'max-attempts': this.__default_number(runtime['max-attempts'], 3),
      },
      backoff: {
        policy: this.__default(runtime.backoff_policy, 'no'),
        period: this.__default_number(runtime.backoff_period, 1),
      },
      ignoreSSL: false,
    };

    var $lastRequest;
    var $now = Date.now();
    for (var $retryTimes = 0; $allowRetry($runtime.retry, $retryTimes, $now); $retryTimes++) {
      if ($retryTimes > 0) {
        const $backoffTime = $getBackoffTime($runtime.backoff, $retryTimes);
        if ($backoffTime > 0) {
          await $sleep($backoffTime);
        }
      }

      try {
        const $request = {};
        $request.protocol = 'https';
        $request.method = 'POST';
        $request.pathname = '/diamond-server/config.co';
        $request.query = {
          method: 'batchGetConfig',
        };
        $request.body = this.__to_form({
          dataIds: this.__to_string(dataIds),
          group: group,
          tenant: this.__default(tenant, this.__namespace),
        });
        $request.headers = {
          host: this.__get_host(),
          'spas-accesskey': this.__accessKeyId,
          timestamp: this.__get_timestamp(),
          'content-type': 'application/x-www-form-urlencoded;charset=GBK',
          exconfiginfo: 'true',
        };
        $request.headers['content-length'] = this.__content_length($request);
        $request.headers['spas-signature'] = this.__get_signature($request, 'form');
        $lastRequest = $request;
        const $response = await $send($request, $runtime);

        if (this.__is_5xx($response)) {
          throw $retryError($request, $response);
        }

        return this.__json($response);
      } catch (ex) {
        if (ex.retryable) {
          continue;
        }
        throw ex;
      }
    }

    throw $unableRetryError($lastRequest);
  }

  /**
   * @description 获取 ACM 上的配置
   * @param dataId 配置 ID
   * @param group 配置分组
   * @param tenant 租户信息，对应 ACM 的命名空间字段
   */
  async batchQuery(dataIds, group, tenant, runtime) {
    const $runtime = {
      timeout: 10000,
      timeouted: 'retry',
      retry: {
        retryable: true,
        policy: 'simple',
        'max-attempts': this.__default_number(runtime['max-attempts'], 3),
      },
      backoff: {
        policy: this.__default(runtime.backoff_policy, 'no'),
        period: this.__default_number(runtime.backoff_period, 1),
      },
      ignoreSSL: false,
    };

    var $lastRequest;
    var $now = Date.now();
    for (var $retryTimes = 0; $allowRetry($runtime.retry, $retryTimes, $now); $retryTimes++) {
      if ($retryTimes > 0) {
        const $backoffTime = $getBackoffTime($runtime.backoff, $retryTimes);
        if ($backoffTime > 0) {
          await $sleep($backoffTime);
        }
      }

      try {
        const $request = {};
        $request.protocol = 'https';
        $request.method = 'POST';
        $request.pathname = '/diamond-server/admin.do';
        $request.query = {
          method: 'batchQuery',
        };
        $request.body = this.__to_form({
          dataIds: this.__to_string(dataIds),
          group: group,
          tenant: this.__default(tenant, this.__namespace),
        });
        $request.headers = {
          host: this.__get_host(),
          'spas-accesskey': this.__accessKeyId,
          timestamp: this.__get_timestamp(),
          'content-type': 'application/x-www-form-urlencoded;charset=GBK',
          exconfiginfo: 'true',
        };
        $request.headers['content-length'] = this.__content_length($request);
        $request.headers['spas-signature'] = this.__get_signature($request, 'form');
        $lastRequest = $request;
        const $response = await $send($request, $runtime);

        if (this.__is_5xx($response)) {
          throw $retryError($request, $response);
        }

        return this.__json($response);
      } catch (ex) {
        if (ex.retryable) {
          continue;
        }
        throw ex;
      }
    }

    throw $unableRetryError($lastRequest);
  }

  /**
   * @description 获取 ACM 上命名空间的配置
   * @param pageNo 分页页号
   * @param pageSize 分页大小
   * @param tenant 租户信息，对应 ACM 的命名空间字段
   */
  async getAllConfigByTenant(pageNo, pageSize, tenant, runtime) {
    const $runtime = {
      timeout: 10000,
      timeouted: 'retry',
      retry: {
        retryable: true,
        policy: 'simple',
        'max-attempts': this.__default_number(runtime['max-attempts'], 3),
      },
      backoff: {
        policy: this.__default(runtime.backoff_policy, 'no'),
        period: this.__default_number(runtime.backoff_period, 1),
      },
      ignoreSSL: false,
    };

    var $lastRequest;
    var $now = Date.now();
    for (var $retryTimes = 0; $allowRetry($runtime.retry, $retryTimes, $now); $retryTimes++) {
      if ($retryTimes > 0) {
        const $backoffTime = $getBackoffTime($runtime.backoff, $retryTimes);
        if ($backoffTime > 0) {
          await $sleep($backoffTime);
        }
      }

      try {
        const $request = {};
        $request.protocol = 'https';
        $request.method = 'GET';
        $request.pathname = '/diamond-server/basestone.do';
        $request.query = {
          pageNo: pageNo,
          pageSize: pageSize,
          method: 'getAllConfigByTenant',
          tenant: this.__default(tenant, this.__namespace),
        };
        $request.headers = {
          host: this.__get_host(),
          'spas-accesskey': this.__accessKeyId,
          timestamp: this.__get_timestamp(),
        };
        $request.headers['spas-signature'] = this.__get_signature($request, '');
        $lastRequest = $request;
        const $response = await $send($request, $runtime);

        if (this.__is_5xx($response)) {
          throw $retryError($request, $response);
        }

        return this.__json($response);
      } catch (ex) {
        if (ex.retryable) {
          continue;
        }
        throw ex;
      }
    }

    throw $unableRetryError($lastRequest);
  }

  /**
   * @description 监听 ACM 上的配置，以便实时感知配置变更，如果配置变更，则用获取配置接口获取配置的最新值，动态刷新本地缓存
   * @typedef {object} ProbeModifyRequest
   * @property dataId 配置 ID
   * @property group 配置分组
   * @property contentMD5 配置内容 MD5 值
   * @property tenant 租户信息，对应 ACM 的命名空间字段
   *
   * @param request 监听数据报文
   */
  async subscribeConfig(request, runtime) {
    const $runtime = {
      timeout: 40000,
      timeouted: 'retry',
      retry: {
        retryable: true,
        policy: 'simple',
        'max-attempts': this.__default_number(runtime['max-attempts'], 3),
      },
      backoff: {
        policy: this.__default(runtime.backoff_policy, 'no'),
        period: this.__default_number(runtime.backoff_period, 1),
      },
      ignoreSSL: false,
    };

    var $lastRequest;
    var $now = Date.now();
    for (var $retryTimes = 0; $allowRetry($runtime.retry, $retryTimes, $now); $retryTimes++) {
      if ($retryTimes > 0) {
        const $backoffTime = $getBackoffTime($runtime.backoff, $retryTimes);
        if ($backoffTime > 0) {
          await $sleep($backoffTime);
        }
      }

      try {
        const $request = {};
        $request.protocol = 'https';
        $request.method = 'POST';
        $request.pathname = '/diamond-server/config.co';
        $request.headers = {
          host: this.__get_host(),
          longpullingtimeout: this.__longpullingtimeout,
          'spas-accesskey': this.__accessKeyId,
          timestamp: this.__get_timestamp(),
          'content-type': 'application/x-www-form-urlencoded;charset=GBK',
        };
        $request.body = this.__to_form(this.__parseProbe(request));
        $request.headers['content-length'] = this.__content_length($request);
        $request.headers['spas-signature'] = this.__get_signature($request, 'form');
        $lastRequest = $request;
        const $response = await $send($request, $runtime);

        if (this.__is_5xx($response)) {
          throw $retryError($request, $response);
        }

        return await this.__text($response);
      } catch (ex) {
        if (ex.retryable) {
          continue;
        }
        throw ex;
      }
    }

    throw $unableRetryError($lastRequest);
  }

  /**
   * @description 发布 ACM 上的配置
   * @param dataId 配置 ID
   * @param group 配置分组
   * @param content 配置内容
   * @param tenant 租户信息，对应 ACM 的命名空间字段
   */
  async publishConfig(dataId, group, content, tenant, runtime) {
    const $runtime = {
      timeout: 10000,
      timeouted: 'retry',
      retry: {
        retryable: true,
        policy: 'simple',
        'max-attempts': this.__default_number(runtime['max-attempts'], 3),
      },
      backoff: {
        policy: this.__default(runtime.backoff_policy, 'no'),
        period: this.__default_number(runtime.backoff_period, 1),
      },
      ignoreSSL: false,
    };

    var $lastRequest;
    var $now = Date.now();
    for (var $retryTimes = 0; $allowRetry($runtime.retry, $retryTimes, $now); $retryTimes++) {
      if ($retryTimes > 0) {
        const $backoffTime = $getBackoffTime($runtime.backoff, $retryTimes);
        if ($backoffTime > 0) {
          await $sleep($backoffTime);
        }
      }

      try {
        const $request = {};
        $request.protocol = 'https';
        $request.method = 'POST';
        $request.pathname = '/diamond-server/basestone.do';
        $request.query = {
          method: 'syncUpdateAll',
        };
        $request.headers = {
          host: this.__get_host(),
          'spas-accesskey': this.__accessKeyId,
          timestamp: this.__get_timestamp(),
          'content-type': 'application/x-www-form-urlencoded;charset=GBK',
        };
        $request.body = this.__encode({
          dataId: dataId,
          group: group,
          content: content,
          tenant: this.__default(tenant, this.__namespace),
        });
        $request.headers['content-length'] = this.__content_length($request);
        $request.headers['spas-signature'] = this.__get_signature($request, 'encode');
        $lastRequest = $request;
        const $response = await $send($request, $runtime);

        if (this.__is_5xx($response)) {
          throw $retryError($request, $response);
        }

        var text = await this.__text($response);
        return this.__to_bool(text);
      } catch (ex) {
        if (ex.retryable) {
          continue;
        }
        throw ex;
      }
    }

    throw $unableRetryError($lastRequest);
  }

  /**
   * @description 删除 ACM 上的配置
   * @param dataId 配置 ID
   * @param group 配置分组
   * @param tenant 租户信息，对应 ACM 的命名空间字段
   */
  async deleteConfig(dataId, group, tenant, runtime) {
    const $runtime = {
      timeout: 10000,
      timeouted: 'retry',
      retry: {
        retryable: true,
        policy: 'simple',
        'max-attempts': this.__default_number(runtime['max-attempts'], 3),
      },
      backoff: {
        policy: this.__default(runtime.backoff_policy, 'no'),
        period: this.__default_number(runtime.backoff_period, 1),
      },
      ignoreSSL: false,
    };

    var $lastRequest;
    var $now = Date.now();
    for (var $retryTimes = 0; $allowRetry($runtime.retry, $retryTimes, $now); $retryTimes++) {
      if ($retryTimes > 0) {
        const $backoffTime = $getBackoffTime($runtime.backoff, $retryTimes);
        if ($backoffTime > 0) {
          await $sleep($backoffTime);
        }
      }

      try {
        const $request = {};
        $request.protocol = 'https';
        $request.method = 'POST';
        $request.pathname = '/diamond-server/datum.do';
        $request.query = {
          method: 'deleteAllDatums',
        };
        $request.headers = {
          host: this.__get_host(),
          'spas-accesskey': this.__accessKeyId,
          timestamp: this.__get_timestamp(),
          'content-type': 'application/x-www-form-urlencoded;charset=GBK',
        };
        $request.body = this.__encode({
          dataId: dataId,
          group: group,
          tenant: this.__default(tenant, this.__namespace),
        });
        $request.headers['content-length'] = this.__content_length($request);
        $request.headers['spas-signature'] = this.__get_signature($request, 'encode');
        $lastRequest = $request;
        const $response = await $send($request, $runtime);

        if (this.__is_5xx($response)) {
          throw $retryError($request, $response);
        }

        var text = await this.__text($response);
        return this.__to_bool(text);
      } catch (ex) {
        if (ex.retryable) {
          continue;
        }
        throw ex;
      }
    }

    throw $unableRetryError($lastRequest);
  }

}

module.exports = ACMClient;

