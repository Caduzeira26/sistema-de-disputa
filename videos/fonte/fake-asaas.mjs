import http from "node:http";

const payments = new Map();
const customers = new Map();
let n = 0;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost:4010");
  const send = (status, body) => {
    res.writeHead(status, { "content-type": "application/json" });
    res.end(JSON.stringify(body));
  };
  let raw = "";
  for await (const chunk of req) raw += chunk;
  const body = raw ? JSON.parse(raw) : {};

  // test control: mutate a payment's state
  if (url.pathname === "/__set") {
    const p = payments.get(body.id);
    if (!p) return send(404, { error: "no such payment" });
    Object.assign(p, body.patch);
    return send(200, p);
  }
  if (url.pathname === "/__list") return send(200, [...payments.values()]);

  // the real API rejects these
  if (req.headers["access_token"] !== "test-key") return send(401, { errors: [{ code: "invalid_access_token", description: "A chave de API informada é inválida" }] });
  if (!req.headers["user-agent"]) return send(400, { errors: [{ code: "invalid_userAgent", description: "User-Agent obrigatório" }] });

  if (req.method === "GET" && url.pathname === "/v3/customers") {
    const doc = url.searchParams.get("cpfCnpj");
    return send(200, { data: [...customers.values()].filter((c) => c.cpfCnpj === doc) });
  }
  if (req.method === "POST" && url.pathname === "/v3/customers") {
    if (!body.name || !body.cpfCnpj) return send(400, { errors: [{ code: "invalid_customer", description: "name e cpfCnpj são obrigatórios" }] });
    const c = { id: `cus_fake_${customers.size + 1}`, name: body.name, cpfCnpj: body.cpfCnpj };
    customers.set(c.id, c);
    return send(200, c);
  }
  if (req.method === "POST" && url.pathname === "/v3/payments") {
    if (!body.customer || !body.billingType || !body.value || !body.dueDate) return send(400, { errors: [{ code: "invalid_payment", description: "campos obrigatórios ausentes" }] });
    n += 1;
    const p = {
      id: `pay_fake_${n}`,
      status: "PENDING",
      billingType: body.billingType,
      value: body.value,
      dueDate: body.dueDate,
      invoiceUrl: `http://localhost:4010/i/pay_fake_${n}`,
      bankSlipUrl: null,
      externalReference: body.externalReference,
      customer: body.customer,
      deleted: false,
    };
    payments.set(p.id, p);
    return send(200, p);
  }
  const m = url.pathname.match(/^\/v3\/payments\/([^/]+)$/);
  if (req.method === "GET" && m) {
    const p = payments.get(m[1]);
    return p ? send(200, p) : send(404, { errors: [{ code: "not_found", description: "Cobrança não encontrada" }] });
  }
  send(404, { error: "not found" });
});

server.listen(4010, () => console.log("fake asaas on :4010"));
