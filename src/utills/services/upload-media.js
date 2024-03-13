import cloudinary from "./cloudinary-config.js";

export const fileUpload = async (filePath) => {
  try {
    const data = await cloudinary.uploader.upload(filePath);
    return data;
  } catch (error) {
    throw error;
  }
};
