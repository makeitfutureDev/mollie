module.exports = {
	parser: '@typescript-eslint/parser',
	parserOptions: {
		ecmaVersion: 2020,
		sourceType: 'module',
	},
	extends: [
		'plugin:n8n-nodes-base/community',
	],
	rules: {
		// Stricter rules for publishing
		'n8n-nodes-base/node-param-display-name-miscased': 'error',
		'n8n-nodes-base/node-param-description-miscased-id': 'error',
		'n8n-nodes-base/node-param-description-wrong-for-dynamic-multi-options': 'error',
		'n8n-nodes-base/node-param-default-missing': 'error',
		'n8n-nodes-base/node-param-description-missing-final-period': 'error',
	},
};
