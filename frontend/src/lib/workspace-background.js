export const backgroundOptions = [
  { value: "cursor", label: "Cursor trail", description: "Blue pixels follow your pointer." },
  { value: "glyph", label: "Glyphs", description: "A drifting field of characters." },
  { value: "plain", label: "Plain", description: "A clean, still background." },
];

const storageKey = "unified:workspace-background";
const changeEvent = "workspace-background-change";
let current = "cursor";

function valid(value) {
  return backgroundOptions.some((option) => option.value === value);
}

export function getWorkspaceBackground() {
  try {
    const saved = window.localStorage.getItem(storageKey);
    if (saved !== null) return valid(saved) ? saved : "cursor";
  } catch {
    // Keep the preference usable when browser storage is unavailable.
  }
  return current;
}

export function setWorkspaceBackground(value) {
  if (!valid(value)) return;
  current = value;
  try {
    window.localStorage.setItem(storageKey, value);
  } catch {
    // The selection still applies for this session.
  }
  window.dispatchEvent(new Event(changeEvent));
}

export function subscribeWorkspaceBackground(listener) {
  const onStorage = (event) => {
    if (event.key === storageKey || event.key === null) {
      current = "cursor";
      listener();
    }
  };
  window.addEventListener(changeEvent, listener);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(changeEvent, listener);
    window.removeEventListener("storage", onStorage);
  };
}
