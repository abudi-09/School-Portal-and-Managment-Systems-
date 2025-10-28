import { Link } from "react-router-dom";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import SectionTitle from "@/components/public/SectionTitle";
import InfoCard from "@/components/public/InfoCard";
import { usePageMetadata } from "@/hooks/usePageMetadata";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const features = [
  {
    title: "Student Management",
    content:
      "Register students, manage enrollment status, and review academic progress in one place.",
  },
  {
    title: "Teacher & Head Assignment",
    content:
      "Assign head teachers and subject instructors quickly, ensuring every class has the right leader.",
  },
  {
    title: "Class Management",
    content:
      "Coordinate grades, sections, schedules, and subjects with an intuitive interface.",
  },
  {
    title: "Reports & Analytics",
    content:
      "Generate insights on attendance, grades, and trends to support data-driven decisions.",
  },
];

const workflow = [
  {
    title: "Step 1",
    content:
      "Admin adds students and teachers to the portal with complete academic profiles.",
  },
  {
    title: "Step 2",
    content:
      "Assign head teachers and subject specialists to grades and sections.",
  },
  {
    title: "Step 3",
    content:
      "Track student grades, attendance, and subject coverage in real time.",
  },
  {
    title: "Step 4",
    content:
      "Generate reports and share analytics with leadership and guardians.",
  },
];

const benefits = [
  {
    title: "Centralized Records",
    content:
      "Keep students, teachers, and guardians aligned with a single source of truth.",
  },
  {
    title: "Secure & Compliant",
    content:
      "Role-based access, encryption, and audit logs protect sensitive information.",
  },
  {
    title: "Responsive Experience",
    content:
      "Access the portal on any device with layouts optimized for mobile and desktop.",
  },
  {
    title: "Actionable Insights",
    content:
      "Monitor trends and intervene early with up-to-date analytics and reporting.",
  },
];

const faqs = [
  {
    question: "How do I add new students?",
    answer:
      "Go to Student Management, choose 'Add Student', and complete the required fields. Bulk CSV imports are supported for large intakes.",
  },
  {
    question: "Can I assign multiple heads per grade?",
    answer:
      "Each grade can have a lead head teacher with optional subject coordinators for specialized oversight.",
  },
  {
    question: "Where can I see performance reports?",
    answer:
      "Visit the Reports & Analytics module to review summaries, export PDFs, and schedule automated updates.",
  },
  {
    question: "Does the portal integrate with remote learning tools?",
    answer:
      "Yes. Attendance and assessment data from supported virtual tools can be synced for unified reporting.",
  },
];

const Home = () => {
  usePageMetadata({
    title: "Student Portal | Home",
    description:
      "Professional school management system to organize students, teachers, classes, and analytics across your institution.",
    keywords: [
      "student portal",
      "school management",
      "teacher assignment",
      "education analytics",
    ],
  });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <section className="border-b border-border/60 bg-card">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
            <div className="space-y-6">
              <span className="inline-flex rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-primary">
                School Management Reinvented
              </span>
              <h1 className="text-4xl font-bold text-foreground sm:text-5xl">
                Welcome to the School Portal
              </h1>
              <p className="text-lg leading-relaxed text-muted-foreground">
                Manage students, teachers, and classes with a professional,
                centralized system built for modern schools.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/login"
                  className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition-colors hover:bg-primary/90"
                >
                  Login
                </Link>
                <Link
                  to="/about"
                  className="rounded-lg border border-primary px-6 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
                >
                  Learn More
                </Link>
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6 shadow-lg">
              <h2 className="text-xl font-semibold text-card-foreground">
                Portal snapshot
              </h2>
              <p className="text-sm text-muted-foreground">
                Key metrics updated in real time.
              </p>
              <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
                <InfoCard
                  title="1,248 Students"
                  subtitle="Active enrollment"
                  content="Track attendance, assignments, and progression for every learner."
                  className="shadow-none border-border/60"
                />
                <InfoCard
                  title="112 Teachers"
                  subtitle="Assigned to classes"
                  content="Monitor workload distribution and head teacher responsibilities."
                  className="shadow-none border-border/60"
                />
              </div>
              <div className="mt-6 rounded-2xl border border-dashed border-border bg-muted/40 p-4">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Automate attendance, approval flows, and performance insights
                  to keep leadership and staff aligned.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionTitle
              eyebrow="Capabilities"
              title="Core features for every stakeholder"
              description="Modules tailored to administrators, head teachers, and classroom educators."
            />
            <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                <InfoCard
                  key={feature.title}
                  title={feature.title}
                  content={feature.content}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="bg-card py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionTitle
              eyebrow="Workflow"
              title="How it works"
              description="Launch, manage, and scale your school operations in four clear steps."
            />
            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {workflow.map((step) => (
                <InfoCard
                  key={step.title}
                  title={step.title}
                  content={step.content}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionTitle
              eyebrow="Benefits"
              title="Why schools choose our portal"
              description="Deliver transparency, accountability, and measurable results across every academic year."
            />
            <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-2">
              {benefits.map((benefit) => (
                <InfoCard
                  key={benefit.title}
                  title={benefit.title}
                  content={benefit.content}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="bg-primary py-20 text-primary-foreground">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold leading-tight">
              Ready to simplify your school management?
            </h2>
            <p className="mt-4 text-base leading-relaxed text-primary-foreground/80">
              Start using the Student Portal to centralize data, empower
              teachers, and deliver consistent academic experiences.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                to="/login"
                className="rounded-lg bg-primary-foreground px-6 py-3 text-sm font-semibold text-primary shadow-lg transition-colors hover:bg-primary-foreground/90"
              >
                Get Started Now
              </Link>
              <Link
                to="/contact"
                className="rounded-lg border border-primary-foreground px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-foreground/10"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </section>

        <section className="bg-card py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <SectionTitle
              eyebrow="Support"
              title="Frequently asked questions"
              description="Find quick answers about onboarding, assignments, and analytics."
            />
            <Accordion type="single" collapsible className="mt-12 space-y-4">
              {faqs.map((faq) => (
                <AccordionItem
                  key={faq.question}
                  value={faq.question}
                  className="rounded-2xl border border-border bg-muted/40 px-4"
                >
                  <AccordionTrigger className="text-left text-base font-semibold text-foreground">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-base leading-relaxed text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Home;
