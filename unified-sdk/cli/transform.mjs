import { parse } from "@babel/parser";
import MagicString from "magic-string";

export function parseEntry(source) {
  try {
    return parse(source, {
      sourceType: "module",
      plugins: ["jsx", "typescript"],
    }).program;
  } catch {
    throw new Error(
      "Could not parse the app entry. No files were changed. Use --entry to select a JSX or TSX entry.",
    );
  }
}
function walk(node, visit) {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    node.forEach((item) => walk(item, visit));
    return;
  }
  if (typeof node.type === "string") visit(node);
  for (const [key, value] of Object.entries(node))
    if (
      ![
        "loc",
        "comments",
        "tokens",
        "leadingComments",
        "trailingComments",
        "innerComments",
      ].includes(key) &&
      value &&
      typeof value === "object"
    )
      walk(value, visit);
}
function jsxName(node) {
  return node?.type === "JSXIdentifier" ? node.name : null;
}
function unwrap(node) {
  return [
    "TSAsExpression",
    "TSNonNullExpression",
    "ParenthesizedExpression",
    "TSSatisfiesExpression",
  ].includes(node?.type)
    ? unwrap(node.expression)
    : node;
}
function defaultReturns(program) {
  let declaration = program.body.find(
    (node) => node.type === "ExportDefaultDeclaration",
  )?.declaration;
  if (declaration?.type === "Identifier") {
    for (const node of program.body) {
      if (
        node.type === "FunctionDeclaration" &&
        node.id?.name === declaration.name
      ) {
        declaration = node;
        break;
      }
      if (node.type === "VariableDeclaration") {
        const item = node.declarations.find(
          (item) => item.id?.name === declaration.name,
        );
        if (item) {
          declaration = item.init;
          break;
        }
      }
    }
  }
  if (
    ![
      "FunctionDeclaration",
      "FunctionExpression",
      "ArrowFunctionExpression",
    ].includes(declaration?.type)
  )
    throw new Error(
      "The default app export is not a supported function. No files were changed.",
    );
  if (declaration.body.type !== "BlockStatement")
    return [unwrap(declaration.body)];
  const values = [];
  function visit(node) {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    if (
      [
        "FunctionDeclaration",
        "FunctionExpression",
        "ArrowFunctionExpression",
      ].includes(node.type)
    )
      return;
    if (node.type === "ReturnStatement" && node.argument) {
      values.push(unwrap(node.argument));
      return;
    }
    for (const [key, value] of Object.entries(node))
      if (key !== "loc" && value && typeof value === "object") visit(value);
  }
  visit(declaration.body);
  return values.filter((node) =>
    ["JSXElement", "JSXFragment"].includes(node.type),
  );
}
function viteRoot(program, imports) {
  const create = new Set();
  const hydrate = new Set();
  const namespaces = new Set();
  for (const node of imports.filter((item) =>
    ["react-dom", "react-dom/client"].includes(item.source.value),
  ))
    for (const item of node.specifiers) {
      if (item.type !== "ImportSpecifier") namespaces.add(item.local.name);
      else if (item.imported.name === "createRoot") create.add(item.local.name);
      else if (item.imported.name === "hydrateRoot")
        hydrate.add(item.local.name);
    }
  const isFactory = (callee, names, member) =>
    callee?.type === "Identifier"
      ? names.has(callee.name)
      : callee?.type === "MemberExpression" &&
        namespaces.has(callee.object?.name) &&
        callee.property?.name === member;
  const roots = new Set();
  walk(program, (node) => {
    if (
      node.type === "VariableDeclarator" &&
      node.id.type === "Identifier" &&
      unwrap(node.init)?.type === "CallExpression" &&
      isFactory(unwrap(node.init).callee, create, "createRoot")
    )
      roots.add(node.id.name);
  });
  const candidates = [];
  walk(program, (node) => {
    if (node.type !== "CallExpression") return;
    const callee = node.callee;
    if (isFactory(callee, hydrate, "hydrateRoot")) {
      if (node.arguments[1]) candidates.push(unwrap(node.arguments[1]));
      return;
    }
    if (
      callee?.type !== "MemberExpression" ||
      callee.property?.name !== "render"
    )
      return;
    const receiver = unwrap(callee.object);
    if (
      roots.has(receiver?.name) ||
      namespaces.has(receiver?.name) ||
      (receiver?.type === "CallExpression" &&
        isFactory(receiver.callee, create, "createRoot"))
    )
      if (node.arguments[0]) candidates.push(unwrap(node.arguments[0]));
  });
  if (candidates.length !== 1)
    throw new Error(
      "Expected one React root in the entry. No files were changed. Select the correct file with --entry.",
    );
  return candidates[0];
}

export function patchEntry(source, { framework, componentImport }) {
  const program = parseEntry(source);
  const imports = program.body.filter(
    (node) => node.type === "ImportDeclaration",
  );
  const existing = imports.find((node) =>
    [
      componentImport,
      `${componentImport}.jsx`,
      `${componentImport}.tsx`,
      `${componentImport}.js`,
    ].includes(node.source.value),
  );
  const sdkNames = imports
    .filter((node) => node.source.value === "unified-sdk")
    .flatMap((node) =>
      node.specifiers
        .filter((item) => item.imported?.name === "UnifiedFeedback")
        .map((item) => item.local.name),
    );
  let manualMount = false;
  walk(program, (node) => {
    if (
      (node.type === "JSXOpeningElement" &&
        sdkNames.includes(jsxName(node.name))) ||
      (node.type === "CallExpression" &&
        sdkNames.includes(node.arguments?.[0]?.name) &&
        (node.callee?.name === "createElement" ||
          node.callee?.property?.name === "createElement"))
    )
      manualMount = true;
  });
  if (manualMount)
    throw new Error(
      "UnifiedFeedback is already mounted manually in this entry. Keep that integration or remove it before running setup. No files were changed.",
    );
  const identifiers = new Set();
  walk(program, (node) => {
    if (["Identifier", "JSXIdentifier"].includes(node.type))
      identifiers.add(node.name);
  });
  let name = existing?.specifiers.find(
    (item) => item.type === "ImportDefaultSpecifier",
  )?.local.name;
  if (!name) {
    name = "UnifiedFeedbackWidget";
    for (let index = 2; identifiers.has(name); index++)
      name = `UnifiedFeedbackWidget${index}`;
  }
  let mounted = false;
  walk(program, (node) => {
    if (node.type === "JSXOpeningElement" && jsxName(node.name) === name)
      mounted = true;
  });
  const output = new MagicString(source);
  if (!mounted) {
    if (framework === "next-app") {
      const returns = defaultReturns(program);
      const bodies = [];
      returns.forEach((node) =>
        walk(node, (item) => {
          if (
            item.type === "JSXElement" &&
            jsxName(item.openingElement.name) === "body" &&
            item.closingElement
          )
            bodies.push(item);
        }),
      );
      if (bodies.length !== 1)
        throw new Error(
          "Expected one <body> in the root layout. No files were changed.",
        );
      output.appendLeft(bodies[0].closingElement.start, `<${name} />`);
    } else {
      const returns =
        framework === "vite"
          ? [viteRoot(program, imports)]
          : defaultReturns(program);
      if (returns.length !== 1)
        throw new Error(
          "Expected one JSX return in the app component. No files were changed.",
        );
      const root = returns[0];
      if (root.type === "JSXFragment")
        output.appendLeft(root.closingFragment.start, `<${name} />`);
      else if (root.type === "JSXElement" && !root.openingElement.selfClosing)
        output.appendLeft(root.closingElement.start, `<${name} />`);
      else
        output.overwrite(
          root.start,
          root.end,
          `<>${["JSXElement", "JSXFragment"].includes(root.type) ? source.slice(root.start, root.end) : `{${source.slice(root.start, root.end)}}`}<${name} /></>`,
        );
    }
  }
  const additions = [];
  if (!existing)
    additions.push(`import ${name} from ${JSON.stringify(componentImport)};`);
  if (
    !imports.some(
      (node) => node.source.value === "unified-sdk/dist/unified-sdk.css",
    )
  )
    additions.push('import "unified-sdk/dist/unified-sdk.css";');
  if (additions.length) {
    const position =
      imports.at(-1)?.end ??
      program.directives.at(-1)?.end ??
      program.interpreter?.end ??
      0;
    output.appendLeft(
      position,
      `${position ? "\n" : ""}${additions.join("\n")}\n`,
    );
  }
  parseEntry(output.toString());
  return output.toString();
}

export function hasManualMount(source) {
  const program = parseEntry(source);
  const names = program.body
    .filter(
      (node) =>
        node.type === "ImportDeclaration" &&
        node.source.value === "unified-sdk",
    )
    .flatMap((node) =>
      node.specifiers
        .filter((item) => item.imported?.name === "UnifiedFeedback")
        .map((item) => item.local.name),
    );
  let found = false;
  walk(program, (node) => {
    if (
      (node.type === "JSXOpeningElement" &&
        names.includes(jsxName(node.name))) ||
      (node.type === "CallExpression" &&
        names.includes(node.arguments?.[0]?.name) &&
        (node.callee?.name === "createElement" ||
          node.callee?.property?.name === "createElement"))
    )
      found = true;
  });
  return found;
}
