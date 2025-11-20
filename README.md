# n8n-nodes-mollie

This is an n8n community node that lets you use [Mollie](https://www.mollie.com/) payment API in your n8n workflows.

Mollie is a payment service provider that allows businesses to accept online payments through various payment methods including credit cards, PayPal, Apple Pay, and more.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

## Table of Contents

- [Installation](#installation)
- [Authentication](#authentication)
  - [API Key Authentication](#api-key-authentication)
  - [OAuth2 Authentication](#oauth2-authentication)
- [Operations](#operations)
- [Compatibility](#compatibility)
- [Usage](#usage)
- [Resources](#resources)
- [Version History](#version-history)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

### Community Node Installation

1. Go to **Settings** > **Community Nodes**
2. Select **Install**
3. Enter `n8n-nodes-mollie` in **Enter npm package name**
4. Agree to the [risks](https://docs.n8n.io/integrations/community-nodes/risks/) of using community nodes
5. Select **Install**

After installation, you can use the Mollie node in your workflows.

### Manual Installation (for development)

1. Clone this repository
2. Navigate to the repository folder
3. Run `npm install`
4. Run `npm run build`
5. Link the package to your n8n installation:
   ```bash
   npm link
   cd ~/.n8n/nodes
   npm link n8n-nodes-mollie
   ```
6. Restart n8n

## Authentication

This node supports two authentication methods:

### API Key Authentication

Simple authentication using your Mollie API key.

**Prerequisites:**
- A Mollie account ([sign up here](https://www.mollie.com/dashboard/signup))
- API key from your Mollie Dashboard

**Setup:**

1. Go to your [Mollie Dashboard](https://www.mollie.com/dashboard)
2. Navigate to **Developers** > **API keys**
3. Copy your **Live API key** or **Test API key**
4. In n8n, create a new **Mollie API** credential
5. Paste your API key
6. Set **Test Account** to `true` if using a test key, `false` for live keys
7. Save the credential

**API Key Format:**
- Test keys start with `test_`
- Live keys start with `live_`

### OAuth2 Authentication

OAuth2 authentication provides more granular permission control and is required for some operations.

**Prerequisites:**
- A Mollie account
- OAuth app configured in Mollie Dashboard (optional - shared app provided by default)

**Setup with Default Shared App:**

1. In n8n, create a new **Mollie OAuth2 API** credential
2. Set **Test Account** to `true` for testing or `false` for production
3. (Optional) Select **Additional Scopes** if you need permissions beyond the defaults
4. Click **Connect my account**
5. Follow the OAuth flow to authorize access
6. Save the credential

**Setup with Custom OAuth App:**

1. Go to your [Mollie Dashboard](https://www.mollie.com/dashboard)
2. Navigate to **Developers** > **OAuth Apps**
3. Create a new OAuth app
4. Set the redirect URL to: `https://your-n8n-instance.com/rest/oauth2-credential/callback`
5. Note your Client ID and Client Secret
6. In n8n, create a new **Mollie OAuth2 API** credential
7. Enter your **Client ID** and **Client Secret**
8. Set **Test Account** appropriately
9. Select any **Additional Scopes** you need
10. Click **Connect my account**
11. Follow the OAuth flow to authorize access
12. Save the credential

**Available Scopes:**

The node requests these scopes by default:
- `organizations.read` - View the merchant's organizational details
- `profiles.read` - View the merchant's payment profiles

Additional scopes you can select:
- `payments.read` - View payments, chargebacks, and payment methods
- `payments.write` - Create and manage payments
- `refunds.read` - View refunds
- `refunds.write` - Create and manage refunds
- `customers.read` - View customers
- `customers.write` - Create and manage customers
- `mandates.read` - View mandates
- `mandates.write` - Create and manage mandates
- `subscriptions.read` - View subscriptions
- `subscriptions.write` - Create and manage subscriptions
- `profiles.write` - Create and manage profiles
- `invoices.read` - View invoices
- `settlements.read` - View settlements
- `orders.read` - View orders
- `orders.write` - Create and manage orders
- `shipments.read` - View shipments
- `shipments.write` - Create and manage shipments
- `organizations.write` - Manage organizational details
- `onboarding.read` - View onboarding status
- `onboarding.write` - Manage onboarding
- `balances.read` - View balances

## Operations

### Payment

#### Get Many
Retrieve a list of payments.

**Parameters:**
- **Return All**: Whether to return all results or limit to a specific number
- **Limit**: Maximum number of payments to return (1-250, default: 100)
- **Filters**:
  - **Status**: Filter by payment status
    - All
    - Open
    - Canceled
    - Pending
    - Authorized
    - Expired
    - Failed
    - Paid

**Output:**
Returns an array of payment objects with the following fields:
- `id` - Mollie payment ID
- `amount` - Payment amount (as number)
- `currency` - Payment currency code (e.g., EUR, USD)
- `status` - Payment status
- `description` - Payment description
- `method` - Payment method used
- `checkoutLink` - URL to the payment checkout page
- `createdAt` - ISO timestamp when payment was created
- `expiresAt` - ISO timestamp when payment expires
- `expiredAt` - ISO timestamp when payment expired (if applicable)
- `paidAt` - ISO timestamp when payment was paid (if applicable)
- `amountRefunded` - Total refunded amount (as number)
- `amountRemaining` - Remaining capturable amount (as number)
- `settlementAmount` - Settlement amount (as number)
- Plus all other fields from the Mollie API response

#### Get
Retrieve a single payment by ID.

**Parameters:**
- **Payment ID**: The Mollie payment ID (e.g., `tr_WDqYK6vllg`)

**Output:**
Returns a single payment object with the same fields as described in "Get Many".

## Compatibility

- Requires n8n version 0.198.0 or later
- Tested with n8n version 1.0.0+
- Compatible with Mollie API v2

## Usage

### Example: List Recent Paid Payments

1. Add the **Mollie** node to your workflow
2. Select your authentication method and credential
3. Choose **Payment** as the resource
4. Choose **Get Many** as the operation
5. Set **Return All** to `false`
6. Set **Limit** to `50`
7. Under **Filters**, set **Status** to `Paid`
8. Execute the node

This will return the 50 most recent paid payments from your Mollie account.

### Example: Get Specific Payment Details

1. Add the **Mollie** node to your workflow
2. Select your authentication method and credential
3. Choose **Payment** as the resource
4. Choose **Get** as the operation
5. Enter the **Payment ID** (e.g., from a webhook or previous node)
6. Execute the node

This will return detailed information about the specific payment.

### Test Mode

Both authentication methods include a **Test Account** parameter:
- Set to `true` to work with test payments (using test API keys)
- Set to `false` to work with live production payments

When Test Account is enabled, all API requests will include `testmode=true`, ensuring you only see test data.

## Future Operations

This node is designed to be extended with additional operations. Planned future operations include:

- **Create Payment** - Create a new payment
- **Create Payment Link** - Generate a payment link
- **Create Refund** - Refund a payment
- **Customer Operations** - Manage customers
- **Subscription Operations** - Manage subscriptions
- **Order Operations** - Manage orders

Contributions are welcome!

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
- [Mollie API documentation](https://docs.mollie.com/reference/v2/payments-api/overview)
- [Mollie Authentication documentation](https://docs.mollie.com/reference/authentication)
- [Mollie Dashboard](https://www.mollie.com/dashboard)

## Version History

### 1.0.0
- Initial release
- Support for API Key and OAuth2 authentication
- List Payments operation with pagination
- Get Payment operation
- Test mode support
- Comprehensive error handling including rate limiting

## License

[MIT](LICENSE)

## Support

For issues, questions, or contributions, please visit the [GitHub repository](https://github.com/yourusername/n8n-nodes-mollie).

## Credits

Developed based on the Make.com Mollie integration specification, adapted for n8n workflows.
