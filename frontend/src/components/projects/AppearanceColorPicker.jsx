import {
  ColorPicker,
  ColorPickerArea,
  ColorPickerHue,
  ColorPickerHexInput,
  ColorPickerEyeDropper,
} from "@/components/motion/color-picker";

export default function AppearanceColorPicker({ label, mode, value, onChange }) {
  return (
    <ColorPicker
      value={value}
      onValueChange={onChange}
      alpha={false}
      aria-label={`${label} color for ${mode} mode`}
      className="max-w-none space-y-3 rounded-md border border-border bg-background p-3"
    >
      <p className="text-xs text-muted-foreground">{label} · {mode} mode</p>
      <ColorPickerArea className="h-36 rounded-md" />
      <ColorPickerHue />
      <div className="flex items-center gap-3">
        <ColorPickerEyeDropper />
        <ColorPickerHexInput className="min-w-0 flex-1" />
      </div>
    </ColorPicker>
  );
}
