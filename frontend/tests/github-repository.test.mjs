import test from "node:test";
import assert from "node:assert/strict";
import { githubRepository } from "../src/lib/github-repository.js";
test("repository entry accepts copied GitHub links and owner/repo names", () => {
  for (const value of ["owner/repository", " https://github.com/owner/repository ", "https://github.com/owner/repository/", "https://github.com/owner/repository.git"]) assert.equal(githubRepository(value), "owner/repository");
  for (const value of ["https://other.example/owner/repository", "https://github.com/owner/repository/tree/main", "https://github.com/owner/repository?tab=readme", "https://name:password@github.com/owner/repo", "owner", "owner/.."]) assert.throws(() => githubRepository(value));
});
