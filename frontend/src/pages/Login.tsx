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
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Validation schemas
const studentLoginSchema = z.object({
  studentId: z
    .string()
    .min(1, "Student ID is required")
    .regex(/^STU\d{3}$/, "Invalid student ID format"),
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
  const { login } = useAuth();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const studentForm = useForm<StudentLoginForm>({
    resolver: zodResolver(studentLoginSchema),
    defaultValues: { studentId: "", password: "", rememberMe: false },
  });

  const staffForm = useForm<StaffLoginForm>({
    resolver: zodResolver(staffLoginSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  const handleStudentLogin = async (data: StudentLoginForm) => {
    setLoading(true);
    try {
      const success = await login({
        studentId: data.studentId,
        password: data.password,
      });
      if (success) {
        toast({ title: "Login successful", description: "Welcome back!" });
        navigate("/dashboard");
      } else {
        toast({
          title: "Login failed",
          description: "Invalid credentials. Try STU001 for demo.",
          variant: "destructive",
        });
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

  const handleStaffLogin = async (data: StaffLoginForm) => {
    setLoading(true);
    try {
      const success = await login({
        email: data.email,
        password: data.password,
      });
      if (success) {
        toast({ title: "Login successful", description: "Welcome back!" });
        // Route based on role
        if (data.email.includes("admin")) navigate("/admin");
        else if (data.email.includes("head")) navigate("/head");
        else navigate("/teacher");
      } else {
        toast({
          title: "Login failed",
          description: "Invalid credentials. Try the demo emails.",
          variant: "destructive",
        });
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
    <div className="min-h-screen grid lg:grid-cols-2 animate-in fade-in duration-500">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex flex-col justify-center items-center bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
        <div className="max-w-md text-center space-y-6 relative z-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm mb-4 animate-pulse">
            <GraduationCap className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white animate-in slide-in-from-bottom-4 duration-700">
            Student Portal System
          </h1>
          <p className="text-lg text-white/90 animate-in slide-in-from-bottom-4 duration-700 delay-100">
            A comprehensive school management platform designed for modern
            education
          </p>
          <div className="pt-8 space-y-3 text-sm text-white/80 animate-in slide-in-from-bottom-4 duration-700 delay-200">
            <p className="flex items-center gap-2">
              <span className="w-2 h-2 bg-white/60 rounded-full"></span> Secure
              access for students, teachers, and administrators
            </p>
            <p className="flex items-center gap-2">
              <span className="w-2 h-2 bg-white/60 rounded-full"></span>{" "}
              Real-time attendance and grade tracking
            </p>
            <p className="flex items-center gap-2">
              <span className="w-2 h-2 bg-white/60 rounded-full"></span>{" "}
              Streamlined assignment and schedule management
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex items-center justify-center p-8 bg-background">
        <Card className="w-full max-w-md shadow-2xl animate-in slide-in-from-right-4 duration-500">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2 mb-2 lg:hidden">
              <GraduationCap className="h-6 w-6 text-primary" />
              <span className="font-bold text-xl">Student Portal</span>
            </div>
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription>Sign in to access your portal</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="student" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="student">Student</TabsTrigger>
                <TabsTrigger value="staff">Staff</TabsTrigger>
              </TabsList>

              <TabsContent
                value="student"
                className="animate-in fade-in duration-300"
              >
                <form
                  onSubmit={studentForm.handleSubmit(handleStudentLogin)}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="studentId">Student ID</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="studentId"
                        placeholder="Enter your student ID"
                        className="pl-10"
                        {...studentForm.register("studentId")}
                        aria-describedby={
                          studentForm.formState.errors.studentId
                            ? "studentId-error"
                            : undefined
                        }
                      />
                    </div>
                    {studentForm.formState.errors.studentId && (
                      <p
                        id="studentId-error"
                        className="text-sm text-destructive"
                      >
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
                        placeholder="Enter your password"
                        className="pl-10 pr-10"
                        {...studentForm.register("password")}
                        aria-describedby={
                          studentForm.formState.errors.password
                            ? "student-password-error"
                            : undefined
                        }
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:text-foreground"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {studentForm.formState.errors.password && (
                      <p
                        id="student-password-error"
                        className="text-sm text-destructive"
                      >
                        {studentForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="student-remember"
                      {...studentForm.register("rememberMe")}
                    />
                    <Label htmlFor="student-remember" className="text-sm">
                      Remember me
                    </Label>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                  <div className="text-center">
                    <button
                      type="button"
                      className="text-sm text-primary hover:underline"
                      onClick={() =>
                        toast({
                          title: "Forgot Password",
                          description:
                            "Contact your administrator for password reset.",
                        })
                      }
                    >
                      Forgot password?
                    </button>
                  </div>
                  <p className="text-xs text-center text-muted-foreground">
                    Demo: Use "STU001" as Student ID
                  </p>
                </form>
              </TabsContent>

              <TabsContent
                value="staff"
                className="animate-in fade-in duration-300"
              >
                <form
                  onSubmit={staffForm.handleSubmit(handleStaffLogin)}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        className="pl-10"
                        {...staffForm.register("email")}
                        aria-describedby={
                          staffForm.formState.errors.email
                            ? "email-error"
                            : undefined
                        }
                      />
                    </div>
                    {staffForm.formState.errors.email && (
                      <p id="email-error" className="text-sm text-destructive">
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
                        placeholder="Enter your password"
                        className="pl-10 pr-10"
                        {...staffForm.register("password")}
                        aria-describedby={
                          staffForm.formState.errors.password
                            ? "staff-password-error"
                            : undefined
                        }
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:text-foreground"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {staffForm.formState.errors.password && (
                      <p
                        id="staff-password-error"
                        className="text-sm text-destructive"
                      >
                        {staffForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="staff-remember"
                      {...staffForm.register("rememberMe")}
                    />
                    <Label htmlFor="staff-remember" className="text-sm">
                      Remember me
                    </Label>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                  <div className="text-center space-y-2">
                    <button
                      type="button"
                      onClick={() => navigate("/signup")}
                      className="text-sm text-primary hover:underline"
                    >
                      Need an account? Sign up
                    </button>
                    <br />
                    <button
                      type="button"
                      className="text-sm text-primary hover:underline"
                      onClick={() =>
                        toast({
                          title: "Forgot Password",
                          description:
                            "Contact your administrator for password reset.",
                        })
                      }
                    >
                      Forgot password?
                    </button>
                  </div>
                  <p className="text-xs text-center text-muted-foreground">
                    Demo: teacher, head, or admin @school.edu
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
