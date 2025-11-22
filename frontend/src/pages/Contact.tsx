import { useEffect, useMemo } from "react";
import {
  GraduationCap,
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  RotateCcw,
  ShieldCheck,
  ArrowLeft,
  MessageSquare,
} from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import { usePageMetadata } from "@/hooks/usePageMetadata";
import { useAuth } from "@/contexts/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Badge } from "@/components/ui/badge";

const contactSchema = z.object({
  name: z.string().trim().min(1, "Full name is required"),
  email: z.string().trim().email("Enter a valid email address"),
  role: z.union([z.literal(""), z.enum(["student", "teacher", "head", "admin", "parent", "visitor"])]).optional(),
  subject: z.string().trim().min(1, "Subject is required"),
  message: z.string().trim().min(10, "Message must be at least 10 characters"),
});

const roleOptions = [
  { value: "student", label: "Student" },
  { value: "teacher", label: "Teacher" },
  { value: "head", label: "Head" },
  { value: "admin", label: "Admin" },
  { value: "parent", label: "Parent" },
  { value: "visitor", label: "Visitor" },
];

type ContactFormValues = z.infer<typeof contactSchema>;

const contactCards = [
  {
    title: "Phone Support",
    description: "+251-911-234-567",
    detail: "Weekday hotline for urgent technical issues.",
    icon: Phone,
  },
  {
    title: "Email",
    description: "support@pathways.edu.et",
    detail: "Reach out for feature requests or detailed feedback.",
    icon: Mail,
  },
  {
    title: "Office Location",
    description: "Gondar, Ethiopia (ICT Center)",
    detail: "Visit our ICT support center during operating hours.",
    icon: MapPin,
  },
  {
    title: "Working Hours",
    description: "Mon – Fri, 8:00 AM – 5:00 PM",
    detail: "Responses within one business day for all requests.",
    icon: Clock,
  },
];

const Contact = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  usePageMetadata({
    title: "Contact Support | Pathways",
    description: "Contact the Student Portal support team for help, feedback, or technical issues.",
  });

  const initialValues = useMemo<ContactFormValues>(
    () => ({
      name: user?.name ?? "",
      email: user?.email ?? "",
      role: user?.role ?? "",
      subject: "",
      message: "",
    }),
    [user]
  );

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: initialValues,
    mode: "onBlur",
  });

  const { handleSubmit, control, register, reset, formState: { errors, isSubmitting } } = form;

  useEffect(() => {
    reset(initialValues);
  }, [initialValues, reset]);

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";

  const onSubmit = async (values: ContactFormValues) => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name.trim(),
          email: values.email.trim(),
          role: values.role && values.role !== "" ? values.role : undefined,
          subject: values.subject.trim(),
          message: values.message.trim(),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data?.success) {
        throw new Error(data?.message ?? "Unable to send message. Please try again later.");
      }

      toast({ title: "Message sent", description: "Your message has been sent successfully." });
      reset({ ...initialValues, subject: "", message: "" });
    } catch (error) {
      const description = error instanceof Error ? error.message : "Unable to send message. Please try again later.";
      toast({ title: "Submission failed", description, variant: "destructive" });
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-primary/20">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 lg:py-28 overflow-hidden bg-muted/30">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-primary/10 via-background to-background"></div>
          
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <div className="mb-8 flex justify-center">
              <Link to="/">
                <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="h-4 w-4" /> Back to Home
                </Button>
              </Link>
            </div>
            
            <Badge variant="outline" className="mb-6 px-4 py-1.5 text-sm font-medium rounded-full border-primary/20 bg-primary/5 text-primary">
              Support Center
            </Badge>
            
            <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight text-foreground sm:text-6xl mb-6">
              How can we <span className="text-primary">help you?</span>
            </h1>
            
            <p className="mx-auto max-w-2xl text-lg leading-8 text-muted-foreground">
              We're here to help with technical support, feedback, or inquiries. Our team typically responds within one business day.
            </p>
          </div>
        </section>

        {/* Contact Info Grid */}
        <section className="py-12 -mt-16 relative z-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {contactCards.map((card) => (
                <Card key={card.title} className="border-border/50 shadow-lg bg-card/95 backdrop-blur hover:-translate-y-1 transition-transform duration-300">
                  <CardHeader className="pb-2">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
                      <card.icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-lg">{card.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-medium text-foreground mb-1">{card.description}</p>
                    <p className="text-sm text-muted-foreground">{card.detail}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Form Section */}
        <section className="py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-[1fr_1.5fr] gap-12 items-start">
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl font-bold mb-4">Send us a message</h2>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Complete the form and our administrators will review your message. Please provide exact details so we can respond quickly.
                  </p>
                </div>
                
                <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10">
                  <div className="flex items-center gap-3 text-primary mb-4">
                    <ShieldCheck className="h-6 w-6" />
                    <span className="font-semibold text-lg">Secure Assistance</span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    Our ICT support team for Grades 9–12 prioritizes security. Logged-in users get personalized follow-up based on their role.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground">Common Topics</h3>
                  <ul className="space-y-3">
                    {["Grade mismatch reporting", "Account access issues", "Feature suggestions", "Technical bug reports"].map((item) => (
                      <li key={item} className="flex items-center gap-3 text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <Card className="shadow-xl border-border/50">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    <CardTitle>Contact Form</CardTitle>
                  </div>
                  <CardDescription>
                    Fill out the details below. We'll get back to you via email.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" placeholder="John Doe" {...register("name")} />
                        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" type="email" placeholder="john@example.com" {...register("email")} />
                        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role">Role (Optional)</Label>
                        <Controller
                          control={control}
                          name="role"
                          render={({ field }) => (
                            <Select value={field.value || "none"} onValueChange={(v) => field.onChange(v === "none" ? "" : v)}>
                              <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Not specified</SelectItem>
                                {roleOptions.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="subject">Subject</Label>
                        <Input id="subject" placeholder="Brief summary of issue" {...register("subject")} />
                        {errors.subject && <p className="text-sm text-destructive">{errors.subject.message}</p>}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Message</Label>
                      <Textarea id="message" rows={6} placeholder="Describe your issue or feedback in detail..." {...register("message")} />
                      {errors.message && <p className="text-sm text-destructive">{errors.message.message}</p>}
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                      <Button type="button" variant="outline" onClick={() => reset(initialValues)} disabled={isSubmitting}>
                        <RotateCcw className="mr-2 h-4 w-4" /> Reset
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Sending..." : <><Send className="mr-2 h-4 w-4" /> Send Message</>}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;
