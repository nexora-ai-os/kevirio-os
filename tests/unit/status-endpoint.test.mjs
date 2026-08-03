import assert from "node:assert/strict";
import test from "node:test";

import statusHandler from "../../api/status.js";

test("status endpoint returns one complete safe JSON response", async () => {
  const response = {
    body: null,
    headers: {},
    statusCode: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.headers["content-type"] = "application/json; charset=utf-8";
      this.body = JSON.stringify(payload);
      return this;
    },
  };

  await statusHandler({ method: "GET" }, response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.headers["content-type"], "application/json; charset=utf-8");
  assert.equal(response.body.at(-1), "}");
  assert.equal(response.body.includes("\n"), false);

  const parsed = JSON.parse(response.body);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.productionExecution, false);
  assert.equal(parsed.externalCommunication, false);
  assert.equal(parsed.approvalConfirmed, false);
  assert.equal(parsed.actualRevenue, false);
  assert.equal(Object.hasOwn(parsed, "error"), false);
  assert.equal(Object.hasOwn(parsed, "stack"), false);
});
