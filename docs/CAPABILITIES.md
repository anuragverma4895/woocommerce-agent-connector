# Capabilities and limitations

## The agent can

- List recent orders.
- Get an order by numeric ID.
- Search by supported customer email, status, order number and date range.
- Paginate results with a bounded page size.
- Receive normalized responses and structured errors.

## The agent cannot

- Create, update, cancel, refund or delete orders.
- Change inventory.
- Access arbitrary WordPress administration data.
- Bypass WooCommerce permissions.
- Read credentials or authentication headers.

## Search limitation

WooCommerce does not provide arbitrary semantic search across every order field. The connector therefore exposes supported filters only. Customer-email filtering is applied by the connector where necessary rather than pretending it is a native upstream search primitive.

## Authentication

Demo mode uses fictional local data. Production mode uses WooCommerce REST credentials from environment variables.

## Long-term production improvements

A real multi-merchant deployment should add OAuth or merchant installation where appropriate, per-tenant secrets storage, distributed rate-limit coordination, tracing with sensitive-field redaction, sandbox contract tests and additional read-only resources.