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
      (url, handler) => routes.set(`${method} ${url}`, handler),
    ]),
  );
  const source = fs.readFileSync(
    path.join(__dirname, "../routes", file),
    "utf8",
  );
  vm.runInNewContext(source, {
    require: (name) =>
      name === "express" ? { Router: () => router } : models[name],
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
