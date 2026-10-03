import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { OrderService } from "../services/order-service.js";
import { registerOrderTools } from "./tools.js";

function createServer(): McpServer {
  const server = new McpServer({
    name: "woocommerce-agent-connector",
    version: "1.0.0"
  });
  registerOrderTools(server, new OrderService());
  return server;
}

void serveStdio(createServer);
console.error("WooCommerce Agent Connector MCP server running on stdio");
