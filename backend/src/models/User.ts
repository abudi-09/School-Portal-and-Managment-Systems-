import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";

export type UserRole = "admin" | "head" | "teacher" | "student";
export type UserStatus = "pending" | "approved" | "deactivated" | "rejected";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  password: string;
  studentId?: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  isApproved: boolean;
  isActive: boolean;
  profile: {
    phone?: string;
    address?: string;
    dateOfBirth?: Date;
    gender?: "male" | "female" | "other";
    avatar?: string;
  };
  academicInfo?: {
    studentId?: string;
    class?: string;
    section?: string;
    grade?: string;
    subjects?: string[];
  };
  employmentInfo?: {
    employeeId?: string;
    department?: string;
    position?: string;
    joinDate?: Date;
    responsibilities?: string;
  };
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
    },
    studentId: {
      type: String,
      unique: true,
      sparse: true,
    },
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      maxlength: [50, "First name cannot exceed 50 characters"],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      maxlength: [50, "Last name cannot exceed 50 characters"],
    },
    role: {
      type: String,
      enum: ["admin", "head", "teacher", "student"],
      required: [true, "Role is required"],
    },
    status: {
      type: String,
      enum: ["pending", "approved", "deactivated", "rejected"],
      required: true,
      default: function (this: IUser) {
        return this.role === "admin" ? "approved" : "pending";
      },
    },
    isApproved: {
      type: Boolean,
      default: function (this: IUser) {
        return this.role === "admin";
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    profile: {
      phone: {
        type: String,
        match: [/^\+?[\d\s\-\(\)]+$/, "Please enter a valid phone number"],
      },
      address: String,
      dateOfBirth: Date,
      gender: {
        type: String,
        enum: ["male", "female", "other"],
      },
      avatar: String,
    },
    academicInfo: {
      studentId: String,
      class: String,
      section: String,
      grade: String,
      subjects: [String],
    },
    employmentInfo: {
      employeeId: String,
      department: String,
      position: String,
      joinDate: Date,
      responsibilities: String,
    },
    lastLogin: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for full name
userSchema.virtual("fullName").get(function (this: IUser) {
  return `${this.firstName} ${this.lastName}`;
});

// Index for better query performance
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });
userSchema.index({ "academicInfo.studentId": 1 });
userSchema.index({ "employmentInfo.employeeId": 1 });

// Pre-save middleware to hash password
userSchema.pre("save", async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified("password")) return next();

  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Pre-save middleware to generate unique student IDs
userSchema.pre("save", async function (next) {
  try {
    if (this.role !== "student") {
      // Ensure non-student roles do not accidentally retain a studentId
      if (this.studentId) {
        delete this.studentId;
      }
      if (this.academicInfo && this.academicInfo.studentId) {
        delete this.academicInfo.studentId;
      }
      return next();
    }

    if (this.studentId) {
      // Student already has an ID, keep it
      this.academicInfo = this.academicInfo ?? {};
      this.academicInfo.studentId = this.studentId;
      return next();
    }

    const year = new Date().getFullYear();
    const maxAttempts = 10;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const random = Math.floor(Math.random() * 1_000_000)
        .toString()
        .padStart(6, "0");
      const candidate = `STU-${year}-${random}`;
      const existing = await this.model("User").exists({
        studentId: candidate,
      });
      if (!existing) {
        this.studentId = candidate;
        this.academicInfo = this.academicInfo ?? {};
        this.academicInfo.studentId = candidate;
        return next();
      }
    }

    return next(
      new Error(
        "Unable to generate a unique student ID at this time. Please try again."
      )
    );
  } catch (error) {
    return next(error as Error);
  }
});

// Instance method to compare password
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.pre("save", function (next) {
  if (this.isModified("status")) {
    this.isApproved = this.status === "approved";
    // If rejected or deactivated ensure not active
    if (this.status === "rejected" || this.status === "deactivated") {
      this.isActive = false;
    } else if (this.status === "approved") {
      this.isActive = true;
    }
  }
  next();
});

// Remove password from JSON output
userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

const User = mongoose.model<IUser>("User", userSchema);

export default User;
