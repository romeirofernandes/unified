// A section remains current until the next heading crosses the reading line.
export function activeDocSection(sections, viewportTop, viewportHeight) {
  const readingLine = viewportTop + Math.min(120, viewportHeight * 0.25);
  return [...sections].reverse().find((section) => section.top <= readingLine)?.id || sections[0]?.id;
}
