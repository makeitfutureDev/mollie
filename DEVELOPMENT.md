# Development Guide

This guide will help you extend the Mollie node with additional operations and maintain the codebase.

## Table of Contents

- [Project Structure](#project-structure)
- [Development Setup](#development-setup)
- [Adding New Operations](#adding-new-operations)
- [Code Style Guidelines](#code-style-guidelines)
- [Testing](#testing)
- [Building](#building)
- [Publishing](#publishing)

## Project Structure

```
n8n-nodes-mollie/
├── credentials/
│   ├── MollieApi.credentials.ts           # API Key authentication
│   └── MollieOAuth2Api.credentials.ts     # OAuth2 authentication
├── nodes/
│   └── Mollie/
│       ├── Mollie.node.ts                 # Main node implementation
│       └── mollie.svg                      # Node icon
├── .eslintrc.js                           # ESLint configuration
├── .gitignore                             # Git ignore rules
├── .prettierrc                            # Prettier configuration
├── gulpfile.js                            # Build tasks
├── index.ts                               # Package entry point
├── LICENSE                                # MIT license
├── package.json                           # Package configuration
├── README.md                              # User documentation
├── tsconfig.json                          # TypeScript configuration
└── DEVELOPMENT.md                         # This file
```

## Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/n8n-nodes-mollie.git
   cd n8n-nodes-mollie
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the project**
   ```bash
   npm run build
   ```

4. **Link to n8n (for local development)**
   ```bash
   npm link
   cd ~/.n8n/nodes
   npm link n8n-nodes-mollie
   ```

5. **Start n8n in development mode**
   ```bash
   n8n start
   ```

6. **Watch for changes** (in the project directory)
   ```bash
   npm run dev
   ```

## Adding New Operations

The architecture is designed to easily accommodate new operations. Here's how to add them:

### Example: Adding "Create Payment" Operation

#### 1. Add Operation to Node Description

In `nodes/Mollie/Mollie.node.ts`, add the new operation to the operations array:

```typescript
{
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	displayOptions: {
		show: {
			resource: ['payment'],
		},
	},
	options: [
		{
			name: 'Create',
			value: 'create',
			description: 'Create a new payment',
			action: 'Create a payment',
		},
		{
			name: 'Get',
			value: 'get',
			description: 'Get a payment by ID',
			action: 'Get a payment',
		},
		{
			name: 'Get Many',
			value: 'getAll',
			description: 'Get many payments',
			action: 'Get many payments',
		},
	],
	default: 'getAll',
},
```

#### 2. Add Operation Parameters

Add the required parameters for the operation:

```typescript
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
	typeOptions: {
		numberPrecision: 2,
		minValue: 0,
	},
	description: 'The amount to charge',
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
	options: [
		{ name: 'EUR', value: 'EUR' },
		{ name: 'USD', value: 'USD' },
		{ name: 'GBP', value: 'GBP' },
		// Add more currencies as needed
	],
	default: 'EUR',
	description: 'The currency for the payment',
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
	description: 'Payment description visible to the customer',
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
	placeholder: 'https://example.com/payment/success',
	description: 'URL to redirect customer after payment',
},
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
			placeholder: 'https://example.com/webhook',
			description: 'URL for payment status webhooks',
		},
		{
			displayName: 'Method',
			name: 'method',
			type: 'options',
			options: [
				{ name: 'Any', value: '' },
				{ name: 'Credit Card', value: 'creditcard' },
				{ name: 'iDEAL', value: 'ideal' },
				{ name: 'PayPal', value: 'paypal' },
				// Add more payment methods
			],
			default: '',
			description: 'Preferred payment method',
		},
		{
			displayName: 'Metadata',
			name: 'metadata',
			type: 'json',
			default: '{}',
			description: 'Custom metadata as JSON object',
		},
	],
},
```

#### 3. Implement Operation Logic

In the `execute` method, add the operation handler:

```typescript
if (resource === 'payment') {
	if (operation === 'create') {
		// Create Payment
		const amount = this.getNodeParameter('amount', i) as number;
		const currency = this.getNodeParameter('currency', i) as string;
		const description = this.getNodeParameter('description', i) as string;
		const redirectUrl = this.getNodeParameter('redirectUrl', i) as string;
		const additionalFields = this.getNodeParameter('additionalFields', i, {}) as IDataObject;

		const body: IDataObject = {
			amount: {
				currency,
				value: amount.toFixed(2),
			},
			description,
			redirectUrl,
		};

		// Add optional fields
		if (additionalFields.webhookUrl) {
			body.webhookUrl = additionalFields.webhookUrl;
		}
		if (additionalFields.method) {
			body.method = additionalFields.method;
		}
		if (additionalFields.metadata) {
			body.metadata = JSON.parse(additionalFields.metadata as string);
		}

		const qs: IDataObject = {
			testmode: testAccount,
		};

		const responseData = await this.makeApiRequest.call(
			this,
			'POST',
			'/v2/payments',
			body,
			qs,
		);

		const transformedData = this.transformPaymentData(responseData);
		returnData.push({ json: transformedData });
	}
	// ... other operations
}
```

### Example: Adding "Create Refund" Operation

#### 1. Add New Resource (if needed)

If refunds should be a separate resource:

```typescript
{
	displayName: 'Resource',
	name: 'resource',
	type: 'options',
	noDataExpression: true,
	options: [
		{
			name: 'Payment',
			value: 'payment',
		},
		{
			name: 'Refund',
			value: 'refund',
		},
	],
	default: 'payment',
},
```

#### 2. Add Operation and Parameters

Follow the same pattern as above, but under the `refund` resource.

#### 3. Add Required OAuth Scopes

If the operation requires specific scopes, ensure they're available in the OAuth2 credential and document them in the README.

## Code Style Guidelines

### TypeScript

- Use TypeScript strict mode
- Define proper types for all parameters
- Avoid `any` types where possible
- Use interfaces for complex objects

### Formatting

- Use tabs for indentation (configured in `.prettierrc`)
- Use single quotes for strings
- Include semicolons
- Max line width: 100 characters

### Naming Conventions

- Use camelCase for variables and functions
- Use PascalCase for classes and types
- Use UPPER_CASE for constants
- Prefix interfaces with `I` (e.g., `IDataObject`)

### Comments

- Add JSDoc comments for functions
- Explain complex logic with inline comments
- Document any workarounds or non-obvious code

### Error Handling

- Always use try-catch blocks
- Provide meaningful error messages
- Include status codes in error messages
- Handle rate limiting (429) separately

Example:
```typescript
catch (error) {
	if (error.statusCode === 429) {
		throw new NodeOperationError(
			this.getNode(),
			`[429] Rate limit exceeded\n\n${error.message}`,
			{ itemIndex: i },
		);
	}
	throw new NodeOperationError(
		this.getNode(),
		`[${error.statusCode || 'Unknown'}] ${error.message}`,
		{ itemIndex: i },
	);
}
```

## Testing

### Manual Testing

1. Set up test credentials in n8n
2. Create a test workflow
3. Test each operation with various parameters
4. Test error cases (invalid IDs, missing parameters)
5. Test pagination for list operations
6. Test both authentication methods

### Test Checklist for New Operations

- [ ] Operation works with API Key authentication
- [ ] Operation works with OAuth2 authentication
- [ ] Test mode parameter is correctly passed
- [ ] Required parameters are validated
- [ ] Optional parameters work correctly
- [ ] Error messages are clear and helpful
- [ ] Response data is properly transformed
- [ ] Rate limiting is handled gracefully
- [ ] Documentation is updated (README.md)

## Building

### Build for Development
```bash
npm run dev
```
This watches for file changes and rebuilds automatically.

### Build for Production
```bash
npm run build
```
This compiles TypeScript and copies icons to the `dist` folder.

### Lint Code
```bash
npm run lint
```

### Format Code
```bash
npm run format
```

## Publishing

### Pre-publish Checklist

- [ ] All tests pass
- [ ] Code is linted and formatted
- [ ] README.md is updated
- [ ] Version number is bumped in package.json
- [ ] CHANGELOG is updated (if you create one)
- [ ] All files are committed to git

### Publish to npm

1. **Login to npm**
   ```bash
   npm login
   ```

2. **Publish the package**
   ```bash
   npm publish
   ```

3. **Tag the release in git**
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

## Mollie API Reference

When implementing new operations, refer to the official Mollie API documentation:

- [Payments API](https://docs.mollie.com/reference/v2/payments-api/overview)
- [Refunds API](https://docs.mollie.com/reference/v2/refunds-api/overview)
- [Customers API](https://docs.mollie.com/reference/v2/customers-api/overview)
- [Subscriptions API](https://docs.mollie.com/reference/v2/subscriptions-api/overview)
- [Orders API](https://docs.mollie.com/reference/v2/orders-api/overview)

## Common Patterns

### Data Transformation

Always transform Mollie's response data to be more n8n-friendly:

```typescript
transformPaymentData(payment: IDataObject): IDataObject {
	// Convert amount objects to numbers
	// Convert dates to ISO strings
	// Extract nested values to top level
	// Remove unnecessary _links
}
```

### Pagination

For list operations, implement pagination support:

```typescript
async makeApiRequestWithPagination(
	method: string,
	endpoint: string,
	body: IDataObject = {},
	qs: IDataObject = {},
): Promise<any[]> {
	// Follow _links.next.href until no more pages
}
```

### Query Parameters

Always include the test mode parameter:

```typescript
const qs: IDataObject = {
	testmode: testAccount,
	// ... other query parameters
};
```

## Getting Help

- [n8n Community Forum](https://community.n8n.io/)
- [n8n Discord](https://discord.gg/n8n)
- [Mollie Support](https://help.mollie.com/)

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Update documentation
6. Submit a pull request

## License

MIT - See [LICENSE](LICENSE) file for details.
