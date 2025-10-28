import { Request, Response } from "express";
import { validationResult } from "express-validator";
import ContactMessage from "../models/ContactMessage";

export const createContactMessage = async (
  req: Request,
  res: Response
): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array(),
    });
    return;
  }

  try {
    const { name, email, role, subject, message } = req.body as {
      name: string;
      email: string;
      role?: string;
      subject: string;
      message: string;
    };

    const contactMessage = await ContactMessage.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: role || undefined,
      subject: subject.trim(),
      message: message.trim(),
      createdBy: req.user?._id,
    });

    res.status(201).json({
      success: true,
      message: "Sent successfully",
      data: { id: contactMessage.id },
    });
  } catch (error) {
    console.error("Failed to store contact message", error);
    res.status(500).json({
      success: false,
      message: "Unable to send message. Please try again later.",
    });
  }
};
