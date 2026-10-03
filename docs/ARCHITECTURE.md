# Architecture

~~~mermaid
flowchart LR
 A[Agent / Agent Studio] --> B[MCP Tool Layer]
 B --> V[Zod Validation]
 V --> C[Order Service]
 C --> D{Data Provider}
 D -->|Demo| E[Fictional Mock Data]
 D -->|Production| F[WooCommerce API Client]
 F --> G[Environment Credentials]
 F --> H[Timeout + Retry + Rate Limit Handling]
 F --> I[WooCommerce REST API v3]
 C --> N[Response Normalizer]
 N --> B
 B --> X[Safe Structured Errors]
~~~

The connector is intentionally read-only.

## Layers

**MCP tool layer** exposes list_orders, get_order and search_orders through the TypeScript MCP SDK and stdio transport.

**Validation** uses Zod schemas for tool and HTTP input. Pagination, IDs, email addresses and date ranges are constrained before service execution.

**Order service** owns business rules such as pagination limits, supported filters and provider selection. The HTTP and MCP layers both use this service.

**WooCommerce client** calls the WooCommerce v3 orders endpoint with environment credentials. Authentication material is never returned to the agent.

**Resilience** uses request timeouts, bounded retries, exponential backoff and Retry-After handling for 429/transient 5xx responses.

**Normalization** reduces raw upstream payloads to useful agent-facing fields and avoids exposing unrelated WooCommerce fields.

**Safe errors** map expected failures to stable error codes/messages without raw stack traces or credential material.

## Authentication flow

1. Credentials are loaded from environment variables.
2. When production mode is enabled, the client builds a WooCommerce v3 API request.
3. Credentials are sent as an HTTP Basic Authorization header to WooCommerce.
4. Authentication failures are converted into a safe AUTHENTICATION_FAILED error.
5. Credentials and authorization headers are never included in connector responses.

## Request flow

1. Agent selects an MCP tool.
2. Tool schema validates input.
3. OrderService applies business rules.
4. Demo data or WooCommerce is queried.
5. Upstream responses are normalized.
6. A concise result is returned to the agent.
7. Expected failures are converted to safe structured errors.