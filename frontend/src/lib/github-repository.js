export function githubRepository(value) {
  let name = value.trim();
  if (/^https?:\/\//i.test(name)) {
    const url = new URL(name);
    if (url.protocol !== "https:" || url.hostname !== "github.com" || url.username || url.password || url.port || url.search || url.hash) throw new Error("Paste a GitHub repository link, such as https://github.com/owner/repository.");
    name = url.pathname.replace(/^\//, "").replace(/\/$/, "");
  }
  name = name.replace(/\.git$/, "");
  if (!/^[a-zA-Z0-9][a-zA-Z0-9-]{0,38}\/[a-zA-Z0-9_.-]{1,100}$/.test(name) || /\/\.{1,2}$/.test(name)) throw new Error("Use a repository link or owner/repository, without a branch or file path.");
  return name;
}
