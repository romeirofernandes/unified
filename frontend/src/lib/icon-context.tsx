"use client";

// ---------------------------------------------------------------------------
// Components never import an icon directly: they look one up by the role it
// plays (`useIcons()["chevron-down"]`). That keeps the icon set swappable in
// one place, so every component uses the same Hugeicons Stroke Rounded set.
//
// Components read from the map rather than calling `useIcon(name)`: React
// Compiler's lint (`react-hooks/static-components`, on in a fresh Next app)
// takes a component returned by a hook call for one created during render,
// and flags rendering it. A property read from the map is the same lookup
// without the false alarm.
// ---------------------------------------------------------------------------

import { createContext, useContext, useMemo, type ComponentType, type ReactNode } from "react";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDown01Icon, ArrowLeft01Icon, ArrowRight01Icon, ArrowUp01Icon,
  ArtificialIntelligence01Icon, BookOpen01Icon, BulbIcon, Calendar01Icon,
  CheckIcon, ChevronDownIcon, ChevronRightIcon, CircleIcon, Clock01Icon,
  Comment01Icon, Copy01Icon, CornerDownLeftIcon, CornerDownRightIcon,
  Delete01Icon, DotIcon, DropperIcon, Folder01Icon, GlobalIcon, HeartIcon,
  Home01Icon, Image01Icon, InboxIcon, InformationCircleIcon, LayoutLeftIcon,
  LayoutRightIcon, Link01Icon, Loading01Icon, LockKeyIcon, Mail01Icon,
  Menu01Icon, MonitorIcon, Moon01Icon, MoreHorizontalIcon, MoreVerticalIcon, RectangleHorizontalIcon,
  Notification01Icon, PaintBrush01Icon, PaletteIcon, PauseIcon, PencilEdit01Icon,
  PlayIcon, PlusSignIcon, RefreshIcon, Rocket01Icon, ScalingIcon, Search01Icon,
  Settings01Icon, Shield01Icon, StarIcon, SkipForwardIcon,
  SlidersHorizontalIcon, Sun01Icon, UserGroupIcon, UserIcon,
} from "@hugeicons/core-free-icons";

// The whole contract an icon has to meet. Components pass `strokeWidth` and
// also animate stroke width through `className` (1.5 → 2 on hover is a
// common cue), so an icon from another library should forward both to its
// `<svg>`. A filled icon set ignores them and simply loses that cue.
export interface IconComponentProps {
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export type IconComponent = ComponentType<IconComponentProps>;

// Names describe the role, not the glyph, so a library whose icon is called
// something else still fills the same slot (`more-horizontal` is Lucide's
// Ellipsis).
export type IconName =
  | "chevron-right" | "chevron-down" | "x" | "copy" | "menu" | "dot"
  | "monitor" | "sun" | "moon" | "rectangle-horizontal" | "circle"
  | "square-library" | "clock" | "star" | "settings"
  | "plus" | "arrow-left" | "arrow-right" | "arrow-up" | "arrow-down"
  | "search" | "loader"
  | "users" | "lock" | "mail" | "bell" | "shield" | "palette"
  | "lightbulb" | "rocket" | "heart" | "paintbrush" | "brain"
  | "globe" | "user"
  | "image" | "link" | "check" | "rotate-ccw"
  | "play" | "pause" | "pipette"
  | "home" | "message-circle" | "inbox"
  | "pencil" | "scaling" | "skip-forward" | "corner-down-right" | "corner-down-left"
  | "panel-left" | "panel-right" | "chevrons-up-down" | "more-horizontal" | "more-vertical" | "calendar" | "folder"
  | "sliders-horizontal" | "info";

function iconComponent(icon: object): IconComponent {
  return function HugeiconAdapter({ size, strokeWidth, className }: IconComponentProps) {
    return <HugeiconsIcon icon={icon} size={size} strokeWidth={strokeWidth} className={className} />;
  };
}

export const defaultIcons: Record<IconName, IconComponent> = {
  "chevron-right": iconComponent(ChevronRightIcon), "chevron-down": iconComponent(ChevronDownIcon),
  "pipette": iconComponent(DropperIcon), "x": iconComponent(Delete01Icon), "copy": iconComponent(Copy01Icon),
  "menu": iconComponent(Menu01Icon), "dot": iconComponent(DotIcon), "monitor": iconComponent(MonitorIcon),
  "sun": iconComponent(Sun01Icon), "moon": iconComponent(Moon01Icon), "rectangle-horizontal": iconComponent(RectangleHorizontalIcon),
  "circle": iconComponent(CircleIcon), "square-library": iconComponent(BookOpen01Icon), "clock": iconComponent(Clock01Icon),
  "star": iconComponent(StarIcon), "settings": iconComponent(Settings01Icon), "plus": iconComponent(PlusSignIcon),
  "arrow-left": iconComponent(ArrowLeft01Icon), "arrow-right": iconComponent(ArrowRight01Icon),
  "arrow-up": iconComponent(ArrowUp01Icon), "arrow-down": iconComponent(ArrowDown01Icon),
  "search": iconComponent(Search01Icon), "loader": iconComponent(Loading01Icon), "users": iconComponent(UserGroupIcon),
  "lock": iconComponent(LockKeyIcon), "mail": iconComponent(Mail01Icon), "bell": iconComponent(Notification01Icon),
  "shield": iconComponent(Shield01Icon), "palette": iconComponent(PaletteIcon), "lightbulb": iconComponent(BulbIcon),
  "rocket": iconComponent(Rocket01Icon), "heart": iconComponent(HeartIcon), "paintbrush": iconComponent(PaintBrush01Icon),
  "brain": iconComponent(ArtificialIntelligence01Icon), "globe": iconComponent(GlobalIcon), "user": iconComponent(UserIcon),
  "image": iconComponent(Image01Icon), "link": iconComponent(Link01Icon), "check": iconComponent(CheckIcon),
  "rotate-ccw": iconComponent(RefreshIcon), "play": iconComponent(PlayIcon), "pause": iconComponent(PauseIcon),
  "home": iconComponent(Home01Icon), "message-circle": iconComponent(Comment01Icon), "inbox": iconComponent(InboxIcon),
  "pencil": iconComponent(PencilEdit01Icon), "scaling": iconComponent(ScalingIcon), "skip-forward": iconComponent(SkipForwardIcon),
  "corner-down-right": iconComponent(CornerDownRightIcon), "corner-down-left": iconComponent(CornerDownLeftIcon),
  "panel-left": iconComponent(LayoutLeftIcon), "panel-right": iconComponent(LayoutRightIcon),
  "chevrons-up-down": iconComponent(ChevronDownIcon), "more-horizontal": iconComponent(MoreHorizontalIcon),
  "more-vertical": iconComponent(MoreVerticalIcon), "calendar": iconComponent(Calendar01Icon),
  "folder": iconComponent(Folder01Icon), "sliders-horizontal": iconComponent(SlidersHorizontalIcon),
  "info": iconComponent(InformationCircleIcon),
};

const IconContext = createContext<Record<IconName, IconComponent> | null>(null);

/**
 * Returns a single icon component for the given name.
 * Falls back to the default Hugeicons set if no provider is present, so a
 * component works on its own before any IconProvider is set up.
 *
 * Fine for passing an icon on as a prop. To render it as `<Icon />`, take it
 * from `useIcons()` instead (see the note at the top of this file).
 */
function useIcon(name: IconName): IconComponent {
  const icons = useContext(IconContext);
  return (icons ?? defaultIcons)[name];
}

/**
 * Returns the full icon map.
 * Falls back to the default (Lucide) set if no provider is present.
 */
function useIcons(): Record<IconName, IconComponent> {
  const icons = useContext(IconContext);
  return icons ?? defaultIcons;
}

/**
 * Swap some or all icons for custom components.
 * Names left out of `icons` keep their default Hugeicons component, so a
 * partial map never leaves a component without an icon.
 *
 * Pass a stable `icons` object (module scope or memoized): an inline object
 * is new on every render and re-renders every component that reads an icon.
 */
function IconProvider({
  children,
  icons,
}: {
  children: ReactNode;
  icons?: Partial<Record<IconName, IconComponent>>;
}) {
  const value = useMemo(() => ({ ...defaultIcons, ...icons }), [icons]);
  return <IconContext.Provider value={value}>{children}</IconContext.Provider>;
}

export { IconProvider, useIcon, useIcons };
