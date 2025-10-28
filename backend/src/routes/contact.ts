import { Router } from "express";
import { body } from "express-validator";
import { createContactMessage } from "../controllers/contact.controller";
import { optionalAuth } from "../middleware/auth";

const router = Router();

router.post(
  "/",
  optionalAuth,
  [
    body("name").trim().notEmpty().withMessage("Full name is required"),
    body("email")
      .trim()
      .isEmail()
      .withMessage("Valid email address is required"),
    body("subject").trim().notEmpty().withMessage("Subject is required"),
    body("message")
      .trim()
      .isLength({ min: 10 })
      .withMessage("Message must be at least 10 characters"),
    body("role")
      .optional({ checkFalsy: true })
      .isIn(["student", "teacher", "head", "admin", "parent", "visitor"])
      .withMessage("Unsupported role"),
  ],
  createContactMessage
);

export default router;
