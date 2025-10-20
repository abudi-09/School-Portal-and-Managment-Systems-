import crypto from "crypto";
import User, { IUser } from "../models/User";
import Counter from "../models/Counter";

export class StudentService {
  /**
   * Generate a unique student ID following the pattern STU-<YEAR>-<####>
   */
  static async generateStudentId(): Promise<string> {
    const currentYear = new Date().getFullYear();
    const key = `studentId:${currentYear}`;
    // Atomic increment per year
    const counter = await Counter.findOneAndUpdate(
      { key },
      { $inc: { seq: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();
    const seq = Math.max(1, counter?.seq ?? 1);
    return `STU-${currentYear}-${seq.toString().padStart(4, "0")}`;
  }

  /**
   * Create a new student user with generated student ID and approved status
   */
  static generateTemporaryPassword(length = 10): string {
    const lower = "abcdefghijklmnopqrstuvwxyz";
    const upper = lower.toUpperCase();
    const digits = "0123456789";
    const symbols = "!@#$%^&*";
    const all = lower + upper + digits + symbols;

    const pick = (source: string) =>
      source.charAt(crypto.randomInt(0, source.length));

    const required: string[] = [
      pick(lower),
      pick(upper),
      pick(digits),
      pick(symbols),
    ];
    const remainingLength = Math.max(length, required.length) - required.length;

    const remaining: string[] = Array.from({ length: remainingLength }, () =>
      pick(all)
    );
    const passwordChars: string[] = [...required, ...remaining];

    // Fisher-Yates shuffle to avoid predictable positions
    for (let i = passwordChars.length - 1; i > 0; i--) {
      const j = crypto.randomInt(0, i + 1);
      const current = passwordChars[i];
      const swapWith = passwordChars[j];

      if (current === undefined || swapWith === undefined) {
        continue;
      }

      passwordChars[i] = swapWith;
      passwordChars[j] = current;
    }

    return passwordChars.join("");
  }

  static async createStudent(payload: {
    firstName: string;
    lastName: string;
    email: string;
    profile?: IUser["profile"];
    academicInfo?: IUser["academicInfo"];
  }) {
    const normalizedEmail = payload.email.toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      throw new Error("A user with this email already exists");
    }
    const temporaryPassword = this.generateTemporaryPassword();

    // Retry loop to handle rare duplicate studentId collisions
    const maxRetries = 5;
    let attempts = 0;
    let student: IUser | null = null;
    let studentId = "";
    // eslint-disable-next-line no-constant-condition
    while (attempts < maxRetries) {
      attempts += 1;
      studentId = await this.generateStudentId();
      try {
        student = new User({
          ...payload,
          email: normalizedEmail,
          role: "student",
          status: "approved",
          isActive: true,
          studentId,
          password: temporaryPassword,
        }) as unknown as IUser;
        await (student as any).save();
        break; // success
      } catch (err: any) {
        const isDupKey =
          err?.code === 11000 &&
          (err?.keyPattern?.studentId || err?.keyValue?.studentId);
        if (isDupKey && attempts < maxRetries) {
          // try again with a new generated id
          continue;
        }
        throw err;
      }
    }

    if (!student) {
      throw new Error("Unable to create student after multiple attempts");
    }

    const studentData = (student as any).toJSON();
    return {
      student: studentData,
      credentials: {
        studentId,
        temporaryPassword,
      },
    };
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

  static async resetPassword(id: string) {
    const student = await User.findOne({ _id: id, role: "student" });
    if (!student) throw new Error("Student not found");
    const temporaryPassword = this.generateTemporaryPassword();
    student.password = temporaryPassword; // will be hashed by pre-save hook
    await student.save();

    const studentData = student.toJSON();
    const studentIdentifier =
      student.studentId ?? student._id?.toString?.() ?? "";

    return {
      student: studentData,
      credentials: {
        studentId: studentIdentifier,
        temporaryPassword,
      },
    };
  }

  static async deleteStudent(id: string) {
    const student = await User.findOne({ _id: id, role: "student" });
    if (!student) throw new Error("Student not found");

    student.isActive = false;
    student.status = "deactivated";
    await student.save();

    return student.toJSON();
  }
}
