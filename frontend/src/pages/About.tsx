import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import SectionTitle from "@/components/public/SectionTitle";
import InfoCard from "@/components/public/InfoCard";
import { usePageMetadata } from "@/hooks/usePageMetadata";

const features = [
  {
    title: "Student & Teacher Management",
    content:
      "Maintain up-to-date records, enrollment, and staff assignments with automated workflows.",
  },
  {
    title: "Head Teacher Assignment",
    content:
      "Designate leadership roles for grades and sections with transparent oversight.",
  },
  {
    title: "Class & Section Management",
    content:
      "Organize grades, sections, subjects, and schedules to keep learning on track.",
  },
  {
    title: "Grade & Performance Tracking",
    content:
      "Visualize student progress, identify trends, and inform interventions early.",
  },
];

const team = [
  {
    name: "Abduselam Mohammednur",
    role: "Product Strategist",
    focus:
      "Leads product vision, aligns stakeholder goals, and ensures measurable school outcomes.",
  },
  {
    name: "Abdurahman Sualih",
    role: "Lead Frontend Engineer",
    focus:
      "Designs user flows, interface systems, and accessibility guardrails for every role.",
  },
  {
    name: "Abuzer Jemal",
    role: "Backend & API Engineer",
    focus:
      "Builds secure APIs, data pipelines, and integrations that power real-time insights.",
  },
  {
    name: "Abyalew Lobe",
    role: "Data & Analytics Specialist",
    focus: "Shapes analytics engines, reporting, and intervention triggers.",
  },
  {
    name: "Biniyam Biyadge",
    role: "UX Researcher",
    focus:
      "Leads discovery sessions, field tests, and ongoing usability benchmarking.",
  },
];

const milestones = [
  {
    phase: "Concept & Research",
    period: "Q1 2024",
    description:
      "Identified school workflow challenges and gathered insights from administrators.",
  },
  {
    phase: "Development",
    period: "Q2 - Q3 2024",
    description:
      "Implemented portal foundations, authentication, and role-based dashboards.",
  },
  {
    phase: "Testing & Iteration",
    period: "Q4 2024",
    description:
      "Conducted usability studies with teachers and refined scheduling, analytics, and approvals.",
  },
  {
    phase: "Launch & Adoption",
    period: "Q1 2025",
    description:
      "Rolled out to partner schools with onboarding, training, and support playbooks.",
  },
];

const techStack = [
  "React",
  "Next.js",
  "Tailwind CSS",
  "Node.js",
  "Express",
  "MongoDB",
  "TypeScript",
  "Cloudinary",
];

const impacts = [
  {
    title: "360° performance visibility",
    content:
      "Monitor Grade 11 Natural Science Section B with real-time averages, rankings, and intervention alerts.",
  },
  {
    title: "Coordinated leadership",
    content:
      "Schedule head teacher rotations across semesters with automated reminders, approvals, and handover notes.",
  },
  {
    title: "Proactive attendance insights",
    content:
      "Track attendance patterns, spot engagement dips early, and inform counselors to act quickly.",
  },
  {
    title: "Frictionless reporting",
    content:
      "Generate school-wide reports for parent conferences, board reviews, and accreditation in minutes.",
  },
];

const About = () => {
  usePageMetadata({
    title: "Student Portal | About",
    description:
      "Learn about the mission, vision, and team behind the student portal for high schools.",
    keywords: [
      "about student portal",
      "education technology team",
      "school management mission",
      "portal timeline",
    ],
  });

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-blue-50 to-white">
      <Navbar />

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="space-y-20">
            {/* Introduction */}
            <SectionTitle
              title="About Our System"
              description="The Student Portal centralizes academic and administrative workflows for high schools, blending automation with actionable insights."
            >
              <div className="mt-8 grid gap-6 md:grid-cols-2">
                <InfoCard
                  title="Our Mission"
                  content="Enhance transparency, reduce manual work, and connect students, teachers, and administrators through efficient digital tools."
                  className="bg-white"
                />
                <InfoCard
                  title="Our Vision"
                  content="Create a future-ready digital school system that makes education management seamless and data-informed."
                  className="bg-white"
                />
              </div>
            </SectionTitle>

            {/* Features Overview */}
            <div>
              <SectionTitle
                eyebrow="Features"
                title="What the portal delivers"
                description="Purpose-built modules tailored to school leadership, teachers, students, and guardians."
              />
              <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {features.map((feature) => (
                  <InfoCard
                    key={feature.title}
                    title={feature.title}
                    content={feature.content}
                    className="h-full border-blue-100 bg-blue-50/40"
                  />
                ))}
              </div>
            </div>

            {/* Impact */}
            <div>
              <SectionTitle
                eyebrow="Impact"
                title="How schools leverage the portal"
                description="Real examples demonstrating daily value across academics and administration."
              />
              <div className="mt-12 grid gap-6 lg:grid-cols-2">
                {impacts.map((impact) => (
                  <InfoCard
                    key={impact.title}
                    title={impact.title}
                    content={impact.content}
                    className="h-full border-blue-100 bg-blue-50/40"
                  />
                ))}
              </div>
            </div>

            {/* Removed: Team, Project Timeline and Tech Stack sections as requested */}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;
