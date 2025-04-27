const express = require('express');
const { 
  createCase, 
  getCases, 
  getCase, 
  updateCase, 
  deleteCase, 
  uploadFiles 
} = require('../controllers/caseController');
const { isAuthenticated } = require('../middlewares/auth');

const router = express.Router();

router.use(isAuthenticated);

router
  .route('/')
  .get(getCases)
  .post(createCase);

router
  .route('/:id')
  .get(getCase)
  .put(updateCase)
  .delete(deleteCase);

router
  .route('/:id/files')
  .put(uploadFiles);

module.exports = router;
