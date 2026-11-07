const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function loadRoutes(file, models) {
  const routes = new Map();
  const router = Object.fromEntries(
    ["get", "post", "put", "delete"].map((method) => [
      method,
      (url, ...handlers) => routes.set(`${method} ${url}`, handlers.at(-1)),
    ]),
  );
  router.use = () => {};
  const source = fs.readFileSync(
    path.join(__dirname, "../routes", file),
    "utf8",
  );
  vm.runInNewContext(source, {
    require: (name) =>
      name === "express" ? { Router: () => router, raw: () => (req, res, next) => next() } : models[name] || require(name.startsWith(".") ? path.join(__dirname, "../routes", name) : name),
    module: { exports: {} },
    console,
  });
  return routes;
}
function response() {
  return {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.data = data;
      return this;
    },
    header() {},
    set() {},
  };
}

test("project lists return counts without downloading each project's feedback", async () => {
  let aggregates = 0;
  const routes = loadRoutes("projects.js", {
    "../models/Project": {
      find: (filter) => {
        assert.equal(filter.userId, "owner");
        return {
          lean: async () => [
            { _id: "a", name: "A" },
            { _id: "b", name: "B" },
          ],
        };
      },
    },
    "../models/Feedback": {
      aggregate: async (pipeline) => {
        aggregates++;
        assert.equal(pipeline[0].$match.projectId.$in.length, 2);
        return [{ _id: "a", count: 7 }];
      },
    },
  });
  const res = response();
  await routes.get("get /")({ user: { id: "owner" } }, res);
  assert.equal(aggregates, 1);
  assert.equal(res.data[0].feedbackCount, 7);
  assert.equal(res.data[1].feedbackCount, 0);
});

test("project reads cannot cross the workspace ownership boundary", async () => {
  const routes = loadRoutes("projects.js", {
    "../models/Project": {
      findOne: async (filter) => {
        assert.equal(filter._id, "other-project");
        assert.equal(filter.userId, "owner");
        return null;
      },
    },
    "../models/Feedback": {},
  });
  const res = response();
  await routes.get("get /:id")(
    { user: { id: "owner" }, params: { id: "other-project" } },
    res,
  );
  assert.equal(res.statusCode, 404);
});

test("project deletion removes feedback before the project and is scoped to its owner", async () => {
  const calls = [];
  const routes = loadRoutes("projects.js", {
    "../models/Project": {
      findOne: async () => ({ _id: "project" }),
      deleteOne: async (filter) => {
        assert.equal(filter.userId, "owner");
        calls.push("project");
      },
    },
    "../models/Feedback": {
      deleteMany: async (filter) => {
        assert.equal(filter.projectId, "project");
        calls.push("feedback");
      },
    },
  });
  const res = response();
  await routes.get("delete /:id")(
    { user: { id: "owner" }, params: { id: "project" } },
    res,
  );
  assert.deepEqual(calls, ["feedback", "project"]);
  assert.equal(res.statusCode, 200);
});

test("a failed feedback cleanup keeps the project available for retry", async () => {
  let deleted = false;
  const routes = loadRoutes("projects.js", {
    "../models/Project": {
      findOne: async () => ({ _id: "project" }),
      deleteOne: async () => {
        deleted = true;
      },
    },
    "../models/Feedback": {
      deleteMany: async () => {
        throw new Error("Database unavailable");
      },
    },
  });
  const res = response();
  await routes.get("delete /:id")(
    { user: { id: "owner" }, params: { id: "project" } },
    res,
  );
  assert.equal(res.statusCode, 500);
  assert.equal(deleted, false);
});

test("feedback reads refuse a project that the caller does not own", async () => {
  let queried = false;
  const routes = loadRoutes("feedback.js", {
    "../models/Project": {
      findOne: async (filter) => {
        assert.equal(filter.userId, "owner");
        return null;
      },
    },
    "../models/Feedback": {
      find: () => {
        queried = true;
      },
    },
  });
  const res = response();
  await routes.get("get /project/:projectId")(
    { user: { id: "owner" }, params: { projectId: "other" } },
    res,
  );
  assert.equal(res.statusCode, 404);
  assert.equal(queried, false);
});

for (const scenario of ["save", "reuse", "new", "locked"]) {
  test(`summary persistence: ${scenario}`, async () => {
    let generations = 0;
    let stored;
    const saved = scenario === "reuse" ? { responseIds: ["r1"], tldr: "Saved" } : scenario === "new" ? { responseIds: ["old"] } : null;
    const project = { _id: "project", fields: [], feedbackSummary: saved };
    const routes = loadRoutes("feedback.js", {
      "../models/Project": {
        findOne: () => ({ lean: async () => project }),
        findOneAndUpdate: (filter, update) => {
          if (update.$set?.summaryLock) return { lean: async () => scenario === "locked" ? null : project };
          stored = update.$set.feedbackSummary;
          return Promise.resolve({ feedbackSummary: stored });
        },
        updateOne: async () => {},
      },
      "../models/Feedback": { find: () => ({ sort: () => ({ lean: async () => [{ _id: "r1" }] }) }) },
      "../services/feedback-summary": { summarizeFeedback: async () => { generations++; return { tldr: "Overview", features: ["Fix search"] }; } },
    });
    const res = response();
    await routes.get("post /project/:projectId/summary")({ user: { id: "owner" }, params: { projectId: "project" } }, res);
    assert.equal(generations, ["save", "new"].includes(scenario) ? 1 : 0);
    assert.equal(res.statusCode, scenario === "locked" ? 409 : 200);
    if (stored) {
      assert.deepEqual(Array.from(stored.responseIds), ["r1"]);
      assert.equal(stored.responseCount, 1);
      assert.equal(res.data, stored);
    }
    if (scenario === "reuse") assert.equal(res.data, saved);
  });
}

test("submission endpoint authenticates a scoped key and saves dashboard feedback", async () => {
  const { createHash } = require("node:crypto");
  const key = `uf_${"a".repeat(64)}`;
  let saved;
  const routes = loadRoutes("submissions.js", {
    "../models/Project": { findOne: async (filter) => {
      assert.equal(filter.submissionKeyHash, createHash("sha256").update(key).digest("hex"));
      return { _id: filter._id, fields: [{ _id: "question", type: "text", label: "Feedback", required: true }] };
    } },
    "../models/Feedback": { create: async (value) => { saved = value; return { _id: "response" }; } },
  });
  const submit = routes.get("post /:projectId");
  const request = { headers: { authorization: `Bearer ${key}` }, params: { projectId: "507f1f77bcf86cd799439011" }, body: { formAnswers: { question: "Looks good" } } };
  const res = response();
  await submit(request, res);
  assert.equal(res.statusCode, 201);
  assert.equal(saved.formAnswers.question, "Looks good");
  const denied = response();
  await submit({ ...request, headers: {} }, denied);
  assert.equal(denied.statusCode, 401);
});

test("revoked submission keys cannot save responses", async () => {
  const routes = loadRoutes("submissions.js", {
    "../models/Project": { findOne: async () => null },
    "../models/Feedback": { create: () => assert.fail("must not save") },
  });
  const res = response();
  await routes.get("post /:projectId")({ headers: { authorization: `Bearer uf_${"b".repeat(64)}` }, params: { projectId: "507f1f77bcf86cd799439011" } }, res);
  assert.equal(res.statusCode, 401);
});

test("owners can retrieve encrypted submission keys without exposing the hash", async () => {
  const routes = loadRoutes("projects.js", {
    "../models/Project": { findOne: (filter) => {
      assert.equal(filter.userId, "owner");
      assert.equal(filter._id, "project");
      return { select: async () => ({ submissionKeyEncrypted: "ciphertext", submissionKeyHash: "digest" }) };
    } },
    "../services/secret-storage": { decrypt: (value) => { assert.equal(value, "ciphertext"); return "uf_saved"; } },
  });
  const res = response();
  await routes.get("get /:id/submission-key")({ params: { id: "project" }, user: { id: "owner" } }, res);
  assert.equal(res.data.key, "uf_saved");
  assert.equal(res.data.submissionKeyHash, undefined);
});
test("replacing a submission key updates its encrypted value and authentication digest", async () => {
  let saved;
  const routes = loadRoutes("projects.js", {
    "../models/Project": { findOneAndUpdate: async (filter, update) => { assert.equal(filter.userId, "owner"); saved = update.$set; return {}; } },
    "../services/secret-storage": { encrypt: (value) => `encrypted:${value}` },
  });
  const res = response();
  await routes.get("post /:id/submission-key")({ params: { id: "project" }, user: { id: "owner" } }, res);
  assert.match(res.data.key, /^uf_[a-f0-9]{64}$/);
  assert.equal(saved.submissionKeyEncrypted, `encrypted:${res.data.key}`);
  assert.equal(saved.submissionKeyHash, require("node:crypto").createHash("sha256").update(res.data.key).digest("hex"));
});

test("owner feedback cannot bypass the same answer validation as public submissions", async () => {
  let saves = 0;
  const routes = loadRoutes("feedback.js", {
    "../models/Project": { findOne: async () => ({ fields: [{ _id: "email", type: "email", label: "Email", required: true }] }) },
    "../models/Feedback": class Feedback {
      constructor(data) { Object.assign(this, data); }
      async save() { saves++; }
    },
  });
  const invalid = response();
  await routes.get("post /")({ user: { id: "owner" }, body: { projectId: "project", formAnswers: { email: "bad" } } }, invalid);
  assert.equal(invalid.statusCode, 400);
  assert.equal(saves, 0);
  const valid = response();
  await routes.get("post /")({ user: { id: "owner" }, body: { projectId: "project", formAnswers: { email: "person@example.com" } } }, valid);
  assert.equal(valid.statusCode, 201);
  assert.equal(saves, 1);
});
