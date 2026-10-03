# WooCommerce Agent Connector

A production-oriented **read-only WooCommerce connector for AI agents**, built for a Forward-Deployed Engineer — Agent Studio technical assignment.

> Demo mode is enabled by default. All included merchant/customer data is fictional.

## Problem

Agents need a narrow and predictable interface to merchant systems. This connector avoids exposing raw WooCommerce payloads or broad administrative access and instead provides three validated, read-only order primitives.

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

## Architecture

Agent / Agent Studio -> MCP Tool Layer -> Order Service -> WooCommerce API Client -> WooCommerce REST API

Detailed design: docs/ARCHITECTURE.md

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

## Run the HTTP demo

~~~bash
npm run dev
~~~

Open http://localhost:3000.

Endpoints:

- GET /health
- GET /api/orders
- GET /api/orders/1001
- GET /api/orders/search?status=processing
- GET /api/orders/search?customer_email=diya@example.test

## Run the MCP server

~~~bash
npm run mcp
~~~

The tool registration is in src/mcp/tools.ts.

## Production WooCommerce mode

Set:

~~~text
USE_MOCK_DATA=false
WOOCOMMERCE_STORE_URL=https://your-store.example.com
WOOCOMMERCE_CONSUMER_KEY=ck_...
WOOCOMMERCE_CONSUMER_SECRET=cs_...
~~~

Never commit .env or share credentials.

## Rate-limit handling

For 429 and transient 5xx responses the client:

1. Reads Retry-After when supplied.
2. Otherwise calculates bounded exponential backoff.
3. Retries only within MAX_RETRIES.
4. Caps individual delays.
5. Returns a structured error when the retry budget is exhausted.

## Security

- Secrets are environment-only.
- .env is ignored.
- MCP operations are read-only.
- Pagination is bounded.
- Request size and upstream timeout are bounded.
- Retry count is bounded.
- Responses are normalized before agent exposure.
- Demo data uses fictional .test addresses.

## Testing

~~~bash
npm test
npm run build
npm run lint
~~~

No real WooCommerce credentials are needed for tests.

## Example agent interactions

**User:** Show me the latest 5 orders.  
**Agent:** Calls list_orders.

**User:** Get details for order 1001.  
**Agent:** Calls get_order.

**User:** Find processing orders for diya@example.test.  
**Agent:** Calls search_orders.

**User:** Get order -4.  
**Connector:** Rejects the request before contacting WooCommerce.

## Capabilities and limitations

See docs/CAPABILITIES.md.

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

## Limitations

This implementation intentionally focuses on read-only order access. It does not mutate WooCommerce data, perform arbitrary semantic search or provide a multi-tenant production secrets store.

For production, use a managed secrets system and enforce tenant isolation.

## Assignment alignment

- Authentication: environment-based WooCommerce API credentials
- List/get/search primitives: three MCP tools
- Rate-limit handling: bounded retry/backoff + Retry-After
- MCP specification: actual SDK registration + documentation
- Agent boundaries: read-only tools and normalized responses
- Setup/run instructions: this README
- Assumptions/limitations: docs/CAPABILITIES.md

No real customer data, passwords, API keys or credentials are included.