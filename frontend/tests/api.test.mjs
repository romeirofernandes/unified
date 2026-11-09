import { setAccessTokenProvider } from "../src/lib/access-token.js";
setAccessTokenProvider(async () => "signed-test-token");
import test from "node:test";
import assert from "node:assert/strict";
import { apiRequest } from "../src/lib/api.js";

test("API requests preserve cancellation, identity, method, and JSON payload", async () => {
  const original = globalThis.fetch;
  const controller = new AbortController();
  try {
    globalThis.fetch = async (url, options) => {
      assert.equal(url, "http://localhost:8000/api/projects");
      assert.equal(options.method, "POST");
      assert.equal(options.headers.Authorization, "Bearer signed-test-token");
      assert.equal(options.headers["firebase-uid"], undefined);
      assert.equal(options.headers["Content-Type"], "application/json");
      assert.equal(options.body, '{"name":"App"}');
      assert.equal(options.signal, controller.signal);
      return { ok: true, status: 201, json: async () => ({ _id: "project" }) };
    };
    assert.deepEqual(
      await apiRequest("/projects", {
        method: "POST",
        uid: "user",
        body: { name: "App" },
        signal: controller.signal,
      }),
      { _id: "project" },
    );
  } finally {
    globalThis.fetch = original;
  }
});

test("HTTP errors retain the status needed for auth recovery", async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => ({
      ok: false,
      status: 404,
      json: async () => ({ message: "User not found" }),
    });
    await assert.rejects(apiRequest("/auth/login"), {
      message: "User not found",
      status: 404,
    });
    globalThis.fetch = async () => ({
      ok: false,
      status: 502,
      json: async () => {
        throw new SyntaxError();
      },
    });
    await assert.rejects(apiRequest("/projects"), { status: 502 });
  } finally {
    globalThis.fetch = original;
  }
});

test("recordings are uploaded as binary audio without JSON conversion", async () => {
  const original = globalThis.fetch;
  const audio = new Blob(["recording"], { type: "audio/ogg" });
  try {
    globalThis.fetch = async (_, options) => {
      assert.equal(options.body, audio);
      assert.equal(options.headers["Content-Type"], "audio/ogg");
      assert.equal(options.headers.Authorization, "Bearer signed-test-token");
      assert.equal(options.headers["firebase-uid"], undefined);
      return {
        ok: true,
        status: 200,
        json: async () => ({ text: "Transcript" }),
      };
    };
    assert.equal(
      (
        await apiRequest("/projects/transcribe", {
          method: "POST",
          uid: "user",
          rawBody: audio,
          headers: { "Content-Type": "audio/ogg" },
        })
      ).text,
      "Transcript",
    );
  } finally {
    globalThis.fetch = original;
  }
});

test("live requests keep bearer authentication in headers and return the stream without parsing JSON", async () => {
  const original = globalThis.fetch;
  const controller = new AbortController();
  const stream = new ReadableStream({start(c){c.enqueue(new TextEncoder().encode('event: ready\ndata: {}\n\n'));c.close();}});
  try {
    globalThis.fetch = async (url,options) => {
      assert.equal(url.includes('signed-test-token'),false);
      assert.equal(options.headers.Authorization,'Bearer signed-test-token');
      assert.equal(options.signal,controller.signal);
      assert.equal(options.stream,undefined);
      return {ok:true,status:200,body:stream,json:()=>{throw new Error('Do not parse SSE as JSON');}};
    };
    assert.equal(await apiRequest('/pull-requests/project/runs/run/events',{uid:'user',stream:true,signal:controller.signal}),stream);
  } finally {globalThis.fetch=original;}
});
