'use strict';

/* Dependencies */
const exec = require('child_process').exec;
const https = require('https');

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

const delay = async (time) => {
	return new Promise((resolve) => {
		setTimeout(resolve, time);
	});
};

const getCountryIPBlocks = async (sourceTemplate, isoCode) => {
	return new Promise((resolve, reject) => {
		https.get(sourceTemplate.replace('{isoCode}', isoCode), (res) => {
			let results = '';

			res.on('data', (chunk) => {
				results += chunk.toString();
			});

			res.on('end', () => {
				resolve(results.trim().split('\n'));
			});
		}).on('error', reject);
	});
};

const _iptables = async (cli) => {
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

/* Export */
module.exports = {
	createIptablesChain,
	delay,
	getCountryIPBlocks,
	iptables
};
