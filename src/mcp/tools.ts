import * as z from "zod/v4";
import { McpServer } from "@modelcontextprotocol/server";
import type { OrderService } from "../services/order-service.js";

export function registerOrderTools(server: McpServer, service: OrderService): void {
  server.registerTool(
    "list_orders",
    {
      description: "List recent WooCommerce orders with optional status and date filters.",
      inputSchema: z.object({
        page: z.number().int().min(1).default(1),
        per_page: z.number().int().min(1).max(50).default(10),
        status: z.string().min(1).optional(),
        after: z.string().datetime({ offset: true }).optional(),
        before: z.string().datetime({ offset: true }).optional()
      })
    },
    async (input) => ({
      content: [{
        type: "text",
        text: JSON.stringify(await service.list({
          page: input.page,
          perPage: input.per_page,
          status: input.status,
          after: input.after,
          before: input.before
        }), null, 2)
      }]
    })
  );

  server.registerTool(
    "get_order",
    {
      description: "Get one WooCommerce order by numeric ID.",
      inputSchema: z.object({
        order_id: z.number().int().positive()
      })
    },
    async (input) => ({
      content: [{
        type: "text",
        text: JSON.stringify(await service.getById(input.order_id), null, 2)
      }]
    })
  );

  server.registerTool(
    "search_orders",
    {
      description: "Search WooCommerce orders using supported filters. At least one filter is required.",
      inputSchema: z.object({
        page: z.number().int().min(1).default(1),
        per_page: z.number().int().min(1).max(50).default(10),
        customer_email: z.string().email().optional(),
        status: z.string().min(1).optional(),
        order_number: z.string().min(1).optional(),
        after: z.string().datetime({ offset: true }).optional(),
        before: z.string().datetime({ offset: true }).optional()
      })
    },
    async (input) => ({
      content: [{
        type: "text",
        text: JSON.stringify(await service.search({
          page: input.page,
          perPage: input.per_page,
          customerEmail: input.customer_email,
          status: input.status,
          orderNumber: input.order_number,
          after: input.after,
          before: input.before
        }), null, 2)
      }]
    })
  );
}
