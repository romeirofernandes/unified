import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  deleteUser,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  EmailAuthProvider,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth } from "@/firebaseConfig";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/api";
import DeleteAccountDialog from "@/components/settings/DeleteAccountDialog";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import SettingsSection from "@/components/settings/SettingsSection";
import AppearanceSettings from "@/components/settings/AppearanceSettings";

export default function Settings() {
  const { user, logout } = useAuth();
  const [deleting, setDeleting] = useState(false);
  const [deletionKey, setDeletionKey] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const isGoogleUser = user?.providerData?.some(
    (provider) => provider.providerId === "google.com",
  );

  async function deleteAccount(password) {
    if (!isGoogleUser && !password) {
      setError("Enter your current password to continue.");
      return;
    }
    setPending(true);
    setError("");
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Your session expired. Sign in again.");
      if (isGoogleUser)
        await reauthenticateWithPopup(currentUser, new GoogleAuthProvider());
      else
        await reauthenticateWithCredential(
          currentUser,
          EmailAuthProvider.credential(currentUser.email, password),
        );
      await apiRequest("/auth/user", {
        method: "DELETE",
        uid: currentUser.uid,
      });
      await deleteUser(currentUser);
      await logout();
      navigate("/", { replace: true });
    } catch (error) {
      setError(
        ["auth/wrong-password", "auth/invalid-credential"].includes(error.code)
          ? "That password didn’t match. Please try again."
          : "Couldn’t delete your account. Please try again.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Settings"
        description="Manage your account and make the workspace feel like yours."
      />
      <div className="space-y-5">
        <SettingsSection
          id="account"
          title="Account"
          description="Your sign-in details and account information."
        >
          <div className="mb-3 flex items-center gap-3">
            <span
              aria-hidden="true"
              className="grid size-10 shrink-0 place-items-center rounded-full border border-border bg-fluid-accent/15 text-lg text-foreground"
            >
              {(user?.displayName || user?.email || "U")
                .slice(0, 1)
                .toUpperCase()}
            </span>
            <div className="min-w-0 space-y-1">
              <p className="break-words text-sm font-medium">
                {user?.displayName || "Your account"}
              </p>
              <p className="break-all text-xs text-muted-foreground">
                {user?.email}
              </p>
            </div>
          </div>
          <dl className="space-y-2">
            {[
              ["Email address", user?.email || "Unavailable"],
              [
                "Sign-in method",
                isGoogleUser ? "Google" : "Email and password",
              ],
              [
                "Member since",
                user?.metadata?.creationTime
                  ? new Date(user.metadata.creationTime).toLocaleDateString(
                      undefined,
                      { year: "numeric", month: "long", day: "numeric" },
                    )
                  : "Unavailable",
              ],
            ].map(([label, value]) => (
              <div
                key={label}
                className="grid gap-1 sm:grid-cols-[140px_minmax(0,1fr)]"
              >
                <dt className="text-sm text-muted-foreground">{label}</dt>
                <dd className="break-words text-sm">{value}</dd>
              </div>
            ))}
          </dl>
        </SettingsSection>
        <SettingsSection
          id="appearance"
          title="Appearance"
          description="Choose how the workspace looks on this device."
        >
          <AppearanceSettings />
        </SettingsSection>
        <SettingsSection
          id="delete-account"
          title="Delete account"
          description="Permanently remove your account, projects and collected feedback."
          destructive
        >
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div className="max-w-sm space-y-2">
              <p className="text-sm font-medium">
                This action can’t be undone.
              </p>
              <p className="text-sm leading-5 text-muted-foreground">
                You’ll confirm your identity before anything is deleted.
              </p>
            </div>
            <Button
              variant="destructive"
              className="shrink-0"
              onClick={() => {
                setError("");
                setDeletionKey((previous) => previous + 1);
                setDeleting(true);
              }}
            >
              Delete account
            </Button>
          </div>
        </SettingsSection>
      </div>
      <DeleteAccountDialog
        key={deletionKey}
        isOpen={deleting}
        isGoogleUser={isGoogleUser}
        onClose={() => setDeleting(false)}
        onConfirm={deleteAccount}
        pending={pending}
        error={error}
      />
    </>
  );
}
