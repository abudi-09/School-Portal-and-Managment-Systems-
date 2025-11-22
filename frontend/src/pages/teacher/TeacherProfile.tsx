import { useState, useEffect, useRef } from "react";
import {
  User,
  Mail,
  Phone,
  Building,
  BookOpen,
  Lock,
  Camera,
  Save,
  Shield,
  Briefcase,
  Calendar,
  MapPin,
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
import { PageHeader } from "@/components/patterns";

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

  const handleSaveProfile = async () => {
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
          joinDate: joinDate ? new Date(joinDate) : undefined,
        },
      });
      setProfile((p) => ({ ...p, ...updated }));
      setFullName([updated.firstName, updated.lastName].filter(Boolean).join(" "));
      setPhone(updated.phoneNumber ?? "");
      toast({
        title: "Profile updated",
        description: "Your profile information has been saved.",
      });
      setIsEditing(false);
    } catch (err: unknown) {
      toast({
        title: "Update failed",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const updated = await uploadAvatar(file);
      setProfile((p) => ({ ...p, avatar: updated.avatar || p.avatar }));
      toast({ title: "Photo updated", description: "Your profile photo has been changed." });
    } catch (err: unknown) {
      toast({
        title: "Upload failed",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-5xl mx-auto">
      <PageHeader
        title="Profile Settings"
        description="Manage your account information and preferences"
        actions={
          !isEditing ? (
            <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button onClick={handleSaveProfile} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          )
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar / Avatar */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <div className="relative mb-4 group">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-background shadow-xl">
                  {loading ? (
                    <SkeletonAvatar size={128} />
                  ) : (
                    <Avatar className="w-full h-full">
                      {profile.avatar ? (
                        <AvatarImage src={profile.avatar} alt="Profile" className="object-cover" />
                      ) : (
                        <AvatarFallback className="text-4xl bg-primary/10 text-primary">
                          {profile.firstName?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  )}
                </div>
                <button
                  className="absolute bottom-0 right-0 p-2.5 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <Camera className="h-4 w-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>
              
              <h2 className="text-xl font-bold">{fullName || "Teacher Name"}</h2>
              <p className="text-sm text-muted-foreground mb-4">{qualification || "Teacher"}</p>
              
              <div className="w-full space-y-2 text-sm text-left mt-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2"><Mail className="h-4 w-4" /> Email</span>
                  <span className="font-medium truncate max-w-[150px]" title={profile.email}>{profile.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2"><Phone className="h-4 w-4" /> Phone</span>
                  <span className="font-medium">{phone || "N/A"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2"><Building className="h-4 w-4" /> Dept</span>
                  <span className="font-medium">{department || "N/A"}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="personal" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="personal">Personal Information</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Basic Details</CardTitle>
                  <CardDescription>Your personal and professional information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={!isEditing} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="employeeId">Employee ID</Label>
                      <Input id="employeeId" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} disabled className="bg-muted/50" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input id="email" value={profile.email} disabled className="bg-muted/50" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={!isEditing} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5" /> Professional Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Input id="department" value={department} onChange={(e) => setDepartment(e.target.value)} disabled={!isEditing} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="qualification">Qualification/Position</Label>
                      <Input id="qualification" value={qualification} onChange={(e) => setQualification(e.target.value)} disabled={!isEditing} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="joinDate">Join Date</Label>
                      <div className="relative">
                        <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input id="joinDate" type="date" value={joinDate} onChange={(e) => setJoinDate(e.target.value)} disabled className="pl-9 bg-muted/50" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="office">Office Location</Label>
                      <div className="relative">
                        <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input id="office" value={office} onChange={(e) => setOffice(e.target.value)} disabled={!isEditing} className="pl-9" />
                      </div>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="experience">Responsibilities / Experience</Label>
                      <Input id="experience" value={experience} onChange={(e) => setExperience(e.target.value)} disabled={!isEditing} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Subjects Taught</Label>
                      <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-muted/20 min-h-[3rem]">
                        {subjects.length === 0 ? (
                          <span className="text-sm text-muted-foreground italic">No subjects listed</span>
                        ) : (
                          subjects.map((s) => <Badge key={s} variant="secondary">{s}</Badge>)
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" /> Password & Security</CardTitle>
                  <CardDescription>Update your password to keep your account secure</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input id="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                    </div>
                  </div>
                  <div className="pt-4 flex justify-end">
                    <Button 
                      onClick={async () => {
                        if (!currentPassword || !newPassword || !confirmPassword) {
                          toast({ title: "Validation failed", description: "Please fill all password fields", variant: "destructive" });
                          return;
                        }
                        if (newPassword !== confirmPassword) {
                          toast({ title: "Validation failed", description: "New password and confirmation do not match", variant: "destructive" });
                          return;
                        }
                        setChangingPassword(true);
                        try {
                          await changePassword({ currentPassword, newPassword, confirmPassword });
                          toast({ title: "Password updated", description: "Your password has been changed successfully." });
                          setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
                        } catch (err: unknown) {
                          toast({ title: "Password update failed", description: err instanceof Error ? err.message : String(err), variant: "destructive" });
                        } finally {
                          setChangingPassword(false);
                        }
                      }} 
                      disabled={changingPassword}
                    >
                      {changingPassword ? "Updating..." : "Update Password"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default TeacherProfile;
