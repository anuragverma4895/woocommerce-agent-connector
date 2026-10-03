# WooCommerce Agent Connector

A production-oriented **read-only WooCommerce connector for AI agents**, built for a Forward-Deployed Engineer — Agent Studio technical assignment.

> Demo mode is enabled by default. All included merchant/customer data is fictional.

## Problem

Agents need a narrow and predictable interface to merchant systems. This connector avoids exposing raw WooCommerce payloads or broad administrative access and instead provides three validated, read-only order primitives.

## Solution

The connector places a small, validated service boundary between an AI agent and WooCommerce. MCP tools call the same OrderService used by the HTTP demo, while the WooCommerce client owns authentication, timeouts, retries and upstream error mapping.

## Features

- MCP-compatible list/get/search tools
- WooCommerce REST API v3 client
- Environment-based credentials
- Credential-free mock/demo mode
- Zod input validation
- Bounded pagination
- Request timeout
- Retry-After aware 429 handling
- Bounded exponential backoff for transient 5xx responses
- Agent-friendly response normalization
- Safe structured errors
- Automated tests without a live store
- Responsive white-background demo UI

## Tech stack

- TypeScript + Node.js 20+
- Express HTTP demo/API
- MCP TypeScript SDK with stdio transport
- WooCommerce REST API v3
- Zod validation
- Vitest tests
- ESLint + Prettier

## Architecture

Agent / Agent Studio -> MCP Tool Layer -> Order Service -> WooCommerce API Client -> WooCommerce REST API

Detailed design: docs/ARCHITECTURE.md.

## Requirements

Node.js 20+ and npm.

## Setup

~~~bash
git clone https://github.com/anuragverma4895/woocommerce-agent-connector.git
cd woocommerce-agent-connector
npm install
cp .env.example .env
~~~

Windows PowerShell:

~~~powershell
Copy-Item .env.example .env
~~~

The default USE_MOCK_DATA=true requires no credentials.

## Configuration

| Variable | Purpose | Required |
|---|---|---|
| USE_MOCK_DATA | Use fictional local data instead of WooCommerce | No; defaults to true |
| WOOCOMMERCE_STORE_URL | WooCommerce store base URL | Required when mock mode is disabled |
| WOOCOMMERCE_CONSUMER_KEY | WooCommerce REST consumer key | Required when mock mode is disabled |
| WOOCOMMERCE_CONSUMER_SECRET | WooCommerce REST consumer secret | Required when mock mode is disabled |
| PORT | HTTP server port | No; defaults to 3000 |
| REQUEST_TIMEOUT_MS | Upstream request timeout | No; defaults to 8000 |
| MAX_RETRIES | Maximum retry attempts | No; defaults to 2 |
| RETRY_BASE_DELAY_MS | Base exponential-backoff delay | No; defaults to 250 |
| MAX_PER_PAGE | Configured pagination ceiling | No; defaults to 50 |

.env.example contains placeholders only. Never commit .env or real merchant credentials.

## Run the HTTP demo

~~~bash
npm run dev
~~~

Open http://localhost:3000.

The demo is pure white with dark typography and includes connector status, demo mode, order listing, filtering/search, order details, loading/error/empty states and pagination.

Endpoints:

~~~text
GET /health
GET /api/orders
GET /api/orders/:id
GET /api/orders/search
~~~

Examples:

~~~text
GET /api/orders?per_page=5
GET /api/orders/1001
GET /api/orders/search?status=processing
GET /api/orders/search?customer_email=diya@example.test
GET /api/orders/search?order_number=1002
~~~

## Run the MCP server

~~~bash
npm run mcp
~~~

The server uses stdio transport. Tool registration is in src/mcp/tools.ts; detailed schemas and examples are in docs/MCP_TOOLS.md.

## MCP tools

### list_orders

Lists recent orders with optional status and date filters.

### get_order

Retrieves one order by positive numeric ID.

### search_orders

Searches using supported filters: customer email, status, order number and date range. At least one filter is required.

All tools enforce bounded pagination and return normalized order data.

## Production WooCommerce mode

Set:

~~~text
USE_MOCK_DATA=false
WOOCOMMERCE_STORE_URL=https://your-store.example.com
WOOCOMMERCE_CONSUMER_KEY=ck_...
WOOCOMMERCE_CONSUMER_SECRET=cs_...
~~~

Credentials are read only from environment configuration and are never returned to the agent.

## Response and error handling

The connector normalizes WooCommerce orders into concise agent-facing fields such as ID, number, status, currency, total, relevant customer information, timestamps, payment method and line-item summaries.

Errors are converted into a safe structure:

~~~json
{
  "success": false,
  "error": {
    "code": "ORDER_NOT_FOUND",
    "message": "No order was found with ID 123."
  }
}
~~~

Known cases include invalid input, authentication failure, forbidden access, not found, rate limiting, timeout, network failure and malformed upstream responses. Raw stack traces and credential material are not exposed.

## Rate-limit and retry strategy

For 429 and transient 5xx responses the client:

1. Reads Retry-After when supplied.
2. Otherwise calculates bounded exponential backoff.
3. Retries only within MAX_RETRIES.
4. Caps individual delays.
5. Returns a structured error when the retry budget is exhausted.

Request timeouts are bounded and aborts are returned as retryable timeout errors.

## Security considerations

- Secrets are environment-only.
- .env is ignored.
- MCP operations are read-only.
- Pagination is bounded.
- Request body size and upstream timeout are bounded.
- Retry count is bounded.
- Responses are normalized before agent exposure.
- Demo data uses fictional .test addresses.
- No authentication headers or API credentials are returned.

## Testing

~~~bash
npm test
npm run build
npm run lint
~~~

No real WooCommerce credentials are needed for tests. The test suite uses mocked upstream responses and covers the required connector behaviors.

## Example agent interactions

**User:** Show me the latest 5 orders.  
**Agent:** Calls list_orders with page=1, per_page=5.

**User:** Get details for order 1001.  
**Agent:** Calls get_order with order_id=1001.

**User:** Find processing orders for diya@example.test.  
**Agent:** Calls search_orders with customer_email and status as needed.

**User:** Get order -4.  
**Connector:** Rejects the request before contacting WooCommerce with INVALID_ORDER_ID.

## Demo mode

Demo mode uses fictional orders, customers, emails and products. It demonstrates listing, getting, filtering/searching, pagination, order details and error states without a real WooCommerce store.

## Capabilities and limitations

See docs/CAPABILITIES.md.

The implementation intentionally focuses on read-only order access. It does not create, modify, cancel, refund or delete orders; change inventory; access arbitrary WordPress administration data; bypass WooCommerce permissions; or perform arbitrary semantic search.

Customer-email filtering is implemented as a connector-supported filter rather than being presented as arbitrary WooCommerce full-text search.

## Project structure

~~~text
src/
  clients/      WooCommerce API client
  config/       Environment validation
  data/         Fictional demo data
  mcp/          MCP server and tools
  services/     Business logic and normalization
  types/        Domain types
  utils/        Validation and errors
  app.ts        HTTP API + demo UI
  server.ts     HTTP entry point
docs/
  ARCHITECTURE.md
  CAPABILITIES.md
  MCP_TOOLS.md
~~~

## Assignment alignment

- Authentication: environment-based WooCommerce API credentials
- List/get/search primitives: three MCP tools
- Rate-limit handling: bounded retry/backoff + Retry-After
- MCP specification: actual SDK registration + detailed documentation
- Agent boundaries: read-only tools and normalized responses
- Setup/run instructions: this README
- Assumptions/limitations: docs/CAPABILITIES.md
- Automated verification: Vitest, ESLint and TypeScript build

No real customer data, passwords, API keys or credentials are included.

## Design decisions

- The connector is intentionally read-only so an agent cannot mutate merchant state.
- The MCP layer calls the same OrderService used by the HTTP demo, avoiding duplicated business logic.
- Mock mode is the default so reviewers can run the project without real merchant credentials.
- Responses are normalized before being exposed to an agent to reduce payload size and avoid leaking unrelated WooCommerce fields.
- Pagination, retries and request timeouts are bounded to prevent uncontrolled resource usage.
- Customer-email search is implemented as a supported connector filter; the project does not claim arbitrary WooCommerce semantic search.

## MCP SDK

The MCP implementation uses @modelcontextprotocol/server@^2.3.0 with stdio transport. Tool definitions use the SDK's McpServer.registerTool() API.

## Future improvements

- Add merchant installation/OAuth and per-tenant secret storage for a multi-merchant deployment.
- Add contract tests against a dedicated WooCommerce sandbox.
- Add structured observability with sensitive-field redaction.
- Add distributed rate-limit coordination for horizontally scaled deployments.
- Expand read-only coverage to additional merchant resources only when the agent use case requires them.
