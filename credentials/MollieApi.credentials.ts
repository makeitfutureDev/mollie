import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class MollieApi implements ICredentialType {
	name = 'mollieApi';
	displayName = 'Mollie API';
	documentationUrl = 'https://docs.mollie.com/reference/authentication';
	
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description: 'Your Mollie API Key. Get it from the <a href="https://www.mollie.com/dashboard/developers/api-keys" target="_blank">Mollie Dashboard</a>. Use test keys (test_xxx) for testing and live keys (live_xxx) for production. Test mode is automatically determined by the key prefix.',
			placeholder: 'test_xxxxxxxxxxxxxxxxxxxxxxxxxx',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.mollie.com',
			url: '/v2/methods',
			method: 'GET',
		},
	};
}