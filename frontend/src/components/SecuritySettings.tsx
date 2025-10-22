import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Eye, EyeOff, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { changePassword as changePasswordApi } from "@/lib/api/profileApi";

type Props = {
  // optional callback after success
  onSuccess?: () => void;
};

const SecuritySettings: React.FC<Props> = ({ onSuccess }) => {
  const { toast } = useToast();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
  };

  const validate = () => {
    if (newPassword.length < 8) {
      toast({
        title: "Password must be at least 8 characters",
        variant: "destructive",
      });
      return false;
    }
    if (newPassword !== confirmPassword) {
      toast({
        title: "New password and confirmation do not match",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const handleUpdate = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await changePasswordApi({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      toast({ title: "Password updated successfully" });
      resetForm();
      onSuccess?.();
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      const msg =
        apiErr?.response?.data?.message ?? "Current password is incorrect";
      toast({
        title: "Current password is incorrect",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Security Settings</CardTitle>
        <CardDescription>
          Update your password and security preferences. You may show or hide
          your password while typing.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="current-password">Current Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="current-password"
              type={showCurrent ? "text" : "password"}
              className="pl-10"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
              onClick={() => setShowCurrent((s) => !s)}
              aria-label={showCurrent ? "Hide" : "Show"}
            >
              {showCurrent ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="new-password">New Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="new-password"
              type={showNew ? "text" : "password"}
              className="pl-10"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
              onClick={() => setShowNew((s) => !s)}
              aria-label={showNew ? "Hide" : "Show"}
            >
              {showNew ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirm New Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="confirm-password"
              type={showConfirm ? "text" : "password"}
              className="pl-10"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
              onClick={() => setShowConfirm((s) => !s)}
              aria-label={showConfirm ? "Hide" : "Show"}
            >
              {showConfirm ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button onClick={handleUpdate} disabled={loading}>
            {loading ? "Updating..." : "Update Password"}
          </Button>
          <Button variant="outline" onClick={resetForm} disabled={loading}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SecuritySettings;
