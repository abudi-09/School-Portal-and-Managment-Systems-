import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  GraduationCap,
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Mail,
  User,
  Lock,
  Briefcase,
  BookOpen,
  Loader2,
  Shield,
  Users,
  Award,
  Sparkles,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  listCoursesPublic,
  type GradeLevel,
  type CourseResponse,
} from "@/lib/api/courseSectionApi";

// Validation schemas
const step1Schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["teacher", "head"], { required_error: "Please select a role" }),
});

const step2Schema = z
  .object({
    subject: z.string().optional(),
    grade: z.number().optional(),
    stream: z.enum(["natural", "social"]).optional(),
    position: z.string().optional(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type Step1Form = z.infer<typeof step1Schema>;
type Step2Form = z.infer<typeof step2Schema>;

const Signup = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [teacherGrade, setTeacherGrade] = useState<GradeLevel | "">("");
  const [teacherStream, setTeacherStream] = useState<"" | "natural" | "social">("");
  const [availableSubjects, setAvailableSubjects] = useState<CourseResponse[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const gradeOptions = useMemo<GradeLevel[]>(() => [9, 10, 11, 12], []);

  const step1Form = useForm<Step1Form>({
    resolver: zodResolver(step1Schema),
    defaultValues: { name: "", email: "", role: undefined },
  });

  const step2Form = useForm<Step2Form>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      subject: "",
      position: "",
      password: "",
      confirmPassword: "",
    },
  });

  const step1Data = step1Form.watch();

  const handleStep1Submit = (data: Step1Form) => {
    setCurrentStep(2);
  };

  const handleStep2Submit = async (data: Step2Form) => {
    setLoading(true);
    try {
      if (step1Data.role === "teacher") {
        if (!teacherGrade) {
          toast({ title: "Select grade", description: "Please select the grade you teach.", variant: "destructive" });
          setLoading(false);
          return;
        }
        if ((teacherGrade === 11 || teacherGrade === 12) && !teacherStream) {
          toast({ title: "Select stream", description: "Please select the stream for grades 11–12.", variant: "destructive" });
          setLoading(false);
          return;
        }
        if (!data.subject) {
          toast({ title: "Select subject", description: "Please select your subject.", variant: "destructive" });
          setLoading(false);
          return;
        }
      }
      const success = await signup({
        name: step1Data.name,
        email: step1Data.email,
        password: data.password,
        role: step1Data.role,
        subject: step1Data.role === "teacher" ? data.subject : undefined,
        grade: step1Data.role === "teacher" ? teacherGrade || undefined : undefined,
        stream: step1Data.role === "teacher" ? teacherStream || undefined : undefined,
        position: step1Data.role === "head" ? data.position : undefined,
      });

      if (success) {
        toast({
          title: "Registration successful",
          description: "Your account is pending approval. You will be notified once approved.",
        });
        navigate("/pending-approval", { state: { email: step1Data.email } });
      } else {
        toast({ title: "Registration failed", description: "Please try again", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "An unexpected error occurred. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadSubjects = async () => {
      try {
        setSubjectsLoading(true);
        setAvailableSubjects([]);
        if (!teacherGrade) return;
        const isSenior = teacherGrade === 11 || teacherGrade === 12;
        if (isSenior && !teacherStream) return;
        const res = await listCoursesPublic(
          teacherGrade as GradeLevel,
          isSenior ? teacherStream || undefined : undefined
        );
        setAvailableSubjects(res.data.courses);
        const current = step2Form.getValues("subject") || "";
        if (current && !res.data.courses.some((c) => c.name === current)) {
          step2Form.setValue("subject", "");
        }
      } catch (e) {
        setAvailableSubjects([]);
      } finally {
        setSubjectsLoading(false);
      }
    };
    void loadSubjects();
  }, [teacherGrade, teacherStream, step2Form]);

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/\d/.test(password)) strength += 25;
    return strength;
  };

  const getStrengthText = (strength: number) => {
    if (strength < 50) return "Weak";
    if (strength < 75) return "Fair";
    return "Strong";
  };

  const steps = [
    { id: 1, title: "Personal Info", description: "Basic information" },
    { id: 2, title: "Account Setup", description: "Security & details" },
  ];

  return (
    <div className="min-h-screen grid lg:grid-cols-2 animate-in fade-in duration-500">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex flex-col justify-center items-center bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
        
        {/* Decorative circles */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>

        <div className="max-w-md text-center space-y-8 relative z-10">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-white/10 backdrop-blur-md shadow-xl mb-6 ring-1 ring-white/20">
            <GraduationCap className="h-12 w-12 text-white" />
          </div>
          
          <div className="space-y-4">
            <h1 className="text-5xl font-bold text-white tracking-tight">
              Join Our Team
            </h1>
            <p className="text-xl text-white/90 font-light leading-relaxed">
              Create your staff account and contribute to excellence in education
            </p>
          </div>

          {/* Step Indicator */}
          <div className="pt-12 space-y-6">
            <div className="flex items-center justify-center space-x-4">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${
                      currentStep >= step.id
                        ? "bg-white border-white text-primary shadow-lg scale-110"
                        : "border-white/30 text-white/50 bg-white/5"
                    }`}
                  >
                    {currentStep > step.id ? (
                      <Check className="h-6 w-6" />
                    ) : (
                      <span className="text-lg font-semibold">{step.id}</span>
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`w-16 h-0.5 mx-4 transition-all duration-500 ${
                        currentStep > step.id ? "bg-white" : "bg-white/20"
                      }`}
                    ></div>
                  )}
                </div>
              ))}
            </div>
            <div className="text-center space-y-1">
              <p className="text-white font-semibold text-lg tracking-wide">
                Step {currentStep}: {steps[currentStep - 1].title}
              </p>
              <p className="text-white/70 text-sm">
                {steps[currentStep - 1].description}
              </p>
            </div>
          </div>

          <div className="pt-8 grid grid-cols-3 gap-4 text-center">
            <div className="p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
              <Shield className="w-6 h-6 text-white mx-auto mb-2" />
              <p className="text-xs text-white/80 font-medium">Secure</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
              <Users className="w-6 h-6 text-white mx-auto mb-2" />
              <p className="text-xs text-white/80 font-medium">Community</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
              <Award className="w-6 h-6 text-white mx-auto mb-2" />
              <p className="text-xs text-white/80 font-medium">Excellence</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Signup Form */}
      <div className="flex items-center justify-center p-6 lg:p-12 bg-background/50 backdrop-blur-sm">
        <Card className="w-full max-w-md shadow-2xl border-muted/40 bg-card/95 backdrop-blur-xl">
          <CardHeader className="space-y-2 pb-6">
            <div className="flex items-center justify-between mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => currentStep === 1 ? navigate("/login") : setCurrentStep(1)}
                className="gap-2 -ml-2 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                {currentStep === 1 ? "Back to login" : "Back"}
              </Button>
              <Badge variant="secondary" className="font-medium">
                Step {currentStep} of 2
              </Badge>
            </div>
            <CardTitle className="text-3xl font-bold tracking-tight">
              {currentStep === 1 ? "Personal Information" : "Account Setup"}
            </CardTitle>
            <CardDescription className="text-base">
              {currentStep === 1 ? "Tell us about yourself to get started" : "Create your secure account credentials"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-8">
              <Progress value={(currentStep / 2) * 100} className="h-1.5" />
            </div>

            {currentStep === 1 && (
              <form onSubmit={step1Form.handleSubmit(handleStep1Submit)} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative group">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    <Input
                      id="name"
                      placeholder="Enter your full name"
                      className="pl-10 h-11 transition-all focus:ring-2 focus:ring-primary/20"
                      {...step1Form.register("name")}
                    />
                  </div>
                  {step1Form.formState.errors.name && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-destructive" />
                      {step1Form.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      className="pl-10 h-11 transition-all focus:ring-2 focus:ring-primary/20"
                      {...step1Form.register("email")}
                    />
                  </div>
                  {step1Form.formState.errors.email && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-destructive" />
                      {step1Form.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={step1Form.watch("role")}
                    onValueChange={(value: "teacher" | "head") => step1Form.setValue("role", value)}
                  >
                    <SelectTrigger className="w-full h-11">
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="teacher">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-primary" />
                          <div className="flex flex-col text-left">
                            <span className="font-medium">Teacher</span>
                            <span className="text-xs text-muted-foreground">Classroom instruction</span>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="head">
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-primary" />
                          <div className="flex flex-col text-left">
                            <span className="font-medium">Head of School</span>
                            <span className="text-xs text-muted-foreground">Administration & Management</span>
                          </div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {step1Form.formState.errors.role && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-destructive" />
                      {step1Form.formState.errors.role.message}
                    </p>
                  )}
                </div>

                <Button type="submit" className="w-full h-11 gap-2 text-base mt-4 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
                  Continue <ArrowRight className="h-4 w-4" />
                </Button>
              </form>
            )}

            {currentStep === 2 && (
              <form onSubmit={step2Form.handleSubmit(handleStep2Submit)} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                {step1Data.role === "teacher" && (
                  <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border/50">
                    <div className="space-y-2">
                      <Label>Grade Level</Label>
                      <Select
                        value={teacherGrade ? String(teacherGrade) : ""}
                        onValueChange={(v) => {
                          const g = Number(v) as GradeLevel;
                          setTeacherGrade(g);
                          setTeacherStream("");
                          step2Form.setValue("subject", "");
                        }}
                      >
                        <SelectTrigger className="w-full bg-background">
                          <SelectValue placeholder="Select grade" />
                        </SelectTrigger>
                        <SelectContent>
                          {gradeOptions.map((g) => (
                            <SelectItem key={g} value={String(g)}>Grade {g}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {(teacherGrade === 11 || teacherGrade === 12) && (
                      <div className="space-y-2">
                        <Label>Stream</Label>
                        <Select
                          value={teacherStream}
                          onValueChange={(v) => {
                            setTeacherStream(v as "natural" | "social");
                            step2Form.setValue("subject", "");
                          }}
                        >
                          <SelectTrigger className="w-full bg-background">
                            <SelectValue placeholder="Select stream" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="natural">Natural Science</SelectItem>
                            <SelectItem value="social">Social Science</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>Subject</Label>
                      <Select
                        value={step2Form.watch("subject")}
                        onValueChange={(value) => step2Form.setValue("subject", value)}
                        disabled={!teacherGrade || ((teacherGrade === 11 || teacherGrade === 12) && !teacherStream) || subjectsLoading}
                      >
                        <SelectTrigger className="w-full bg-background">
                          <SelectValue placeholder={
                            !teacherGrade ? "Select grade first" :
                            (teacherGrade === 11 || teacherGrade === 12) && !teacherStream ? "Select stream first" :
                            subjectsLoading ? "Loading subjects..." :
                            availableSubjects.length === 0 ? "No subjects available" : "Select your subject"
                          } />
                        </SelectTrigger>
                        <SelectContent>
                          {availableSubjects.length === 0 ? (
                            <SelectItem value="__none" disabled>No subjects available</SelectItem>
                          ) : (
                            availableSubjects.map((c) => (
                              <SelectItem key={c.id} value={c.name}>
                                {c.name}
                                {(teacherGrade === 11 || teacherGrade === 12) && c.stream ? (c.stream === "natural" ? " — Natural" : " — Social") : null}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {step1Data.role === "head" && (
                  <div className="space-y-2">
                    <Label htmlFor="position">Position Title</Label>
                    <div className="relative group">
                      <Briefcase className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      <Input
                        id="position"
                        placeholder="e.g., Head of School, Principal"
                        className="pl-10 h-11"
                        {...step2Form.register("position")}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a strong password"
                      className="pl-10 pr-10 h-11"
                      {...step2Form.register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {step2Form.watch("password") && (
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Password strength</span>
                        <span className={`font-medium ${
                          getPasswordStrength(step2Form.watch("password")) < 50 ? "text-destructive" :
                          getPasswordStrength(step2Form.watch("password")) < 75 ? "text-yellow-600" : "text-green-600"
                        }`}>
                          {getStrengthText(getPasswordStrength(step2Form.watch("password")))}
                        </span>
                      </div>
                      <Progress value={getPasswordStrength(step2Form.watch("password"))} className="h-1" />
                    </div>
                  )}
                  {step2Form.formState.errors.password && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-destructive" />
                      {step2Form.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      className="pl-10 pr-10 h-11"
                      {...step2Form.register("confirmPassword")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {step2Form.formState.errors.confirmPassword && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-destructive" />
                      {step2Form.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <Button type="submit" className="w-full h-11 gap-2 text-base mt-4 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all" disabled={loading}>
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account...</> : "Create Account"}
                </Button>

                <div className="text-center space-y-2 pt-4 border-t">
                  <p className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                    Note: Students cannot self-register. Student accounts are created by administrators.
                  </p>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Signup;
