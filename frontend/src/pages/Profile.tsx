import { useState, useEffect, useMemo } from "react";
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
import { Textarea } from "@/components/ui/textarea";
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
import { useAuth } from "@/contexts/useAuth";
import type { User as AuthUser } from "@/contexts/auth-types";
import {
  updateProfile as updateProfileApi,
  uploadAvatar as uploadAvatarApi,
  changePassword as changePasswordApi,
} from "@/lib/api/profileApi";
import {
  SkeletonWrapper,
  SkeletonLine,
  SkeletonAvatar,
} from "@/components/skeleton";

type Gender = "male" | "female" | "other" | undefined;
interface ProfileInfo {
  phone?: string;
  address?: string;
  dateOfBirth?: string | Date;
  gender?: Gender;
  avatar?: string;
}
interface AcademicInfo {
  studentId?: string;
  class?: string;
  section?: string;
  grade?: string;
  subjects?: string[];
}
interface EmploymentInfo {
  employeeId?: string;
  department?: string;
  position?: string;
  joinDate?: string | Date;
  responsibilities?: string;
}
interface ApiUser {
  _id?: string;
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: "admin" | "head" | "teacher" | "student";
  status?: "pending" | "approved" | "deactivated" | "rejected";
  studentId?: string;
  profile?: ProfileInfo;
  academicInfo?: AcademicInfo;
  employmentInfo?: EmploymentInfo;
}

const getApiBase = () =>
  (import.meta as unknown as { env?: { VITE_API_BASE_URL?: string } }).env
    ?.VITE_API_BASE_URL || "http://localhost:5000";

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const { user: authUser } = useAuth();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  // Security settings (password change)
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [apiUser, setApiUser] = useState<ApiUser | null>(null);

  // Editable fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  // Role-specific editable fields
  const [classField, setClassField] = useState("");
  const [section, setSection] = useState("");
  const [grade, setGrade] = useState("");
  const [subjects, setSubjects] = useState("");
  const [department, setDepartment] = useState("");
  const [position, setPosition] = useState("");
  const [responsibilities, setResponsibilities] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setLoading(false);
          return;
        }
        const res = await fetch(`${getApiBase()}/api/profile/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok || !data?.success) {
          throw new Error(data?.message || "Failed to load profile");
        }
        const raw: ApiUser = data.data.user as ApiUser;
        // Normalize id immutably
        const u: ApiUser = {
          ...raw,
          id: raw.id || raw._id,
        };
        setApiUser(u);
        setFirstName(u.firstName || "");
        setLastName(u.lastName || "");
        setPhone(u.profile?.phone || "");
        setAddress(u.profile?.address || "");
        // Role-specific
        setClassField(u.academicInfo?.class || "");
        setSection(u.academicInfo?.section || "");
        setGrade(u.academicInfo?.grade || "");
        setSubjects(u.academicInfo?.subjects?.join(", ") || "");
        setDepartment(u.employmentInfo?.department || "");
        setPosition(u.employmentInfo?.position || "");
        setResponsibilities(u.employmentInfo?.responsibilities || "");

        // Avatar
        const avatarPath = u.profile?.avatar;
        if (avatarPath && typeof avatarPath === "string") {
          setAvatarPreview(
            avatarPath.startsWith("http")
              ? avatarPath
              : `${getApiBase()}${avatarPath}`
          );
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [authUser]);
  const isStudent = apiUser?.role === "student";
  const displayName = useMemo(() => {
    const f = firstName?.trim() || "";
    const l = lastName?.trim() || "";
    const full = `${f} ${l}`.trim();
    return full || apiUser?.email || apiUser?.studentId || "User";
  }, [firstName, lastName, apiUser]);

  const initials = useMemo(() => {
    const parts = displayName.split(" ").filter(Boolean);
    return (
      parts
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase())
        .join("") || "U"
    );
  }, [displayName]);

  const classLabel = useMemo(() => {
    const info = apiUser?.academicInfo;
    if (!info) return undefined;
    if (info.class) return info.class;
    const grade = info.grade ? `Grade ${info.grade}` : "";
    const section = info.section ? ` ${info.section}` : "";
    return (grade + section).trim() || undefined;
  }, [apiUser]);

  const userIdForUpload = apiUser?._id || apiUser?.id || authUser?.id || "";

  const handleSave = async () => {
    try {
      const payload: {
        firstName: string;
        lastName: string;
        profile: { phone: string; address: string };
        academicInfo?: {
          class: string;
          section: string;
          grade: string;
          subjects: string[];
        };
        employmentInfo?: {
          department: string;
          position: string;
          responsibilities: string;
        };
      } = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        profile: { phone: phone.trim(), address: address.trim() },
      };
      // Add role-specific
      if (apiUser?.role === "student") {
        payload.academicInfo = {
          class: classField.trim(),
          section: section.trim(),
          grade: grade.trim(),
          subjects: subjects
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        };
      } else if (apiUser?.role === "teacher" || apiUser?.role === "head") {
        payload.employmentInfo = {
          department: department.trim(),
          position: position.trim(),
          responsibilities: responsibilities.trim(),
        };
      }
      const updated = (await updateProfileApi(payload)) as unknown as ApiUser;
      setApiUser(updated);
      toast.success("Profile updated successfully");
      setIsEditing(false);

      // Update cached auth user name
      const stored = localStorage.getItem("currentUser");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const fullName = `${updated.firstName ?? ""} ${
            updated.lastName ?? ""
          }`
            .trim()
            .replace(/\s+/g, " ");
          parsed.name = fullName || parsed.name;
          parsed.studentId = updated.studentId ?? parsed.studentId;
          parsed.email = updated.email ?? parsed.email;
          localStorage.setItem("currentUser", JSON.stringify(parsed));
        } catch {
          // ignore
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Update error";
      toast.error(message);
    }
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8 space-y-6" aria-busy>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Profile</h1>
          <p className="text-muted-foreground mt-1">
            Manage your personal information and settings
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4" aria-hidden>
              <SkeletonAvatar size={64} />
              <div className="space-y-2">
                <SkeletonLine height="h-5" width="w-48" />
                <SkeletonLine height="h-4" width="w-32" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent
            className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6"
            aria-hidden
          >
            <div className="space-y-2">
              <SkeletonLine height="h-4" width="w-24" />
              <SkeletonLine height="h-10" />
            </div>
            <div className="space-y-2">
              <SkeletonLine height="h-4" width="w-24" />
              <SkeletonLine height="h-10" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
                      {initials}
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
                      const user = await uploadAvatarApi(selectedFile);
                      const avatarUrl = user.avatar;
                      if (avatarUrl) setAvatarPreview(avatarUrl);
                      toast.success("Avatar uploaded");
                      // persist to localStorage currentUser if present
                      const stored = localStorage.getItem("currentUser");
                      if (stored) {
                        try {
                          const parsed = JSON.parse(stored);
                          parsed.profile = parsed.profile || {};
                          parsed.profile.avatar = avatarUrl;
                          localStorage.setItem(
                            "currentUser",
                            JSON.stringify(parsed)
                          );
                        } catch (e) {
                          // ignore
                        }
                      }
                      // Also update local state
                      setApiUser((prev) => ({
                        ...(prev || {}),
                        profile: {
                          ...(prev?.profile || {}),
                          avatar: avatarUrl || prev?.profile?.avatar,
                        },
                      }));
                      setSelectedFile(null);
                    } catch (err) {
                      const message =
                        err instanceof Error ? err.message : "Upload error";
                      toast.error(message);
                    }
                  }}
                >
                  ✓
                </Button>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                {displayName}
              </h2>
              <p className="text-muted-foreground">
                {apiUser?.studentId || apiUser?.academicInfo?.studentId || ""}
              </p>
              {(classLabel || apiUser?.role) && (
                <div className="flex items-center gap-2 mt-2">
                  {classLabel && (
                    <Badge variant="secondary">{classLabel}</Badge>
                  )}
                  {apiUser?.role && (
                    <Badge variant="outline" className="capitalize">
                      {apiUser.role}
                    </Badge>
                  )}
                  {apiUser?.status && (
                    <Badge
                      variant={
                        apiUser.status === "approved" ? "secondary" : "outline"
                      }
                      className="capitalize"
                    >
                      {apiUser.status}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList
          className={`grid w-full max-w-md ${
            isStudent ? "grid-cols-3" : "grid-cols-2"
          }`}
        >
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          {isStudent && <TabsTrigger value="parent">Parent Info</TabsTrigger>}
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
                  <Label
                    htmlFor="firstName"
                    className="flex items-center gap-2"
                  >
                    <User className="h-4 w-4" />
                    Full Name
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="firstName"
                      placeholder="First name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      disabled={!isEditing}
                    />
                    <Input
                      id="lastName"
                      placeholder="Last name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
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
                    value={
                      apiUser?.studentId ||
                      apiUser?.academicInfo?.studentId ||
                      ""
                    }
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
                    value={apiUser?.email || ""}
                    disabled
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone
                  </Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
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
                    value={
                      apiUser?.profile?.dateOfBirth
                        ? new Date(apiUser.profile.dateOfBirth)
                            .toISOString()
                            .slice(0, 10)
                        : ""
                    }
                    disabled
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Gender
                  </Label>
                  <Input
                    id="gender"
                    value={apiUser?.profile?.gender || ""}
                    disabled
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Address
                  </Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    disabled={!isEditing}
                  />
                </div>

                {/* Role-specific fields */}
                {apiUser?.role === "student" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="classField">Class</Label>
                      <Input
                        id="classField"
                        value={classField}
                        onChange={(e) => setClassField(e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="section">Section</Label>
                      <Input
                        id="section"
                        value={section}
                        onChange={(e) => setSection(e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="grade">Grade</Label>
                      <Input
                        id="grade"
                        value={grade}
                        onChange={(e) => setGrade(e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="subjects">
                        Subjects (comma-separated)
                      </Label>
                      <Input
                        id="subjects"
                        value={subjects}
                        onChange={(e) => setSubjects(e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>
                  </>
                )}

                {(apiUser?.role === "teacher" || apiUser?.role === "head") && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Input
                        id="department"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="position">Position</Label>
                      <Input
                        id="position"
                        value={position}
                        onChange={(e) => setPosition(e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="responsibilities">Responsibilities</Label>
                      <Textarea
                        id="responsibilities"
                        value={responsibilities}
                        onChange={(e) => setResponsibilities(e.target.value)}
                        disabled={!isEditing}
                        rows={3}
                      />
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Parent Information (students only, placeholder) */}
        {isStudent && (
          <TabsContent value="parent">
            <Card>
              <CardHeader>
                <CardTitle>Parent/Guardian Information</CardTitle>
                <CardDescription>
                  Emergency contact and guardian details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Parent/guardian information is managed by your school. Please
                  contact administration to request updates.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        )}

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
                    <Label htmlFor="confirmPassword">
                      Confirm New Password
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={async () => {
                      try {
                        if (!currentPassword || !newPassword) {
                          throw new Error("Please fill all password fields");
                        }
                        if (newPassword !== confirmPassword) {
                          throw new Error("New passwords do not match");
                        }
                        if (newPassword.length < 6) {
                          throw new Error(
                            "New password must be at least 6 characters"
                          );
                        }
                        await changePasswordApi({
                          currentPassword,
                          newPassword,
                          confirmPassword,
                        });
                        toast.success("Password updated successfully");
                        setCurrentPassword("");
                        setNewPassword("");
                        setConfirmPassword("");
                      } catch (err) {
                        const message =
                          err instanceof Error
                            ? err.message
                            : "Error updating password";
                        toast.error(message);
                      }
                    }}
                  >
                    Update Password
                  </Button>
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
