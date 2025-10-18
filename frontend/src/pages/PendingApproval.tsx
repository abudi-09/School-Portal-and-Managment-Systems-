import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2, Hourglass, LogIn } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const PendingApproval = () => {
  const location = useLocation() as { state?: { email?: string } };
  const navigate = useNavigate();
  const email = location.state?.email;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <Card className="w-full max-w-lg shadow-2xl animate-in fade-in duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Hourglass className="h-5 w-5 text-amber-500" />
            Account Pending Approval
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            Thanks for signing up. Your account is currently awaiting approval
            by an administrator. You will be able to sign in once your account
            is approved.
          </p>
          {email && (
            <p>
              Registered email:{" "}
              <span className="font-medium text-foreground">{email}</span>
            </p>
          )}
          <ul className="list-disc pl-5 space-y-1">
            <li>You may receive an email notification after approval.</li>
            <li>If this takes longer than expected, contact your admin.</li>
          </ul>
          <div className="pt-2 flex items-center gap-2">
            <Button onClick={() => navigate("/login")}>
              <LogIn className="h-4 w-4 mr-2" /> Back to Login
            </Button>
            <Button variant="outline" onClick={() => navigate("/")}>
              Go Home
            </Button>
          </div>
          <div className="pt-4 flex items-center text-emerald-600">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            You'll be able to log in immediately after approval.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PendingApproval;
