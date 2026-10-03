import { mockOrders } from "../data/mock.js";
import { WooCommerceClient } from "../clients/woocommerce.js";
import { normalizeOrder } from "./normalizer.js";
import type {
  OrderFilters,
  OrderListResult,
  NormalizedOrder,
} from "../types/order.js";
import { ConnectorError } from "../utils/errors.js";
import { assertDateRange } from "../utils/validation.js";

export class OrderService {
  constructor(
    private readonly client = new WooCommerceClient(),
    private readonly useMock =
      process.env.USE_MOCK_DATA?.toLowerCase() !== "false",
  ) {}

  async list(f: OrderFilters = {}): Promise<OrderListResult> {
    const page = f.page ?? 1;
    const perPage = f.perPage ?? 10;

    if (
      !Number.isInteger(page) ||
      page < 1 ||
      !Number.isInteger(perPage) ||
      perPage < 1 ||
      perPage > 50
    ) {
      throw new ConnectorError(
        "INVALID_PAGINATION",
        "page must be at least 1 and per_page must be between 1 and 50.",
        400,
      );
    }

    assertDateRange(f.after, f.before);

    if (this.useMock) {
      let orders = [...mockOrders];

      if (f.status) orders = orders.filter((x) => x.status === f.status);
      if (f.customerEmail) {
        orders = orders.filter(
          (x) =>
            x.customer.email?.toLowerCase() === f.customerEmail!.toLowerCase(),
        );
      }
      if (f.orderNumber) {
        orders = orders.filter((x) => x.number === f.orderNumber);
      }
      if (f.after) {
        orders = orders.filter(
          (x) => new Date(x.createdAt) >= new Date(f.after!),
        );
      }
      if (f.before) {
        orders = orders.filter(
          (x) => new Date(x.createdAt) <= new Date(f.before!),
        );
      }

      const start = (page - 1) * perPage;

      return {
        orders: orders.slice(start, start + perPage),
        page,
        perPage,
        total: orders.length,
        totalPages: Math.ceil(orders.length / perPage),
      };
    }

    const searchTerm = f.orderNumber ?? f.customerEmail;

    const response = await this.client.request<any[]>("orders", {
      page,
      per_page: perPage,
      status: f.status,
      after: f.after,
      before: f.before,
      search: searchTerm,
    });

    if (!Array.isArray(response.data)) {
      throw new ConnectorError(
        "MALFORMED_UPSTREAM_RESPONSE",
        "WooCommerce returned an unexpected orders payload.",
        502,
      );
    }

    let orders = response.data.map(normalizeOrder);

    if (f.customerEmail) {
      orders = orders.filter(
        (order) =>
          order.customer.email?.toLowerCase() === f.customerEmail!.toLowerCase(),
      );
    }

    const total = Number(
      response.headers.get("x-wp-total") ?? orders.length,
    );
    const totalPages = Number(
      response.headers.get("x-wp-totalpages") ?? Math.ceil(total / perPage),
    );

    return {
      orders,
      page,
      perPage,
      total,
      totalPages,
    };
  }

  async getById(id: number): Promise<NormalizedOrder> {
    if (!Number.isInteger(id) || id <= 0) {
      throw new ConnectorError(
        "INVALID_ORDER_ID",
        "order_id must be a positive integer.",
        400,
      );
    }

    if (this.useMock) {
      const order = mockOrders.find((x) => x.id === id);

      if (!order) {
        throw new ConnectorError(
          "ORDER_NOT_FOUND",
          `No order was found with ID ${id}.`,
          404,
        );
      }

      return order;
    }

    return normalizeOrder(
      (await this.client.request<any>(`orders/${id}`)).data,
    );
  }

  async search(f: OrderFilters): Promise<OrderListResult> {
    if (
      !f.customerEmail &&
      !f.status &&
      !f.orderNumber &&
      !f.after &&
      !f.before
    ) {
      throw new ConnectorError(
        "SEARCH_FILTER_REQUIRED",
        "Provide at least one supported search filter.",
        400,
      );
    }

    return this.list(f);
  }
}
