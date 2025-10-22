import { useState } from "react";
import {
  User,
  Mail,
  Phone,
  Building,
  Lock,
  Camera,
  Shield,
} from "lucide-react";
import { useEffect } from "react";
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
import { Switch } from "@/components/ui/switch";

const HeadProfile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(true);

  // clear demo loading after a short delay — replace with real query flags when available
  useEffect(() => {
    const t = setTimeout(() => setIsDemoLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  const profileInfo = {
    name: "Dr. Robert Anderson",
    position: "Head of School",
    email: "robert.anderson@school.edu",
    phone: "+1 (555) 987-6543",
    office: "Administration Building, Room 101",
    joinDate: "2018-07-01",
    experience: "15 years in education administration",
  };

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
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
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
                {isDemoLoading ? (
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
                      <div className="w-24 h-24 rounded-full bg-accent flex items-center justify-center">
                        <span className="text-3xl font-semibold text-accent-foreground">
                          DR
                        </span>
                      </div>
                      <button className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors">
                        <Camera className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-2">
                        Allowed formats: JPG, PNG (Max 5MB)
                      </p>
                      <Button variant="outline" size="sm">
                        Upload New Photo
                      </Button>
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
                    <Button onClick={() => setIsEditing(false)}>
                      Save Changes
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
                    defaultValue={profileInfo.name}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      Position
                    </div>
                  </Label>
                  <Input
                    id="position"
                    defaultValue={profileInfo.position}
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
                    defaultValue={profileInfo.email}
                    disabled={!isEditing}
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
                    defaultValue={profileInfo.phone}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="office">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      Office Location
                    </div>
                  </Label>
                  <Input
                    id="office"
                    defaultValue={profileInfo.office}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="experience">Experience</Label>
                  <Input
                    id="experience"
                    defaultValue={profileInfo.experience}
                    disabled
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="joinDate">Date Joined</Label>
                <Input
                  id="joinDate"
                  defaultValue={profileInfo.joinDate}
                  disabled
                />
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
                <Input id="currentPassword" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input id="newPassword" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input id="confirmPassword" type="password" />
              </div>
              <Button className="mt-4">Update Password</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Manage how you receive notifications and updates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="font-medium text-foreground">
                    Email Notifications
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via email
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="font-medium text-foreground">
                    New Teacher Registrations
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Alert when new teachers register
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="font-medium text-foreground">
                    Student Activation Requests
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Alert when student activation is needed
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="font-medium text-foreground">System Updates</p>
                  <p className="text-sm text-muted-foreground">
                    Notifications about system maintenance
                  </p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="font-medium text-foreground">Weekly Reports</p>
                  <p className="text-sm text-muted-foreground">
                    Receive weekly summary reports
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HeadProfile;
