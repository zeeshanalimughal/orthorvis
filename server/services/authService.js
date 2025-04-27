const User = require("../models/User");
const ErrorResponse = require("../utils/errorResponse");

/**
 * Register a new user
 * @param {string} fullName - User's full name
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Promise<User>} - Newly created user
 */
exports.registerService = async (fullName, email, password) => {
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new ErrorResponse("Email already in use", 400);
  }

  const user = await User.create({
    fullName,
    email,
    password,
  });

  return user;
};

/**
 * Login a user
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Promise<User>} - User if credentials are valid
 */
exports.loginService = async (email, password) => {
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    throw new ErrorResponse("Invalid credentials", 400);
  }

  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    throw new ErrorResponse("Invalid credentials", 400);
  }

  return user;
};
