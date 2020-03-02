#!/usr/bin/env node

'use strict';

/* Dependencies */
const {
	createIptablesChain,
	delay,
	getCountryIPBlocks,
	iptables
} = require('../');

/* Bang */
(async () => {
	const countries = (process.argv[2] || '').split(' ');
	const iptablesListName = process.argv[3] || 'countryipblock';
	const countryIpBlockSource = process.argv[4] || 'https://raw.githubusercontent.com/herrbischoff/country-ip-blocks/master/ipv4/{isoCode}.cidr';

	console.log('Creating country block table list...');

	createIptablesChain(iptablesListName);

	console.log('Flushing existing rules...');

	await iptables('--flush ' + iptablesListName);

	console.log('Processing configured countries...');

	for(let i = 0; i < countries.length; ++i){
		const isoCode = countries[i];

		console.log('%d/%d: Processing country code "%s"...', i + 1, countries.length, isoCode);

		const ipBlocks = await getCountryIPBlocks(countryIpBlockSource, isoCode);

		console.log('Found %d ip blocks', ipBlocks.length);

		for(let o = 0; o < ipBlocks.length; ++o){
			const ipBlock = ipBlocks[o];

			console.log('%d/%d %s %d/%d: Adding ip block %s', i + 1, countries.length, isoCode, o + 1, ipBlocks.length, ipBlock);

			await iptables([
				'-A',
				iptablesListName,
				'-s',
				ipBlock,
				'-j DROP'
			].join(' '));
		}

		console.log('Done processing country code %s', isoCode);
	}

	console.log('Done processing configured country codes');

	console.log('Attempting to remove existing country block table list...');

	try { await iptables('-D INPUT -j ' + iptablesListName); }catch(ignore){}
	try { await iptables('-D OUTPUT -j ' + iptablesListName); }catch(ignore){}
	try { await iptables('-D FORWARD -j ' + iptablesListName); }catch(ignore){}

	console.log('Adding country block table list...');

	await iptables('-I INPUT -j ' + iptablesListName);
	await iptables('-I OUTPUT -j ' + iptablesListName);
	await iptables('-I FORWARD -j ' + iptablesListName);

	console.log('Done');
	console.log('Recommended to install a cronjob for updating these rules');
	console.log('@weekly iptables-country-block "%s" "%s" "%s"', countries.join(' '), iptablesListName, countryIpBlockSource);

	return true;
})();
