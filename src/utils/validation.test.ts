import { describe, expect, it } from "vitest";
import {
  getOrderSchema,
  listOrdersSchema,
  searchOrdersSchema,
  toOrderFilters,
} from "./validation.js";

describe("validation", () => {
  it("accepts valid list order parameters", () => {
    expect(
      listOrdersSchema.parse({
        page: 1,
        per_page: 10,
        status: "processing",
      }),
    ).toMatchObject({
      page: 1,
      per_page: 10,
      status: "processing",
    });
  });

  it("rejects excessive page sizes", () => {
    expect(() =>
      listOrdersSchema.parse({ page: 1, per_page: 51 }),
    ).toThrow();
  });

  it("rejects invalid order IDs", () => {
    expect(() => getOrderSchema.parse({ order_id: 0 })).toThrow();
    expect(() => getOrderSchema.parse({ order_id: 1.5 })).toThrow();
  });

  it("rejects malformed customer email filters", () => {
    expect(() =>
      searchOrdersSchema.parse({ customer_email: "not-an-email" }),
    ).toThrow();
  });

  it("rejects reversed date ranges", () => {
    expect(() =>
      toOrderFilters({
        page: 1,
        per_page: 10,
        after: "2026-10-02T00:00:00Z",
        before: "2026-10-01T00:00:00Z",
        status: undefined,
        customer_email: undefined,
        order_number: undefined,
      }),
    ).toThrowError(/after/);
  });
});
