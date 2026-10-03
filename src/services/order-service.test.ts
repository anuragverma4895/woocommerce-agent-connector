import { describe, expect, it } from "vitest";
import { ConnectorError } from "../utils/errors.js";
import { OrderService } from "./order-service.js";

describe("OrderService", () => {
  it("lists mock orders", async () => {
    const service = new OrderService(undefined, true);
    const result = await service.list({ perPage: 2 });

    expect(result.orders).toHaveLength(2);
    expect(result.total).toBe(5);
    expect(result.totalPages).toBe(3);
  });

  it("filters and searches mock orders", async () => {
    const service = new OrderService(undefined, true);
    const result = await service.search({
      customerEmail: "diya@example.test",
    });

    expect(result.orders).toHaveLength(1);
    expect(result.orders[0]?.number).toBe("1002");
  });

  it("gets a specific mock order", async () => {
    const service = new OrderService(undefined, true);
    const order = await service.getById(1001);

    expect(order.id).toBe(1001);
    expect(order.customer.email).toBe("aarav@example.test");
  });

  it("rejects invalid order IDs", async () => {
    const service = new OrderService(undefined, true);

    await expect(service.getById(0)).rejects.toMatchObject({
      code: "INVALID_ORDER_ID",
      status: 400,
    });
  });

  it("rejects invalid pagination", async () => {
    const service = new OrderService(undefined, true);

    await expect(service.list({ page: 0 })).rejects.toMatchObject({
      code: "INVALID_PAGINATION",
      status: 400,
    });

    await expect(service.list({ perPage: 51 })).rejects.toMatchObject({
      code: "INVALID_PAGINATION",
      status: 400,
    });
  });

  it("rejects reversed date ranges", async () => {
    const service = new OrderService(undefined, true);

    await expect(
      service.list({
        after: "2026-10-01T00:00:00Z",
        before: "2026-09-01T00:00:00Z",
      }),
    ).rejects.toMatchObject({
      code: "INVALID_DATE_RANGE",
      status: 400,
    });
  });

  it("returns order not found without contacting an upstream service", async () => {
    const service = new OrderService(undefined, true);

    await expect(service.getById(9999)).rejects.toMatchObject({
      code: "ORDER_NOT_FOUND",
      status: 404,
    });
  });

  it("rejects search without filters", async () => {
    const service = new OrderService(undefined, true);

    await expect(service.search({})).rejects.toMatchObject({
      code: "SEARCH_FILTER_REQUIRED",
      status: 400,
    });
  });

  it("normalizes malformed upstream list payloads into a safe error", async () => {
    const client = {
      request: async () => ({
        data: { unexpected: true },
        headers: new Headers(),
      }),
    };

    const service = new OrderService(client as any, false);

    await expect(service.list()).rejects.toMatchObject({
      code: "MALFORMED_UPSTREAM_RESPONSE",
      status: 502,
    });
  });

  it("does not expose credential-like values in service errors", async () => {
    const secret = "cs_test_secret_should_never_escape";
    const client = {
      request: async () => {
        throw new ConnectorError(
          "UPSTREAM_ERROR",
          "WooCommerce returned an upstream error.",
          502,
        );
      },
    };

    const service = new OrderService(client as any, false);

    try {
      await service.list();
      throw new Error("Expected service.list() to reject");
    } catch (error) {
      expect(error).toMatchObject({ code: "UPSTREAM_ERROR", status: 502 });
      expect((error as Error).message).not.toContain(secret);
    }
  });
});
