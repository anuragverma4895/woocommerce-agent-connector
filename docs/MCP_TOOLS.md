# MCP tool specification

The project uses the Model Context Protocol TypeScript SDK with stdio transport: @modelcontextprotocol/server@^2.3.0.

The MCP layer calls OrderService directly. It does not duplicate WooCommerce business logic.

## list_orders

**Purpose:** List recent WooCommerce orders.

**Input schema:**

| Parameter | Type | Required | Validation |
|---|---|---|---|
| page | number | No | Integer, >= 1; default 1 |
| per_page | number | No | Integer, 1-50; default 10 |
| status | string | No | Non-empty when provided |
| after | string | No | ISO datetime with timezone offset |
| before | string | No | ISO datetime with timezone offset |

**Example invocation:**

~~~json
{
  "page": 1,
  "per_page": 10,
  "status": "processing"
}
~~~

**Response:** A normalized order-list object containing orders, page, perPage, total and totalPages.

**Possible errors:** INVALID_PAGINATION, INVALID_DATE_RANGE, authentication/upstream errors and malformed upstream response.

## get_order

**Purpose:** Retrieve one WooCommerce order.

**Input schema:**

| Parameter | Type | Required | Validation |
|---|---|---|---|
| order_id | number | Yes | Positive integer |

**Example invocation:**

~~~json
{
  "order_id": 1001
}
~~~

**Response:** One normalized order containing ID, order number, status, currency, total, relevant customer information, timestamps, payment method when available and line-item summaries.

**Possible errors:** INVALID_ORDER_ID, ORDER_NOT_FOUND, authentication/upstream errors and malformed upstream response.

## search_orders

**Purpose:** Search orders using supported filters rather than arbitrary semantic search.

**Input schema:**

| Parameter | Type | Required | Validation |
|---|---|---|---|
| page | number | No | Integer, >= 1; default 1 |
| per_page | number | No | Integer, 1-50; default 10 |
| customer_email | string | Conditional | Valid email when provided |
| status | string | Conditional | Non-empty when provided |
| order_number | string | Conditional | Non-empty when provided |
| after | string | Conditional | ISO datetime with timezone offset |
| before | string | Conditional | ISO datetime with timezone offset |

At least one search filter is required.

**Example invocation:**

~~~json
{
  "customer_email": "diya@example.test",
  "status": "processing",
  "page": 1,
  "per_page": 10
}
~~~

**Response:** A normalized order-list object containing orders, page, perPage, total and totalPages.

**Possible errors:** SEARCH_FILTER_REQUIRED, INVALID_PAGINATION, INVALID_DATE_RANGE, authentication/upstream errors and malformed upstream response.

## Common response shape

Successful list/search responses are normalized for agent consumption:

~~~json
{
  "orders": [],
  "page": 1,
  "perPage": 10,
  "total": 0,
  "totalPages": 0
}
~~~

A successful get operation returns a single normalized order.

## Error response

The HTTP layer exposes safe errors in this shape:

~~~json
{
  "success": false,
  "error": {
    "code": "ORDER_NOT_FOUND",
    "message": "No order was found with ID 123."
  }
}
~~~

MCP callers receive the corresponding tool error/result from the service layer. Credential material, authorization headers and raw stack traces are not exposed.

## Search behavior

The connector supports customer email, status, order number and date range filters. It does not claim arbitrary full-text or semantic search across WooCommerce.

## Safety boundaries

All three tools are read-only. They cannot create, update, cancel, refund or delete WooCommerce orders, change inventory or bypass WooCommerce permissions.

## Transport

Run the MCP server with:

~~~bash
npm run mcp
~~~

The server uses stdio transport and registers the tools through McpServer.registerTool().