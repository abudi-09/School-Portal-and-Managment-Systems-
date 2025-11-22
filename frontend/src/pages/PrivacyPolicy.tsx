import { Link } from "react-router-dom";
import { ArrowLeft, Shield, Lock, FileText, Eye, Cookie, Server } from "lucide-react";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import { usePageMetadata } from "@/hooks/usePageMetadata";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const corePolicies = [
  {
    title: "Information Collection",
    icon: FileText,
    content:
      "We collect student, teacher, guardian, and class data including names, contact details, academic records, assignments, and activity logs to provide personalized services.",
  },
  {
    title: "Data Usage",
    icon: Server,
    content:
      "Collected information powers school management features such as enrollment tracking, grade reporting, scheduling, complaint handling, and analytics dashboards.",
  },
  {
    title: "Data Protection",
    icon: Lock,
    content:
      "We apply encryption in transit and at rest, enforce role-based access controls, and maintain audit logs to detect unusual activities.",
  },
  {
    title: "User Rights",
    icon: Shield,
    content:
      "Students, teachers, heads, and administrators may request copies of their data, corrections, or deletion by contacting the system administrator or privacy officer.",
  },
];

const extendedPolicies = [
  {
    title: "Cookies & Tracking",
    icon: Cookie,
    content:
      "The portal uses session cookies to maintain secure logins, remember role-based preferences, and capture anonymized analytics to improve usability. You can disable non-essential cookies in your browser settings.",
  },
  {
    title: "Third-Party Services",
    icon: Eye,
    content:
      "We may integrate cloud storage providers, messaging gateways, analytics services, or ministry-approved APIs. Partner services must comply with educational data regulations and contractual confidentiality agreements.",
  },
];

const PrivacyPolicy = () => {
  usePageMetadata({
    title: "Privacy Policy | Pathways",
    description: "Understand how the student portal collects, uses, and protects user information.",
  });

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-primary/20">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 lg:py-28 overflow-hidden bg-muted/30">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-primary/10 via-background to-background"></div>
          
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
            <Badge variant="outline" className="mb-6 px-4 py-1.5 text-sm font-medium rounded-full border-primary/20 bg-primary/5 text-primary">
              Last Updated: October 2025
            </Badge>
            
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl mb-6">
              Privacy & <span className="text-primary">Policy</span>
            </h1>
            
            <p className="text-lg leading-8 text-muted-foreground">
              We protect every learner’s data while supporting operational excellence for schools and administrators. Transparency is our core value.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 -mt-12 relative z-10">
          <div className="grid gap-6 md:grid-cols-2">
            {corePolicies.map((section) => (
              <Card key={section.title} className="border-border/50 shadow-lg bg-card/95 backdrop-blur hover:shadow-xl transition-all duration-300">
                <CardHeader>
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3 text-primary">
                    <section.icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-xl">{section.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {section.content}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-20">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold tracking-tight mb-4">Extended Policies</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Additional details regarding technical implementation and third-party integrations.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {extendedPolicies.map((policy) => (
                <Card key={policy.title} className="border-border/50 shadow-sm">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <policy.icon className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">{policy.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {policy.content}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="mt-20 bg-primary/5 rounded-2xl p-8 border border-primary/10 text-center">
            <h3 className="text-2xl font-bold mb-4">Have questions about your data?</h3>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Our privacy team is available to answer any questions regarding data access requests, corrections, or general inquiries.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/contact">
                <Button size="lg" className="gap-2">
                  Contact Support
                </Button>
              </Link>
              <a href="mailto:privacy@pathways.edu.et">
                <Button variant="outline" size="lg" className="gap-2">
                  Email Privacy Team
                </Button>
              </a>
            </div>
          </div>

          <div className="mt-12 flex justify-center">
            <Link to="/">
              <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" /> Back to Home
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
