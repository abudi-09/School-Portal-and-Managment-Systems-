import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  GraduationCap,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Validation schemas
const studentLoginSchema = z.object({
  studentId: z
    .string()
    .min(1, "Student ID is required")
    .regex(/^STU-\d{4}-\d{4}$/i, "Student ID must look like STU-2024-0001"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean().optional(),
});

const staffLoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean().optional(),
});

type StudentLoginForm = z.infer<typeof studentLoginSchema>;
type StaffLoginForm = z.infer<typeof staffLoginSchema>;

const Login = () => {
  const navigate = useNavigate();
  const { login, getRoleBasedRedirect } = useAuth();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"student" | "staff">("student");

  const studentForm = useForm<StudentLoginForm>({
    resolver: zodResolver(studentLoginSchema),
    defaultValues: { studentId: "", password: "", rememberMe: false },
  });

  const staffForm = useForm<StaffLoginForm>({
    resolver: zodResolver(staffLoginSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  const handleLogin = async (
    data: StudentLoginForm | StaffLoginForm,
    type: "student" | "staff"
  ) => {
    setLoading(true);
    try {
      let credentials;
      if (type === "student") {
        const sData = data as StudentLoginForm;
        credentials = {
          studentId: sData.studentId.trim().toUpperCase(),
          password: sData.password,
        };
      } else {
        const sData = data as StaffLoginForm;
        credentials = {
          email: sData.email,
          password: sData.password,
        };
      }

      const result = await login(credentials);

      if (result.success && result.user) {
        toast({ title: "Welcome back!", description: `Logged in as ${result.user.firstName}` });
        const redirectPath = getRoleBasedRedirect(result.user.role);
        navigate(redirectPath);
      } else {
        toast({
          title: "Login failed",
          description: result.message || "Invalid credentials.",
          variant: "destructive",
        });
        
        // Auto-switch hint
        const hint = (result.message || "").toLowerCase();
        if (
          result.code === "EMAIL_ONLY_LOGIN" ||
          (hint.includes("admin") && hint.includes("email"))
        ) {
          setTab("staff");
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo & Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-primary-foreground mb-4 shadow-lg shadow-primary/20">
            <GraduationCap className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Pathways UI</h1>
          <p className="text-muted-foreground">
            Sign in to access your educational portal
          </p>
        </div>

        <Card className="border-none shadow-xl bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <CardHeader>
            <Tabs
              value={tab}
              onValueChange={(v) => setTab(v as "student" | "staff")}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="student">Student</TabsTrigger>
                <TabsTrigger value="staff">Staff</TabsTrigger>
              </TabsList>

              {/* Student Login */}
              <TabsContent value="student">
                <form onSubmit={studentForm.handleSubmit((d) => handleLogin(d, "student"))} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="studentId">Student ID</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="studentId"
                        placeholder="STU-2024-0001"
                        className="pl-9"
                        {...studentForm.register("studentId")}
                      />
                    </div>
                    {studentForm.formState.errors.studentId && (
                      <p className="text-sm text-destructive">
                        {studentForm.formState.errors.studentId.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="student-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="student-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pl-9 pr-9"
                        {...studentForm.register("password")}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1 h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {studentForm.formState.errors.password && (
                      <p className="text-sm text-destructive">
                        {studentForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="student-remember"
                        checked={studentForm.watch("rememberMe")}
                        onCheckedChange={(c) => studentForm.setValue("rememberMe", c as boolean)}
                      />
                      <label
                        htmlFor="student-remember"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Remember me
                      </label>
                    </div>
                    <Button variant="link" size="sm" className="px-0 font-normal">
                      Forgot password?
                    </Button>
                  </div>

                  <Button className="w-full" type="submit" disabled={loading}>
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowRight className="mr-2 h-4 w-4" />
                    )}
                    Sign In as Student
                  </Button>
                </form>
              </TabsContent>

              {/* Staff Login */}
              <TabsContent value="staff">
                <form onSubmit={staffForm.handleSubmit((d) => handleLogin(d, "staff"))} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="teacher@school.edu"
                        className="pl-9"
                        {...staffForm.register("email")}
                      />
                    </div>
                    {staffForm.formState.errors.email && (
                      <p className="text-sm text-destructive">
                        {staffForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="staff-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="staff-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pl-9 pr-9"
                        {...staffForm.register("password")}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1 h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {staffForm.formState.errors.password && (
                      <p className="text-sm text-destructive">
                        {staffForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="staff-remember"
                        checked={staffForm.watch("rememberMe")}
                        onCheckedChange={(c) => staffForm.setValue("rememberMe", c as boolean)}
                      />
                      <label
                        htmlFor="staff-remember"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Remember me
                      </label>
                    </div>
                    <Button variant="link" size="sm" className="px-0 font-normal">
                      Forgot password?
                    </Button>
                  </div>

                  <Button className="w-full" type="submit" disabled={loading}>
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowRight className="mr-2 h-4 w-4" />
                    )}
                    Sign In as Staff
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardHeader>
          <CardFooter className="flex flex-col space-y-4 text-center text-sm text-muted-foreground border-t pt-6">
            <p>
              Don't have an account?{" "}
              <Button variant="link" className="p-0 h-auto font-semibold" onClick={() => navigate("/signup")}>
                Sign up
              </Button>
            </p>
            <div className="flex items-center justify-center gap-4 text-xs">
              <a href="#" className="hover:underline">Privacy Policy</a>
              <span>•</span>
              <a href="#" className="hover:underline">Terms of Service</a>
              <span>•</span>
              <a href="#" className="hover:underline">Help Center</a>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Login;
