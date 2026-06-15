const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Expose multer upload middleware
exports.uploadMiddleware = upload.single('file');

exports.uploadDocument = async (req, res) => {
  try {
    const { projectId, category } = req.body;
    const file = req.file;

    if (!projectId || !category || !file) {
      return res.status(400).json({ error: 'Missing projectId, category, or file' });
    }

    const fileName = file.originalname;
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;

    const document = await prisma.document.create({
      data: {
        fileName,
        fileUrl,
        category,
        projectId
      }
    });

    res.status(201).json(document);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find document to get file path
    const document = await prisma.document.findUnique({ where: { id } });
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Extract filename from URL and delete physical file
    const filename = document.fileUrl.split('/').pop();
    const filePath = path.join(__dirname, '../../uploads', filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete DB record
    await prisma.document.delete({ where: { id } });
    
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
