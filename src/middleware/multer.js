import multer from "multer";

const storage = multer.diskStorage({
  filenme: (req, file, cb) => {
    cb(null, file.orignalName);
  },
});
const multerUpload = multer({ storage: storage });

export default multerUpload;
