# Make.com to n8n Implementation Mapping

This document maps the Make.com Mollie integration to the n8n implementation.

## Authentication

### Make.com OAuth Connection
```javascript
// Authorization
url: "https://www.mollie.com/oauth2/authorize"
scope: "organizations.read profiles.read" (default)

// Token
url: "https://api.mollie.com/oauth2/tokens"
method: "POST"
grant_type: "authorization_code"

// Refresh
url: "https://api.mollie.com/oauth2/tokens"
grant_type: "refresh_token"

// Info/Test
url: "https://api.mollie.com/v2/organizations/me"
```

### n8n Implementation
- **File**: `credentials/MollieOAuth2Api.credentials.ts`
- **Extends**: `oAuth2Api` (built-in n8n OAuth2 support)
- **Default Scopes**: `organizations.read profiles.read`
- **Additional Scopes**: Configurable via multiOptions
- **Test Account**: Boolean parameter (passed as `testmode` in requests)

## API Base Configuration

### Make.com Base
```javascript
{
    "baseUrl": "https://api.mollie.com",
    "headers": {
        "Authorization": "Bearer {{connection.accessToken}}"
    },
    "response": {
        "error": {
            "429": {
                "type": "RateLimitError",
                "message": "[{{statusCode}}] {{body.title}}\n\n{{body.detail}}"
            },
            "message": "[{{statusCode}}] {{body.title}}\n\n{{body.detail}}"
        }
    }
}
```

### n8n Implementation
- **File**: `nodes/Mollie/Mollie.node.ts`
- **Base URL**: `https://api.mollie.com` (hardcoded in requests)
- **Authentication**: Handled by credential system
- **Error Handling**: Custom error handling in `makeApiRequest` method
- **Rate Limiting**: Special handling for 429 status codes

## List Payments Operation

### Make.com Module
```javascript
{
    "url": "https://api.mollie.com/v2/payments",
    "method": "GET",
    "qs": {
        "limit": 250,
        "testmode": "{{connection.testAccount}}"
    },
    "pagination": {
        "url": "{{body._links.next.href}}",
        "condition": "{{body._links.next.href}}"
    },
    "response": {
        "iterate": {
            "container": "{{body._embedded.payments}}"
        }
    }
}
```

### n8n Implementation
- **Operation**: `getAll`
- **Method**: `GET`
- **Endpoint**: `/v2/payments`
- **Query Parameters**:
  - `testmode`: From credential
  - `limit`: 250 (API max per page)
- **Pagination**: Implemented in `makeApiRequestWithPagination` method
- **Response Container**: `response._embedded.payments`

## Data Transformation

### Make.com Transformations
```javascript
{
    "amount": "{{parseNumber(item.amount.value,'.')}}",
    "currency": "{{item.amount.currency}}",
    "checkoutLink": "{{item._links.checkout.href}}",
    "createdAt": "{{parseDate(item.createdAt)}}",
    "expiresAt": "{{parseDate(item.expiresAt)}}",
    "expiredAt": "{{parseDate(item.expiredAt)}}",
    "paidAt": "{{parseDate(item.paidAt)}}",
    "amountRefunded": "{{parseNumber(item.amountRefunded.value)}}",
    "amountRemaining": "{{parseNumber(item.amountRemaining.value)}}",
    "settlementAmount": "{{parseNumber(item.settlementAmount.value)}}"
}
```

### n8n Implementation
- **Method**: `transformPaymentData()`
- **Amount Fields**: Convert from object `{value, currency}` to number
- **Dates**: Convert to ISO string format
- **Checkout Link**: Extract from `_links.checkout.href`
- **Cleanup**: Remove `_links` object from response

## Status Filter

### Make.com
```javascript
{
    "status": {
        "type": "select",
        "options": "rpc://status"
    }
}
```

RPC Response:
```javascript
[
    {"value": "open", "label": "Open"},
    {"value": "canceled", "label": "Canceled"},
    {"value": "pending", "label": "Pending"},
    {"value": "authorized", "label": "Authorized"},
    {"value": "expired", "label": "Expired"},
    {"value": "failed", "label": "Failed"},
    {"value": "paid", "label": "Paid"}
]
```

### n8n Implementation
- **Parameter**: `filters.status`
- **Type**: `options` (within collection)
- **Options**: Hardcoded in node properties
- **Implementation**: Client-side filtering after API response

## Get Payment Operation

### Make.com Module
```javascript
{
    "url": "https://api.mollie.com/v2/payments/{{parameters.paymentId}}",
    "method": "GET",
    "qs": {
        "testmode": "{{connection.testAccount}}"
    }
}
```

### n8n Implementation
- **Operation**: `get`
- **Method**: `GET`
- **Endpoint**: `/v2/payments/{paymentId}`
- **Parameter**: `paymentId` (string, required)
- **Query Parameters**: `testmode` from credential
- **Transformation**: Same as List Payments

## Connection Parameters Mapping

| Make.com Parameter | n8n OAuth2 Credential | n8n API Credential |
|--------------------|----------------------|---------------------|
| `testAccount` | `testAccount` | `testAccount` |
| `scopes` (additional) | `additionalScopes` | N/A |
| `clientId` | `clientId` | N/A |
| `clientSecret` | `clientSecret` | N/A |
| N/A | N/A | `apiKey` |

## Default vs Custom OAuth App

### Make.com
- Default Client ID: `app_eMnS2knjgrRr2jk4eA6dbEA4`
- Default Client Secret: `9Rz9wEy9wU4tK8nHPFzFnMa4WkJTAe4tRDeqJjEb`
- Advanced parameters allow overriding with custom app

### n8n Implementation
- Same default credentials embedded in `MollieOAuth2Api.credentials.ts`
- Users can override in credential settings
- Both are visible fields (not hidden/advanced)

## Key Differences

### 1. Pagination
- **Make.com**: Automatic via pagination configuration
- **n8n**: Explicit `returnAll` parameter, manual implementation

### 2. Status Filtering
- **Make.com**: Server-side via RPC
- **n8n**: Client-side filtering after fetching data

### 3. Limit Parameter
- **Make.com**: Default 100
- **n8n**: Default 100, max 250 (API limit), user-configurable

### 4. Authentication Selection
- **Make.com**: Single OAuth connection
- **n8n**: User selects between API Key or OAuth2

### 5. Error Messages
- **Make.com**: Template-based error formatting
- **n8n**: TypeScript error handling with NodeOperationError

## API Request Flow

### Make.com
1. Module configured with base settings
2. Connection provides authentication
3. Make.com engine handles request/response
4. Built-in pagination support
5. Template-based transformations

### n8n
1. Node operation selected by user
2. Credential selected (API Key or OAuth2)
3. Custom `makeApiRequest` method
4. Manual pagination if `returnAll` is true
5. TypeScript transformation method

## Response Structure Preservation

Both implementations preserve the original Mollie API response structure while adding convenience fields:

**Original Mollie Response:**
```json
{
  "id": "tr_WDqYK6vllg",
  "amount": {
    "value": "10.00",
    "currency": "EUR"
  },
  "_links": {
    "checkout": {
      "href": "https://..."
    }
  }
}
```

**Transformed Response (both Make.com and n8n):**
```json
{
  "id": "tr_WDqYK6vllg",
  "amount": 10.00,
  "currency": "EUR",
  "checkoutLink": "https://...",
  ...
}
```

## Future Extensions

Both implementations are designed to support future operations:
- Create Payment
- Create Payment Link
- Create Refund
- Customer Management
- Subscription Management
- Order Management

The n8n implementation follows the same architectural patterns as Make.com, making it easy to add new operations by referencing the Make.com module definitions.
