import User, { IUser } from "../models/User";

export class StudentService {
  /**
   * Generate a unique student ID following the pattern STD-<YEAR>-<###>
   */
  static async generateStudentId(): Promise<string> {
    const currentYear = new Date().getFullYear();
    const prefix = `STD-${currentYear}`;

    const lastStudent = await User.findOne({
      role: "student",
      studentId: { $regex: `^${prefix}-\\d{3}$` },
    })
      .sort({ studentId: -1 })
      .select("studentId")
      .lean();

    let sequence = 1;
    if (lastStudent?.studentId) {
      const match = lastStudent.studentId.match(/-(\d{3})$/);
      if (match?.[1]) {
        sequence = parseInt(match[1], 10) + 1;
      }
    }

    return `${prefix}-${sequence.toString().padStart(3, "0")}`;
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
}
