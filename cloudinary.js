import cloudinary from "cloudinary";
import dotenv from "dotenv";
dotenv.config({ path: "config/config.env" });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
console.log(cloudinary.config());

export const upload_file = (file, folder) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      file,
      (result) => {
        resolve({
          public_id: result.public_id,
          url: result.url,
        });
      },
      {
        resource_type: "auto",
        folder,
      }
    );
  });
};

export const deleteFile = async (file) => {
  const res = await cloudinary.uploader.destroy(file);
  if (res?.result === "ok") return true;
};