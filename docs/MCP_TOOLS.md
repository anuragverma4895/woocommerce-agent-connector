# MCP tool specification

The project uses the Model Context Protocol TypeScript SDK with stdio transport.

## list_orders

Input: page, per_page, optional status, after and before. Page must be at least 1 and per_page must be between 1 and 50.

## get_order

Input: order_id. Must be a positive integer.

## search_orders

Input: page, per_page, and at least one of customer_email, status, order_number, after or before.

## Response

Normalized JSON contains order ID, number, status, currency, total, relevant customer information, timestamps, payment method when present and line-item summaries.

## Errors

Errors follow a consistent success=false and error.code/error.message shape. Raw stack traces, credentials and authorization headers are never returned.