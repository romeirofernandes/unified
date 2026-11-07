import selectorParser from "postcss-selector-parser";

// Keep Tailwind's reset, theme and utilities inside the embedded widget.
export default function scopeStyles() {
  return {
    postcssPlugin: "unified-scope-styles",
    Rule(rule) {
      if (rule.parent?.type === "atrule" && /keyframes$/.test(rule.parent.name)) return;
      if (rule.selector.includes(".unified-feedback-root")) return;
      rule.selector = selectorParser((selectors) => {
        selectors.each((selector) => {
          selector.walkPseudos((node) => {
            if (node.value === ":root" || node.value === ":host") node.replaceWith(selectorParser.className({ value: "unified-feedback-root" }));
          });
          if (!selector.toString().includes(".unified-feedback-root")) {
            selector.prepend(selectorParser.combinator({ value: " " }));
            selector.prepend(selectorParser.className({ value: "unified-feedback-root" }));
          }
        });
      }).processSync(rule.selector);
    },
  };
}
