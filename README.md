iptables-country-block
======================

```
[sudo] node main.js "<country iso codes, space delimited>"[ "<iptables chain name>"[ "<url template of ip block sources>"]]
[sudo] node main.js "ru cn" "countryipblock" "https://raw.githubusercontent.com/herrbischoff/country-ip-blocks/master/ipv4/{isoCode}.cidr"
```
