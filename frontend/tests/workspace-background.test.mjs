import test from "node:test";
import assert from "node:assert/strict";
import {
  getWorkspaceBackground,
  setWorkspaceBackground,
  subscribeWorkspaceBackground,
} from "../src/lib/workspace-background.js";

test("background selection persists, rejects invalid values, and synchronizes subscribers", () => {
  const storage = new Map();
  const target = new EventTarget();
  globalThis.window = Object.assign(target, {
    localStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
    },
  });
  try {
    assert.equal(getWorkspaceBackground(), "cursor");
    let updates = 0;
    const unsubscribe = subscribeWorkspaceBackground(() => updates++);
    for (const value of ["glyph", "plain", "cursor"]) {
      setWorkspaceBackground(value);
      assert.equal(getWorkspaceBackground(), value);
      assert.equal(storage.get("unified:workspace-background"), value);
    }
    setWorkspaceBackground("invalid");
    assert.equal(updates, 3);
    storage.set("unified:workspace-background", "invalid");
    assert.equal(getWorkspaceBackground(), "cursor");
    storage.set("unified:workspace-background", "glyph");
    target.dispatchEvent(Object.assign(new Event("storage"), { key: "unified:workspace-background" }));
    assert.equal(updates, 4);
    assert.equal(getWorkspaceBackground(), "glyph");
    storage.clear();
    target.dispatchEvent(Object.assign(new Event("storage"), { key: null }));
    assert.equal(getWorkspaceBackground(), "cursor");
    target.localStorage = {
      getItem: () => { throw new Error("blocked"); },
      setItem: () => { throw new Error("blocked"); },
    };
    setWorkspaceBackground("plain");
    assert.equal(getWorkspaceBackground(), "plain");
    unsubscribe();
    setWorkspaceBackground("cursor");
    assert.equal(updates, 6);
  } finally {
    delete globalThis.window;
  }
});
