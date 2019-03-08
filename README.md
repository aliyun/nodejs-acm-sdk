# Alibaba Cloud ACM client for Node.js

[![npm version](https://badge.fury.io/js/@alicloud%2facm-sdk.svg)](https://badge.fury.io/js/@alicloud%2facm-sdk.svg)
[![Build Status](https://api.travis-ci.org/aliyun/nodejs-acm-sdk.png?branch=master)](https://travis-ci.org/aliyun/nodejs-acm-sdk)
[![codecov](https://codecov.io/gh/aliyun/nodejs-acm-sdk/branch/master/graph/badge.svg)](https://codecov.io/gh/aliyun/nodejs-acm-sdk)
[![license](https://img.shields.io/github/license/mashape/apistatus.svg)](LICENSE)



## Installation

```bash
npm install @alicloud/acm-sdk
```

**Node.js >= 8.5.0** required.

## Usage

### Client with accessKeyId & accessKeySecret

```js
const AcmClient = require('@alicloud/acm-sdk');
const client = new AcmClient({
  endpoint: 'acm.aliyun.com', // check this from acm console
  namespace: '***************', // check this from acm console
  accessKeyId: '***************', // check this from acm console
  accessKeySecret: '***************', // check this from acm console
  requestTimeout: 6000, // timeout(ms)，default 6s
});
```

### Client with sdk credentials

**Attention:** acm only supports directly accessKeyId & accessKeySecret credential

Credentials file example (~/.alibabacloud/credentials):

```bash
[acm-demo]
enable = true
type = access_key
access_key_id = ******
access_key_secret = ******
```

 Actually **@alicloud/credentials** will automatically load credentials from the credentials file above.

 Client example:

 ```js
const AcmClient = require('@alicloud/acm-sdk');
const Credentials = require('@alicloud/credentials');
const client = new AcmClient({
  endpoint: 'acm.aliyun.com', // check this from acm console
  namespace: '***************', // check this from acm console
  requestTimeout: 6000, // timeout(ms)，default 6s
  credential: new Credentials({ profile: 'acm-demo' })
});
```

Similarly, we also support setting explicit credentials file path like:

```js
const AcmClient = require('@alicloud/acm-sdk');
const Credentials = require('@alicloud/credentials');
const client = new AcmClient({
  endpoint: 'acm.aliyun.com', // check this from acm console
  namespace: '***************', // check this from acm console
  requestTimeout: 6000, // timeout(ms)，default 6s
  credential: new Credentials({
    credentialsFile: '/path/to/your/credential'
    profile: 'acm-demo'
  })
});
```

Please see [@alicloud/credentials docs](https://github.com/aliyun/nodejs-credentials#usage) for more information.

### Api demo

```js

async function demo() {
    // get config
    const content = await client.getConfig('test', 'DEFAULT_GROUP');
    console.log('getConfig = ', content);

    // get all configs
    const allConfig = await client.getAllConfigInfo();
    console.log('all config:', allConfig);

    // subscribe config
    client.subscribe({
        dataId: 'test',
        group: 'DEFAULT_GROUP',
    }, content => {
        console.log('config update:', content);
    });

    // publish config
    await client.publishSingle('test', 'DEFAULT_GROUP', JSON.stringify({value: 'test'}));

    // delete config
    await client.remove('test', 'DEFAULT_GROUP');

    // batch get config
    const contents = await client.batchGetConfig(['test', 'test1'], 'DEFAULT_GROUP');
    console.log('batch get configs = ', contents);
}

demo();
```



## API Doc

### Method:  `getConfig(dataId, group)`

#### Arguments

* **dataId** String - check this from acm console
* **group** String - check this from acm console

#### Returns

* **config** String - your config



### Method: `getAllConfigInfo()`

#### Returns

* **configInfoList** Array - your all config info, like `[{appName: 'xxx', dataId: 'xxx', group: 'xxx'}, ...]` , then you can get config with this info



### Method: `subscribe(info, listener)`

#### Arguments

* **info** Object
  * **dataId** String - check this from acm console
  * **group** String - check this from acm console
* **listener** Function - callback function, will be called when your acm config updated
  * **config** String - callback argument, new config



### Method: `publishSingle(dataId, group, config)`

#### Arguments

* **dataId** String - check this from acm console
* **group** String - check this from acm console
* **config** String - new config content



### Method: `unSubscribe(info, [listener])`

- **info** Object
  - **dataId** String - check this from acm console
  - **group** String - check this from acm console
- **listener** Function - optional listener, will remove all listeners if you don't set



### Method: `remove(dataId, group)`

#### Arguments

* **dataId** String - check this from acm console
* **group** String - check this from acm console



### Method: `batchGetConfig(dataIds, group)`

#### Arguments

* **dataIds** Array - list of acm dataId, like [dataId1, dataId2, ...], dataId must be String, you can check this from acm console
* **group** String - check this from acm console

### Returns

* **configList** Array - list of configs

## Test & Coverage

You should set environment variables before running the test or coverage. For example:

* run test

```
NAMESPACE=<your namespace> ACCESS_KEY=<your access key id> SECRET_KEY=<your secret key id> npm run test
```

* run code coverage

```
NAMESPACE=<your namespace> ACCESS_KEY=<your access key id> SECRET_KEY=<your secret key id> npm run cov
```

## License

[MIT](LICENSE)
