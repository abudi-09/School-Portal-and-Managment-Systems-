import request from "supertest";
import app from "../app";
import { Types } from "mongoose";
import cloudinary from "../config/cloudinary";
import User from "../models/User";
import Message from "../models/Message";

// Mock dependencies
jest.mock("../config/cloudinary", () => ({
  uploader: {
    upload_stream: jest.fn(),
  },
  isCloudinaryConfigured: true,
  default: {
    uploader: {
      upload_stream: jest.fn(),
    },
  },
}));

jest.mock("../models/User");
jest.mock("../models/Message");

// Mock auth middleware to inject a user
jest.mock("../middleware/auth", () => ({
  authMiddleware: (req: any, res: any, next: any) => {
    req.user = {
      _id: new Types.ObjectId("507f1f77bcf86cd799439011"),
      role: "teacher",
    };
    next();
  },
  authorizeRoles:
    (...roles: string[]) =>
    (req: any, res: any, next: any) => {
      next();
    },
  optionalAuth: (req: any, res: any, next: any) => {
    next();
  },
}));

describe("Voice Message API", () => {
  const mockSenderId = new Types.ObjectId("507f1f77bcf86cd799439011");
  const mockReceiverId = new Types.ObjectId("507f1f77bcf86cd799439012");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should upload a voice message, generate waveform, and save to DB", async () => {
    // Mock User.findById for receiver
    (User.findById as jest.Mock).mockResolvedValue({
      _id: mockReceiverId,
      role: "student",
    });

    // Mock Cloudinary upload stream
    const mockUploadStream = (options: any, callback: any) => {
      // Simulate async success
      setTimeout(() => {
        callback(null, {
          secure_url:
            "https://res.cloudinary.com/demo/video/upload/v1/voice.webm",
          bytes: 1024,
        });
      }, 10);
      return { end: jest.fn() };
    };
    (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
      mockUploadStream
    );

    // Mock Message.save
    const mockSave = jest.fn().mockResolvedValue({
      _id: new Types.ObjectId(),
      sender: mockSenderId,
      receiver: mockReceiverId,
      voiceUrl: "https://res.cloudinary.com/demo/video/upload/v1/voice.webm",
      waveform: Array(100).fill(50), // Mocked waveform for the saved doc
      duration: 10,
      toObject: () => ({}),
    });
    // Mock Message constructor
    (Message as unknown as jest.Mock).mockImplementation((data) => ({
      ...data,
      _id: new Types.ObjectId(),
      createdAt: new Date(),
      save: mockSave,
      toObject: () => data,
    }));

    // Create a dummy WAV buffer (RIFF header + PCM data)
    // This is a minimal valid WAV file (1 second of silence)
    const wavHeader = Buffer.from([
      0x52,
      0x49,
      0x46,
      0x46, // "RIFF"
      0x24,
      0x00,
      0x00,
      0x00, // ChunkSize (36)
      0x57,
      0x41,
      0x56,
      0x45, // "WAVE"
      0x66,
      0x6d,
      0x74,
      0x20, // "fmt "
      0x10,
      0x00,
      0x00,
      0x00, // Subchunk1Size (16)
      0x01,
      0x00, // AudioFormat (1 = PCM)
      0x01,
      0x00, // NumChannels (1)
      0x44,
      0xac,
      0x00,
      0x00, // SampleRate (44100)
      0x88,
      0x58,
      0x01,
      0x00, // ByteRate (44100 * 2)
      0x02,
      0x00, // BlockAlign (2)
      0x10,
      0x00, // BitsPerSample (16)
      0x64,
      0x61,
      0x74,
      0x61, // "data"
      0x00,
      0x00,
      0x00,
      0x00, // Subchunk2Size (0)
    ]);

    // Append some random noise data to simulate audio
    const pcmData = Buffer.alloc(44100 * 2); // 1 second of silence
    for (let i = 0; i < pcmData.length; i++) {
      pcmData[i] = Math.floor(Math.random() * 256);
    }
    const voiceBuffer = Buffer.concat([wavHeader, pcmData]);

    const response = await request(app)
      .post("/api/messages/send-voice")
      .field("receiverId", mockReceiverId.toString())
      .attach("voice", voiceBuffer, {
        filename: "test_voice.wav",
        contentType: "audio/wav",
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body).toHaveProperty("voiceUrl");
    expect(response.body).toHaveProperty("waveform");

    // Verify Cloudinary was called
    expect(cloudinary.uploader.upload_stream).toHaveBeenCalled();

    // Verify Message was saved
    expect(mockSave).toHaveBeenCalled();

    // Verify waveform generation (indirectly via the response or mock calls if we mocked generateWaveform,
    // but we are testing the real generateWaveform integration with ffmpeg)
    // Since we are using real generateWaveform, the waveform in the response should be populated.
    // Note: The mockSave return value overrides the actual instance data in the controller if we aren't careful,
    // but the controller creates a new Message instance and saves it.
    // The controller uses the result of generateWaveform to populate the message.
    // So we should check if the Message constructor was called with the waveform.

    const constructorCalls = (Message as unknown as jest.Mock).mock.calls;
    expect(constructorCalls.length).toBeGreaterThan(0);
    const messageData = constructorCalls[0][0];
    expect(messageData.waveform).toBeDefined();
    expect(Array.isArray(messageData.waveform)).toBe(true);
    // We expect 100 samples
    expect(messageData.waveform.length).toBe(100);
  });
});
