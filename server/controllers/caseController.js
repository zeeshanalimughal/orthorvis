const Case = require("../models/Case");
const ErrorResponse = require("../utils/errorResponse");
const path = require("path");
const fs = require("fs");
const { logger } = require("../utils/logger");
const {
  createCaseService,
  updateCaseService,
  uploadFilesService,
  deleteCaseService,
  getCaseService,
  getAllCasesService,
} = require("../services/caseService");

// @desc    Create a new case
// @route   POST /api/v1/cases
// @access  Private
exports.createCase = async (req, res, next) => {
  try {
    req.body.user = req.user.id;

    req.logger.info(
      {
        userId: req.user.id,
        patientId: req.body.patientId,
        action: "create_case",
      },
      "Creating new patient case"
    );

    const caseData = await createCaseService(req.body, req.files);

    req.logger.info(
      {
        userId: req.user.id,
        caseId: caseData._id,
        patientId: caseData.patientId,
        action: "case_created",
      },
      "Patient case created successfully"
    );

    res.status(201).json({
      success: true,
      data: caseData,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all cases with filtering
// @route   GET /api/v1/cases
// @access  Private
exports.getCases = async (req, res, next) => {
  try {
    console.log("User ID from request:", req.user.id);
    console.log("Query filters:", req.query);

    const result = await getAllCasesService({
      ...req.query,
      user: req.user.id,
    });

    res.status(200).json({
      success: true,
      count: result.total,
      pagination: result.pagination,
      data: result.cases,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single case
// @route   GET /api/v1/cases/:id
// @access  Private
exports.getCase = async (req, res, next) => {
  try {
    req.logger.info(
      {
        userId: req.user.id,
        caseId: req.params.id,
        action: "get_case",
      },
      "Retrieving single case"
    );

    const caseData = await getCaseService(req.params.id, req.user.id);

    if (!caseData) {
      req.logger.warn(
        {
          userId: req.user.id,
          caseId: req.params.id,
          action: "case_not_found",
        },
        `Case not found with id of ${req.params.id}`
      );

      return next(
        new ErrorResponse(`Case not found with id of ${req.params.id}`, 404)
      );
    }

    req.logger.info(
      {
        userId: req.user.id,
        caseId: caseData._id,
        patientId: caseData.patientId,
        action: "case_retrieved",
      },
      "Case retrieved successfully"
    );

    res.status(200).json({
      success: true,
      data: caseData,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update case
// @route   PUT /api/v1/cases/:id
// @access  Private
exports.updateCase = async (req, res, next) => {
  try {
    req.logger.info(
      {
        userId: req.user.id,
        caseId: req.params.id,
        updates: req.body,
        action: "update_case",
      },
      "Updating case"
    );

    const caseData = await updateCaseService(
      req.params.id,
      req.body,
      req.user.id
    );

    if (!caseData) {
      req.logger.warn(
        {
          userId: req.user.id,
          caseId: req.params.id,
          action: "case_not_found",
        },
        `Case not found with id of ${req.params.id}`
      );

      return next(
        new ErrorResponse(`Case not found with id of ${req.params.id}`, 404)
      );
    }

    req.logger.info(
      {
        userId: req.user.id,
        caseId: caseData._id,
        patientId: caseData.patientId,
        action: "case_updated",
      },
      "Case updated successfully"
    );

    res.status(200).json({
      success: true,
      data: caseData,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete case
// @route   DELETE /api/v1/cases/:id
// @access  Private
exports.deleteCase = async (req, res, next) => {
  try {
    req.logger.info(
      {
        userId: req.user.id,
        caseId: req.params.id,
        action: "delete_case",
      },
      "Deleting case"
    );

    const result = await deleteCaseService(req.params.id, req.user.id);

    if (!result) {
      req.logger.warn(
        {
          userId: req.user.id,
          caseId: req.params.id,
          action: "case_not_found",
        },
        `Case not found with id of ${req.params.id}`
      );

      return next(
        new ErrorResponse(`Case not found with id of ${req.params.id}`, 404)
      );
    }

    req.logger.info(
      {
        userId: req.user.id,
        caseId: req.params.id,
        action: "case_deleted",
      },
      "Case deleted successfully"
    );

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Upload files to case
// @route   PUT /api/v1/cases/:id/files
// @access  Private
exports.uploadFiles = async (req, res, next) => {
  try {
    req.logger.info(
      {
        userId: req.user.id,
        caseId: req.params.id,
        fileCount: req.files ? Object.keys(req.files).length : 0,
        action: "upload_files",
      },
      "Uploading files to case"
    );

    if (!req.files || Object.keys(req.files).length === 0) {
      req.logger.warn(
        {
          userId: req.user.id,
          caseId: req.params.id,
          action: "no_files_uploaded",
        },
        "No files were uploaded"
      );

      return next(new ErrorResponse("No files were uploaded", 400));
    }

    const caseData = await uploadFilesService(
      req.params.id,
      req.files,
      req.user.id
    );

    if (!caseData) {
      req.logger.warn(
        {
          userId: req.user.id,
          caseId: req.params.id,
          action: "case_not_found",
        },
        `Case not found with id of ${req.params.id}`
      );

      return next(
        new ErrorResponse(`Case not found with id of ${req.params.id}`, 404)
      );
    }

    req.logger.info(
      {
        userId: req.user.id,
        caseId: caseData._id,
        fileCount: req.files ? Object.keys(req.files).length : 0,
        action: "files_uploaded",
      },
      `Successfully uploaded ${Object.keys(req.files).length} files to case`
    );

    res.status(200).json({
      success: true,
      data: caseData,
    });
  } catch (err) {
    next(err);
  }
};
