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
			default: '={{ "organizations.read profiles.read" + ($parameter.additionalScopes && $parameter.additionalScopes.length ? " " + $parameter.additionalScopes.join(" ") : "") }}',
			description: 'Base scopes (organizations.read, profiles.read) plus any additional scopes selected',
		},
		{
			displayName: 'Auth URI Query Parameters',
			name: 'authQueryParameters',
			type: 'hidden',
			default: 'response_type=code',
		},
		{
			displayName: 'Authentication',
			name: 'authentication',
			type: 'hidden',
			default: 'body',
		},
		{
			displayName: 'Additional Scopes',
			name: 'additionalScopes',
			type: 'multiOptions',
			default: ['payments.read', 'payments.write', 'refunds.read', 'refunds.write'],
			description: 'Select additional scopes you want to get access to. These will be added to the base scopes (organizations.read, profiles.read).',
			options: [
				{
					name: 'Payments Read',
					value: 'payments.read',
				},
				{
					name: 'Payments Write',
					value: 'payments.write',
				},
				{
					name: 'Refunds Read',
					value: 'refunds.read',
				},
				{
					name: 'Refunds Write',
					value: 'refunds.write',
				},
				{
					name: 'Customers Read',
					value: 'customers.read',
				},
				{
					name: 'Customers Write',
					value: 'customers.write',
				},
				{
					name: 'Mandates Read',
					value: 'mandates.read',
				},
				{
					name: 'Mandates Write',
					value: 'mandates.write',
				},
				{
					name: 'Subscriptions Read',
					value: 'subscriptions.read',
				},
				{
					name: 'Subscriptions Write',
					value: 'subscriptions.write',
				},
				{
					name: 'Profiles Write',
					value: 'profiles.write',
				},
				{
					name: 'Invoices Read',
					value: 'invoices.read',
				},
				{
					name: 'Settlements Read',
					value: 'settlements.read',
				},
				{
					name: 'Orders Read',
					value: 'orders.read',
				},
				{
					name: 'Orders Write',
					value: 'orders.write',
				},
				{
					name: 'Shipments Read',
					value: 'shipments.read',
				},
				{
					name: 'Shipments Write',
					value: 'shipments.write',
				},
				{
					name: 'Organizations Write',
					value: 'organizations.write',
				},
				{
					name: 'Onboarding Read',
					value: 'onboarding.read',
				},
				{
					name: 'Onboarding Write',
					value: 'onboarding.write',
				},
				{
					name: 'Balances Read',
					value: 'balances.read',
				},
			],
		},
		{
			displayName: 'Test Mode',
			name: 'testMode',
			type: 'boolean',
			default: true,
			description: 'Whether to use test mode. This adds testmode=true to API requests.',
		},
		{
			displayName: 'Client ID',
			name: 'clientId',
			type: 'string',
			// TODO BEFORE PRODUCTION: Change to environment variable
			// default: '={{ $env.MOLLIE_OAUTH_CLIENT_ID || "" }}',
			default: 'app_kMFXHdtHbXEoGsHQNCWZDXwx',
			description: 'OAuth2 Client ID. Default is the shared app (works for n8n Cloud: app.n8n.cloud). For self-hosted instances, <a href="https://www.mollie.com/dashboard/developers/applications" target="_blank">create your own app</a> and replace this value.',
		},
		{
			displayName: 'Client Secret',
			name: 'clientSecret',
			type: 'string',
			typeOptions: {
				password: true,
			},
			// TODO BEFORE PRODUCTION: Change to environment variable
			// default: '={{ $env.MOLLIE_OAUTH_CLIENT_SECRET || "" }}',
			default: 'cSzFvSgJscDDnVddx5GTSmbwd2KxH37BGGmngvrf',
			description: 'OAuth2 Client Secret. Default is the shared app (works for n8n Cloud). For self-hosted instances, replace with your own Client Secret.',
		},
	];
}