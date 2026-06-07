import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary";

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "properties",
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
    transformation: [
      { quality: "auto:good" },
      { fetch_format: "auto" },  
      { width: 1000, crop: "limit" } 
    ],
  } as any,
});

export const upload = multer({ storage });


// import multer from "multer";

// const storage = multer.memoryStorage();

// const fileFilter = (req: any, file: any, cb: any) => {
//   const allowedFormats = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
//   if (allowedFormats.includes(file.mimetype)) {
//     cb(null, true);
//   } else {
//     cb(new Error("Invalid file format. Only JPG, PNG, JPEG, and WEBP are allowed!"), false);
//   }
// };

// export const upload = multer({
//   storage,
//   fileFilter,
//   limits: { fileSize: 5 * 1024 * 1024 }
// });