import { useEffect, useRef, useState } from "react";
import {
  User,
  Mail,
  Phone,
  Lock,
  Activity,
  Image as ImageIcon,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import {
  getMe,
  updateProfile,
  uploadAvatar,
  changePassword,
  type Profile,
} from "@/lib/api/profileApi";
import { SkeletonAvatar, SkeletonLine } from "@/components/skeleton";

type ApiError = { response?: { data?: { message?: string } } };
const getErrorMessage = (e: unknown) => {
  const api = e as ApiError;
  return (
    api?.response?.data?.message ??
    (e instanceof Error ? e.message : "Please try again.")
  );
};

const AdminProfile = () => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  // Profile state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [profile, setProfile] = useState<
    Pick<Profile, "firstName" | "lastName" | "email" | "phoneNumber" | "avatar">
  >({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    avatar: "",
  });

  const [office, setOffice] = useState("");
  const [experience, setExperience] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const me = await getMe();
        setProfile({
          firstName: me.firstName ?? "",
          lastName: me.lastName ?? "",
          email: me.email ?? "",
          phoneNumber: me.phoneNumber ?? "",
          avatar: me.avatar ?? "",
        });
        setOffice(me.address ?? "");
        setExperience(me.employmentInfo?.responsibilities ?? "");
      } catch (err: unknown) {
        toast({
          title: "Failed to load profile",
          description: getErrorMessage(err),
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, [toast]);

  const recentActivity = [
    {
      action: "Approved student registration",
      details: "Alex Thompson",
      time: "2 hours ago",
    },
    {
      action: "Disabled registration system",
      details: "System-wide change",
      time: "1 day ago",
    },
    {
      action: "Added new student",
      details: "Sarah Davis - STU-2024-099",
      time: "2 days ago",
    },
    {
      action: "Activated teacher account",
      details: "Prof. James Wilson",
      time: "3 days ago",
    },
  ];

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const updated = await updateProfile({
        firstName: profile.firstName,
        lastName: profile.lastName,
        phoneNumber: profile.phoneNumber,
        address: office || undefined,
        employmentInfo: {
          responsibilities: experience || undefined,
          position: undefined,
        },
      });
      setProfile((p) => ({ ...p, ...updated }));
      toast({
        title: "Profile updated",
        description: "Your profile information has been saved.",
      });
      setIsEditing(false);
    } catch (err: unknown) {
      toast({
        title: "Update failed",
        description: getErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Missing fields",
        description: "Fill all password fields.",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "New passwords do not match.",
        variant: "destructive",
      });
      return;
    }
    try {
      await changePassword({ currentPassword, newPassword, confirmPassword });
      toast({
        title: "Password changed",
        description: "Your password has been updated.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      toast({
        title: "Change failed",
        description: getErrorMessage(err),
        variant: "destructive",
      });
    }
  };

  const triggerFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected: React.ChangeEventHandler<HTMLInputElement> = async (
    e
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const updated = await uploadAvatar(file);
      setProfile((p) => ({ ...p, avatar: updated.avatar || p.avatar }));
      toast({
        title: "Photo updated",
        description: "Your profile photo has been changed.",
      });
    } catch (err: unknown) {
      toast({
        title: "Upload failed",
        description: getErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      // reset input so the same file can be re-selected if needed
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Admin Profile
        </h1>
        <p className="text-muted-foreground">
          Manage your account settings and view activity
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Your account details and contact information
                </CardDescription>
              </div>
              {!isEditing && (
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  Edit Profile
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                {loading ? (
                  <div className="flex items-center gap-4" aria-hidden>
                    <SkeletonAvatar size={80} />
                    <div className="space-y-2">
                      <SkeletonLine height="h-6" width="w-40" />
                      <SkeletonLine height="h-4" width="w-32" />
                    </div>
                  </div>
                ) : (
                  <Avatar className="h-20 w-20">
                    {profile.avatar ? (
                      <AvatarImage src={profile.avatar} alt="Profile photo" />
                    ) : null}
                    <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                      {profile.firstName?.[0]?.toUpperCase()}
                      {profile.lastName?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
                {isEditing && (
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileSelected}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={triggerFilePicker}
                      disabled={uploading}
                    >
                      <ImageIcon className="mr-2 h-4 w-4" />
                      {uploading ? "Uploading..." : "Change Photo"}
                    </Button>
                  </div>
                )}
              </div>

              <Separator />

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    {loading ? (
                      <SkeletonLine height="h-10" />
                    ) : (
                      <Input
                        id="name"
                        value={`${profile.firstName ?? ""} ${
                          profile.lastName ?? ""
                        }`.trim()}
                        onChange={(e) => {
                          // Split into first/last by first space
                          const val = e.target.value;
                          const [first, ...rest] = val.split(" ");
                          setProfile((p) => ({
                            ...p,
                            firstName: first,
                            lastName: rest.join(" "),
                          }));
                        }}
                        disabled={!isEditing}
                        className="pl-10"
                      />
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    defaultValue="System Admin"
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      disabled
                      className="pl-10 bg-muted"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      value={profile.phoneNumber ?? ""}
                      onChange={(e) =>
                        setProfile((p) => ({
                          ...p,
                          phoneNumber: e.target.value,
                        }))
                      }
                      disabled={!isEditing}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              {isEditing && (
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSaveProfile} disabled={saving}>
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    disabled={saving || uploading}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Update your password and security preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="current-password"
                    type="password"
                    className="pl-10"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="new-password"
                    type="password"
                    className="pl-10"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirm-password"
                    type="password"
                    className="pl-10"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              <Button onClick={handleChangePassword}>Change Password</Button>
            </CardContent>
          </Card>
        </div>

        {/* Activity Log */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>Your recent admin actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    {activity.action}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {activity.details}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {activity.time}
                  </p>
                  {index < recentActivity.length - 1 && (
                    <Separator className="mt-4" />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;
