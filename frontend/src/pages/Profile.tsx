import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Briefcase,
  Lock,
  Camera,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const { user: authUser } = useAuth();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    try {
      const profile = (authUser as unknown) && (authUser as any).profile;
      if (profile && typeof profile.avatar === "string") {
        const avatarPath = profile.avatar;
        // import.meta.env typing can be strict in some toolchains, so safely access.
        const base =
          typeof (import.meta as any)?.env?.VITE_API_BASE_URL === "string"
            ? (import.meta as any).env.VITE_API_BASE_URL
            : "http://localhost:5000";
        setAvatarPreview(
          avatarPath.startsWith("http") ? avatarPath : `${base}${avatarPath}`
        );
      }
    } catch (e) {
      // ignore any runtime/typing issues
    }
  }, [authUser]);

  const studentInfo = {
    fullName: "John Smith",
    studentId: "2024-11A-001",
    email: "john.smith@school.edu",
    phone: "+1 (555) 123-4567",
    dateOfBirth: "2007-03-15",
    gender: "Male",
    class: "Grade 11A",
    address: "123 Main Street, City, State 12345",
  };

  const parentInfo = {
    guardianName: "Robert Smith",
    relationship: "Father",
    phone: "+1 (555) 987-6543",
    email: "robert.smith@email.com",
    occupation: "Engineer",
  };

  const handleSave = () => {
    toast.success("Profile updated successfully");
    setIsEditing(false);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Profile</h1>
        <p className="text-muted-foreground mt-1">
          Manage your personal information and settings
        </p>
      </div>

      {/* Profile Picture Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <label className="cursor-pointer block">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    if (f) {
                      setSelectedFile(f);
                      setAvatarPreview(URL.createObjectURL(f));
                    }
                  }}
                />
                <div className="w-24 h-24 rounded-full bg-accent flex items-center justify-center overflow-hidden">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl font-bold text-accent-foreground">
                      JS
                    </span>
                  )}
                  <div className="absolute bottom-0 right-0">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="rounded-full h-8 w-8"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </label>
              {selectedFile && (
                <Button
                  size="icon"
                  variant="default"
                  className="rounded-full h-8 w-8 absolute bottom-0 left-0"
                  onClick={async () => {
                    if (!selectedFile) return;
                    try {
                      const form = new FormData();
                      form.append("avatar", selectedFile);
                      const userId =
                        authUser?.id || studentInfo.studentId || "";
                      const base =
                        (import.meta as any).env?.VITE_API_BASE_URL ||
                        "http://localhost:5000";
                      const token = localStorage.getItem("token");
                      const res = await fetch(
                        `${base}/api/users/${userId}/avatar`,
                        {
                          method: "POST",
                          body: form,
                          headers: token
                            ? { Authorization: `Bearer ${token}` }
                            : undefined,
                        }
                      );
                      const data = await res.json();
                      if (!res.ok)
                        throw new Error(data?.message || "Upload failed");
                      const avatarPath = data?.data?.avatar;
                      const fullPath = avatarPath.startsWith("http")
                        ? avatarPath
                        : `${base}${avatarPath}`;
                      setAvatarPreview(fullPath);
                      toast.success("Avatar uploaded");
                      // persist to localStorage currentUser if present
                      const stored = localStorage.getItem("currentUser");
                      if (stored) {
                        try {
                          const parsed = JSON.parse(stored);
                          parsed.profile = parsed.profile || {};
                          parsed.profile.avatar = avatarPath;
                          localStorage.setItem(
                            "currentUser",
                            JSON.stringify(parsed)
                          );
                        } catch (e) {
                          // ignore
                        }
                      }
                      setSelectedFile(null);
                    } catch (err: any) {
                      toast.error(err.message || "Upload error");
                    }
                  }}
                >
                  ✓
                </Button>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                {studentInfo.fullName}
              </h2>
              <p className="text-muted-foreground">{studentInfo.studentId}</p>
              <Badge variant="secondary" className="mt-2">
                {studentInfo.class}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="parent">Parent Info</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Personal Information */}
        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>
                    Your basic information and contact details
                  </CardDescription>
                </div>
                {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)}>Edit</Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleSave}>Save</Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Full Name
                  </Label>
                  <Input
                    id="fullName"
                    defaultValue={studentInfo.fullName}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="studentId"
                    className="flex items-center gap-2"
                  >
                    <User className="h-4 w-4" />
                    Student ID
                  </Label>
                  <Input
                    id="studentId"
                    defaultValue={studentInfo.studentId}
                    disabled
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    defaultValue={studentInfo.email}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone
                  </Label>
                  <Input
                    id="phone"
                    defaultValue={studentInfo.phone}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dob" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Date of Birth
                  </Label>
                  <Input
                    id="dob"
                    defaultValue={studentInfo.dateOfBirth}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Gender
                  </Label>
                  <Input
                    id="gender"
                    defaultValue={studentInfo.gender}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Address
                  </Label>
                  <Input
                    id="address"
                    defaultValue={studentInfo.address}
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Parent Information */}
        <TabsContent value="parent">
          <Card>
            <CardHeader>
              <CardTitle>Parent/Guardian Information</CardTitle>
              <CardDescription>
                Emergency contact and guardian details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="guardianName"
                    className="flex items-center gap-2"
                  >
                    <User className="h-4 w-4" />
                    Guardian Name
                  </Label>
                  <Input
                    id="guardianName"
                    defaultValue={parentInfo.guardianName}
                    disabled
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="relationship"
                    className="flex items-center gap-2"
                  >
                    <User className="h-4 w-4" />
                    Relationship
                  </Label>
                  <Input
                    id="relationship"
                    defaultValue={parentInfo.relationship}
                    disabled
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="guardianPhone"
                    className="flex items-center gap-2"
                  >
                    <Phone className="h-4 w-4" />
                    Phone
                  </Label>
                  <Input
                    id="guardianPhone"
                    defaultValue={parentInfo.phone}
                    disabled
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="guardianEmail"
                    className="flex items-center gap-2"
                  >
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <Input
                    id="guardianEmail"
                    type="email"
                    defaultValue={parentInfo.email}
                    disabled
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label
                    htmlFor="occupation"
                    className="flex items-center gap-2"
                  >
                    <Briefcase className="h-4 w-4" />
                    Occupation
                  </Label>
                  <Input
                    id="occupation"
                    defaultValue={parentInfo.occupation}
                    disabled
                  />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                To update guardian information, please contact the school
                administration.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Settings */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>Manage your account security</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Change Password
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input id="currentPassword" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input id="newPassword" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">
                      Confirm New Password
                    </Label>
                    <Input id="confirmPassword" type="password" />
                  </div>
                  <Button>Update Password</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;
