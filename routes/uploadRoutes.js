import express from 'express';
import multer from 'multer';
import path from 'path';
import { protect } from '../middleware/auth.js';
const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads');
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + '_' + `${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

const checkFileType = (file, cb) => {
  const formats = /jpg|jpeg|png|/;
  const extname = formats.test(path.extname(file.originalname).toLowerCase());
  const mimeType = formats.test(file.mimeType);
  return cb(null, extname && mimeType);
};

const upload = multer({
  storage,
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});


let imageUpload = upload.single('image');
router.post('/', protect, (req, res) => {
  imageUpload(req, res, (err) => {
    if (err) {
      console.log(err.message);
      res.status(400).json({
        success: false,
        message: err.message,
      });
    } else {
      const file = req.file;
      if (!file) {
        res.status(400);
        throw new Error('Please upload a file');
      }
      res.status(200).send(`${process.env.URL}/api/${req.file.path}`);
    }
  });
});

export default router;
