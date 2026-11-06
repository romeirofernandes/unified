import { Tabs, TabsList, TabsTrigger } from "@/components/motion/tabs";

export default function PreviewModeToggle({ value, onChange, disabled }) {
  return (
    <Tabs
      value={value}
      onValueChange={onChange}
      variant="segment"
      className="shrink-0"
    >
      <TabsList
        aria-label="Form color mode"
        className="border border-border bg-background"
      >
        {["light", "dark"].map((mode) => (
          <TabsTrigger
            key={mode}
            value={mode}
            disabled={disabled}
            className="min-h-8 px-3 text-xs capitalize"
            indicatorClassName="bg-fluid-accent"
          >
            {mode}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
