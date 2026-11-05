import { useState } from "react";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import FormField from "@/components/shared/FormField";
import { Button } from "@/components/ui/button";

export default function DeleteAccountDialog({
  isGoogleUser,
  onClose,
  onConfirm,
  pending,
  error,
}) {
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  return (
    <ConfirmDialog
      open
      onClose={onClose}
      title="Delete your account?"
      description={
        isGoogleUser
          ? "Your account, projects, and feedback will be permanently deleted. Confirm your identity with Google to continue."
          : "Your account, projects, and feedback will be permanently deleted. Enter your password to confirm."
      }
      onConfirm={() => onConfirm(password)}
      pending={pending}
      error={error}
      confirmLabel={isGoogleUser ? "Confirm with Google" : "Delete account"}
    >
      {!isGoogleUser && (
        <div className="space-y-2">
          <FormField
            label="Current password"
            type={visible ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={pending}
            required
          />
          <Button
            variant="ghost"
            size="compact"
            onClick={() => setVisible((previous) => !previous)}
            aria-pressed={visible}
          >
            {visible ? "Hide password" : "Show password"}
          </Button>
        </div>
      )}
    </ConfirmDialog>
  );
}
