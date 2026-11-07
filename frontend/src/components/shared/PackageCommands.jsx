import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/motion/tabs";
import CodeBlock from "./CodeBlock";
import { setupCommand } from "@/lib/integration-code";

export default function PackageCommands({ automatic = false, projectId, uid }) {
  const [manager, setManager] = useState("npm");
  const installs = { npm: "npm install unified-sdk", pnpm: "pnpm add unified-sdk", yarn: "yarn add unified-sdk", bun: "bun add unified-sdk" };
  return <div className="min-w-0 space-y-3">
    <Tabs value={manager} onValueChange={setManager} variant="underline">
      <TabsList aria-label="Package manager">
        {["npm", "pnpm", "yarn", "bun"].map((name) => <TabsTrigger key={name} value={name}>{name}</TabsTrigger>)}
      </TabsList>
    </Tabs>
    <CodeBlock code={automatic ? setupCommand({ projectId, uid, manager }) : installs[manager]} label="Terminal" />
  </div>;
}
