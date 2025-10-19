import User, { IUser } from "../models/User";

export class StudentService {
  /**
   * Generate a unique student ID following the pattern STU-<YEAR>-<####>
   */
  static async generateStudentId(): Promise<string> {
    const currentYear = new Date().getFullYear();
    const prefix = `STU-${currentYear}`;

    const lastStudent = await User.findOne({
      role: "student",
      studentId: { $regex: `^${prefix}-\\d{4}$` },
    })
      .sort({ studentId: -1 })
      .select("studentId")
      .lean();

    let sequence = 1;
    if (lastStudent?.studentId) {
      const match = lastStudent.studentId.match(/-(\d{4})$/);
      if (match?.[1]) {
        sequence = parseInt(match[1], 10) + 1;
      }
    }

    return `${prefix}-${sequence.toString().padStart(4, "0")}`;
  }

  /**
   * Create a new student user with generated student ID and approved status
   */
  static async createStudent(payload: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    profile?: IUser["profile"];
    academicInfo?: IUser["academicInfo"];
  }) {
    const existingUser = await User.findOne({ email: payload.email });
    if (existingUser) {
      throw new Error("A user with this email already exists");
    }

    const studentId = await this.generateStudentId();

    const student = new User({
      ...payload,
      email: payload.email.toLowerCase(),
      role: "student",
      status: "approved",
      isActive: true,
      studentId,
    });

    await student.save();

    return student.toJSON();
  }

  static async getStudents(options: {
    page?: number;
    limit?: number;
    search?: string;
    status?: "active" | "inactive";
  }) {
    const page = options.page ?? 1;
    const limit = options.limit ?? 10;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = { role: "student" };

    if (options.status) {
      filter.isActive = options.status === "active";
    }

    if (options.search) {
      const searchRegex = new RegExp(options.search, "i");
      filter.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { studentId: searchRegex },
      ];
    }

    const [students, total] = await Promise.all([
      User.find(filter)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    return {
      students,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  static async updateStudent(
    id: string,
    payload: Partial<{
      firstName: string;
      lastName: string;
      email: string;
      profile: IUser["profile"];
      academicInfo: IUser["academicInfo"];
      isActive: boolean;
    }>
  ) {
    const student = await User.findOne({ _id: id, role: "student" });
    if (!student) throw new Error("Student not found");

    if (payload.email) {
      const emailLower = payload.email.toLowerCase();
      if (emailLower !== student.email) {
        const exists = await User.findOne({ email: emailLower });
        if (exists) throw new Error("A user with this email already exists");
        student.email = emailLower;
      }
    }

    if (payload.firstName !== undefined) student.firstName = payload.firstName;
    if (payload.lastName !== undefined) student.lastName = payload.lastName;
    if (payload.profile !== undefined) student.profile = payload.profile;
    if (payload.academicInfo !== undefined)
      student.academicInfo = payload.academicInfo;
    if (payload.isActive !== undefined) student.isActive = payload.isActive;

    await student.save();
    return student.toJSON();
  }

  static async setActive(id: string, active: boolean) {
    const student = await User.findOne({ _id: id, role: "student" });
    if (!student) throw new Error("Student not found");
    student.isActive = active;
    await student.save();
    return student.toJSON();
  }

  static async resetPassword(id: string, newPassword: string) {
    const student = await User.findOne({ _id: id, role: "student" });
    if (!student) throw new Error("Student not found");
    student.password = newPassword; // will be hashed by pre-save hook
    await student.save();
    return { _id: student._id };
  }
}
