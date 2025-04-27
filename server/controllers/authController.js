const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const { logger } = require('../utils/logger');
const { registerService, loginService } = require('../services/authService');

// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { fullName, email, password } = req.body;

    req.logger.info({ fullName, email: email.toLowerCase() }, 'User registration attempt');

    const user = await registerService(fullName, email, password);

    req.logger.info({ userId: user._id }, 'User registered successfully');
    sendTokenResponse(user, 201, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    req.logger.info({ email: email?.toLowerCase() }, 'Login attempt');

    if (!email || !password) {
      req.logger.warn({ email }, 'Login attempt missing email or password');
      return next(new ErrorResponse('Please provide an email and password', 400));
    }

    const user = await loginService(email, password);

    req.logger.info({ userId: user._id }, 'User logged in successfully');
    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Get current logged in user
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    req.logger.info({ userId: req.user.id }, 'Get current user profile');
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email
      },
      message: 'User profile retrieved successfully'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Log user out / clear cookie
// @route   GET /api/v1/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  req.logger.info({ userId: req.user.id }, 'User logged out');
  
  res.cookie('token', '', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    data: {}
  });
};

const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email
      },
      message: statusCode === 201 ? 'Registration successful' : 'Login successful'
    });
};
