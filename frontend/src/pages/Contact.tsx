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
} from "lucide-react";
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

const contactSchema = z.object({
  name: z.string().trim().min(1, "Full name is required"),
  email: z.string().trim().email("Enter a valid email address"),
  role: z
    .union([
      z.literal(""),
      z.enum(["student", "teacher", "head", "admin", "parent", "visitor"]),
    ])
    .optional(),
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
    description: "+251-xxx-xxx-xxx",
    detail: "Weekday hotline for urgent technical issues.",
    icon: Phone,
  },
  {
    title: "Email",
    description: "support@schoolportal.edu",
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

const scenarioItems = [
  "A student reports a grade mismatch via the Contact form.",
  "A teacher requests account reset through the Contact page.",
  "An admin receives the submitted messages in their inbox or admin panel.",
];

const Contact = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  usePageMetadata({
    title: "Student Portal | Contact",
    description:
      "Contact the Student Portal support team for help, feedback, or technical issues.",
    keywords: [
      "contact student portal",
      "school management support",
      "ict help desk",
      "grade 9-12 portal assistance",
    ],
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

  const {
    handleSubmit,
    control,
    register,
    reset,
    formState: { errors, isSubmitting },
  } = form;

  useEffect(() => {
    reset(initialValues);
  }, [initialValues, reset]);

  const apiBaseUrl =
    import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";

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
        throw new Error(
          data?.message ?? "Unable to send message. Please try again later."
        );
      }

      toast({
        title: "Message sent",
        description: "Your message has been sent successfully.",
      });

      reset({
        ...initialValues,
        subject: "",
        message: "",
      });
    } catch (error) {
      const description =
        error instanceof Error
          ? error.message
          : "Unable to send message. Please try again later.";
      toast({
        title: "Submission failed",
        description,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <section className="border-b border-border/60 bg-card">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-16 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <div className="flex items-center gap-4 rounded-2xl border border-border bg-background/80 p-4 shadow-sm">
              <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <GraduationCap className="h-8 w-8" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-muted-foreground">
                  Student Portal &amp; School Management System
                </p>
                <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
                  Contact Us
                </h1>
                <p className="mt-2 text-base text-muted-foreground">
                  We&apos;re here to help. Reach out for technical support,
                  feedback, or inquiries.
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 text-sm text-muted-foreground shadow-sm">
              <div className="flex items-center gap-3 text-primary">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                <span className="font-semibold">Secure assistance</span>
              </div>
              <p className="mt-2 leading-relaxed">
                Our ICT support team for Grades 9–12 responds within one
                business day. Logged-in users get personalized follow-up based
                on their role.
              </p>
            </div>
          </div>
        </section>

        <section id="support" className="py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {contactCards.map((card) => (
                <div
                  key={card.title}
                  className="flex h-full flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-lg"
                >
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <card.icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="text-lg font-semibold text-card-foreground">
                      {card.title}
                    </h2>
                    <p className="text-base font-medium text-foreground">
                      {card.description}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {card.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-muted/30 py-16">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_1.2fr] lg:px-8">
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-foreground">
                Send a message to our support team
              </h2>
              <p className="text-base leading-relaxed text-muted-foreground">
                Complete the form and our administrators will review your
                message. Please provide exact course names, class sections, or
                error details so we can respond quickly.
              </p>
              <ul className="space-y-3 text-sm text-muted-foreground">
                {scenarioItems.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1 inline-flex h-2 w-2 shrink-0 rounded-full bg-primary"></span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle>Contact form</CardTitle>
                <CardDescription>
                  All fields are required except role. We&apos;ll reply via the
                  email you provide.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  className="space-y-6"
                  onSubmit={handleSubmit(onSubmit)}
                  noValidate
                >
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full name</Label>
                      <Input
                        id="name"
                        placeholder="Enter your full name"
                        autoComplete="name"
                        {...register("name")}
                      />
                      {errors.name && (
                        <p className="text-sm text-destructive" role="alert">
                          {errors.name.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        autoComplete="email"
                        {...register("email")}
                      />
                      {errors.email && (
                        <p className="text-sm text-destructive" role="alert">
                          {errors.email.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Role (optional)</Label>
                      <Controller
                        control={control}
                        name="role"
                        render={({ field }) => (
                          <Select
                            value={field.value ?? ""}
                            onValueChange={(value) => field.onChange(value)}
                          >
                            <SelectTrigger id="role">
                              <SelectValue placeholder="Select your role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">Not specified</SelectItem>
                              {roleOptions.map((option) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.role && (
                        <p className="text-sm text-destructive" role="alert">
                          {errors.role.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        placeholder="Short summary"
                        {...register("subject")}
                      />
                      {errors.subject && (
                        <p className="text-sm text-destructive" role="alert">
                          {errors.subject.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      rows={6}
                      placeholder="Describe the issue or feedback in detail"
                      {...register("message")}
                    />
                    {errors.message && (
                      <p className="text-sm text-destructive" role="alert">
                        {errors.message.message}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex items-center gap-2"
                      onClick={() => reset(initialValues)}
                      disabled={isSubmitting}
                    >
                      <RotateCcw className="h-4 w-4" aria-hidden="true" />
                      Reset
                    </Button>
                    <Button
                      type="submit"
                      className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <svg
                          className="h-4 w-4 animate-spin"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          aria-hidden="true"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                          ></path>
                        </svg>
                      ) : (
                        <Send className="h-4 w-4" aria-hidden="true" />
                      )}
                      Submit
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;
