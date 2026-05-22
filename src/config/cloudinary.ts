import { v2 as cloudinary } from "cloudinary";
import envVars from "./envars";

cloudinary.config({
  cloud_name: envVars.CLOUD_NAME,
  api_key: envVars.CLOUD_API_KEY,
  api_secret: envVars.CLOUD_API_SECRET,
});

export default cloudinary;