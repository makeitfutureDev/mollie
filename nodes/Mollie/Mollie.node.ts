import {
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
	ILoadOptionsFunctions,
	INodePropertyOptions,
} from 'n8n-workflow';

export class Mollie implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Mollie',
		name: 'mollie',
		icon: 'file:mollie.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with Mollie payment API',
		defaults: {
			name: 'Mollie',
		},
		inputs: ['main' as NodeConnectionType],
		outputs: ['main' as NodeConnectionType],
		codex: {
			categories: ['Finance & Accounting'],
			subcategories: {
				'Finance & Accounting': ['Payment Processing'],
			},
			resources: {
				primaryDocumentation: [
					{
						url: 'https://docs.mollie.com',
					},
				],
			},
		},
		credentials: [
			{
				name: 'mollieApi',
				required: true,
				displayOptions: {
					show: {
						authentication: ['apiKey'],
					},
				},
			},
			{
				name: 'mollieOAuth2Api',
				required: true,
				displayOptions: {
					show: {
						authentication: ['oAuth2'],
					},
				},
			},
		],
		requestDefaults: {
			baseURL: 'https://api.mollie.com',
			headers: {
				Accept: 'application/json',
			    'User-Agent': 'n8n-nodes-mollie/1.0.6'
			},
		},
		properties: [
			{
				displayName: 'Authentication',
				name: 'authentication',
				type: 'options',
				options: [
					{
						name: 'API Key',
						value: 'apiKey',
					},
					{
						name: 'OAuth2',
						value: 'oAuth2',
					},
				],
				default: 'apiKey',
				description: 'Authentication method to use',
			},
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Balance',
						value: 'balance',
					},
					{
						name: 'Payment',
						value: 'payment',
					},
					{
						name: 'Payment Link',
						value: 'paymentLink',
					},
				],
				default: 'payment',
			},
			// Balance Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['balance'],
					},
				},
				options: [
					{
						name: 'Get Many Transactions',
						value: 'getTransactions',
						description: 'Get many balance transactions',
						action: 'Get many balance transactions',
						routing: {
							request: {
								method: 'GET',
								url: '=/v2/balances/{{$parameter.balanceId}}/transactions',
							},
							output: {
								postReceive: [
									{
										type: 'rootProperty',
										properties: {
											property: '_embedded.balance_transactions',
										},
									},
									{
										type: 'set',
										properties: {
											value: '={{ $response.body._embedded.balance_transactions.map(item => ({ ...item, createdAt: new Date(item.createdAt) })) }}',
										},
									},
								],
							},
							send: {
								paginate: true,
								preSend: [
									async function (this, requestOptions) {
										const limit = this.getNodeParameter('limit', 0) as number;
										const fromParam = this.getNodeParameter('from', 0);
										const from = fromParam ? String(fromParam) : '';
										
										requestOptions.qs = requestOptions.qs || {};
										requestOptions.qs.limit = Math.min(limit, 250);
										
										if (from) {
											requestOptions.qs.from = from;
										}
										
										return requestOptions;
									},
								],
							},
						},
					},
				],
				default: 'getTransactions',
			},
			// Payment Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['payment'],
					},
				},
				options: [
					{
						name: 'Create',
						value: 'create',
						description: 'Create a payment',
						action: 'Create a payment',
						routing: {
							request: {
								method: 'POST',
								url: '/v2/payments',
								body: {
									amount: {
										value: '={{parseFloat($parameter.amount || 0).toFixed(2)}}',
										currency: '={{$parameter.currency}}',
									},
									description: '={{$parameter.description}}',
									redirectUrl: '={{$parameter.redirectUrl}}',
									// Only include profileId for OAuth2
									profileId: '={{$parameter.authentication === "oAuth2" ? $parameter.profileId : undefined}}',
									webhookUrl: '={{$parameter.additionalFields?.webhookUrl || undefined}}',
									captureMode: '={{$parameter.additionalFields?.captureMode || undefined}}',
									sequenceType: '={{$parameter.additionalFields?.sequenceType || undefined}}',
									locale: '={{$parameter.additionalFields?.locale || undefined}}',
									method: '={{$parameter.additionalFields?.method || undefined}}',
									restrictPaymentMethodsToCountry: '={{$parameter.additionalFields?.restrictPaymentMethodsToCountry || undefined}}',
									customerId: '={{$parameter.additionalFields?.customerId || undefined}}',
									mandateId: '={{$parameter.additionalFields?.mandateId || undefined}}',
									metadata: '={{$parameter.additionalFields?.metadata || undefined}}',
								},
							},
							send: {
								preSend: [
									async function (this, requestOptions) {
										const authentication = this.getNodeParameter('authentication', 0) as string;
										
										// Only include testmode for OAuth2 - read from credential
										if (authentication === 'oAuth2') {
											const credentials = await this.getCredentials('mollieOAuth2Api');
											const testMode = credentials.testMode === true;
											if (testMode) {
												requestOptions.body = requestOptions.body || {};
												requestOptions.body.testmode = true;
											}
										}
										
										return requestOptions;
									},
								],
							},
						},
					},
					{
						name: 'Create Capture',
						value: 'createCapture',
						description: 'Capture an authorized payment',
						action: 'Create a payment capture',
						routing: {
							request: {
								method: 'POST',
								url: '=/v2/payments/{{$parameter.paymentId}}/captures',
								body: {
									amount: {
										value: '={{$parameter.amount ? parseFloat($parameter.amount).toFixed(2) : undefined}}',
										currency: '={{$parameter.amount ? $parameter.currency : undefined}}',
									},
									description: '={{$parameter.description || undefined}}',
									metadata: '={{$parameter.metadata || undefined}}',
								},
							},
							send: {
								preSend: [
									async function (this, requestOptions) {
										const authentication = this.getNodeParameter('authentication', 0) as string;
										
										// Only include testmode for OAuth2 - read from credential
										if (authentication === 'oAuth2') {
											const credentials = await this.getCredentials('mollieOAuth2Api');
											const testMode = credentials.testMode === true;
											if (testMode) {
												requestOptions.body = requestOptions.body || {};
												requestOptions.body.testmode = true;
											}
										}
										
										return requestOptions;
									},
								],
							},
						},
					},
					{
						name: 'Create Refund',
						value: 'createRefund',
						description: 'Create a payment refund',
						action: 'Create a payment refund',
						routing: {
							request: {
								method: 'POST',
								url: '=/v2/payments/{{$parameter.paymentId}}/refunds',
								body: {
									amount: {
										value: '={{parseFloat($parameter.amount || 0).toFixed(2)}}',
										currency: '={{$parameter.currency}}',
									},
									description: '={{$parameter.description || undefined}}',
									reverseRouting: '={{$parameter.additionalFields?.reverseRouting || undefined}}',
									routingReversals: '={{ $parameter.additionalFields?.routingReversals?.reversalValues ? $parameter.additionalFields.routingReversals.reversalValues.map(r => ({ amount: { value: parseFloat(r.amountValue || 0).toFixed(2), currency: r.amountCurrency }, source: { type: r.sourceType, organizationId: r.organizationId } })) : undefined }}',
									metadata: '={{$parameter.additionalFields?.metadata || undefined}}',
								},
							},
							send: {
								preSend: [
									async function (this, requestOptions) {
										const authentication = this.getNodeParameter('authentication', 0) as string;
										
										// Only include testmode for OAuth2 - read from credential
										if (authentication === 'oAuth2') {
											const credentials = await this.getCredentials('mollieOAuth2Api');
											const testMode = credentials.testMode === true;
											if (testMode) {
												requestOptions.body = requestOptions.body || {};
												requestOptions.body.testmode = true;
											}
										}
										
										return requestOptions;
									},
								],
							},
						},
					},
					{
						name: 'Get',
						value: 'get',
						description: 'Get a payment by ID',
						action: 'Get a payment',
						routing: {
							request: {
								method: 'GET',
								url: '=/v2/payments/{{$parameter.paymentId}}',
							},
							send: {
								preSend: [
									async function (this, requestOptions) {
										const authentication = this.getNodeParameter('authentication', 0) as string;
										
										// Only include testmode for OAuth2 - read from credential
										if (authentication === 'oAuth2') {
											const credentials = await this.getCredentials('mollieOAuth2Api');
											const testMode = credentials.testMode === true;
											if (testMode) {
												requestOptions.qs = requestOptions.qs || {};
												requestOptions.qs.testmode = true;
											}
										}
										
										return requestOptions;
									},
								],
							},
						},
					},
					{
						name: 'Get Many',
						value: 'getAll',
						description: 'Get many payments',
						action: 'Get many payments',
						routing: {
							request: {
								method: 'GET',
								url: '/v2/payments',
							},
							output: {
								postReceive: [
									{
										type: 'rootProperty',
										properties: {
											property: '_embedded.payments',
										},
									},
								],
							},
							send: {
								preSend: [
									async function (this, requestOptions) {
										const limitParam = this.getNodeParameter('limit', 0);
										const limit = limitParam ? Number(limitParam) : 100;
										const authentication = this.getNodeParameter('authentication', 0) as string;
										
										requestOptions.qs = requestOptions.qs || {};
										requestOptions.qs.limit = limit;
										
										// Only include testmode for OAuth2 - read from credential
										if (authentication === 'oAuth2') {
											const credentials = await this.getCredentials('mollieOAuth2Api');
											const testMode = credentials.testMode === true;
											if (testMode) {
												requestOptions.qs.testmode = true;
											}
										}
										
										return requestOptions;
									},
								],
							},
						},
					},
				],
				default: 'getAll',
			},
			// Payment Link Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['paymentLink'],
					},
				},
				options: [
					{
						name: 'Create',
						value: 'create',
						description: 'Create a payment link',
						action: 'Create a payment link',
						routing: {
							request: {
								method: 'POST',
								url: '/v2/payment-links',
								body: {
									description: '={{$parameter.description}}',
									amount: {
										value: '={{parseFloat($parameter.amount || 0).toFixed(2)}}',
										currency: '={{$parameter.currency}}',
									},
									// Only include profileId for OAuth2
									profileId: '={{$parameter.authentication === "oAuth2" ? $parameter.profileId : undefined}}',
									redirectUrl: '={{$parameter.redirectUrl || undefined}}',
									webhookUrl: '={{$parameter.webhookUrl || undefined}}',
									expiresAt: '={{$parameter.expiresAt ? new Date($parameter.expiresAt).toISOString() : undefined}}',
								},
							},
							send: {
								preSend: [
									async function (this, requestOptions) {
										const authentication = this.getNodeParameter('authentication', 0) as string;
										
										// Only include testmode for OAuth2 - read from credential
										if (authentication === 'oAuth2') {
											const credentials = await this.getCredentials('mollieOAuth2Api');
											const testMode = credentials.testMode === true;
											if (testMode) {
												requestOptions.body = requestOptions.body || {};
												requestOptions.body.testmode = true;
											}
										}
										
										return requestOptions;
									},
								],
							},
						},
					},
				],
				default: 'create',
			},
			// Balance Transaction parameters
			{
				displayName: 'Balance',
				name: 'balanceId',
				type: 'options',
				required: true,
				displayOptions: {
					show: {
						resource: ['balance'],
						operation: ['getTransactions'],
						authentication: ['oAuth2'],
					},
				},
				typeOptions: {
					loadOptionsMethod: 'getBalances',
				},
				default: '',
				description: 'The balance to retrieve transactions for',
			},
			{
				displayName: 'Balance ID',
				name: 'balanceId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['balance'],
						operation: ['getTransactions'],
						authentication: ['apiKey'],
					},
				},
				default: '',
				placeholder: 'bal_gVMhHKqSSRYJyPsuoPNFH',
				description: 'The ID of the balance to retrieve transactions for. You can also use "primary" for your primary balance.',
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				required: true,
				displayOptions: {
					show: {
						resource: ['balance'],
						operation: ['getTransactions'],
					},
				},
				typeOptions: {
					minValue: 1,
					maxValue: 250,
				},
				default: 100,
				description: 'The maximum number of results to be worked with during one execution cycle',
			},
			{
				displayName: 'From',
				name: 'from',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['balance'],
						operation: ['getTransactions'],
					},
				},
				default: '',
				placeholder: 'baltr_QM24QwzUWR4ev4Xfgyt29A',
				description: 'Please enter a balance transaction ID to offset from',
			},
			// Create Payment parameters
			{
				displayName: 'Amount',
				name: 'amount',
				type: 'number',
				required: true,
				displayOptions: {
					show: {
						resource: ['payment'],
						operation: ['create'],
					},
				},
				default: 0,
				description: 'The amount in the selected currency',
				typeOptions: {
					minValue: 0,
				},
			},
			{
				displayName: 'Currency',
				name: 'currency',
				type: 'options',
				required: true,
				displayOptions: {
					show: {
						resource: ['payment'],
						operation: ['create'],
					},
				},
				default: 'EUR',
				description: 'The currency for the payment',
				options: [
					{ name: 'Euro', value: 'EUR' },
					{ name: 'United States dollar', value: 'USD' },
					{ name: 'Pound sterling', value: 'GBP' },
					{ name: 'Swiss franc', value: 'CHF' },
					{ name: 'Canadian dollar', value: 'CAD' },
					{ name: 'Australian dollar', value: 'AUD' },
					{ name: 'Japanese yen', value: 'JPY' },
					{ name: 'Danish krone', value: 'DKK' },
					{ name: 'Norwegian krone', value: 'NOK' },
					{ name: 'Swedish krona', value: 'SEK' },
					{ name: 'Polish złoty', value: 'PLN' },
					{ name: 'Czech koruna', value: 'CZK' },
					{ name: 'Hungarian forint', value: 'HUF' },
					{ name: 'Romanian leu', value: 'RON' },
					{ name: 'Bulgarian lev', value: 'BGN' },
					{ name: 'Brazilian real', value: 'BRL' },
					{ name: 'Mexican peso', value: 'MXN' },
					{ name: 'South African rand', value: 'ZAR' },
					{ name: 'Indian rupee', value: 'INR' },
					{ name: 'Singapore dollar', value: 'SGD' },
					{ name: 'Hong Kong dollar', value: 'HKD' },
					{ name: 'New Zealand dollar', value: 'NZD' },
					{ name: 'South Korean won', value: 'KRW' },
					{ name: 'Turkish lira', value: 'TRY' },
					{ name: 'Russian ruble', value: 'RUB' },
					{ name: 'Israeli new shekel', value: 'ILS' },
				],
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['payment'],
						operation: ['create'],
					},
				},
				default: '',
				description: 'A description of the payment',
			},
			{
				displayName: 'Redirect URL',
				name: 'redirectUrl',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['payment'],
						operation: ['create'],
					},
				},
				default: '',
				description: 'The URL to redirect to after payment',
			},
			// OAuth2-specific parameters for Create Payment
			{
				displayName: 'Profile',
				name: 'profileId',
				type: 'options',
				required: true,
				displayOptions: {
					show: {
						resource: ['payment'],
						operation: ['create'],
						authentication: ['oAuth2'],
					},
				},
				typeOptions: {
					loadOptionsMethod: 'getProfiles',
				},
				default: '',
				description: 'The profile this payment belongs to (required for OAuth2)',
			},
			// Advanced parameters for Create Payment
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: {
						resource: ['payment'],
						operation: ['create'],
					},
				},
				options: [
					{
						displayName: 'Webhook URL',
						name: 'webhookUrl',
						type: 'string',
						default: '',
						description: 'Set the webhook URL, where you will receive payment status updates',
					},
					{
						displayName: 'Capture Mode',
						name: 'captureMode',
						type: 'options',
						default: 'automatic',
						options: [
							{
								name: 'Automatic',
								value: 'automatic',
								description: 'Capture payment automatically (default)',
							},
							{
								name: 'Manual',
								value: 'manual',
								description: 'Authorization only - capture later using Create Capture operation',
							},
						],
						description: 'Whether to capture the payment automatically or manually. Manual mode requires later capture via the Create Capture operation.',
					},
					{
						displayName: 'Sequence Type',
						name: 'sequenceType',
						type: 'options',
						default: 'oneoff',
						options: [
							{
								name: 'One Off',
								value: 'oneoff',
							},
							{
								name: 'First',
								value: 'first',
							},
							{
								name: 'Recurring',
								value: 'recurring',
							},
						],
						description: 'Indicate which type of payment this is',
					},
					{
						displayName: 'Locale',
						name: 'locale',
						type: 'options',
						default: '',
						options: [
							{ name: 'English (US)', value: 'en_US' },
							{ name: 'English (GB)', value: 'en_GB' },
							{ name: 'Dutch (NL)', value: 'nl_NL' },
							{ name: 'Dutch (BE)', value: 'nl_BE' },
							{ name: 'French (FR)', value: 'fr_FR' },
							{ name: 'French (BE)', value: 'fr_BE' },
							{ name: 'German (DE)', value: 'de_DE' },
							{ name: 'German (AT)', value: 'de_AT' },
							{ name: 'German (CH)', value: 'de_CH' },
							{ name: 'Spanish (ES)', value: 'es_ES' },
							{ name: 'Catalan (ES)', value: 'ca_ES' },
							{ name: 'Portuguese (PT)', value: 'pt_PT' },
							{ name: 'Italian (IT)', value: 'it_IT' },
							{ name: 'Norwegian (NO)', value: 'nb_NO' },
							{ name: 'Swedish (SE)', value: 'sv_SE' },
							{ name: 'Finnish (FI)', value: 'fi_FI' },
							{ name: 'Danish (DK)', value: 'da_DK' },
							{ name: 'Icelandic (IS)', value: 'is_IS' },
							{ name: 'Hungarian (HU)', value: 'hu_HU' },
							{ name: 'Polish (PL)', value: 'pl_PL' },
							{ name: 'Latvian (LV)', value: 'lv_LV' },
							{ name: 'Lithuanian (LT)', value: 'lt_LT' },
						],
						description: 'Locale to use for the payment screen',
					},
					{
						displayName: 'Method',
						name: 'method',
						type: 'multiOptions',
						default: [],
						options: [
							{ name: 'Apple Pay', value: 'applepay' },
							{ name: 'Bancontact', value: 'bancontact' },
							{ name: 'Bank Transfer', value: 'banktransfer' },
							{ name: 'Belfius', value: 'belfius' },
							{ name: 'Credit Card', value: 'creditcard' },
							{ name: 'Direct Debit', value: 'directdebit' },
							{ name: 'EPS', value: 'eps' },
							{ name: 'Gift Card', value: 'giftcard' },
							{ name: 'GiroPay', value: 'giropay' },
							{ name: 'iDEAL', value: 'ideal' },
							{ name: 'KBC', value: 'kbc' },
							{ name: 'MyBank', value: 'mybank' },
							{ name: 'PayPal', value: 'paypal' },
							{ name: 'PaySafeCard', value: 'paysafecard' },
							{ name: 'Przelewy24', value: 'przelewy24' },
							{ name: 'Sofort', value: 'sofort' },
						],
						description: 'Payment methods to use. Leave empty for all available methods.',
					},
					{
						displayName: 'Restrict Payment Methods To Country',
						name: 'restrictPaymentMethodsToCountry',
						type: 'string',
						default: '',
						placeholder: 'NL',
						description: 'For digital goods, you must pass the customer\'s country. ISO 3166-1 alpha-2 country code.',
					},
					{
						displayName: 'Customer ID',
						name: 'customerId',
						type: 'string',
						default: '',
						description: 'The ID of the customer for whom the payment is being created',
					},
					{
						displayName: 'Mandate ID',
						name: 'mandateId',
						type: 'string',
						default: '',
						description: 'When creating recurring payments, the ID of a specific mandate may be supplied',
					},
					{
						displayName: 'Metadata',
						name: 'metadata',
						type: 'string',
						default: '',
						description: 'Provide any data you like in JSON format. You can use up to approximately 1kB.',
						placeholder: '{"order_id": "12345"}',
					},
				],
			},
			// Create Capture parameters
			{
				displayName: 'Payment',
				name: 'paymentId',
				type: 'options',
				required: true,
				displayOptions: {
					show: {
						resource: ['payment'],
						operation: ['createCapture'],
					},
				},
				typeOptions: {
					loadOptionsMethod: 'getPayments',
				},
				default: '',
				description: 'The payment to capture. Note: Only works for payments created with captureMode: manual and status: authorized.',
			},
			{
				displayName: 'Amount',
				name: 'amount',
				type: 'number',
				displayOptions: {
					show: {
						resource: ['payment'],
						operation: ['createCapture'],
					},
				},
				default: 0,
				description: 'The amount to capture (optional - if not specified, the full authorized amount will be captured)',
				typeOptions: {
					minValue: 0,
				},
			},
			{
				displayName: 'Currency',
				name: 'currency',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['payment'],
						operation: ['createCapture'],
					},
				},
				default: 'EUR',
				description: 'The currency for the capture (required when amount is specified)',
				options: [
					{ name: 'Euro', value: 'EUR' },
					{ name: 'United States dollar', value: 'USD' },
					{ name: 'Pound sterling', value: 'GBP' },
					{ name: 'Swiss franc', value: 'CHF' },
					{ name: 'Canadian dollar', value: 'CAD' },
					{ name: 'Australian dollar', value: 'AUD' },
					{ name: 'Japanese yen', value: 'JPY' },
					{ name: 'Danish krone', value: 'DKK' },
					{ name: 'Norwegian krone', value: 'NOK' },
					{ name: 'Swedish krona', value: 'SEK' },
					{ name: 'Polish złoty', value: 'PLN' },
					{ name: 'Czech koruna', value: 'CZK' },
					{ name: 'Hungarian forint', value: 'HUF' },
					{ name: 'Romanian leu', value: 'RON' },
					{ name: 'Bulgarian lev', value: 'BGN' },
					{ name: 'Brazilian real', value: 'BRL' },
					{ name: 'Mexican peso', value: 'MXN' },
					{ name: 'South African rand', value: 'ZAR' },
					{ name: 'Indian rupee', value: 'INR' },
					{ name: 'Singapore dollar', value: 'SGD' },
					{ name: 'Hong Kong dollar', value: 'HKD' },
					{ name: 'New Zealand dollar', value: 'NZD' },
					{ name: 'South Korean won', value: 'KRW' },
					{ name: 'Turkish lira', value: 'TRY' },
					{ name: 'Russian ruble', value: 'RUB' },
					{ name: 'Israeli new shekel', value: 'ILS' },
				],
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['payment'],
						operation: ['createCapture'],
					},
				},
				default: '',
				description: 'The description of the capture',
			},
			{
				displayName: 'Metadata',
				name: 'metadata',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['payment'],
						operation: ['createCapture'],
					},
				},
				default: '',
				description: 'Provide any data you like in JSON format',
				placeholder: '{"capture_id": "12345"}',
			},
			// Create Refund parameters
			{
				displayName: 'Payment',
				name: 'paymentId',
				type: 'options',
				required: true,
				displayOptions: {
					show: {
						resource: ['payment'],
						operation: ['createRefund'],
					},
				},
				typeOptions: {
					loadOptionsMethod: 'getPayments',
				},
				default: '',
				description: 'The payment to refund',
			},
			{
				displayName: 'Amount',
				name: 'amount',
				type: 'number',
				required: true,
				displayOptions: {
					show: {
						resource: ['payment'],
						operation: ['createRefund'],
					},
				},
				default: 0,
				description: 'The amount to refund',
				typeOptions: {
					minValue: 0,
				},
			},
			{
				displayName: 'Currency',
				name: 'currency',
				type: 'options',
				required: true,
				displayOptions: {
					show: {
						resource: ['payment'],
						operation: ['createRefund'],
					},
				},
				default: 'EUR',
				description: 'The currency for the refund',
				options: [
					{ name: 'Euro', value: 'EUR' },
					{ name: 'United States dollar', value: 'USD' },
					{ name: 'Pound sterling', value: 'GBP' },
					{ name: 'Swiss franc', value: 'CHF' },
					{ name: 'Canadian dollar', value: 'CAD' },
					{ name: 'Australian dollar', value: 'AUD' },
					{ name: 'Japanese yen', value: 'JPY' },
					{ name: 'Danish krone', value: 'DKK' },
					{ name: 'Norwegian krone', value: 'NOK' },
					{ name: 'Swedish krona', value: 'SEK' },
					{ name: 'Polish złoty', value: 'PLN' },
					{ name: 'Czech koruna', value: 'CZK' },
					{ name: 'Hungarian forint', value: 'HUF' },
					{ name: 'Romanian leu', value: 'RON' },
					{ name: 'Bulgarian lev', value: 'BGN' },
					{ name: 'Brazilian real', value: 'BRL' },
					{ name: 'Mexican peso', value: 'MXN' },
					{ name: 'South African rand', value: 'ZAR' },
					{ name: 'Indian rupee', value: 'INR' },
					{ name: 'Singapore dollar', value: 'SGD' },
					{ name: 'Hong Kong dollar', value: 'HKD' },
					{ name: 'New Zealand dollar', value: 'NZD' },
					{ name: 'South Korean won', value: 'KRW' },
					{ name: 'Turkish lira', value: 'TRY' },
					{ name: 'Russian ruble', value: 'RUB' },
					{ name: 'Israeli new shekel', value: 'ILS' },
				],
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['payment'],
						operation: ['createRefund'],
					},
				},
				default: '',
				description: 'The description of the refund',
			},
			// Advanced parameters for Create Refund
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: {
						resource: ['payment'],
						operation: ['createRefund'],
					},
				},
				options: [
					{
						displayName: 'Reverse Routing',
						name: 'reverseRouting',
						type: 'boolean',
						default: false,
						description: 'Whether to reverse the routing. When creating partial refunds for split payments, you should instead use the Routing Reversals to set the amount that you want to pull back from the single routes.',
					},
					{
						displayName: 'Routing Reversals',
						name: 'routingReversals',
						type: 'fixedCollection',
						typeOptions: {
							multipleValues: true,
						},
						default: {},
						description: 'Array of routing reversals for split payment refunds',
						options: [
							{
								name: 'reversalValues',
								displayName: 'Reversal',
								values: [
									{
										displayName: 'Amount Value',
										name: 'amountValue',
										type: 'number',
										default: 0,
										description: 'The amount value to reverse',
										typeOptions: {
											minValue: 0,
										},
									},
									{
										displayName: 'Amount Currency',
										name: 'amountCurrency',
										type: 'options',
										default: 'EUR',
										description: 'The currency of the amount',
										options: [
											{ name: 'Euro', value: 'EUR' },
											{ name: 'United States dollar', value: 'USD' },
											{ name: 'Pound sterling', value: 'GBP' },
										],
									},
									{
										displayName: 'Source Type',
										name: 'sourceType',
										type: 'string',
										default: 'organization',
										description: 'The type of source. Currently only "organization" is supported.',
									},
									{
										displayName: 'Organization ID',
										name: 'organizationId',
										type: 'string',
										default: '',
										description: 'The ID of the organization',
									},
								],
							},
						],
					},
					{
						displayName: 'Metadata',
						name: 'metadata',
						type: 'string',
						default: '',
						description: 'Provide any data you like in JSON format. You can use up to approximately 1kB.',
						placeholder: '{"bookkeeping_id": "12345"}',
					},
				],
			},
			// Get Payment parameters
			{
				displayName: 'Payment',
				name: 'paymentId',
				type: 'options',
				required: true,
				displayOptions: {
					show: {
						resource: ['payment'],
						operation: ['get'],
					},
				},
				typeOptions: {
					loadOptionsMethod: 'getPayments',
				},
				default: '',
				description: 'The payment to retrieve',
			},
			// List Payments parameters
			{
				displayName: 'Return All',
				name: 'returnAll',
				type: 'boolean',
				displayOptions: {
					show: {
						resource: ['payment'],
						operation: ['getAll'],
					},
				},
				default: false,
				description: 'Whether to return all results or only up to a given limit',
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				displayOptions: {
					show: {
						resource: ['payment'],
						operation: ['getAll'],
						returnAll: [false],
					},
				},
				typeOptions: {
					minValue: 1,
					maxValue: 250,
				},
				default: 100,
				description: 'Max number of results to return',
			},
			{
				displayName: 'Filters',
				name: 'filters',
				type: 'collection',
				placeholder: 'Add Filter',
				default: {},
				displayOptions: {
					show: {
						resource: ['payment'],
						operation: ['getAll'],
					},
				},
				options: [
					{
						displayName: 'Status',
						name: 'status',
						type: 'options',
						default: '',
						description: 'Filter payments by status',
						options: [
							{
								name: 'All',
								value: '',
							},
							{
								name: 'Open',
								value: 'open',
							},
							{
								name: 'Canceled',
								value: 'canceled',
							},
							{
								name: 'Pending',
								value: 'pending',
							},
							{
								name: 'Authorized',
								value: 'authorized',
							},
							{
								name: 'Expired',
								value: 'expired',
							},
							{
								name: 'Failed',
								value: 'failed',
							},
							{
								name: 'Paid',
								value: 'paid',
							},
						],
					},
				],
			},
			// Create Payment Link parameters
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['paymentLink'],
						operation: ['create'],
					},
				},
				default: '',
				description: 'A description of the payment link',
			},
			{
				displayName: 'Amount',
				name: 'amount',
				type: 'number',
				required: true,
				displayOptions: {
					show: {
						resource: ['paymentLink'],
						operation: ['create'],
					},
				},
				default: 0,
				description: 'The amount in the selected currency',
				typeOptions: {
					minValue: 0,
				},
			},
			{
				displayName: 'Currency',
				name: 'currency',
				type: 'options',
				required: true,
				displayOptions: {
					show: {
						resource: ['paymentLink'],
						operation: ['create'],
					},
				},
				default: 'EUR',
				description: 'The currency for the payment',
				options: [
					{ name: 'Euro', value: 'EUR' },
					{ name: 'United States dollar', value: 'USD' },
					{ name: 'Pound sterling', value: 'GBP' },
					{ name: 'Swiss franc', value: 'CHF' },
					{ name: 'Canadian dollar', value: 'CAD' },
					{ name: 'Australian dollar', value: 'AUD' },
					{ name: 'Japanese yen', value: 'JPY' },
					{ name: 'Danish krone', value: 'DKK' },
					{ name: 'Norwegian krone', value: 'NOK' },
					{ name: 'Swedish krona', value: 'SEK' },
					{ name: 'Polish złoty', value: 'PLN' },
					{ name: 'Czech koruna', value: 'CZK' },
					{ name: 'Hungarian forint', value: 'HUF' },
					{ name: 'Romanian leu', value: 'RON' },
					{ name: 'Bulgarian lev', value: 'BGN' },
					{ name: 'Brazilian real', value: 'BRL' },
					{ name: 'Mexican peso', value: 'MXN' },
					{ name: 'South African rand', value: 'ZAR' },
					{ name: 'Indian rupee', value: 'INR' },
					{ name: 'Singapore dollar', value: 'SGD' },
					{ name: 'Hong Kong dollar', value: 'HKD' },
					{ name: 'New Zealand dollar', value: 'NZD' },
					{ name: 'South Korean won', value: 'KRW' },
					{ name: 'Turkish lira', value: 'TRY' },
					{ name: 'Russian ruble', value: 'RUB' },
					{ name: 'Israeli new shekel', value: 'ILS' },
				],
			},
			// OAuth2-specific parameters (conditionally displayed)
			{
				displayName: 'Profile',
				name: 'profileId',
				type: 'options',
				required: true,
				displayOptions: {
					show: {
						resource: ['paymentLink'],
						operation: ['create'],
						authentication: ['oAuth2'],
					},
				},
				typeOptions: {
					loadOptionsMethod: 'getProfiles',
				},
				default: '',
				description: 'The profile this payment link belongs to (required for OAuth2)',
			},
			// Common optional parameters
			{
				displayName: 'Redirect URL',
				name: 'redirectUrl',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['paymentLink'],
						operation: ['create'],
					},
				},
				default: '',
				description: 'The URL to redirect to after payment',
			},
			{
				displayName: 'Webhook URL',
				name: 'webhookUrl',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['paymentLink'],
						operation: ['create'],
					},
				},
				default: '',
				description: 'The webhookUrl is optional, but without a webhook you will miss out on important status changes about your payment link',
			},
			{
				displayName: 'Expires At',
				name: 'expiresAt',
				type: 'dateTime',
				displayOptions: {
					show: {
						resource: ['paymentLink'],
						operation: ['create'],
					},
				},
				default: '',
				description: 'The date and time when the payment link expires',
			},
		],
	};

	methods = {
		loadOptions: {
			async getBalances(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const authentication = this.getNodeParameter('authentication', 0) as string;
				
				// This should only be called for OAuth2 due to displayOptions, but check anyway
				if (authentication !== 'oAuth2') {
					return [
						{
							name: 'Balances dropdown only available with OAuth2',
							value: '',
						},
					];
				}
				
				// Get test mode from credentials
				const credentials = await this.getCredentials('mollieOAuth2Api');
				const testMode = credentials.testMode === true;
				
				let response;
				try {
					response = await this.helpers.httpRequestWithAuthentication.call(
						this,
						'mollieOAuth2Api',
						{
							method: 'GET',
							url: 'https://api.mollie.com/v2/balances',
							qs: {
								limit: 250,
								...(testMode && { testmode: true }),
							},
							json: true,
						},
					);
				} catch (error: any) {
					// Return error message for debugging
					const errorMessage = error.message || 'Unknown error';
					const statusCode = error.statusCode || '';
					return [
						{
							name: `Error: ${errorMessage}${statusCode ? ` (${statusCode})` : ''}`,
							value: '',
						},
					];
				}

				const balances = response._embedded?.balances || [];
				
				if (balances.length === 0) {
					return [
						{
							name: testMode ? 'No test balances available' : 'No balances available',
							value: '',
						},
					];
				}

				return balances.map((balance: any) => ({
					name: `${balance.description || balance.id} (${balance.currency} - ${balance.status})`,
					value: balance.id,
				}));
			},

			async getPayments(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const authentication = this.getNodeParameter('authentication', 0) as string;
				
				// Get test mode from credentials if OAuth2
				let testMode = false;
				if (authentication === 'oAuth2') {
					const credentials = await this.getCredentials('mollieOAuth2Api');
					testMode = credentials.testMode === true;
				}
				
				let response;
				try {
					response = await this.helpers.httpRequestWithAuthentication.call(
						this,
						authentication === 'oAuth2' ? 'mollieOAuth2Api' : 'mollieApi',
						{
							method: 'GET',
							url: 'https://api.mollie.com/v2/payments',
							qs: {
								limit: 250,
								...(testMode && { testmode: true }),
							},
							json: true,
						},
					);
				} catch (error) {
					return [
						{
							name: 'No payments found - check API credentials',
							value: '',
						},
					];
				}

				const payments = response._embedded?.payments || [];
				
				if (payments.length === 0) {
					return [
						{
							name: testMode ? 'No test payments available' : 'No payments available',
							value: '',
						},
					];
				}

				return payments.map((payment: any) => {
					const amount = payment.amount ? `${payment.amount.currency} ${payment.amount.value}` : '';
					const description = payment.description || 'No description';
					const status = payment.status || '';
					
					return {
						name: `${description} - ${amount} (${status})`,
						value: payment.id,
					};
				});
			},

			async getProfiles(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const authentication = this.getNodeParameter('authentication', 0) as string;
				
				// Get test mode from credentials if OAuth2
				let testMode = false;
				if (authentication === 'oAuth2') {
					const credentials = await this.getCredentials('mollieOAuth2Api');
					testMode = credentials.testMode === true;
				}
				
				let response;
				try {
					response = await this.helpers.httpRequestWithAuthentication.call(
						this,
						authentication === 'oAuth2' ? 'mollieOAuth2Api' : 'mollieApi',
						{
							method: 'GET',
							url: 'https://api.mollie.com/v2/profiles',
							qs: {
								limit: 250,
								...(testMode && { testmode: true }),
							},
							json: true,
						},
					);
				} catch (error) {
					return [
						{
							name: 'No profiles found - check API credentials',
							value: '',
						},
					];
				}

				const profiles = response._embedded?.profiles || [];
				
				if (profiles.length === 0) {
					return [
						{
							name: testMode ? 'No test profiles available' : 'No profiles available',
							value: '',
						},
					];
				}

				return profiles.map((profile: any) => ({
					name: profile.name || profile.id,
					value: profile.id,
				}));
			},
		},
	};
}