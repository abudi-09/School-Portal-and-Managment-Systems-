import User from "../models/User";

export class ApprovalService {
  /**
   * Approve a user by updating their status to 'approved'
   */
  static async approveUser(userId: string): Promise<any> {
    const user = await User.findByIdAndUpdate(
      userId,
      { status: "approved", isActive: true, isApproved: true },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  /**
   * Deactivate a user by updating their status to 'deactivated'
   */
  static async deactivateUser(userId: string): Promise<any> {
    const user = await User.findByIdAndUpdate(
      userId,
      { status: "deactivated", isActive: false, isApproved: false },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  /**
   * Reject a user registration
   */
  static async rejectUser(userId: string): Promise<any> {
    const user = await User.findByIdAndUpdate(
      userId,
      { status: "rejected", isActive: false, isApproved: false },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  /**
   * Get pending users by role
   */
  static async getPendingUsersByRole(role: string): Promise<any[]> {
    return await User.find({
      status: "pending",
      role: role,
    })
      .select("-password")
      .sort({ createdAt: -1 });
  }

  /**
   * Update user role (admin only)
   */
  static async updateUserRole(userId: string, newRole: string): Promise<any> {
    const user = await User.findByIdAndUpdate(
      userId,
      { role: newRole },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  /**
   * Soft delete user (deactivate)
   */
  static async deleteUser(userId: string): Promise<void> {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    user.isActive = false;
    user.status = "deactivated";
    await user.save();
  }
}
