const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { upload, uploadToCloudinary } = require('../config/cloudinary');

router.post('/image', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' });
    }

    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
      const result = await uploadToCloudinary(req.file.path);
      return res.json({
        message: 'Image uploaded successfully',
        url: result.url,
        publicId: result.publicId
      });
    } else {
      const localUrl = `/uploads/${req.file.filename}`;
      return res.json({
        message: 'Image uploaded locally (Configure Cloudinary for cloud storage)',
        url: localUrl,
        local: true
      });
    }
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload image', message: error.message });
  }
});

router.post('/multiple', auth, upload.array('images', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No images provided' });
    }

    const images = [];
    
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
      for (const file of req.files) {
        const result = await uploadToCloudinary(file.path);
        images.push(result);
      }
    } else {
      for (const file of req.files) {
        images.push({
          url: `/uploads/${file.filename}`,
          local: true
        });
      }
    }

    res.json({
      message: 'Images uploaded successfully',
      images
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload images', message: error.message });
  }
});

module.exports = router;