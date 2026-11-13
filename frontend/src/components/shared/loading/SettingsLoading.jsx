export default function SettingsLayout() {
  return <div className="space-y-5">{[
    ["Account", "Your sign-in details and account information."],
    ["Appearance", "Choose how the workspace looks on this device."],
    ["Delete account", "Permanently remove your account, projects and collected feedback."],
  ].map(([title, description]) => <section key={title} className="grid items-start gap-3 lg:grid-cols-[minmax(180px,0.6fr)_minmax(0,1.4fr)] lg:gap-8"><div className="space-y-2"><h2 className="text-xl tracking-tight">{title}</h2><p className="max-w-sm text-sm leading-5">{description}</p></div><div className="space-y-3 rounded-md border border-border bg-card p-4">{title === "Account" ? <><div className="flex items-center gap-3"><div className="size-10 rounded-full border border-border" /><div><p className="text-sm">Your account</p><p className="text-xs">person@example.com</p></div></div>{["Email address", "Sign-in method", "Member since"].map(label => <div key={label} className="grid gap-1 text-sm sm:grid-cols-[140px_minmax(0,1fr)]"><span>{label}</span><span>Account details</span></div>)}</> : <><p className="text-sm">{title === "Appearance" ? "Theme and workspace background" : "This action can’t be undone."}</p><div className="h-10 w-40 rounded-md border border-border" /></>}</div></section>)}</div>;
}
