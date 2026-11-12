const colors = ["#5577b5", "#a66b35", "#588568", "#a55d76", "#64858c", "#8b74a4"];
export function issueColor(id = "") {
  return colors[[...String(id)].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) >>> 0, 0) % colors.length];
}
