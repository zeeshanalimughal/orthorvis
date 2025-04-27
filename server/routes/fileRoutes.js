const express = require('express');
const { 
  uploadFiles, 
  associateFilesWithCase,
  removeFileFromCase
} = require('../controllers/fileController');
const { isAuthenticated } = require('../middlewares/auth');

const router = express.Router();

router.use(isAuthenticated);

router.post('/upload', uploadFiles);

router.post('/associate/:id', associateFilesWithCase);

router.delete('/remove/:caseId/:fileId', removeFileFromCase);

module.exports = router;
