import sharp from "sharp";
import path from "path";
import fs from "fs";

export const optimizeImage = async (
  fileBuffer: Buffer,
  originalName: string
): Promise<string> => {
  const uploadDir = path.join(process.cwd(), "uploads", "properties");

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
  const ext = ".webp";
  const filename = `image-${uniqueSuffix}${ext}`;
  const finalFilePath = path.join(uploadDir, filename);

  await sharp(fileBuffer)
    .resize({ width: 1200, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(finalFilePath);

  return `/uploads/properties/${filename}`;
};