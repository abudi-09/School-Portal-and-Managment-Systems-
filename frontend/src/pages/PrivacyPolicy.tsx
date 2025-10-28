import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import SectionTitle from "@/components/public/SectionTitle";
import { usePageMetadata } from "@/hooks/usePageMetadata";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const corePolicies = [
  {
    title: "Information Collection",
    content:
      "We collect student, teacher, guardian, and class data including names, contact details, academic records, assignments, and activity logs to provide personalized services.",
  },
  {
    title: "Data Usage",
    content:
      "Collected information powers school management features such as enrollment tracking, grade reporting, scheduling, complaint handling, and analytics dashboards.",
  },
  {
    title: "Data Protection",
    content:
      "We apply encryption in transit and at rest, enforce role-based access controls, and maintain audit logs to detect unusual activities.",
  },
  {
    title: "User Rights",
    content:
      "Students, teachers, heads, and administrators may request copies of their data, corrections, or deletion by contacting the system administrator or privacy officer.",
  },
  {
    title: "Policy Updates",
    content:
      "Any changes to this policy will be communicated through the portal dashboard, email notifications, and release notes prior to taking effect.",
  },
];

const extendedPolicies = [
  {
    title: "Cookies & Tracking",
    content:
      "The portal uses session cookies to maintain secure logins, remember role-based preferences, and capture anonymized analytics to improve usability. You can disable non-essential cookies in your browser settings.",
  },
  {
    title: "Third-Party Services",
    content:
      "We may integrate cloud storage providers, messaging gateways, analytics services, or ministry-approved APIs. Partner services must comply with educational data regulations and contractual confidentiality agreements.",
  },
];

const PrivacyPolicy = () => {
  usePageMetadata({
    title: "Student Portal | Privacy & Policy",
    description:
      "Understand how the student portal collects, uses, and protects user information.",
    keywords: [
      "student portal privacy",
      "school data protection",
      "education compliance",
      "cookies policy",
    ],
  });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        <section className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
          <SectionTitle
            title="Privacy & Policy"
            description="We protect every learner’s data while supporting operational excellence for schools and administrators."
          >
            <p className="text-sm font-medium uppercase tracking-wide text-primary">
              Last Updated: October 2025
            </p>
          </SectionTitle>

          <div className="mt-12 space-y-8">
            {corePolicies.map((section) => (
              <Card key={section.title} className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl text-primary">
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground sm:text-base">
                    {section.content}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <SectionTitle
            className="mt-20"
            eyebrow="Extended Policies"
            title="Additional information"
            description="Transparency about cookies, tracking, and partner services."
            align="left"
          />

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            {extendedPolicies.map((policy) => (
              <Card key={policy.title} className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-foreground">
                    {policy.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {policy.content}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <SectionTitle
            className="mt-20"
            eyebrow="Support"
            title="Contact for privacy inquiries"
            description="Reach our privacy team with questions, data requests, or feedback on this policy."
            align="left"
          />

          <Card className="mt-12 border-border shadow-sm">
            <CardContent className="space-y-4 p-6 sm:p-8">
              <p className="text-sm text-muted-foreground">
                Email us at
                <a
                  href="mailto:privacy@schoolportal.com"
                  className="ml-2 font-medium text-primary hover:underline"
                >
                  privacy@schoolportal.com
                </a>
                for privacy concerns, data access requests, or clarifications
                about this policy.
              </p>
              <p className="text-sm text-muted-foreground">
                Prefer a form? Submit details through our
                <Link
                  to="/contact"
                  className="ml-1 font-medium text-primary hover:underline"
                >
                  contact page
                </Link>
                and select "Privacy & Compliance" as the inquiry type.
              </p>
            </CardContent>
          </Card>

          <div className="mt-16 flex flex-col gap-3 sm:flex-row sm:justify-start">
            <Link
              to="/"
              className="inline-flex items-center gap-2 justify-center rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground shadow-sm border border-border/40 hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <ArrowLeft className="h-4 w-4" />
              Home
            </Link>
            <Link
              to="/about"
              className="inline-flex items-center justify-center rounded-full border border-primary/60 px-6 py-3 text-sm font-semibold text-primary transition hover:bg-primary/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Learn About the Portal
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
