import cloudinary from "./cloudinary";

const extractPublicIdFromUrl = (url: string): string | null => {
    try {
        const parts = url.split("/");
        const uploadIndex = parts.indexOf("upload");
        if (uploadIndex === -1) return null;
        
        const imageParts = parts.slice(uploadIndex + 2);
        const filenameWithExtension = imageParts.join("/");
        const publicId = filenameWithExtension.substring(0, filenameWithExtension.lastIndexOf("."));
        return publicId;
    } catch (error) {
        return null;
    }
};

export const deleteOldCloudinaryImage = async (imageUrl: string | undefined | null) => {
    if (!imageUrl || !imageUrl.includes("cloudinary.com")) return;
    
    const publicId = extractPublicIdFromUrl(imageUrl);
    if (publicId) {
        try {
            await cloudinary.uploader.destroy(publicId);
        } catch (error) {
            console.error("Failed to delete image from Cloudinary:", error);
        }
    }
};
