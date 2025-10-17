import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Scores from "./pages/Scores";
import Assignments from "./pages/Assignments";
import Timetable from "./pages/Timetable";
import Announcements from "./pages/Announcements";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import TeacherLayout from "./components/TeacherLayout";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import TeacherAssignments from "./pages/teacher/TeacherAssignments";
import TeacherGrades from "./pages/teacher/TeacherGrades";
import TeacherClasses from "./pages/teacher/TeacherClasses";
import TeacherAnnouncements from "./pages/teacher/TeacherAnnouncements";
import TeacherProfile from "./pages/teacher/TeacherProfile";
import TeacherAttendance from "./pages/teacher/TeacherAttendance";
import HeadClassGradeManagement from "./pages/teacher/HeadClassGradeManagement";
import HeadClassAttendance from "./pages/teacher/HeadClassAttendance";
import HeadLayout from "./components/HeadLayout";
import HeadDashboard from "./pages/head/HeadDashboard";
import TeacherManagement from "./pages/head/TeacherManagement";
import StudentManagement from "./pages/head/StudentManagement";
import ScheduleManagement from "./pages/head/ScheduleManagement";
import AssignmentManagement from "./pages/head/AssignmentManagement";
import HeadAnnouncements from "./pages/head/HeadAnnouncements";
import HeadProfile from "./pages/head/HeadProfile";
import AdminLayout from "./components/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminStudentManagement from "./pages/admin/AdminStudentManagement";
import AdminUserManagement from "./pages/admin/AdminUserManagement";
import AdminHeadManagement from "./pages/admin/AdminHeadManagement";
import AdminRegistrationControl from "./pages/admin/AdminRegistrationControl";
import AdminProfile from "./pages/admin/AdminProfile";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AssignmentDetail from "./pages/AssignmentDetail";
import TimetableMatrix from "./pages/TimetableMatrix";
import AttendanceTracking from "./pages/AttendanceTracking";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Student Portal Routes */}
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/scores" element={<Scores />} />
              <Route path="/assignments" element={<Assignments />} />
              <Route path="/assignment/:id" element={<AssignmentDetail />} />
              <Route path="/timetable" element={<TimetableMatrix />} />
              <Route path="/attendance" element={<AttendanceTracking />} />
              <Route path="/announcements" element={<Announcements />} />
              <Route path="/profile" element={<Profile />} />
            </Route>

            {/* Teacher Portal Routes */}
            <Route path="/teacher" element={<TeacherLayout />}>
              <Route index element={<TeacherDashboard />} />
              <Route path="assignments" element={<TeacherAssignments />} />
              <Route path="grades" element={<TeacherGrades />} />
              <Route path="classes" element={<TeacherClasses />} />
              <Route path="announcements" element={<TeacherAnnouncements />} />
              <Route path="attendance" element={<TeacherAttendance />} />
              <Route
                path="head-grades"
                element={<HeadClassGradeManagement />}
              />
              <Route
                path="head-grade-management"
                element={<HeadClassGradeManagement />}
              />
              <Route path="head-attendance" element={<HeadClassAttendance />} />
              <Route path="profile" element={<TeacherProfile />} />
            </Route>

            {/* Head of School Portal Routes */}
            <Route path="/head" element={<HeadLayout />}>
              <Route index element={<HeadDashboard />} />
              <Route path="teachers" element={<TeacherManagement />} />
              <Route path="students" element={<StudentManagement />} />
              <Route path="schedules" element={<ScheduleManagement />} />
              <Route path="assignments" element={<AssignmentManagement />} />
              <Route path="announcements" element={<HeadAnnouncements />} />
              <Route path="profile" element={<HeadProfile />} />
            </Route>

            {/* Admin Portal Routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="students" element={<AdminStudentManagement />} />
              <Route path="head-management" element={<AdminHeadManagement />} />
              <Route path="users" element={<AdminUserManagement />} />
              <Route
                path="registration"
                element={<AdminRegistrationControl />}
              />
              <Route path="profile" element={<AdminProfile />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
