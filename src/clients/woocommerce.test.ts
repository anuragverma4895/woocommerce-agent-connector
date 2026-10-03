import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../config/env.js", () => ({
  config: {
    USE_MOCK_DATA: false,
    WOOCOMMERCE_STORE_URL: "https://merchant.example.test",
    WOOCOMMERCE_CONSUMER_KEY: "ck_test_key",
    WOOCOMMERCE_CONSUMER_SECRET: "cs_test_secret",
    REQUEST_TIMEOUT_MS: 100,
    MAX_RETRIES: 1,
    MAX_PER_PAGE: 50,
    RETRY_BASE_DELAY_MS: 0,
  },
}));

import { WooCommerceClient } from "./woocommerce.js";

describe("WooCommerceClient", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("maps authentication failures to a safe error", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response("unauthorized", { status: 401 }),
    );

    const client = new WooCommerceClient(fetchMock);

    await expect(client.request("orders")).rejects.toMatchObject({
      code: "AUTHENTICATION_FAILED",
      status: 401,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries a rate-limited response and honors the bounded retry budget", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response("slow down", {
          status: 429,
          headers: { "Retry-After": "0" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify([{ id: 1001, number: "1001" }]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

    const client = new WooCommerceClient(fetchMock);
    const result = await client.request<unknown[]>("orders", { per_page: 5 });

    expect(result.data).toEqual([{ id: 1001, number: "1001" }]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("converts aborts into a retryable timeout error", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockRejectedValue(
      new DOMException("Timed out", "AbortError"),
    );

    const client = new WooCommerceClient(fetchMock);

    await expect(client.request("orders")).rejects.toMatchObject({
      code: "UPSTREAM_TIMEOUT",
      status: 504,
      retryable: true,
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("never includes the consumer secret in authentication errors", async () => {
    const secret = "cs_test_secret";
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response("unauthorized", { status: 401 }),
    );

    const client = new WooCommerceClient(fetchMock);

    try {
      await client.request("orders");
      throw new Error("Expected request to reject");
    } catch (error) {
      expect((error as Error).message).not.toContain(secret);
      expect((error as Error).message).not.toContain("ck_test_key");
    }
  });

  it("sends the expected WooCommerce URL and authorization header", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response("[]", {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "X-WP-Total": "0",
          "X-WP-TotalPages": "0",
        },
      }),
    );

    const client = new WooCommerceClient(fetchMock);
    await client.request("orders", { page: 1, per_page: 10 });

    const [url, options] = fetchMock.mock.calls[0]!;
    expect(String(url)).toContain(
      "https://merchant.example.test/wp-json/wc/v3/orders?page=1&per_page=10",
    );
    expect((options?.headers as Record<string, string>).Authorization).toMatch(
      /^Basic /,
    );
  });
});
