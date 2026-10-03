import { config } from "../config/env.js";
import { ConnectorError } from "../utils/errors.js";

export class WooCommerceClient {
  constructor(private readonly fetchImpl: typeof fetch = fetch) {}

  async request<T>(
    path: string,
    params: Record<string, string | number | undefined> = {},
  ): Promise<{ data: T; headers: Headers }> {
    if (config.USE_MOCK_DATA) {
      throw new ConnectorError(
        "MOCK_MODE_CLIENT_ERROR",
        "HTTP client is disabled in mock mode.",
      );
    }

    const base = config.WOOCOMMERCE_STORE_URL!.replace(/\/$/, "");
    const url = new URL(
      `${base}/wp-json/wc/v3/${path.replace(/^\//, "")}`,
    );

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) url.searchParams.set(key, String(value));
    });

    const auth = Buffer.from(
      `${config.WOOCOMMERCE_CONSUMER_KEY}:${config.WOOCOMMERCE_CONSUMER_SECRET}`,
    ).toString("base64");

    let attempt = 0;

    while (true) {
      const controller = new AbortController();
      const timeout = setTimeout(
        () => controller.abort(),
        config.REQUEST_TIMEOUT_MS,
      );

      try {
        const response = await this.fetchImpl(url, {
          headers: {
            Accept: "application/json",
            Authorization: `Basic ${auth}`,
          },
          signal: controller.signal,
        });

        if (response.ok) {
          return {
            data: (await response.json()) as T,
            headers: response.headers,
          };
        }

        const retryAfter = response.headers.get("retry-after");

        if (
          (response.status === 429 || response.status >= 500) &&
          attempt < config.MAX_RETRIES
        ) {
          const delay = Math.min(
            Math.max(
              retryAfter ? Number(retryAfter) * 1000 : 0,
              config.RETRY_BASE_DELAY_MS * 2 ** attempt,
            ),
            5000,
          );
          attempt++;
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        if (response.status === 401) {
          throw new ConnectorError(
            "AUTHENTICATION_FAILED",
            "WooCommerce rejected the connector credentials.",
            401,
          );
        }

        if (response.status === 403) {
          throw new ConnectorError(
            "FORBIDDEN",
            "The configured credentials do not permit this operation.",
            403,
          );
        }

        if (response.status === 404) {
          throw new ConnectorError(
            "NOT_FOUND",
            "The requested WooCommerce resource was not found.",
            404,
          );
        }

        if (response.status === 429) {
          throw new ConnectorError(
            "RATE_LIMITED",
            "WooCommerce rate-limited the request. Please retry later.",
            429,
            true,
          );
        }

        throw new ConnectorError(
          "UPSTREAM_ERROR",
          `WooCommerce returned HTTP ${response.status}.`,
          502,
          response.status >= 500,
        );
      } catch (error) {
        if (error instanceof ConnectorError) throw error;

        if (error instanceof Error && error.name === "AbortError") {
          throw new ConnectorError(
            "UPSTREAM_TIMEOUT",
            "WooCommerce did not respond within the configured timeout.",
            504,
            true,
          );
        }

        if (attempt < config.MAX_RETRIES) {
          const delay = Math.min(
            config.RETRY_BASE_DELAY_MS * 2 ** attempt,
            5000,
          );
          attempt++;
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        throw new ConnectorError(
          "UPSTREAM_NETWORK_ERROR",
          "The connector could not reach WooCommerce.",
          502,
          true,
        );
      } finally {
        clearTimeout(timeout);
      }
    }
  }
}
