# Aliyun ACM Client for Node.js

[![npm version](https://badge.fury.io/js/@alicloud%2facm-sdk.svg)](https://badge.fury.io/js/@alicloud%2facm-sdk.svg)
[![Build Status](https://api.travis-ci.org/aliyun-node/nodejs-acm-sdk.png?branch=master)](https://travis-ci.org/aliyun-node/nodejs-acm-sdk)
[![codecov](https://codecov.io/gh/aliyun-node/nodejs-acm-sdk/branch/master/graph/badge.svg)](https://codecov.io/gh/aliyun-node/nodejs-acm-sdk)
[![license](https://img.shields.io/github/license/mashape/apistatus.svg)](LICENSE)



## Installation

```bash
npm install @alicloud/acm-sdk
```

**Node.js >= 8.5.0** required.



## Usage

```js
const ACMClient = require('@alicloud/acm-sdk');

const acm = new ACMClient({
  endpoint: 'acm.aliyun.com', // check this from acm console
  namespace: '***************', // check this from acm console
  accessKey: '***************', // check this from acm console
  secretKey: '***************', // check this from acm console
  requestTimeout: 6000, // timeout(ms)，default 6s
});

async function demo() {
	// get config
	const content = await acm.getConfig('test', 'DEFAULT_GROUP');
	console.log('getConfig = ', content);

    // get all configs
	const allConfig = await amc.getAllConfigInfo();
    console.log('all config:', allConfig);

    // subscribe config
	await acm.subscribe({
        dataId: 'test',
        group: 'DEFAULT_GROUP',
    }, content => {
        console.log('config update:', content);
	});

    // publish config
    await acm.publishSingle('test', 'DEFAULT_GROUP', JSON.stringify({value: 'test'}));

    // delete config
	await acm.remove('test', 'DEFAULT_GROUP');

    // batch get config
	const contents = await amc.batchGetConfig(['test', 'test1'], 'DEFAULT_GROUP');
    console.log('batch get configs = ', contents);
}
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



## License

[MIT](LICENSE)