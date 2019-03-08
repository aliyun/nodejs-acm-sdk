// https://help.aliyun.com/document_detail/64131.html?spm=a2c4g.11186623.6.569.2sVfEO

module acm {

  model ProbeModifyRequest = {
    dataId: string(description="配置 ID"),
    group: string(description="配置分组"),
    contentMD5: string(description="配置内容 MD5 值"),
    tenant: string(description="租户信息，对应 ACM 的命名空间字段")
  }

  model RuntimeObject = {
    max-attempts: number,
    backoff_policy: string,
    backoff_period: number
  }

  type @default = (string, string): string
  type @default_number = (number, number): number
  type @default_unit_server = string
  type @endpoint = string
  type @text = async ($Response): string
  type @to_array = (string): [string]
  type @get_host = (): string
  type @get_timestamp = (): string
  type @get_signature = async ($Request, string): string
  type @to_form = (object): string
  type @to_string = ([string]): string
  type @content_length = ($Request): integer
  type @json = ($Response): object
  type @parseProbe = (ProbeModifyRequest): object
  type @encode = (object): string
  type @to_bool = (string): boolean
  type @is_5xx = ($Response): boolean

  /**
   * @description 获取 ACM 服务列表
   * @param server 获取 ACM 服务列表地址的服务器地址
   */
  api getServerList(server: string, runtime: RuntimeObject): string {
    port = '8080';
    method = 'GET';
    pathname = @default(server, @default_unit_server);

    headers = {
      host = @endpoint
    };
  } returns {
    if (@is_5xx(__response)) {
      retry;
    }

    return @text(__response);
  } runtime {
    timeout = 3000,
    timeouted = 'retry',
    retry = {
      retryable = true,
      policy = 'simple',
      max-attempts = @default_number(runtime.max-attempts, 3)
    },
    backoff = {
      policy = @default(runtime.backoff_policy, 'no'),
      period = @default_number(runtime.backoff_period, 1)
    }
  }

  /**
   * @description 获取当前机器所在单元
   */
  api getCurrentUnit(): string {
    port = '8080';
    method = 'GET';
    pathname = '/env';

    headers = {
      host = @endpoint
    };
  } returns {
    return @text(__response);
  }

  api getAllUnits(): [string] {
    port = '8080';
    method = 'GET';
    pathname = '/diamond-server/unit-list';

    query = {
      nofix = '1'
    };

    headers = {
      host = @endpoint
    };
  } returns {
    var text = @text(__response);
    return @to_array(text);
  }

  /**
   * @description 获取 ACM 上的配置
   * @param dataId 配置 ID
   * @param group 配置分组
   * @param tenant 租户信息，对应 ACM 的命名空间字段
   */
  api getConfig(dataId: string, group: string, tenant: string, runtime: RuntimeObject): string {
    protocol = 'https';
    method = 'GET';
    pathname = '/diamond-server/config.co';

    query = {
      dataId = dataId,
      group = group,
      tenant = @default(tenant, @namespace)
    };

    headers = {
      host = @get_host(),
      timestamp = @get_timestamp()
    };

    headers.spas-signature = @get_signature(__request, '');
  } returns {
    if (@is_5xx(__response)) {
      retry;
    }

    return @text(__response);
  } runtime {
    timeout = 10000,
    timeouted = 'retry',
    retry = {
      retryable = true,
      policy = 'simple',
      max-attempts = @default_number(runtime.max-attempts, 3)
    },
    backoff = {
      policy = @default(runtime.backoff_policy, 'no'),
      period = @default_number(runtime.backoff_period, 1)
    },
    ignoreSSL = false
  }

  api batchGetConfig(dataIds: [string], group: string, tenant: string, runtime: RuntimeObject): [string] {
    protocol = 'https';
    method = 'POST';
    pathname = '/diamond-server/config.co';

    query = {
      method = 'batchGetConfig'
    };

    body = @to_form({
      dataIds = @to_string(dataIds),
      group = group,
      tenant = @default(tenant, @namespace)
    });

    headers = {
      host = @get_host(),
      timestamp = @get_timestamp(),
      content-type = 'application/x-www-form-urlencoded;charset=GBK',
      exconfiginfo = 'true'
    };

    headers.content-length = @content_length(__request);
    headers.spas-signature = @get_signature(__request, 'form');
  } returns {
    if (@is_5xx(__response)) {
      retry;
    }

    return @json(__response);
  } runtime {
    timeout = 10000,
    timeouted = 'retry',
    retry = {
      retryable = true,
      policy = 'simple',
      max-attempts = @default_number(runtime.max-attempts, 3)
    },
    backoff = {
      policy = @default(runtime.backoff_policy, 'no'),
      period = @default_number(runtime.backoff_period, 1)
    },
    ignoreSSL = false
  }

  api batchQuery(dataIds: [string], group: string, tenant: string, runtime: RuntimeObject): [string] {
    protocol = 'https';
    method = 'POST';
    pathname = '/diamond-server/admin.do';

    query = {
      method = 'batchQuery'
    };

    body = @to_form({
      dataIds = @to_string(dataIds),
      group = group,
      tenant = @default(tenant, @namespace)
    });

    headers = {
      host = @get_host(),
      timestamp = @get_timestamp(),
      content-type = 'application/x-www-form-urlencoded;charset=GBK',
      exconfiginfo = 'true'
    };

    headers.content-length = @content_length(__request);
    headers.spas-signature = @get_signature(__request, 'form');
  } returns {
    if (@is_5xx(__response)) {
      retry;
    }

    return @json(__response);
  } runtime {
    timeout = 10000,
    timeouted = 'retry',
    retry = {
      retryable = true,
      policy = 'simple',
      max-attempts = @default_number(runtime.max-attempts, 3)
    },
    backoff = {
      policy = @default(runtime.backoff_policy, 'no'),
      period = @default_number(runtime.backoff_period, 1)
    },
    ignoreSSL = false
  }

  model ACMConfig = {
    totalCount: integer(description="总配置数"),
    pageNumber: integer(description="分页页号"),
    pagesAvailable: integer(description="可用分页数"),
    pageItems: string(description="配置元素")
  }

  /**
   * @description 获取 ACM 上命名空间的配置
   * @param pageNo 分页页号
   * @param pageSize 分页大小
   * @param tenant 租户信息，对应 ACM 的命名空间字段
   */
  api getAllConfigByTenant(pageNo: integer, pageSize: integer, tenant: string, runtime: RuntimeObject): ACMConfig {
    protocol = 'https';
    method = 'GET';
    pathname = '/diamond-server/basestone.do';

    query = {
      pageNo = pageNo,
      pageSize = pageSize,
      method = 'getAllConfigByTenant',
      tenant = @default(tenant, @namespace)
    };

    headers = {
      host = @get_host(),
      timestamp = @get_timestamp()
    };

    headers.spas-signature = @get_signature(__request, '');
  } returns {
    if (@is_5xx(__response)) {
      retry;
    }

    return @json(__response);
  } runtime {
    timeout = 10000,
    timeouted = 'retry',
    retry = {
      retryable = true,
      policy = 'simple',
      max-attempts = @default_number(runtime.max-attempts, 3)
    },
    backoff = {
      policy = @default(runtime.backoff_policy, 'no'),
      period = @default_number(runtime.backoff_period, 1)
    },
    ignoreSSL = false
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
  api subscribeConfig(request: ProbeModifyRequest, runtime: RuntimeObject): string {
    protocol = 'https';
    method = 'POST';
    pathname = '/diamond-server/config.co';

    headers = {
      host = @get_host(),
      longpullingtimeout = @longpullingtimeout,
      timestamp = @get_timestamp(),
      content-type = 'application/x-www-form-urlencoded;charset=GBK'
    };

    body = @to_form(@parseProbe(request));

    headers.content-length = @content_length(__request);
    headers.spas-signature = @get_signature(__request, 'form');
  } returns {
    if (@is_5xx(__response)) {
      retry;
    }

    return @text(__response);
  } runtime {
    timeout = 40000,
    timeouted = 'retry',
    retry = {
      retryable = true,
      policy = 'simple',
      max-attempts = @default_number(runtime.max-attempts, 3)
    },
    backoff = {
      policy = @default(runtime.backoff_policy, 'no'),
      period = @default_number(runtime.backoff_period, 1)
    },
    ignoreSSL = false
  }

  /**
   * @description 发布 ACM 上的配置
   * @param dataId 配置 ID
   * @param group 配置分组
   * @param content 配置内容
   * @param tenant 租户信息，对应 ACM 的命名空间字段
   */
  api publishConfig(dataId: string, group: string, content: string, tenant: string, runtime: RuntimeObject): boolean {
    protocol = 'https';
    method = 'POST';
    pathname = '/diamond-server/basestone.do';

    query = {
      method = 'syncUpdateAll'
    };

    headers = {
      host = @get_host(),
      timestamp = @get_timestamp(),
      content-type = 'application/x-www-form-urlencoded;charset=GBK'
    };

    body = @encode({
      dataId = dataId,
      group = group,
      content = content,
      tenant = @default(tenant, @namespace)
    });

    headers.content-length = @content_length(__request);
    headers.spas-signature = @get_signature(__request, 'encode');
  } returns {
    if (@is_5xx(__response)) {
      retry;
    }

    var text = @text(__response);
    return @to_bool(text);
  } runtime {
    timeout = 10000,
    timeouted = 'retry',
    retry = {
      retryable = true,
      policy = 'simple',
      max-attempts = @default_number(runtime.max-attempts, 3)
    },
    backoff = {
      policy = @default(runtime.backoff_policy, 'no'),
      period = @default_number(runtime.backoff_period, 1)
    },
    ignoreSSL = false
  }

  /**
   * @description 删除 ACM 上的配置
   * @param dataId 配置 ID
   * @param group 配置分组
   * @param tenant 租户信息，对应 ACM 的命名空间字段
   */
  api deleteConfig(dataId: string, group: string, tenant: string, runtime: RuntimeObject): boolean {
    protocol = 'https';
    method = 'POST';
    pathname = '/diamond-server/datum.do';

    query = {
      method = 'deleteAllDatums'
    };

    headers = {
      host = @get_host(),
      timestamp = @get_timestamp(),
      content-type = 'application/x-www-form-urlencoded;charset=GBK'
    };

    body = @encode({
      dataId = dataId,
      group = group,
      tenant = @default(tenant, @namespace)
    });

    headers.content-length = @content_length(__request);
    headers.spas-signature = @get_signature(__request, 'encode');
  } returns {
    if (@is_5xx(__response)) {
      retry;
    }

    var text = @text(__response);
    return @to_bool(text);
  } runtime {
    timeout = 10000,
    timeouted = 'retry',
    retry = {
      retryable = true,
      policy = 'simple',
      max-attempts = @default_number(runtime.max-attempts, 3)
    },
    backoff = {
      policy = @default(runtime.backoff_policy, 'no'),
      period = @default_number(runtime.backoff_period, 1)
    },
    ignoreSSL = false
  }
}
