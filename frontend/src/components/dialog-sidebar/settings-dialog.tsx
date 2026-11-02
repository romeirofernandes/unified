"use client";

import { useState, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { InputGroup, InputField } from "@/components/ui/input-group";
import { useIcons, type IconName } from "@/lib/icon-context";
import { cn } from "@/lib/utils";
import { fontWeights } from "@/lib/font-weight";

// ---------------------------------------------------------------------------
// A settings dialog: the `xl` Dialog as a canvas, a non-collapsing Sidebar
// of sections down its left edge, and a scrolling panel for the section's
// controls. The sidebar is the same composable Sidebar the app shell uses —
// it just lives in a bounded frame: `collapsible="none"` drops the rail and
// the drawer, the provider is told not to persist or listen for the
// shortcut, and `h-full` pins both to the dialog's fixed height.
//
// Below the `sm` breakpoint the column would leave no room for the panel,
// so it hides and a Select at the top of the panel takes over navigation.
// ---------------------------------------------------------------------------

interface SettingsSection {
  id: string;
  label: string;
  icon: IconName;
  description: string;
}

const SECTIONS: SettingsSection[] = [
  { id: "general", label: "General", icon: "settings", description: "Workspace name, language, and region." },
  { id: "notifications", label: "Notifications", icon: "bell", description: "What reaches your inbox and when." },
  { id: "appearance", label: "Appearance", icon: "palette", description: "Theme and density for this device." },
  { id: "security", label: "Security", icon: "shield", description: "Sign-in protection and active sessions." },
  { id: "members", label: "Members", icon: "users", description: "Who can access this workspace." },
];

export interface SettingsDialogProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** The section shown first. @default "general" */
  defaultSection?: string;
}

export function SettingsDialog({
  open,
  defaultOpen,
  onOpenChange,
  defaultSection = "general",
}: SettingsDialogProps) {
  const icons = useIcons();
  const [section, setSection] = useState(defaultSection);
  const current = SECTIONS.find((s) => s.id === section) ?? SECTIONS[0];

  return (
    <Dialog open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      <DialogContent
        size="xl"
        // The dialog's padding and centering give way to the two-column
        // shell; the height is fixed so the panel scrolls inside it.
        className="flex h-[min(640px,calc(100dvh-4rem))] overflow-hidden p-0"
      >
        <SidebarProvider
          persist={false}
          shortcut={null}
          width="13rem"
          className="h-full min-h-0"
        >
          <Sidebar
            collapsible="none"
            className="hidden h-full sm:flex bg-[rgb(var(--overlay)/0.03)]"
          >
            <SidebarHeader className="px-4 pt-5 pb-2">
              {/* Headings here are labels, not a headline: the dialog's own
                  title weight would out-shout the nav beneath it. */}
              <DialogTitle style={{ fontVariationSettings: fontWeights.normal }}>
                Settings
              </DialogTitle>
              <DialogDescription className="sr-only">
                Workspace and account settings.
              </DialogDescription>
            </SidebarHeader>
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>Workspace</SidebarGroupLabel>
                {/* Rows are the whole surface here; keyboard focus moves the
                    highlight instead of drawing a ring. */}
                <SidebarMenu focusRing={false}>
                  {SECTIONS.map((s) => (
                    <SidebarMenuItem key={s.id}>
                      <SidebarMenuButton
                        icon={icons[s.icon]}
                        isActive={s.id === section}
                        onClick={() => setSection(s.id)}
                      >
                        {s.label}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>

          <div className="flex min-w-0 flex-1 flex-col">
            {/* Panel header — pr-12 keeps clear of the dialog's ✕. */}
            <div className="flex shrink-0 flex-col gap-1 px-6 pt-5 pb-4 pr-12">
              <div className="sm:hidden">
                {/* The dialog's one DialogTitle lives in the sidebar header
                    (a referenced title names the dialog even while hidden);
                    this is the visible heading for narrow screens. */}
                <h2
                  className="mb-3 text-[length:var(--fs-title,16px)] leading-[var(--lh-title,22px)] text-foreground"
                  style={{ fontVariationSettings: fontWeights.normal }}
                >
                  Settings
                </h2>
                <Select value={section} onValueChange={setSection}>
                  <SelectTrigger placeholder="Section" />
                  <SelectContent>
                    {SECTIONS.map((s, i) => (
                      <SelectItem key={s.id} index={i} value={s.id} icon={icons[s.icon]}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <h3
                className="hidden text-[length:var(--fs-title,16px)] leading-[var(--lh-title,22px)] text-foreground sm:block"
                style={{ fontVariationSettings: fontWeights.normal }}
              >
                {current.label}
              </h3>
              <p className="hidden text-[length:var(--fs-body,13px)] leading-[var(--lh-body,20px)] text-muted-foreground sm:block">
                {current.description}
              </p>
            </div>
            <ScrollArea className="min-h-0 flex-1">
              <div className="flex flex-col gap-6 px-6 pb-6">
                <SectionPanel id={current.id} />
              </div>
            </ScrollArea>
          </div>
        </SidebarProvider>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Section panels — placeholder settings built from the library's controls.
// Swap for your own; each row is a label + description on the left and a
// control on the right.
// ---------------------------------------------------------------------------

// Switches carry their own (required) label for assistive tech; the row
// already shows it, so the switch's copy is visually hidden.
const SWITCH_LABEL_HIDDEN = "[&>span:last-child]:sr-only";

function SettingRow({
  label,
  description,
  children,
  className,
}: {
  label: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-6 border-b border-border/60 py-4 last:border-b-0",
        className
      )}
    >
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-[length:var(--fs-body,13px)] leading-[var(--lh-body,20px)] text-foreground">{label}</span>
        {description && (
          <span className="text-[length:var(--fs-caption,12px)] leading-[var(--lh-caption,16px)] text-muted-foreground">{description}</span>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function SectionPanel({ id }: { id: string }) {
  switch (id) {
    case "notifications":
      return <NotificationsPanel />;
    case "appearance":
      return <AppearancePanel />;
    case "security":
      return <SecurityPanel />;
    case "members":
      return <MembersPanel />;
    default:
      return <GeneralPanel />;
  }
}

function GeneralPanel() {
  const [name, setName] = useState("Acme Inc");
  const [language, setLanguage] = useState("en");
  const [timezone, setTimezone] = useState("utc+1");
  return (
    <>
      <InputGroup className="w-full">
        <InputField
          index={0}
          label="Workspace name"
          value={name}
          onChange={setName}
          placeholder="Acme Inc"
        />
      </InputGroup>
      <div className="flex flex-col">
        <SettingRow label="Language" description="Used for the interface and emails.">
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger placeholder="Language" />
            <SelectContent>
              <SelectItem index={0} value="en">English</SelectItem>
              <SelectItem index={1} value="fr">Français</SelectItem>
              <SelectItem index={2} value="de">Deutsch</SelectItem>
              <SelectItem index={3} value="ja">日本語</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>
        <SettingRow label="Timezone" description="Dates and reminders follow it.">
          <Select value={timezone} onValueChange={setTimezone}>
            <SelectTrigger placeholder="Timezone" />
            <SelectContent>
              <SelectItem index={0} value="utc-8">(UTC−8) Pacific</SelectItem>
              <SelectItem index={1} value="utc-5">(UTC−5) Eastern</SelectItem>
              <SelectItem index={2} value="utc+0">(UTC+0) London</SelectItem>
              <SelectItem index={3} value="utc+1">(UTC+1) Paris</SelectItem>
              <SelectItem index={4} value="utc+9">(UTC+9) Tokyo</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>
      </div>
    </>
  );
}

function NotificationsPanel() {
  const [digest, setDigest] = useState(true);
  const [mentions, setMentions] = useState(true);
  const [updates, setUpdates] = useState(false);
  return (
    <div className="flex flex-col">
      <SettingRow label="Daily digest" description="One email each morning with what changed.">
        <Switch className={SWITCH_LABEL_HIDDEN} label="Daily digest" checked={digest} onToggle={() => setDigest((v) => !v)} />
      </SettingRow>
      <SettingRow label="Mentions" description="When someone @-mentions you.">
        <Switch className={SWITCH_LABEL_HIDDEN} label="Mentions" checked={mentions} onToggle={() => setMentions((v) => !v)} />
      </SettingRow>
      <SettingRow label="Product updates" description="New features, once a month at most.">
        <Switch className={SWITCH_LABEL_HIDDEN} label="Product updates" checked={updates} onToggle={() => setUpdates((v) => !v)} />
      </SettingRow>
    </div>
  );
}

function AppearancePanel() {
  const icons = useIcons();
  const [theme, setTheme] = useState("system");
  const [density, setDensity] = useState("default");
  return (
    <div className="flex flex-col">
      <SettingRow label="Theme" description="Follows the system unless you pick one.">
        <Select value={theme} onValueChange={setTheme}>
          <SelectTrigger placeholder="Theme" />
          <SelectContent>
            <SelectItem index={0} value="system" icon={icons.monitor}>System</SelectItem>
            <SelectItem index={1} value="light" icon={icons.sun}>Light</SelectItem>
            <SelectItem index={2} value="dark" icon={icons.moon}>Dark</SelectItem>
          </SelectContent>
        </Select>
      </SettingRow>
      <SettingRow label="Density" description="Row height across lists and tables.">
        <Select value={density} onValueChange={setDensity}>
          <SelectTrigger placeholder="Density" />
          <SelectContent>
            <SelectItem index={0} value="default">Default</SelectItem>
            <SelectItem index={1} value="compact">Compact</SelectItem>
          </SelectContent>
        </Select>
      </SettingRow>
    </div>
  );
}

function SecurityPanel() {
  const [twoFactor, setTwoFactor] = useState(true);
  const [alerts, setAlerts] = useState(true);
  return (
    <div className="flex flex-col">
      <SettingRow label="Two-factor authentication" description="A code from your authenticator app at sign-in.">
        <Switch className={SWITCH_LABEL_HIDDEN} label="Two-factor authentication" checked={twoFactor} onToggle={() => setTwoFactor((v) => !v)} />
      </SettingRow>
      <SettingRow label="New sign-in alerts" description="Email when a new device signs in.">
        <Switch className={SWITCH_LABEL_HIDDEN} label="New sign-in alerts" checked={alerts} onToggle={() => setAlerts((v) => !v)} />
      </SettingRow>
      <SettingRow label="Active sessions" description="3 devices are signed in right now.">
        <Button variant="secondary" size="sm">Sign out everywhere</Button>
      </SettingRow>
    </div>
  );
}

const MEMBERS = [
  { name: "Jane Doe", email: "jane@acme.com", role: "owner" },
  { name: "Sam Park", email: "sam@acme.com", role: "admin" },
  { name: "Ravi Patel", email: "ravi@acme.com", role: "member" },
];

function MembersPanel() {
  const [roles, setRoles] = useState<Record<string, string>>(
    Object.fromEntries(MEMBERS.map((m) => [m.email, m.role]))
  );
  return (
    <div className="flex flex-col">
      {MEMBERS.map((m) => (
        <SettingRow key={m.email} label={m.name} description={m.email}>
          <Select
            value={roles[m.email]}
            onValueChange={(v) => setRoles((r) => ({ ...r, [m.email]: v }))}
          >
            <SelectTrigger placeholder="Role" variant="borderless" />
            <SelectContent>
              <SelectItem index={0} value="owner">Owner</SelectItem>
              <SelectItem index={1} value="admin">Admin</SelectItem>
              <SelectItem index={2} value="member">Member</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>
      ))}
      <div className="pt-4">
        <Button variant="secondary" size="sm">Invite people</Button>
      </div>
    </div>
  );
}
