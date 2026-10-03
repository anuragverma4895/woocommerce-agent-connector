import express from "express";
import cors from "cors";
import { OrderService } from "./services/order-service.js";
import {
  ConnectorError,
  toSafeError,
} from "./utils/errors.js";
import {
  listOrdersSchema,
  getOrderSchema,
  searchOrdersSchema,
  toOrderFilters,
} from "./utils/validation.js";

export function createApp(service = new OrderService()) {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "100kb" }));

  app.get("/health", (_q, r) =>
    r.json({
      status: "ok",
      service: "woocommerce-agent-connector",
      readOnly: true,
    }),
  );

  app.get("/api/orders", async (q, r, n) => {
    try {
      const p = listOrdersSchema.parse({
        page: q.query.page ? Number(q.query.page) : 1,
        per_page: q.query.per_page ? Number(q.query.per_page) : 10,
        status: q.query.status,
        after: q.query.after,
        before: q.query.before,
      });

      r.json(
        await service.list({
          page: p.page,
          perPage: p.per_page,
          status: p.status,
          after: p.after,
          before: p.before,
        }),
      );
    } catch (e) {
      n(e);
    }
  });

  app.get("/api/orders/search", async (q, r, n) => {
    try {
      const p = searchOrdersSchema.parse({
        page: q.query.page ? Number(q.query.page) : 1,
        per_page: q.query.per_page ? Number(q.query.per_page) : 10,
        customer_email: q.query.customer_email,
        status: q.query.status,
        order_number: q.query.order_number,
        after: q.query.after,
        before: q.query.before,
      });

      r.json(await service.search(toOrderFilters(p)));
    } catch (e) {
      n(e);
    }
  });

  app.get("/api/orders/:id", async (q, r, n) => {
    try {
      const p = getOrderSchema.parse({ order_id: Number(q.params.id) });
      r.json(await service.getById(p.order_id));
    } catch (e) {
      n(e);
    }
  });

  app.get("/", (_q, r) =>
    r.type("html").send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>WooCommerce Agent Connector</title>
  <style>
    *{box-sizing:border-box}
    :root{color-scheme:light}
    body{margin:0;background:#fff;color:#111;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    button,input,select{font:inherit}
    button{cursor:pointer}
    .shell{max-width:1220px;margin:0 auto;padding:32px 26px 80px}
    .topbar{display:flex;align-items:center;justify-content:space-between;gap:20px;border-bottom:1px solid #eee;padding-bottom:18px}
    .brand{font-size:17px;font-weight:800;letter-spacing:-.03em}
    .brand span{font-weight:500;color:#777}
    .status{display:flex;align-items:center;gap:8px;border:1px solid #e5e5e5;border-radius:999px;padding:9px 13px;font-size:14px;font-weight:700}
    .dot{width:7px;height:7px;border-radius:50%;background:#111}
    .hero{padding:54px 0 36px;max-width:850px}
    .eyebrow{font-size:13px;letter-spacing:.16em;text-transform:uppercase;color:#777;font-weight:800}
    h1{font-size:clamp(42px,7vw,72px);line-height:.98;letter-spacing:-.055em;margin:13px 0 18px}
    .hero p{font-size:19px;color:#555;line-height:1.65;margin:0;max-width:780px}
    .actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:24px}
    .btn{border:1px solid #111;background:#111;color:#fff;border-radius:10px;padding:12px 17px;font-size:15px;font-weight:750}
    .btn.secondary{background:#fff;color:#111;border-color:#ddd}
    .btn.small{padding:9px 13px;font-size:14px}
    .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:12px 0 34px}
    .stat{border:1px solid #e8e8e8;border-radius:14px;padding:17px;background:#fff}
    .stat .label{font-size:14px;color:#777}
    .stat .value{font-size:30px;font-weight:800;letter-spacing:-.03em;margin-top:7px}
    .panel{border:1px solid #e6e6e6;border-radius:18px;overflow:hidden;margin-top:18px}
    .panel-head{padding:19px 20px;border-bottom:1px solid #eee;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap}
    .panel-title{font-size:20px;font-weight:800}
    .panel-sub{font-size:14px;color:#777;margin-top:4px}
    .filters{display:flex;gap:9px;flex-wrap:wrap}
    .input,.select{height:44px;border:1px solid #ddd;border-radius:9px;padding:0 11px;background:#fff;color:#111;min-width:200px;outline:none}
    .input:focus,.select:focus{border-color:#111}
    .table-wrap{overflow:auto}
    table{width:100%;border-collapse:collapse;min-width:760px}
    th,td{text-align:left;padding:16px 18px;border-bottom:1px solid #f0f0f0;font-size:15px}
    th{font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#777;background:#fafafa}
    tr:last-child td{border-bottom:0}
    .order-id{font-weight:800}
    .customer{font-weight:650}
    .muted{color:#777}
    .badge{display:inline-flex;border:1px solid #ddd;border-radius:999px;padding:5px 9px;font-size:12px;font-weight:750;text-transform:capitalize}
    .amount{font-weight:800}
    .empty{padding:45px;text-align:center;color:#777}
    .pager{display:flex;align-items:center;justify-content:space-between;padding:16px 18px;border-top:1px solid #eee;font-size:14px;color:#666}
    .pager-actions{display:flex;gap:7px}
    .tools{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
    .tool{border:1px solid #e6e6e6;border-radius:14px;padding:18px}
    .tool-name{font-size:16px;font-weight:850;font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
    .tool p{font-size:15px;line-height:1.55;color:#666;min-height:42px}
    .tool-code{background:#f7f7f7;border-radius:9px;padding:10px;font-size:13px;color:#555;margin:12px 0;overflow:auto}
    .architecture{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;align-items:center}
    .arch-box{border:1px solid #ddd;border-radius:12px;padding:16px;text-align:center;font-size:14px;font-weight:750}
    .arrow{text-align:center;color:#999}
    .footer{padding-top:34px;color:#888;font-size:14px}
    .modal{position:fixed;inset:0;background:rgba(0,0,0,.38);display:none;align-items:center;justify-content:center;padding:20px;z-index:20}
    .modal.open{display:flex}
    .modal-card{width:min(720px,100%);max-height:88vh;overflow:auto;background:#fff;border-radius:18px;border:1px solid #ddd;box-shadow:0 25px 80px rgba(0,0,0,.18)}
    .modal-head{display:flex;justify-content:space-between;align-items:center;padding:18px 20px;border-bottom:1px solid #eee}
    .modal-body{padding:20px}
    .close{border:1px solid #ddd;background:#fff;border-radius:8px;width:34px;height:34px}
    .detail-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}
    .detail{border:1px solid #eee;border-radius:11px;padding:13px}
    .detail-label{font-size:12px;color:#777;text-transform:uppercase;letter-spacing:.06em}
    .detail-value{font-size:15px;font-weight:750;margin-top:5px}
    .items{margin-top:18px;border:1px solid #eee;border-radius:12px;overflow:hidden}
    .json{background:#111;color:#eee;border-radius:10px;padding:15px;overflow:auto;font-size:14px;line-height:1.55}
    .toast{position:fixed;right:20px;bottom:20px;background:#111;color:#fff;padding:12px 16px;border-radius:10px;font-size:14px;display:none;z-index:30}
    .toast.show{display:block}
    @media(max-width:850px){.stats{grid-template-columns:repeat(2,1fr)}.tools{grid-template-columns:1fr}.architecture{grid-template-columns:1fr}.arrow{transform:rotate(90deg)}}
    @media(max-width:600px){.shell{padding:20px 14px 55px}.hero{padding:38px 0 28px}.stats{grid-template-columns:1fr 1fr}.input,.select{min-width:150px;width:100%}.filters{width:100%}.filters>*{flex:1}}
  </style>
</head>
<body>
  <div class="shell">
    <header class="topbar">
      <div class="brand">WooCommerce <span>Agent Connector</span></div>
      <div class="status"><span class="dot"></span><span id="statusText">Checking connector...</span></div>
    </header>

    <section class="hero">
      <div class="eyebrow">Merchant agent infrastructure</div>
      <h1>Connect WooCommerce data to AI agents.</h1>
      <p>Read-only, MCP-compatible order access with validated inputs, normalized responses, bounded pagination and resilient upstream handling.</p>
      <div class="actions">
        <button class="btn" id="loadBtn">Load demo orders</button>
        <button class="btn secondary" id="healthBtn">Run health check</button>
      </div>
    </section>

    <section class="stats">
      <div class="stat"><div class="label">Orders loaded</div><div class="value" id="statOrders">—</div></div>
      <div class="stat"><div class="label">Processing</div><div class="value" id="statProcessing">—</div></div>
      <div class="stat"><div class="label">Completed</div><div class="value" id="statCompleted">—</div></div>
      <div class="stat"><div class="label">Total value</div><div class="value" id="statValue">—</div></div>
    </section>

    <section class="panel">
      <div class="panel-head">
        <div>
          <div class="panel-title">Merchant orders</div>
          <div class="panel-sub">Interactive demo backed by the connector API</div>
        </div>
        <div class="filters">
          <input id="searchInput" class="input" placeholder="Email or order number">
          <select id="statusFilter" class="select">
            <option value="">All statuses</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
          <button class="btn small" id="searchBtn">Search</button>
          <button class="btn small secondary" id="clearBtn">Clear</button>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Order</th><th>Customer</th><th>Status</th><th>Total</th><th>Created</th><th></th></tr></thead>
          <tbody id="ordersBody"><tr><td colspan="6"><div class="empty">Click "Load demo orders" to fetch orders.</div></td></tr></tbody>
        </table>
      </div>
      <div class="pager">
        <span id="pageInfo">No results</span>
        <div class="pager-actions">
          <button class="btn small secondary" id="prevBtn">Previous</button>
          <button class="btn small secondary" id="nextBtn">Next</button>
        </div>
      </div>
    </section>

    <section class="panel">
      <div class="panel-head">
        <div><div class="panel-title">Agent tools</div><div class="panel-sub">The primitives exposed to an AI agent through MCP</div></div>
      </div>
      <div style="padding:16px">
        <div class="tools">
          <div class="tool">
            <div class="tool-name">list_orders</div>
            <p>List recent orders with optional status and date filters.</p>
            <div class="tool-code">list_orders({ page, per_page, status })</div>
            <button class="btn small" onclick="runTool('list')">Run tool</button>
          </div>
          <div class="tool">
            <div class="tool-name">get_order</div>
            <p>Retrieve one order by validated numeric ID.</p>
            <div class="tool-code">get_order({ order_id: 1001 })</div>
            <button class="btn small" onclick="runTool('get')">Run tool</button>
          </div>
          <div class="tool">
            <div class="tool-name">search_orders</div>
            <p>Search orders by customer email, order number or status.</p>
            <div class="tool-code">search_orders({ customer_email, status })</div>
            <button class="btn small" onclick="runTool('search')">Run tool</button>
          </div>
        </div>
        <div style="margin-top:16px" id="toolOutput"></div>
      </div>
    </section>

    <section class="panel">
      <div class="panel-head">
        <div><div class="panel-title">Architecture</div><div class="panel-sub">Narrow read-only boundary between the agent and WooCommerce</div></div>
      </div>
      <div style="padding:18px">
        <div class="architecture">
          <div class="arch-box">AI Agent / Agent Studio</div><div class="arrow">→</div>
          <div class="arch-box">MCP Tool Layer</div><div class="arrow">→</div>
          <div class="arch-box">Order Service</div><div class="arrow">→</div>
          <div class="arch-box">WooCommerce API</div>
        </div>
      </div>
    </section>

    <div class="footer">Read-only connector · Demo data is fictional · No customer credentials are stored in the UI</div>
  </div>

  <div class="modal" id="modal">
    <div class="modal-card">
      <div class="modal-head"><strong id="modalTitle">Order details</strong><button class="close" onclick="closeModal()">×</button></div>
      <div class="modal-body" id="modalBody"></div>
    </div>
  </div>
  <div class="toast" id="toast"></div>

  <script>
    var page = 1;
    var lastResult = null;

    function money(value, currency) {
      return new Intl.NumberFormat("en-IN", { style: "currency", currency: currency || "INR" }).format(Number(value || 0));
    }

    function escapeHtml(value) {
      return String(value == null ? "" : value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    }

    function showToast(message) {
      var el = document.getElementById("toast");
      el.textContent = message;
      el.classList.add("show");
      setTimeout(function(){ el.classList.remove("show"); }, 2200);
    }

    async function loadOrders(targetPage) {
      page = targetPage || 1;
      var search = document.getElementById("searchInput").value.trim();
      var status = document.getElementById("statusFilter").value;
      var url;

      if (search) {
        var params = new URLSearchParams({ page: String(page), per_page: "10" });
        if (status) params.set("status", status);
        if (search.indexOf("@") >= 0) params.set("customer_email", search);
        else params.set("order_number", search);
        url = "/api/orders/search?" + params.toString();
      } else {
        var listParams = new URLSearchParams({ page: String(page), per_page: "10" });
        if (status) listParams.set("status", status);
        url = "/api/orders?" + listParams.toString();
      }

      var body = document.getElementById("ordersBody");
      body.innerHTML = '<tr><td colspan="6"><div class="empty">Loading orders...</div></td></tr>';

      try {
        var response = await fetch(url);
        var data = await response.json();
        if (!response.ok) throw new Error(data.error ? data.error.message : "Request failed");
        lastResult = data;
        renderOrders(data);
      } catch (error) {
        body.innerHTML = '<tr><td colspan="6"><div class="empty">Error: ' + escapeHtml(error.message) + '</div></td></tr>';
        showToast(error.message);
      }
    }

    function renderOrders(data) {
      var body = document.getElementById("ordersBody");
      var orders = data.orders || [];

      document.getElementById("statOrders").textContent = data.total;
      document.getElementById("statProcessing").textContent = orders.filter(function(o){ return o.status === "processing"; }).length;
      document.getElementById("statCompleted").textContent = orders.filter(function(o){ return o.status === "completed"; }).length;
      document.getElementById("statValue").textContent = money(orders.reduce(function(sum,o){ return sum + Number(o.total || 0); }, 0), orders[0] && orders[0].currency);

      if (!orders.length) {
        body.innerHTML = '<tr><td colspan="6"><div class="empty">No orders matched these filters.</div></td></tr>';
      } else {
        body.innerHTML = orders.map(function(order) {
          return '<tr>' +
            '<td><span class="order-id">#' + escapeHtml(order.number) + '</span></td>' +
            '<td><div class="customer">' + escapeHtml(order.customer && order.customer.name) + '</div><div class="muted">' + escapeHtml(order.customer && order.customer.email) + '</div></td>' +
            '<td><span class="badge">' + escapeHtml(order.status) + '</span></td>' +
            '<td><span class="amount">' + money(order.total, order.currency) + '</span></td>' +
            '<td class="muted">' + new Date(order.createdAt).toLocaleString("en-IN") + '</td>' +
            '<td><button class="btn small secondary" onclick="showOrder(' + Number(order.id) + ')">Details</button></td>' +
          '</tr>';
        }).join("");
      }

      document.getElementById("pageInfo").textContent = "Page " + data.page + " of " + Math.max(data.totalPages || 1, 1) + " · " + data.total + " total";
      document.getElementById("prevBtn").disabled = data.page <= 1;
      document.getElementById("nextBtn").disabled = data.page >= data.totalPages;
    }

    async function showOrder(id) {
      try {
        var response = await fetch("/api/orders/" + id);
        var order = await response.json();
        if (!response.ok) throw new Error(order.error ? order.error.message : "Request failed");

        document.getElementById("modalTitle").textContent = "Order #" + order.number;
        var items = (order.items || []).map(function(item) {
          return '<tr><td>' + escapeHtml(item.name) + '</td><td>' + escapeHtml(item.quantity) + '</td><td>' + money(item.total, order.currency) + '</td></tr>';
        }).join("");

        document.getElementById("modalBody").innerHTML =
          '<div class="detail-grid">' +
            '<div class="detail"><div class="detail-label">Customer</div><div class="detail-value">' + escapeHtml(order.customer && order.customer.name) + '</div></div>' +
            '<div class="detail"><div class="detail-label">Status</div><div class="detail-value">' + escapeHtml(order.status) + '</div></div>' +
            '<div class="detail"><div class="detail-label">Email</div><div class="detail-value">' + escapeHtml(order.customer && order.customer.email) + '</div></div>' +
            '<div class="detail"><div class="detail-label">Total</div><div class="detail-value">' + money(order.total, order.currency) + '</div></div>' +
            '<div class="detail"><div class="detail-label">Payment</div><div class="detail-value">' + escapeHtml(order.paymentMethod) + '</div></div>' +
            '<div class="detail"><div class="detail-label">Created</div><div class="detail-value">' + new Date(order.createdAt).toLocaleString("en-IN") + '</div></div>' +
          '</div>' +
          '<div class="items"><table><thead><tr><th>Item</th><th>Qty</th><th>Total</th></tr></thead><tbody>' + items + '</tbody></table></div>' +
          '<details style="margin-top:16px"><summary style="cursor:pointer;font-weight:700">View normalized JSON</summary><pre class="json">' + escapeHtml(JSON.stringify(order, null, 2)) + '</pre></details>';

        document.getElementById("modal").classList.add("open");
      } catch (error) {
        showToast(error.message);
      }
    }

    function closeModal() {
      document.getElementById("modal").classList.remove("open");
    }

    async function runTool(type) {
      var url;
      if (type === "list") url = "/api/orders?per_page=5";
      if (type === "get") url = "/api/orders/1001";
      if (type === "search") url = "/api/orders/search?status=processing&per_page=5";

      try {
        var response = await fetch(url);
        var data = await response.json();
        if (!response.ok) throw new Error(data.error ? data.error.message : "Tool failed");
        document.getElementById("toolOutput").innerHTML =
          '<div class="panel" style="margin:0;border-radius:12px"><div class="panel-head"><div><div class="panel-title">Tool result</div><div class="panel-sub">' + escapeHtml(type === "list" ? "list_orders" : type === "get" ? "get_order" : "search_orders") + '</div></div></div><div style="padding:16px"><pre class="json">' +
          escapeHtml(JSON.stringify(data, null, 2)) + '</pre></div></div>';
      } catch (error) {
        showToast(error.message);
      }
    }

    async function healthCheck() {
      try {
        var response = await fetch("/health");
        var data = await response.json();
        document.getElementById("statusText").textContent = data.status === "ok" ? "Connector online · Read-only" : "Connector issue";
        showToast("Health check passed");
      } catch (error) {
        document.getElementById("statusText").textContent = "Connector unavailable";
        showToast(error.message);
      }
    }

    document.getElementById("loadBtn").addEventListener("click", function(){ loadOrders(1); });
    document.getElementById("searchBtn").addEventListener("click", function(){ loadOrders(1); });
    document.getElementById("clearBtn").addEventListener("click", function(){
      document.getElementById("searchInput").value = "";
      document.getElementById("statusFilter").value = "";
      loadOrders(1);
    });
    document.getElementById("prevBtn").addEventListener("click", function(){ if (page > 1) loadOrders(page - 1); });
    document.getElementById("nextBtn").addEventListener("click", function(){ if (lastResult && page < lastResult.totalPages) loadOrders(page + 1); });
    document.getElementById("healthBtn").addEventListener("click", healthCheck);
    document.getElementById("searchInput").addEventListener("keydown", function(event){ if (event.key === "Enter") loadOrders(1); });
    document.getElementById("modal").addEventListener("click", function(event){ if (event.target.id === "modal") closeModal(); });
    healthCheck();
    loadOrders(1);
  </script>
</body>
</html>`),
  );

  app.use((e: unknown, _q: any, r: any, _n: any) => {
    const x = e instanceof ConnectorError ? e : toSafeError(e);
    r.status(x.status).json({
      success: false,
      error: { code: x.code, message: x.message },
    });
  });

  return app;
}
