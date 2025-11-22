import { Link } from "react-router-dom";
import { ArrowLeft, Target, Lightbulb, CheckCircle2, Zap, Users, BarChart, ShieldCheck } from "lucide-react";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import { usePageMetadata } from "@/hooks/usePageMetadata";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    title: "Student & Teacher Management",
    content: "Maintain up-to-date records, enrollment, and staff assignments with automated workflows.",
    icon: Users,
  },
  {
    title: "Head Teacher Assignment",
    content: "Designate leadership roles for grades and sections with transparent oversight.",
    icon: ShieldCheck,
  },
  {
    title: "Class & Section Management",
    content: "Organize grades, sections, subjects, and schedules to keep learning on track.",
    icon: Target,
  },
  {
    title: "Grade & Performance Tracking",
    content: "Visualize student progress, identify trends, and inform interventions early.",
    icon: BarChart,
  },
];

const impacts = [
  {
    title: "360° Performance Visibility",
    content: "Monitor Grade 11 Natural Science Section B with real-time averages, rankings, and intervention alerts.",
  },
  {
    title: "Coordinated Leadership",
    content: "Schedule head teacher rotations across semesters with automated reminders, approvals, and handover notes.",
  },
  {
    title: "Proactive Attendance Insights",
    content: "Track attendance patterns, spot engagement dips early, and inform counselors to act quickly.",
  },
  {
    title: "Frictionless Reporting",
    content: "Generate school-wide reports for parent conferences, board reviews, and accreditation in minutes.",
  },
];

const About = () => {
  usePageMetadata({
    title: "About Pathways | Transforming Education",
    description: "Learn about the mission, vision, and capabilities of the Pathways student portal.",
  });

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-primary/20">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 lg:py-32 overflow-hidden bg-muted/30">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background"></div>
          
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <div className="mb-8 flex justify-center">
              <Link to="/">
                <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="h-4 w-4" /> Back to Home
                </Button>
              </Link>
            </div>
            
            <Badge variant="outline" className="mb-6 px-4 py-1.5 text-sm font-medium rounded-full border-primary/20 bg-primary/5 text-primary">
              Our Story
            </Badge>
            
            <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight text-foreground sm:text-6xl mb-6">
              Empowering schools with <span className="text-primary">intelligent tools</span>
            </h1>
            
            <p className="mx-auto max-w-2xl text-lg leading-8 text-muted-foreground">
              The Pathways Student Portal centralizes academic and administrative workflows for high schools, blending automation with actionable insights to create a better learning environment.
            </p>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 md:grid-cols-2">
              <Card className="bg-primary/5 border-primary/10">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Target className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">Our Mission</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Enhance transparency, reduce manual work, and connect students, teachers, and administrators through efficient digital tools that make education management effortless.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-blue-500/5 border-blue-500/10">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
                    <Lightbulb className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-2xl">Our Vision</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Create a future-ready digital school system that makes education management seamless, data-informed, and focused on what matters most: student success.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">What the portal delivers</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Purpose-built modules tailored to school leadership, teachers, students, and guardians.
              </p>
            </div>
            
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                <Card key={feature.title} className="hover:shadow-md transition-all hover:-translate-y-1 border-border/50">
                  <CardHeader>
                    <div className="w-10 h-10 rounded-lg bg-background border shadow-sm flex items-center justify-center mb-3">
                      <feature.icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.content}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Impact Section */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">Real World Impact</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                How schools are leveraging Pathways to improve daily operations.
              </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
              {impacts.map((impact) => (
                <div key={impact.title} className="flex gap-4 p-6 rounded-2xl bg-card border border-border/50 shadow-sm">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{impact.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{impact.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 border-t bg-muted/10">
          <div className="mx-auto max-w-4xl text-center px-4">
            <h2 className="text-3xl font-bold mb-6">Ready to modernize your school?</h2>
            <div className="flex justify-center gap-4">
              <Link to="/contact">
                <Button size="lg" className="px-8">Contact Us</Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg" className="px-8">Sign In</Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;
