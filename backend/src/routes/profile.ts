import express from "express";
import multer from "multer";
import { body } from "express-validator";
import { authMiddleware } from "../middleware/auth";
import profileController from "../controllers/profile.controller";

const router = express.Router();
const upload = multer({ dest: "tmp/uploads" });

router.get("/me", authMiddleware, profileController.getProfile);

const updateProfileValidators = [
  body("firstName")
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage("First name is required"),
  body("lastName")
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage("Last name is required"),
  body("phoneNumber")
    .optional({ nullable: true })
    .matches(/^\+?[\d\s\-\(\)]+$/)
    .withMessage("Please enter a valid phone number"),
  body("address").optional({ nullable: true }).isString(),
  body("profile").optional().isObject(),
  body("profile.phone")
    .optional({ nullable: true })
    .matches(/^\+?[\d\s\-\(\)]+$/)
    .withMessage("Please enter a valid phone number"),
  body("profile.address").optional({ nullable: true }).isString(),
  body("profile.gender")
    .optional({ nullable: true })
    .isIn(["male", "female", "other"]),
  body("profile.dateOfBirth").optional({ nullable: true }).isISO8601().toDate(),
  body("academicInfo").optional().isObject(),
  body("academicInfo.class").optional({ nullable: true }).isString(),
  body("academicInfo.section").optional({ nullable: true }).isString(),
  body("academicInfo.grade").optional({ nullable: true }).isString(),
  body("academicInfo.subjects").optional({ nullable: true }).isArray(),
  body("employmentInfo").optional().isObject(),
  body("employmentInfo.department").optional({ nullable: true }).isString(),
  body("employmentInfo.position").optional({ nullable: true }).isString(),
  body("employmentInfo.responsibilities")
    .optional({ nullable: true })
    .isString(),
];

router.put(
  "/",
  authMiddleware,
  updateProfileValidators,
  profileController.updateProfile
);

router.put(
  "/avatar",
  authMiddleware,
  upload.single("avatar"),
  profileController.updateAvatar
);

router.put(
  "/change-password",
  authMiddleware,
  [
    body("currentPassword")
      .isString()
      .isLength({ min: 1 })
      .withMessage("Current password is required"),
    body("newPassword")
      .isString()
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
    body("confirmPassword")
      .custom((value, { req }) => value === req.body.newPassword)
      .withMessage("Passwords do not match"),
  ],
  profileController.changePassword
);

export default router;
