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
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import DeleteAccountDialog from "@/components/settings/DeleteAccountDialog";
import PageHeader from "@/components/shared/PageHeader";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/landing/ThemeToggle";
import { typeClass } from "@/lib/type-scale";

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
    <DashboardLayout>
      <PageHeader
        title="Settings"
        description="Your account, your workspace, and how it feels."
      />
      <div className="max-w-3xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>
              The details behind your workspace.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-6 sm:grid-cols-2">
              {[
                ["Email", user?.email],
                [
                  "Member since",
                  user?.metadata?.creationTime
                    ? new Date(user.metadata.creationTime).toLocaleDateString()
                    : "Unavailable",
                ],
                [
                  "Sign-in method",
                  isGoogleUser ? "Google" : "Email and password",
                ],
              ].map(([label, value]) => (
                <div key={label} className="space-y-1">
                  <dt
                    className={`${typeClass("caption")} text-muted-foreground`}
                  >
                    {label}
                  </dt>
                  <dd className={`${typeClass("body")} break-words`}>
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>
              Choose a light or dark workspace. You can also press D when you’re
              not typing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ThemeToggle />
          </CardContent>
        </Card>
        <Card className="border border-destructive/25">
          <CardHeader>
            <CardTitle>Delete account</CardTitle>
            <CardDescription>
              Permanently remove your account and its data. This can’t be
              undone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="secondary"
              className="text-destructive"
              onClick={() => {
                setError("");
                setDeletionKey((previous) => previous + 1);
                setDeleting(true);
              }}
            >
              Delete account
            </Button>
          </CardContent>
        </Card>
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
    </DashboardLayout>
  );
}
