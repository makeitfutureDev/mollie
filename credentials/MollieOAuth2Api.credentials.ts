import {
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class MollieOAuth2Api implements ICredentialType {
	name = 'mollieOAuth2Api';
	extends = ['oAuth2Api'];
	displayName = 'Mollie OAuth2 API';
	documentationUrl = 'https://docs.mollie.com/reference/authentication';
	
	properties: INodeProperties[] = [
		{
			displayName: 'Grant Type',
			name: 'grantType',
			type: 'hidden',
			default: 'authorizationCode',
		},
		{
			displayName: 'Authorization URL',
			name: 'authUrl',
			type: 'hidden',
			default: 'https://www.mollie.com/oauth2/authorize',
		},
		{
			displayName: 'Access Token URL',
			name: 'accessTokenUrl',
			type: 'hidden',
			default: 'https://api.mollie.com/oauth2/tokens',
		},
		{
			displayName: 'Scope',
			name: 'scope',
			type: 'hidden',
			default: 'organizations.read profiles.read payments.read payments.write refunds.read refunds.write balances.read customers.read mandates.read subscriptions.read invoices.read settlements.read orders.read shipments.read',
		},
		{
			displayName: 'Auth URI Query Parameters',
			name: 'authQueryParameters',
			type: 'hidden',
			default: '',
		},
		{
			displayName: 'Authentication',
			name: 'authentication',
			type: 'hidden',
			default: 'body',
		},
		{
			displayName: 'Client ID',
			name: 'clientId',
			type: 'string',
			default: 'app_kMFXHdtHbXEoGsHQNCWZDXwx',
			required: true,
			description: 'OAuth2 Client ID from your Mollie App. Create your app at: https://www.mollie.com/dashboard/developers/applications',
		},
		{
			displayName: 'Client Secret',
			name: 'clientSecret',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: 'cSzFvSgJscDDnVddx5GTSmbwd2KxH37BGGmngvrf',
			required: true,
			description: 'OAuth2 Client Secret from your Mollie App',
		},
	];
}