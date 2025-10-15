import { useState } from "react";
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
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Validation schemas
const step1Schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["teacher", "head"], { required_error: "Please select a role" }),
});

const step2Schema = z
  .object({
    subject: z.string().optional(),
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
      const success = await signup({
        name: step1Data.name,
        email: step1Data.email,
        password: data.password,
        role: step1Data.role,
        subject: step1Data.role === "teacher" ? data.subject : undefined,
        position: step1Data.role === "head" ? data.position : undefined,
      });

      if (success) {
        toast({
          title: "Registration successful",
          description:
            "Your account is pending approval. You will be notified once approved.",
        });
        navigate("/login");
      } else {
        toast({
          title: "Registration failed",
          description: "Please try again",
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

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/\d/.test(password)) strength += 25;
    return strength;
  };

  const getStrengthColor = (strength: number) => {
    if (strength < 50) return "bg-red-500";
    if (strength < 75) return "bg-yellow-500";
    return "bg-green-500";
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
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
        <div className="max-w-md text-center space-y-6 relative z-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm mb-4 animate-pulse">
            <GraduationCap className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white animate-in slide-in-from-bottom-4 duration-700">
            Join Our Team
          </h1>
          <p className="text-lg text-white/90 animate-in slide-in-from-bottom-4 duration-700 delay-100">
            Create your staff account and contribute to excellence in education
          </p>

          {/* Step Indicator */}
          <div className="pt-8 space-y-4">
            <div className="flex items-center justify-center space-x-4">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                      currentStep >= step.id
                        ? "bg-white border-white text-primary"
                        : "border-white/30 text-white/50"
                    }`}
                  >
                    {currentStep > step.id ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <span className="text-sm font-semibold">{step.id}</span>
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`w-12 h-0.5 mx-2 transition-all duration-300 ${
                        currentStep > step.id ? "bg-white" : "bg-white/30"
                      }`}
                    ></div>
                  )}
                </div>
              ))}
            </div>
            <div className="text-center">
              <p className="text-white/90 font-medium">
                Step {currentStep} of {steps.length}
              </p>
              <p className="text-white/70 text-sm">
                {steps[currentStep - 1].description}
              </p>
            </div>
          </div>

          <div className="pt-4 space-y-3 text-sm text-white/80 animate-in slide-in-from-bottom-4 duration-700 delay-200">
            <p className="flex items-center gap-2">
              <Shield className="w-4 h-4" /> Secure account creation process
            </p>
            <p className="flex items-center gap-2">
              <Users className="w-4 h-4" /> Join our educational community
            </p>
            <p className="flex items-center gap-2">
              <Award className="w-4 h-4" /> Access powerful teaching tools
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Signup Form */}
      <div className="flex items-center justify-center p-8 bg-background">
        <Card className="w-full max-w-md shadow-2xl animate-in slide-in-from-right-4 duration-500">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-between mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  currentStep === 1 ? navigate("/login") : setCurrentStep(1)
                }
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                {currentStep === 1 ? "Back to login" : "Back"}
              </Button>
              <Badge variant="outline" className="text-xs">
                Step {currentStep} of 2
              </Badge>
            </div>
            <CardTitle className="text-2xl">
              {currentStep === 1 ? "Personal Information" : "Account Setup"}
            </CardTitle>
            <CardDescription>
              {currentStep === 1
                ? "Tell us about yourself"
                : "Create your secure account credentials"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Progress Bar */}
            <div className="mb-6">
              <Progress value={(currentStep / 2) * 100} className="h-2" />
            </div>

            {currentStep === 1 && (
              <form
                onSubmit={step1Form.handleSubmit(handleStep1Submit)}
                className="space-y-4 animate-in fade-in duration-300"
              >
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      placeholder="Enter your full name"
                      className="pl-10"
                      {...step1Form.register("name")}
                      aria-describedby={
                        step1Form.formState.errors.name
                          ? "name-error"
                          : undefined
                      }
                    />
                  </div>
                  {step1Form.formState.errors.name && (
                    <p id="name-error" className="text-sm text-destructive">
                      {step1Form.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      className="pl-10"
                      {...step1Form.register("email")}
                      aria-describedby={
                        step1Form.formState.errors.email
                          ? "email-error"
                          : undefined
                      }
                    />
                  </div>
                  {step1Form.formState.errors.email && (
                    <p id="email-error" className="text-sm text-destructive">
                      {step1Form.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={step1Form.watch("role")}
                    onValueChange={(value: "teacher" | "head") =>
                      step1Form.setValue("role", value)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="teacher">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          Teacher
                        </div>
                      </SelectItem>
                      <SelectItem value="head">
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4" />
                          Head of School
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {step1Form.formState.errors.role && (
                    <p className="text-sm text-destructive">
                      {step1Form.formState.errors.role.message}
                    </p>
                  )}
                </div>

                <Button type="submit" className="w-full gap-2">
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </form>
            )}

            {currentStep === 2 && (
              <form
                onSubmit={step2Form.handleSubmit(handleStep2Submit)}
                className="space-y-4 animate-in fade-in duration-300"
              >
                {step1Data.role === "teacher" && (
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Select
                      value={step2Form.watch("subject")}
                      onValueChange={(value) =>
                        step2Form.setValue("subject", value)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select your subject" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Mathematics">Mathematics</SelectItem>
                        <SelectItem value="English">English</SelectItem>
                        <SelectItem value="Science">Science</SelectItem>
                        <SelectItem value="History">History</SelectItem>
                        <SelectItem value="Geography">Geography</SelectItem>
                        <SelectItem value="Physics">Physics</SelectItem>
                        <SelectItem value="Chemistry">Chemistry</SelectItem>
                        <SelectItem value="Biology">Biology</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {step1Data.role === "head" && (
                  <div className="space-y-2">
                    <Label htmlFor="position">Position</Label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="position"
                        placeholder="e.g., Head of School, Principal"
                        className="pl-10"
                        {...step2Form.register("position")}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a strong password"
                      className="pl-10 pr-10"
                      {...step2Form.register("password")}
                      aria-describedby={
                        step2Form.formState.errors.password
                          ? "password-error"
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
                  {step2Form.watch("password") && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          Password strength:
                        </span>
                        <span
                          className={`font-medium ${
                            getPasswordStrength(step2Form.watch("password")) <
                            50
                              ? "text-red-600"
                              : getPasswordStrength(
                                  step2Form.watch("password")
                                ) < 75
                              ? "text-yellow-600"
                              : "text-green-600"
                          }`}
                        >
                          {getStrengthText(
                            getPasswordStrength(step2Form.watch("password"))
                          )}
                        </span>
                      </div>
                      <Progress
                        value={getPasswordStrength(step2Form.watch("password"))}
                        className="h-1"
                      />
                    </div>
                  )}
                  {step2Form.formState.errors.password && (
                    <p id="password-error" className="text-sm text-destructive">
                      {step2Form.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      className="pl-10 pr-10"
                      {...step2Form.register("confirmPassword")}
                      aria-describedby={
                        step2Form.formState.errors.confirmPassword
                          ? "confirm-password-error"
                          : undefined
                      }
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:text-foreground"
                      aria-label={
                        showConfirmPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {step2Form.formState.errors.confirmPassword && (
                    <p
                      id="confirm-password-error"
                      className="text-sm text-destructive"
                    >
                      {step2Form.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>

                <div className="text-center space-y-2 pt-4 border-t">
                  <p className="text-xs text-muted-foreground">
                    Note: Students cannot self-register. Student accounts are
                    created by administrators.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Your account will require approval from an administrator
                    before you can log in.
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
