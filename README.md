# iptables-country-block

Interact with `iptables`, block whole countries based on assigned ip blocks

## Install

```
$ npm install [--global] iptables-country-block
```

## Usage

### CLI

Note: Most use cases requires `--global` installation

```
$ [sudo] iptables-country-block ["<country iso codes, space delimited>"[ "<iptables chain name>"[ "<url template of ip block sources>"]]]
$ [sudo] iptables-country-block "ru cn" "countryipblock" "https://raw.githubusercontent.com/herrbischoff/country-ip-blocks/master/ipv4/{isoCode}.cidr"
```

### Require
```js
const {
	createIptablesChain,
	getCountryIPBlocks,
	iptables
} = require('iptables-country-block');

await iptables('-N somechain');
// or await createIptablesChain('somechain');

const ipBlocks = await getCountryIPBlocks(
	'https://raw.githubusercontent.com/herrbischoff/country-ip-blocks/master/ipv4/{isoCode}.cidr',
	'cn'
);

for(let i = 0; i < ipBlocks.length; ++i){
	await iptables('-A somechain -s ' + ipBlocks[i] + ' -j DROP');
}


await iptables('-I INPUT -j somechain');
await iptables('-I OUTPUT -j somechain');
await iptables('-I FORWARD -j somechain');
```
