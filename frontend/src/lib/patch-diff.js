export function patchRows(before, after) {
  const old = before === "" ? [] : before.split("\n");
  const cur = after === "" ? [] : after.split("\n");
  let prefix = 0, suffix = 0;
  while (prefix < old.length && prefix < cur.length && old[prefix] === cur[prefix]) prefix++;
  while (suffix < old.length - prefix && suffix < cur.length - prefix && old[old.length - 1 - suffix] === cur[cur.length - 1 - suffix]) suffix++;
  const rows = old.slice(0, prefix).map((text, i) => ({old:i+1,cur:i+1,type:"ctx",pieces:[{text}]}));
  const pieces = (text, other, change) => {
    if (other === undefined) return [{text,change}];
    let start = 0, end = 0;
    while (start < text.length && start < other.length && text[start] === other[start]) start++;
    while (end < text.length - start && end < other.length - start && text[text.length - 1 - end] === other[other.length - 1 - end]) end++;
    return [{text:text.slice(0,start)}, {text:text.slice(start,text.length-end),change}, {text:end ? text.slice(-end) : ""}];
  };
  const removed = old.slice(prefix, old.length-suffix), added = cur.slice(prefix, cur.length-suffix);
  removed.forEach((text,i) => rows.push({old:prefix+i+1,cur:null,type:"del",pieces:pieces(text,added[i],"del")}));
  added.forEach((text,i) => rows.push({old:null,cur:prefix+i+1,type:"add",pieces:pieces(text,removed[i],"add")}));
  old.slice(old.length-suffix).forEach((text,i) => rows.push({old:old.length-suffix+i+1,cur:cur.length-suffix+i+1,type:"ctx",pieces:[{text}]}));
  return rows;
}
