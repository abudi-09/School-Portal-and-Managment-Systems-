import { useState, useEffect, useRef } from "react";
import {
  User,
  Mail,
  Phone,
  Building,
  BookOpen,
  Lock,
  Camera,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  getMe,
  updateProfile,
  uploadAvatar,
  changePassword,
  type Profile,
} from "@/lib/api/profileApi";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { SkeletonAvatar, SkeletonLine } from "@/components/skeleton";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const TeacherProfile = () => {
  const { toast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [profile, setProfile] = useState<
    Pick<Profile, "firstName" | "lastName" | "email" | "phoneNumber" | "avatar">
  >({ firstName: "", lastName: "", email: "", phoneNumber: "", avatar: "" });

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [office, setOffice] = useState("");
  const [experience, setExperience] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [department, setDepartment] = useState("");
  const [qualification, setQualification] = useState("");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [joinDate, setJoinDate] = useState<string>("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const me = await getMe();
        setProfile({
          firstName: me.firstName ?? "",
          lastName: me.lastName ?? "",
          email: me.email ?? "",
          phoneNumber: me.phoneNumber ?? "",
          avatar: me.avatar ?? "",
        });
        setFullName([me.firstName, me.lastName].filter(Boolean).join(" "));
        setPhone(me.phoneNumber ?? "");
        setOffice(me.address ?? "");
        setExperience(me.employmentInfo?.responsibilities ?? "");
        setEmployeeId(me.employmentInfo?.employeeId ?? "");
        setDepartment(me.employmentInfo?.department ?? "");
        setQualification(me.employmentInfo?.position ?? "");
        setSubjects(me.academicInfo?.subjects ?? []);
        setJoinDate(
          me.employmentInfo?.joinDate
            ? new Date(me.employmentInfo.joinDate).toISOString().slice(0, 10)
            : ""
        );
      } catch (err: unknown) {
        toast({
          title: "Failed to load profile",
          description: err instanceof Error ? err.message : String(err),
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [toast]);

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Profile</h1>
        <p className="text-muted-foreground">
          Manage your account information and settings
        </p>
      </div>

      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList>
          <TabsTrigger value="personal">Personal Information</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-6">
          {/* Profile Photo */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Photo</CardTitle>
              <CardDescription>Update your profile picture</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                {loading ? (
                  <div className="flex items-center gap-6" aria-hidden>
                    <SkeletonAvatar size={96} />
                    <div className="space-y-2">
                      <SkeletonLine height="h-5" width="w-40" />
                      <SkeletonLine height="h-4" width="w-36" />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <div className="w-24 h-24">
                        <Avatar className="w-24 h-24">
                          {profile.avatar ? (
                            <AvatarImage src={profile.avatar} alt="Profile" />
                          ) : (
                            <AvatarFallback className="text-3xl bg-accent text-accent-foreground">
                              {profile.firstName?.[0]?.toUpperCase()}
                            </AvatarFallback>
                          )}
                        </Avatar>
                      </div>
                      <button
                        className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                        type="button"
                      >
                        <Camera className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-2">
                        Allowed formats: JPG, PNG (Max 5MB)
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setUploading(true);
                          try {
                            const updated = await uploadAvatar(file);
                            setProfile((p) => ({
                              ...p,
                              avatar: updated.avatar || p.avatar,
                            }));
                            toast({
                              title: "Photo updated",
                              description:
                                "Your profile photo has been changed.",
                            });
                          } catch (err: unknown) {
                            toast({
                              title: "Upload failed",
                              description:
                                err instanceof Error
                                  ? err.message
                                  : String(err),
                              variant: "destructive",
                            });
                          } finally {
                            setUploading(false);
                            if (fileInputRef.current)
                              fileInputRef.current.value = "";
                          }
                        }}
                      />
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Personal Details */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Personal Details</CardTitle>
                  <CardDescription>Your basic information</CardDescription>
                </div>
                {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)}>
                    Edit Profile
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={async () => {
                        setSaving(true);
                        try {
                          const parts = fullName.trim().split(/\s+/);
                          const firstName = parts.shift() || "";
                          const lastName = parts.join(" ") || "";
                          const updated = await updateProfile({
                            firstName,
                            lastName,
                            phoneNumber: phone || undefined,
                            address: office || undefined,
                            employmentInfo: {
                              responsibilities: experience || undefined,
                              position: qualification || undefined,
                              department: department || undefined,
                              joinDate: joinDate
                                ? new Date(joinDate)
                                : undefined,
                            },
                          });
                          setProfile((p) => ({ ...p, ...updated }));
                          setFullName(
                            [updated.firstName, updated.lastName]
                              .filter(Boolean)
                              .join(" ")
                          );
                          setPhone(updated.phoneNumber ?? "");
                          toast({
                            title: "Profile updated",
                            description:
                              "Your profile information has been saved.",
                          });
                          setIsEditing(false);
                        } catch (err: unknown) {
                          toast({
                            title: "Update failed",
                            description:
                              err instanceof Error ? err.message : String(err),
                            variant: "destructive",
                          });
                        } finally {
                          setSaving(false);
                        }
                      }}
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      Full Name
                    </div>
                  </Label>
                  <Input
                    id="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employeeId">Employee ID</Label>
                  <Input
                    id="employeeId"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    disabled
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="email">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      Email Address
                    </div>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      Phone Number
                    </div>
                  </Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="department">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      Department
                    </div>
                  </Label>
                  <Input
                    id="department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="qualification">Qualification</Label>
                  <Input
                    id="qualification"
                    value={qualification}
                    onChange={(e) => setQualification(e.target.value)}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      Subjects Taught
                    </div>
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {subjects.length === 0 ? (
                      <span className="text-sm text-muted-foreground">
                        No subjects listed
                      </span>
                    ) : (
                      subjects.map((s) => (
                        <Badge key={s} variant="secondary">
                          {s}
                        </Badge>
                      ))
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="joinDate">Join Date</Label>
                  <Input
                    id="joinDate"
                    type="date"
                    value={joinDate}
                    onChange={(e) => setJoinDate(e.target.value)}
                    disabled
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="office">Office Location</Label>
                  <Input
                    id="office"
                    value={office}
                    onChange={(e) => setOffice(e.target.value)}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience">Experience</Label>
                  <Input
                    id="experience"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Change Password
              </CardTitle>
              <CardDescription>Update your account password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <Button
                className="mt-4"
                onClick={async () => {
                  // basic validation
                  if (!currentPassword || !newPassword || !confirmPassword) {
                    toast({
                      title: "Validation failed",
                      description: "Please fill all password fields",
                      variant: "destructive",
                    });
                    return;
                  }
                  if (newPassword !== confirmPassword) {
                    toast({
                      title: "Validation failed",
                      description: "New password and confirmation do not match",
                      variant: "destructive",
                    });
                    return;
                  }
                  setChangingPassword(true);
                  try {
                    await changePassword({
                      currentPassword,
                      newPassword,
                      confirmPassword,
                    });
                    toast({ title: "Password updated" });
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                  } catch (err: unknown) {
                    toast({
                      title: "Password update failed",
                      description:
                        err instanceof Error ? err.message : String(err),
                      variant: "destructive",
                    });
                  } finally {
                    setChangingPassword(false);
                  }
                }}
                disabled={changingPassword}
              >
                {changingPassword ? "Updating..." : "Update Password"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeacherProfile;
