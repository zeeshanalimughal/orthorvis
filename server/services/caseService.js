const Case = require("../models/Case");
const mongoose = require("mongoose");
const ErrorResponse = require("../utils/errorResponse");
const path = require("path");
const fs = require("fs");

/**
 * Create a new case with patient information and optional files
 * @param {Object} caseData - Case data including patient information
 * @param {Object} files - Uploaded files
 * @returns {Promise<Case>} - Newly created case
 */
exports.createCaseService = async (caseData, files) => {
  // Convert user ID to ObjectId if it's a string
  if (
    caseData.user &&
    typeof caseData.user === "string" &&
    mongoose.Types.ObjectId.isValid(caseData.user)
  ) {
    caseData.user = new mongoose.Types.ObjectId(caseData.user);
  }

  console.log(
    "Creating case with user ID:",
    caseData.user,
    "of type:",
    typeof caseData.user
  );

  // Create case
  const newCase = await Case.create(caseData);

  console.log("Created case with ID:", newCase._id, "for user:", newCase.user);

  // If files were uploaded, process them
  if (files && Object.keys(files).length > 0) {
    await handleFileUpload(newCase._id, files);

    // Refresh case data with files
    return await Case.findById(newCase._id);
  }

  return newCase;
};

/**
 * Get all cases with filtering, sorting, and pagination
 * @param {Object} queryParams - Query parameters for filtering
 * @returns {Promise<Object>} - Cases, pagination info, and total count
 */
exports.getAllCasesService = async (queryParams) => {
  const {
    status,
    startDate,
    endDate,
    firstName,
    lastName,
    patientId,
    gender,
    user,
    page = 1,
    limit = 10,
    sort = "-createdAt",
  } = queryParams;

  let userId = user;
  if (typeof user === "string" && mongoose.Types.ObjectId.isValid(user)) {
    userId = new mongoose.Types.ObjectId(user);
  }

  const query = { user: userId };

  console.log("Query being built with user ID:", user);
  console.log("User ID type:", typeof user);
  console.log("Using userId for query:", userId);

  if (status && status !== "All") {
    query.status = status;
  }

  if (startDate || endDate) {
    query.createdAt = {};

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      query.createdAt.$gte = start;
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.createdAt.$lte = end;
    }
  }

  if (firstName) {
    query.firstName = { $regex: firstName, $options: "i" };
  }

  if (lastName) {
    query.lastName = { $regex: lastName, $options: "i" };
  }

  if (patientId) {
    query.patientId = { $regex: patientId, $options: "i" };
  }

  if (gender) {
    query.gender = gender;
  }

  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await Case.countDocuments(query);


  const cases = await Case.find(query)
    .sort(sort)
    .skip(startIndex)
    .limit(parseInt(limit));

  console.log(`Found ${cases.length} cases for query`);
  if (cases.length > 0) {
    console.log(
      "First case user ID:",
      cases[0].user,
      "of type:",
      typeof cases[0].user
    );
  }

  const pagination = {};

  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit,
    };
  }

  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit,
    };
  }

  pagination.total = Math.ceil(total / limit);
  pagination.current = page;

  return {
    cases,
    pagination,
    total,
  };
};

/**
 * Get a single case by ID
 * @param {string} caseId - Case ID
 * @param {string} userId - User ID
 * @returns {Promise<Case>} - Case data
 */
exports.getCaseService = async (caseId, userId) => {
  if (typeof userId === "string" && mongoose.Types.ObjectId.isValid(userId)) {
    userId = new mongoose.Types.ObjectId(userId);
  }

  return await Case.findOne({ _id: caseId, user: userId });
};

/**
 * Update a case
 * @param {string} caseId - Case ID
 * @param {Object} updateData - Data to update
 * @param {string} userId - User ID
 * @returns {Promise<Case>} - Updated case
 */
exports.updateCaseService = async (caseId, updateData, userId) => {
  if (typeof userId === "string" && mongoose.Types.ObjectId.isValid(userId)) {
    userId = new mongoose.Types.ObjectId(userId);
  }

  const caseToUpdate = await Case.findOne({ _id: caseId, user: userId });

  if (!caseToUpdate) {
    return null;
  }

  Object.keys(updateData).forEach((key) => {
    if (key !== "files" && key !== "user") {
      caseToUpdate[key] = updateData[key];
    }
  });

  await caseToUpdate.save();

  return caseToUpdate;
};

/**
 * Delete a case and its files
 * @param {string} caseId - Case ID
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} - Success status
 */
exports.deleteCaseService = async (caseId, userId) => {
  if (typeof userId === "string" && mongoose.Types.ObjectId.isValid(userId)) {
    userId = new mongoose.Types.ObjectId(userId);
  }

  const caseToDelete = await Case.findOne({ _id: caseId, user: userId });

  if (!caseToDelete) {
    return false;
  }

  if (caseToDelete.folderName) {
    const caseFolderPath = path.join(__dirname, '..', 'uploads', caseToDelete.folderName);
    try {
      if (fs.existsSync(caseFolderPath)) {
        fs.rmdirSync(caseFolderPath, { recursive: true, force: true });
      }
    } catch (err) {
      console.error(`Error deleting case folder ${caseFolderPath}:`, err);
    }
  }
  
  if (caseToDelete.files && caseToDelete.files.length > 0) {
    caseToDelete.files.forEach((file) => {
      try {
        if (file && file.path) {
          const filePath = path.join(__dirname, '..', file.path);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
      } catch (err) {
        console.error(`Error deleting file:`, err);
      }
    });
  }

  await Case.deleteOne({ _id: caseId, user: userId });

  return true;
};

/**
 * Upload files to an existing case
 * @param {string} caseId - Case ID
 * @param {Object} files - Uploaded files
 * @param {string} userId - User ID
 * @returns {Promise<Case>} - Updated case
 */
exports.uploadFilesService = async (caseId, files, userId) => {
  if (typeof userId === "string" && mongoose.Types.ObjectId.isValid(userId)) {
    userId = new mongoose.Types.ObjectId(userId);
  }

  const caseToUpdate = await Case.findOne({ _id: caseId, user: userId });

  if (!caseToUpdate) {
    return null;
  }

  await handleFileUpload(caseId, files);

  return await Case.findById(caseId);
};

/**
 * Helper function to handle file uploads
 * @param {string} caseId - Case ID
 * @param {Object} files - Uploaded files
 */
async function handleFileUpload(caseId, files) {
  const caseDoc = await Case.findById(caseId);
  if (!caseDoc) {
    throw new Error(`Case not found with ID: ${caseId}`);
  }
  
  // Generate a unique folder name for this case if it doesn't exist
  if (!caseDoc.folderName) {
    caseDoc.folderName = `case_${caseDoc._id}_${Date.now()}`;
    await caseDoc.save();
  }
  
  const caseFolderPath = path.join('uploads', caseDoc.folderName);
  const uploadDir = path.join(process.cwd(), caseFolderPath);

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const uploadedFiles = [];

  if (files.file && !Array.isArray(files.file)) {
    files.file = [files.file];
  }

  if (files.file) {
    for (const file of files.file) {
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = path.join(uploadDir, fileName);
      const relativePath = path.join('uploads', caseDoc.folderName, fileName);

      await file.mv(filePath);

      uploadedFiles.push({
        name: file.name,
        path: relativePath,
        size: file.size,
        mimetype: file.mimetype,
        uploadedAt: Date.now(),
      });
    }
  } else {
    for (const fieldName in files) {
      const file = files[fieldName];
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = path.join(uploadDir, fileName);
      const relativePath = path.join('uploads', caseDoc.folderName, fileName);

      await file.mv(filePath);

      uploadedFiles.push({
        name: file.name,
        path: relativePath,
        size: file.size,
        mimetype: file.mimetype,
        uploadedAt: Date.now(),
      });
    }
  }

  await Case.findByIdAndUpdate(
    caseId,
    { $push: { files: { $each: uploadedFiles } } },
    { new: true }
  );
}
