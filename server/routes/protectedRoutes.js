const express = require('express');
const { isAuthenticated } = require('../middlewares/auth');

const router = express.Router();

router.get('/test', isAuthenticated, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'You have access to this protected route',
    user: req.user
  });
});

module.exports = router;
