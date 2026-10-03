# Architecture

~~~mermaid
flowchart LR
 A[Agent / Agent Studio] --> B[MCP Tool Layer]
 B --> C[Order Service]
 C --> D{Data Provider}
 D -->|Demo| E[Fictional Mock Data]
 D -->|Production| F[WooCommerce REST API]
 F --> G[Auth + Timeout + Retry]
 C --> H[Response Normalizer]
 H --> B
~~~

The connector is intentionally read-only.

## Layers

**MCP tool layer** exposes list_orders, get_order and search_orders.

**Order service** owns business rules such as pagination limits, supported filters and provider selection.

**WooCommerce client** calls the WooCommerce v3 orders endpoint with environment credentials and never returns authentication material to the agent.

**Resilience** uses request timeouts, bounded retries, exponential backoff and Retry-After for 429/transient 5xx responses.

**Normalization** reduces raw upstream payloads to useful agent fields.

## Request flow

1. Agent selects a tool.
2. Tool schema validates input.
3. OrderService applies business rules.
4. Mock data or WooCommerce is queried.
5. Raw orders are normalized.
6. A concise JSON result is returned.