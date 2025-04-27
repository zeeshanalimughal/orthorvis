const path = require("path");
const fs = require("fs");
const ErrorResponse = require("../utils/errorResponse");
const Case = require("../models/Case");

// Base directory for uploads relative to server root
const UPLOADS_DIR = "uploads";
const UPLOADS_FULL_PATH = path.join(__dirname, "..", UPLOADS_DIR);

// Helper function to validate file types
const isValidFileType = (file) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "application/dicom",
    "application/octet-stream",
  ];

  return (
    allowedTypes.includes(file.mimetype) ||
    file.name.endsWith(".dcm") ||
    file.name.endsWith(".dicom")
  );
};

// @desc    Upload files
// @route   POST /api/v1/files/upload
// @access  Private
exports.uploadFiles = async (req, res, next) => {
  try {
    req.logger.info(
      { userId: req.user.id, action: "upload_files" },
      "Uploading files"
    );

    if (!req.files || Object.keys(req.files).length === 0) {
      return next(new ErrorResponse("Please upload at least one file", 400));
    }

    if (!fs.existsSync(UPLOADS_FULL_PATH)) {
      fs.mkdirSync(UPLOADS_FULL_PATH, { recursive: true });
    }

    let fileArray = [];
    if (Array.isArray(req.files.files)) {
      fileArray = req.files.files;
    } else {
      fileArray = [req.files.files];
    }

    // Validate file types
    for (const file of fileArray) {
      if (!isValidFileType(file)) {
        return next(
          new ErrorResponse(
            `File ${file.name} is not an allowed type. Allowed types: JPEG, PNG`,
            400
          )
        );
      }
    }

    const uploadedFiles = [];
    for (const file of fileArray) {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.name);
      const fileName = `${uniqueSuffix}${ext}`;
      const relativePath = `${UPLOADS_DIR}/${fileName}`;
      const fullPath = path.join(UPLOADS_FULL_PATH, fileName);

      await file.mv(fullPath);

      uploadedFiles.push({
        name: file.name,
        path: relativePath,
        fullPath: fullPath,
        size: file.size,
        mimetype: file.mimetype,
        uploadedAt: Date.now(),
      });
    }

    req.logger.info(
      {
        userId: req.user.id,
        fileCount: uploadedFiles.length,
        action: "files_uploaded",
      },
      "Files uploaded successfully"
    );

    res.status(200).json({
      success: true,
      count: uploadedFiles.length,
      data: uploadedFiles,
    });
  } catch (err) {
    req.logger.error(
      { userId: req.user.id, error: err.message },
      "File upload error"
    );
    next(err);
  }
};

// @desc    Associate uploaded files with a case
// @route   POST /api/v1/files/associate/:id
// @access  Private
exports.associateFilesWithCase = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { files } = req.body;

    if (!files || !Array.isArray(files) || files.length === 0) {
      return next(
        new ErrorResponse("Please provide file data to associate", 400)
      );
    }

    const caseToUpdate = await Case.findOne({ _id: id, user: req.user.id });

    if (!caseToUpdate) {
      return next(new ErrorResponse(`Case not found with id ${id}`, 404));
    }

    if (!caseToUpdate.files) {
      caseToUpdate.files = [];
    }

    caseToUpdate.files.push(...files);
    await caseToUpdate.save();

    req.logger.info(
      {
        userId: req.user.id,
        caseId: id,
        fileCount: files.length,
        action: "files_associated",
      },
      "Files associated with case successfully"
    );

    res.status(200).json({
      success: true,
      data: caseToUpdate,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Remove a file from a case
// @route   DELETE /api/v1/files/remove/:caseId/:fileId
// @access  Private
exports.removeFileFromCase = async (req, res, next) => {
  try {
    const { caseId, fileId } = req.params;

    const caseToUpdate = await Case.findOne({ _id: caseId, user: req.user.id });

    if (!caseToUpdate) {
      return next(new ErrorResponse(`Case not found with id ${caseId}`, 404));
    }

    const fileIndex = caseToUpdate.files.findIndex(
      (file) => file._id.toString() === fileId
    );

    if (fileIndex === -1) {
      return next(new ErrorResponse(`File not found with id ${fileId}`, 404));
    }

    const fileToRemove = caseToUpdate.files[fileIndex];

    try {
      const fullPath = path.join(__dirname, "..", fileToRemove.path);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    } catch (error) {
      req.logger.warn(
        {
          userId: req.user.id,
          caseId,
          fileId,
          error: error.message,
          action: "delete_file_failed",
        },
        `Failed to delete physical file: ${error.message}`
      );
    }

    caseToUpdate.files.splice(fileIndex, 1);
    await caseToUpdate.save();

    req.logger.info(
      { userId: req.user.id, caseId, fileId, action: "file_removed" },
      "File removed from case successfully"
    );

    res.status(200).json({
      success: true,
      data: caseToUpdate,
    });
  } catch (err) {
    next(err);
  }
};
