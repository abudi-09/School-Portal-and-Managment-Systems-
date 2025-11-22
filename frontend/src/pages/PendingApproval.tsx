import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2, Hourglass, LogIn, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const PendingApproval = () => {
  const location = useLocation() as { state?: { email?: string } };
  const navigate = useNavigate();
  const email = location.state?.email;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background relative overflow-hidden">
      {/* Background Elements matching Login/Signup */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-primary/20 via-background to-background"></div>
      <div className="absolute top-0 right-0 -z-10 h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 -z-10 h-[500px] w-[500px] rounded-full bg-secondary/20 blur-3xl"></div>

      <Card className="w-full max-w-md shadow-xl border-border/50 bg-card/95 backdrop-blur animate-in fade-in zoom-in-95 duration-300">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10">
            <Hourglass className="h-8 w-8 text-amber-500" />
          </div>
          <CardTitle className="text-2xl font-bold">Approval Pending</CardTitle>
          <CardDescription>
            Your account has been created and is awaiting administrator review.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg bg-secondary/50 p-4 text-sm text-muted-foreground border border-border/50">
            <p className="mb-2">
              We verify all new accounts to ensure the security of our school portal.
            </p>
            {email && (
              <p className="mt-3 pt-3 border-t border-border/50">
                Registered email: <span className="font-medium text-foreground block mt-1">{email}</span>
              </p>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3 text-sm text-muted-foreground">
              <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
              <p>You will receive an email notification once your account is approved.</p>
            </div>
            <div className="flex items-start gap-3 text-sm text-muted-foreground">
              <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
              <p>Typically processed within 24 hours on business days.</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <Button onClick={() => navigate("/login")} className="w-full gap-2">
              <LogIn className="h-4 w-4" /> Return to Login
            </Button>
            <Button variant="ghost" onClick={() => navigate("/")} className="w-full gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PendingApproval;
