const multer = require('multer');

// Store in memory; controller will upload to Cloudinary/S3
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = /\.(pdf|jpg|jpeg|png|doc|docx)$/i.test(file.originalname);
    if (allowed) cb(null, true);
    else {
      const err = new Error('Invalid file type. Allowed: pdf, jpg, png, doc, docx');
      err.statusCode = 400;
      cb(err, false);
    }
  },
});

module.exports = upload;
