declare module "cloudinary" {
  export const v2: any;
}

declare module "multer" {
  const multer: any;
  export default multer;
}

declare namespace Express {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  interface Request {
    file?: {
      path: string;
      filename?: string;
      mimetype?: string;
      originalname?: string;
    };
  }
}
