import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/useAuth";
import { getAuthToken } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertCircle, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Simple gate: require teacher role AND HeadClass:* responsibility
export default function HeadAllSubjects() {
  const { user } = useAuth();
  const { toast } = useToast();
  const apiBaseUrl =
    import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";

  const headClassIds = useMemo(() => {
    const entries = (user?.responsibilities ?? []).filter((r) =>
      r.startsWith("HeadClass:")
    );
    return entries.map((r) => r.replace(/^HeadClass:/, "").toLowerCase());
  }, [user?.responsibilities]);

  const [classes, setClasses] = useState<
    Array<{ classId: string; grade: string; section: string; name: string }>
  >([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    // If not authorized by responsibility, show a gentle info toast
    if (!user || user.role !== "teacher" || headClassIds.length === 0) {
      toast({
        title: "Access limited",
        description:
          "This page is only available to teachers assigned as Head Class Teacher.",
      });
    }
  }, [user, headClassIds, toast]);

  useEffect(() => {
    // Load classes and filter by head responsibilities
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (token) headers.Authorization = `Bearer ${token}`;
        const res = await fetch(`${apiBaseUrl}/api/classes`, { headers });
        const payload = await res.json().catch(() => ({}));
        if (res.ok && payload?.success) {
          type ApiClass = {
            classId: string;
            grade: string;
            section: string;
            name: string;
          };
          const list: Array<{
            classId: string;
            grade: string;
            section: string;
            name: string;
          }> = (payload.data?.classes ?? []).map((c: ApiClass) => ({
            classId: c.classId,
            grade: c.grade,
            section: c.section,
            name: c.name,
          }));
          setClasses(list.filter((c) => headClassIds.includes(c.classId)));
          if (list.length > 0 && !selectedClassId) {
            const first = list.find((c) => headClassIds.includes(c.classId));
            if (first) setSelectedClassId(first.classId);
          }
        }
      } catch (e) {
        console.error("Failed to load classes for All Subjects", e);
      }
    })();
  }, [apiBaseUrl, headClassIds, selectedClassId]);

  useEffect(() => {
    // Load subjects for selected class's grade from Courses
    (async () => {
      if (!selectedClassId) return;
      const selected = classes.find((c) => c.classId === selectedClassId);
      if (!selected) return;
      try {
        const token = getAuthToken();
        // If there's no auth token, don't call admin endpoints — they'll return 403.
        if (!token) {
          setSubjects([]);
          return;
        }
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        };
        const res = await fetch(
          `${apiBaseUrl}/api/admin/courses?grade=${selected.grade}`,
          { headers }
        );
        const payload = await res.json().catch(() => ({}));
        if (res.ok && payload?.success) {
          type ApiCourse = { name: string };
          setSubjects(
            (payload.data?.courses ?? []).map((c: ApiCourse) => c.name)
          );
        } else {
          setSubjects([]);
        }
      } catch (e) {
        console.error("Failed to load subjects for class", e);
      }
    })();
  }, [selectedClassId, classes, apiBaseUrl]);

  const filteredSubjects = subjects.filter((s) =>
    search ? s.toLowerCase().includes(search.toLowerCase()) : true
  );

  const selected = classes.find((c) => c.classId === selectedClassId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">All Subjects</h1>
          <p className="text-muted-foreground">
            Overview for your head classes to manage totals, averages, and
            rankings.
          </p>
        </div>
        <Badge variant="secondary" className="gap-2">
          <BookOpen className="h-4 w-4" /> Head View
        </Badge>
      </div>

      {headClassIds.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex gap-2 items-center">
              <AlertCircle className="h-5 w-5 text-amber-500" /> No head classes
            </CardTitle>
            <CardDescription>
              Once you are assigned as a Head Class Teacher, your classes will
              appear here.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Class selector</CardTitle>
            <CardDescription>
              Choose one of your head classes to see its subjects
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-sm mb-1 block">Class</label>
                <Select
                  value={selectedClassId ?? undefined}
                  onValueChange={(v) => setSelectedClassId(v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c.classId} value={c.classId}>
                        Class {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm mb-1 block">Search subject</label>
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Type subject name..."
                />
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubjects.map((subj) => (
                  <TableRow key={subj}>
                    <TableCell className="font-medium">{subj}</TableCell>
                    <TableCell className="space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          toast({
                            title: "Totals",
                            description: `Open totals for ${selected?.name} - ${subj}`,
                          })
                        }
                      >
                        Totals
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          toast({
                            title: "Averages",
                            description: `Open averages for ${selected?.name} - ${subj}`,
                          })
                        }
                      >
                        Averages
                      </Button>
                      <Button
                        size="sm"
                        onClick={() =>
                          toast({
                            title: "Ranking",
                            description: `Open ranking for ${selected?.name} - ${subj}`,
                          })
                        }
                      >
                        Ranking
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredSubjects.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-muted-foreground">
                      No subjects found for this class
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
