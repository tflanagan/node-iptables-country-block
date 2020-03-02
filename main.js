'use strict';

/* Config */
const countries = process.argv[2].split(' ');
const iptablesListName = process.argv[3] || 'countryipblock';

/* Dependencies */
const got = require('got');
const exec = require('child_process').exec;

/* Functions */
const createIptablesChain = async (chainName) => {
	try {
		await iptables('-N ' + chainName);
	}catch(err){
		if(!err.message.match(/Chain already exists/)){
			throw err;
		}
	}
};

const delay = (time) => {
	return new Promise((resolve) => {
		setTimeout(resolve, time);
	});
};

const getCountryIPBlocks = async (isoCode) => {
	const response = await got([
		'https://raw.githubusercontent.com/herrbischoff/country-ip-blocks/master/ipv4/',
		isoCode,
		'.cidr'
	].join(''));

	return Promise.resolve(response.body.trim().split('\n'));
};

const _iptables = (cli) => {
	return new Promise((resolve, reject) => {
		exec('iptables ' + cli, (err, stdout, stderr) => {
			if(err){
				return reject(err);
			}else
			if(stderr){
				return reject(new Error(stderr));
			}

			resolve(stdout);
		});
	});
};

const iptables = async (cli) => {
	try {
		return await _iptables(cli);
	}catch(err){
		if(err.message && err.message.match(/Another app is currently holding the xtables lock/)){
			await delay(3000);

			return await iptables(cli);
		}

		throw err;
	};
};

/* Bang! */
(async () => {
	console.log('Creating country block table list...');

	createIptablesChain(iptablesListName);

	console.log('Flushing existing rules...');

	await iptables('--flush ' + iptablesListName);

	console.log('Processing configured countries...');

	for(let i = 0; i < countries.length; ++i){
		const isoCode = countries[i];

		console.log('%d/%d: Processing country code "%s"...', i, countries.length, isoCode);

		const ipBlocks = await getCountryIPBlocks(isoCode);

		console.log('Found %d ip blocks', ipBlocks.length);

		for(let o = 0; o < ipBlocks.length; ++o){
			const ipBlock = ipBlocks[o];

			console.log('%d/%d %s %d/%d: Adding ip block %s', i, countries.length, isoCode, o, ipBlocks.length, ipBlock);

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
	console.log('@weekly node %s/main.js "%s" "%s"', __dirname, countries.join(' '), iptablesListName);

	return true;
})();
