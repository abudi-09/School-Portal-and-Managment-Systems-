import { Link } from "react-router-dom";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import { usePageMetadata } from "@/hooks/usePageMetadata";
import {
  ArrowRight,
  CheckCircle2,
  BarChart3,
  Users,
  Calendar,
  Shield,
  Zap,
  GraduationCap,
  LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const Home = () => {
  usePageMetadata({
    title: "Pathways | Modern School Management",
    description: "Professional school management system to organize students, teachers, classes, and analytics across your institution.",
  });

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-primary/20">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background opacity-50"></div>
          <div className="absolute top-0 right-0 -z-10 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl opacity-30 animate-pulse"></div>
          <div className="absolute bottom-0 left-0 -z-10 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl opacity-30 animate-pulse delay-700"></div>

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <Badge variant="outline" className="mb-6 px-4 py-1.5 text-sm font-medium rounded-full border-primary/20 bg-primary/5 text-primary animate-in fade-in slide-in-from-bottom-4 duration-500">
              ✨ Reimagining Education Management
            </Badge>
            
            <h1 className="mx-auto max-w-4xl text-5xl font-bold tracking-tight text-foreground sm:text-7xl animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
              Manage your school with <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">confidence</span>
            </h1>
            
            <p className="mx-auto mt-8 max-w-2xl text-lg leading-8 text-muted-foreground animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
              A comprehensive platform for students, teachers, and administrators. Streamline attendance, grades, and communication in one beautiful interface.
            </p>
            
            <div className="mt-10 flex items-center justify-center gap-x-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
              <Link to="/login">
                <Button size="lg" className="h-12 px-8 text-base shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all hover:scale-105">
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/about">
                <Button variant="outline" size="lg" className="h-12 px-8 text-base hover:bg-accent hover:text-accent-foreground transition-all">
                  Learn more
                </Button>
              </Link>
            </div>

            {/* Hero Image / Dashboard Preview */}
            <div className="mt-20 relative mx-auto max-w-5xl rounded-2xl border border-border/50 bg-background/50 p-2 shadow-2xl backdrop-blur-sm animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500">
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10"></div>
              <div className="rounded-xl overflow-hidden border border-border/50 bg-card aspect-[16/9] relative group">
                 {/* Placeholder for a dashboard screenshot - using a constructed UI representation */}
                 <div className="absolute inset-0 bg-muted/10 flex flex-col">
                    <div className="h-12 border-b flex items-center px-4 gap-2 bg-card/50">
                       <div className="w-3 h-3 rounded-full bg-red-400/80"></div>
                       <div className="w-3 h-3 rounded-full bg-yellow-400/80"></div>
                       <div className="w-3 h-3 rounded-full bg-green-400/80"></div>
                    </div>
                    <div className="flex-1 p-6 grid grid-cols-4 gap-6">
                       <div className="col-span-1 space-y-4">
                          <div className="h-8 w-3/4 bg-muted rounded animate-pulse"></div>
                          <div className="h-4 w-1/2 bg-muted/50 rounded animate-pulse"></div>
                          <div className="h-32 w-full bg-muted/30 rounded-lg animate-pulse"></div>
                          <div className="h-32 w-full bg-muted/30 rounded-lg animate-pulse"></div>
                       </div>
                       <div className="col-span-3 space-y-6">
                          <div className="grid grid-cols-3 gap-4">
                             <div className="h-24 bg-primary/5 border border-primary/10 rounded-xl"></div>
                             <div className="h-24 bg-primary/5 border border-primary/10 rounded-xl"></div>
                             <div className="h-24 bg-primary/5 border border-primary/10 rounded-xl"></div>
                          </div>
                          <div className="h-64 bg-card border border-border/50 rounded-xl shadow-sm"></div>
                       </div>
                    </div>
                 </div>
                 <div className="absolute inset-0 flex items-center justify-center z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-background/10 backdrop-blur-[2px]">
                    <span className="px-4 py-2 bg-background/80 backdrop-blur rounded-full text-sm font-medium shadow-lg border">Interactive Dashboard Preview</span>
                 </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-24 sm:py-32 bg-muted/30">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-base font-semibold leading-7 text-primary">Everything you need</h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Powerful features for modern education
              </p>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">
                Empower your institution with tools designed to enhance learning, streamline administration, and foster communication.
              </p>
            </div>
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
                {[
                  {
                    name: 'Student Management',
                    description: 'Comprehensive profiles, enrollment tracking, and academic history in one secure place.',
                    icon: Users,
                  },
                  {
                    name: 'Academic Analytics',
                    description: 'Real-time insights into student performance, attendance trends, and grade distributions.',
                    icon: BarChart3,
                  },
                  {
                    name: 'Class Scheduling',
                    description: 'Smart timetable management for teachers, classes, and exam schedules.',
                    icon: Calendar,
                  },
                  {
                    name: 'Secure Portal',
                    description: 'Role-based access control ensuring data privacy for students, teachers, and staff.',
                    icon: Shield,
                  },
                  {
                    name: 'Teacher Tools',
                    description: 'Gradebooks, attendance taking, and lesson planning tools built for educators.',
                    icon: GraduationCap,
                  },
                  {
                    name: 'Real-time Updates',
                    description: 'Instant notifications for announcements, grades, and important school events.',
                    icon: Zap,
                  },
                ].map((feature) => (
                  <div key={feature.name} className="flex flex-col bg-card p-8 rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                    <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-foreground">
                      <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <feature.icon className="h-6 w-6" aria-hidden="true" />
                      </div>
                      {feature.name}
                    </dt>
                    <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-muted-foreground">
                      <p className="flex-auto">{feature.description}</p>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        {/* Workflow Section */}
        <section className="py-24 sm:py-32 relative overflow-hidden">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
              <h2 className="text-base font-semibold leading-7 text-primary">Workflow</h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Simple, efficient, and effective
              </p>
            </div>
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
                {[
                  { title: "Setup", desc: "Admin configures school profile, classes, and subjects." },
                  { title: "Onboard", desc: "Register students and assign teachers to classes." },
                  { title: "Manage", desc: "Track attendance, grades, and daily activities." },
                  { title: "Analyze", desc: "Generate reports and view performance insights." },
                ].map((step, idx) => (
                  <div key={step.title} className="relative flex flex-col items-center text-center p-6">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold shadow-lg mb-6 z-10 relative">
                      {idx + 1}
                    </div>
                    {idx < 3 && (
                      <div className="hidden lg:block absolute top-14 left-1/2 w-full h-0.5 bg-border -z-0"></div>
                    )}
                    <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                    <p className="text-muted-foreground">{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative isolate mt-12 px-6 py-24 sm:mt-20 sm:py-32 lg:px-8">
          <div className="absolute inset-0 -z-10 bg-primary overflow-hidden">
            <div className="absolute -top-[50%] -left-[20%] w-[1000px] h-[1000px] bg-white/5 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-[50%] -right-[20%] w-[1000px] h-[1000px] bg-white/5 rounded-full blur-3xl"></div>
          </div>
          <div className="mx-auto max-w-2xl text-center relative z-10">
            <h2 className="text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
              Ready to transform your school?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-primary-foreground/80">
              Join hundreds of schools using Pathways to deliver better education management today.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link to="/login">
                <Button size="lg" variant="secondary" className="h-12 px-8 text-base font-semibold shadow-lg">
                  Get started
                </Button>
              </Link>
              <Link to="/contact">
                <Button variant="outline" size="lg" className="h-12 px-8 text-base bg-transparent text-primary-foreground border-primary-foreground/30 hover:bg-primary-foreground/10 hover:text-primary-foreground">
                  Contact sales
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Home;
