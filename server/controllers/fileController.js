const path = require("path");
const fs = require("fs");
const ErrorResponse = require("../utils/errorResponse");
const Case = require("../models/Case");

const UPLOADS_DIR = "uploads";
const TMP_DIR = "tmp";
const UPLOADS_FULL_PATH = path.join(__dirname, "..", UPLOADS_DIR);
const TMP_FULL_PATH = path.join(__dirname, "..", TMP_DIR);

const createNestedDirectories = (basePath, relativePath) => {
  const folderPath = path.join(basePath, relativePath);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
  return folderPath;
};

const isValidDicomFile = (filePath) => {
  try {
    const buffer = fs.readFileSync(filePath);
    if (buffer.length < 132) return false;
    const dicmSignature = buffer.toString("utf8", 128, 132);
    return dicmSignature === "DICM";
  } catch (error) {
    return false;
  }
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
    
    // Check if a case ID was provided for direct upload to case folder
    let uploadFolderName;
    let isCaseUpload = false;
    
    if (req.body.caseId) {
      try {
        const caseDoc = await Case.findById(req.body.caseId);
        if (caseDoc) {
          if (caseDoc.folderName) {
            uploadFolderName = caseDoc.folderName;
            isCaseUpload = true;
          } else {
            uploadFolderName = `case_${caseDoc._id}_${Date.now()}`;
            caseDoc.folderName = uploadFolderName;
            await caseDoc.save();
            isCaseUpload = true;
          }
        }
      } catch (error) {
        console.error('Error finding case:', error);
      }
    }
    
    // If no case was found or no case ID was provided, create a temporary upload ID
    if (!uploadFolderName) {
      uploadFolderName = `upload_${Date.now()}_${Math.round(Math.random() * 1e6)}`;
    }
    
    const folderStructure = req.body.folderStructure ? 
      JSON.parse(req.body.folderStructure) : {};

    const uploadedFiles = [];
    for (const file of fileArray) {
      // Check if this file has a relative path (part of a folder structure)
      let relativeFolderPath = '';
      let folderPath = '';
      
      if (file.relativePath) {
        relativeFolderPath = Array.isArray(file.relativePath) ? file.relativePath[0] : file.relativePath;
      } else if (req.body[`relativePath_${file.name}`]) {
        relativeFolderPath = Array.isArray(req.body[`relativePath_${file.name}`]) 
          ? req.body[`relativePath_${file.name}`][0] 
          : req.body[`relativePath_${file.name}`];
      }
      
      if (req.body[`folderPath_${file.name}`]) {
        folderPath = Array.isArray(req.body[`folderPath_${file.name}`])
          ? req.body[`folderPath_${file.name}`][0]
          : req.body[`folderPath_${file.name}`];
      } else if (relativeFolderPath) {
        // Extract folder path from relative path if not explicitly provided
        folderPath = path.dirname(relativeFolderPath.toString());
        if (folderPath === '.') folderPath = '';
      }
      
      // Create a unique filename that preserves the original name but ensures uniqueness
      // Include a hash of the relative path to ensure files with same name in different folders don't conflict
      const originalName = path.basename(file.name, path.extname(file.name));
      const ext = path.extname(file.name);
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e6);
      const fileName = `${originalName}_${uniqueSuffix}${ext}`;
      
      // Create a path that preserves folder structure directly in uploads directory
      let targetRelativePath;
      let targetFullPath;
      let originalFolderPath = '';
      
      try {
        // Store the original folder path for reference
        originalFolderPath = folderPath;
        
        const baseFolderPath = path.join(UPLOADS_DIR, uploadFolderName);
        
        if (folderPath && folderPath !== '.') {
          // Split the folder path to ensure we create each level of nesting
          const folderParts = folderPath.split('/');
          let currentPath = baseFolderPath;
          
          // Create each folder level one by one to ensure the complete structure
          for (let i = 0; i < folderParts.length; i++) {
            if (!folderParts[i]) continue;
            currentPath = path.join(currentPath, folderParts[i]);
            createNestedDirectories(path.join(__dirname, '..'), currentPath);
          }
          
          // Final target path includes all nested folders
          const targetFolderPath = path.join(baseFolderPath, folderPath);
          targetRelativePath = path.join(targetFolderPath, fileName);
          targetFullPath = path.join(__dirname, '..', targetRelativePath);
          
        } else {
          // No folder structure, use base folder directly
          createNestedDirectories(path.join(__dirname, '..'), baseFolderPath);
          targetRelativePath = path.join(baseFolderPath, fileName);
          targetFullPath = path.join(__dirname, '..', targetRelativePath);
        }
      } catch (error) {
        console.error('Error processing path:', error);
        // Fallback to uploads directory if there's an error
        const uploadFolderPath = path.join(UPLOADS_DIR, uploadFolderName);
        createNestedDirectories(path.join(__dirname, '..'), uploadFolderPath);
        targetRelativePath = path.join(uploadFolderPath, fileName);
        targetFullPath = path.join(__dirname, '..', targetRelativePath);
      }

      await file.mv(targetFullPath);

      const hasExtension = file.name.includes('.') && file.name.split('.').pop().length > 0;
      
      if (hasExtension && file.name !== 'DICOMDIR') {
        const isValidDicom = isValidDicomFile(targetFullPath);

        if (!isValidDicom) {
          fs.unlinkSync(targetFullPath);
          return next(
            new ErrorResponse(
              `Uploaded file ${file.name} is not a valid DICOM file.`,
              400
            )
          );
        }
      }

      uploadedFiles.push({
        name: file.name,
        path: targetRelativePath,
        relativePath: relativeFolderPath || '',
        originalFolderPath: originalFolderPath || '',
        fullRelativePath: relativeFolderPath ? path.join(path.dirname(relativeFolderPath), file.name) : file.name,
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
    const { fileIds, folderStructure, files } = req.body;

    if (!fileIds || !Array.isArray(fileIds)) {
      return next(new ErrorResponse("File IDs are required", 400));
    }

    const caseDoc = await Case.findById(id);
    if (!caseDoc) {
      return next(new ErrorResponse("Case not found", 404));
    }

    if (caseDoc.user.toString() !== req.user.id) {
      return next(
        new ErrorResponse("Not authorized to update this case", 401)
      );
    }
    
    if (!caseDoc.folderName) {
      caseDoc.folderName = `case_${caseDoc._id}_${Date.now()}`;
    }
    
    const caseFolderPath = path.join(UPLOADS_DIR, caseDoc.folderName);
    const caseFullFolderPath = path.join(__dirname, '..', caseFolderPath);
    if (!fs.existsSync(caseFullFolderPath)) {
      fs.mkdirSync(caseFullFolderPath, { recursive: true });
    }
    
    const filesToAdd = [];
    
    for (const fileId of fileIds) {
      const fileIndex = caseDoc.files.findIndex(f => f._id && f._id.toString() === fileId);
      
      if (fileIndex === -1) {
        // This is a new file to be added
        // Get the file data from the request body
        const uploadedFiles = files || [];
        const newFile = uploadedFiles.find(f => f._id === fileId);
        if (!newFile) continue;
        
        const uploadPath = newFile.path;
        const uploadFullPath = path.join(__dirname, '..', uploadPath);
        
        if (!fs.existsSync(uploadFullPath)) {
          console.error(`File not found at ${uploadFullPath}`);
          continue;
        }
        
        // Check if the file is already in the case folder
        const isAlreadyInCaseFolder = uploadPath.includes(caseDoc.folderName);
        
        if (isAlreadyInCaseFolder) {
          filesToAdd.push(newFile);
        } else {
          let newRelativePath;
          if (newFile.originalFolderPath && newFile.originalFolderPath !== '.') {
            // Preserve folder structure within case folder
            const structurePath = path.join(caseFolderPath, newFile.originalFolderPath);
            createNestedDirectories(path.join(__dirname, '..'), structurePath);
            newRelativePath = path.join(structurePath, path.basename(uploadPath));
          } else {
            newRelativePath = path.join(caseFolderPath, path.basename(uploadPath));
          }
          
          const newFullPath = path.join(__dirname, '..', newRelativePath);
          
          // Move file from upload directory to case folder
          try {
            fs.renameSync(uploadFullPath, newFullPath);
            
            newFile.path = newRelativePath;
            filesToAdd.push(newFile);
            
            // Clean up empty directories in the uploads folder
            try {
              const uploadDir = path.dirname(uploadFullPath);
              const filesInDir = fs.readdirSync(uploadDir);
              if (filesInDir.length === 0) {
                fs.rmdirSync(uploadDir, { recursive: true });
              }
            } catch (cleanupError) {
              console.error('Error cleaning up empty directories:', cleanupError);
            }
          } catch (error) {
            console.error(`Error moving file from ${uploadFullPath} to ${newFullPath}:`, error);
            try {
              fs.copyFileSync(uploadFullPath, newFullPath);
              fs.unlinkSync(uploadFullPath);
              
              newFile.path = newRelativePath;
              filesToAdd.push(newFile);
            } catch (copyError) {
              console.error(`Error copying file:`, copyError);
            }
          }
        }
      }
    }
    
    if (!caseDoc.files) {
      caseDoc.files = [];
    }
    
    if (filesToAdd.length > 0) {
      caseDoc.files.push(...filesToAdd);
    } else if (files && files.length > 0) {
      caseDoc.files.push(...files);
    }
    
    if (folderStructure) {
      try {
        const folderData = typeof folderStructure === 'string' ? 
          JSON.parse(folderStructure) : folderStructure;
          
        // Store or update folder structure
        if (!caseDoc.folderStructure) {
          caseDoc.folderStructure = folderData;
        } else {
          // Merge with existing structure
          caseDoc.folderStructure = {
            ...caseDoc.folderStructure,
            ...folderData
          };
        }
      } catch (error) {
        console.error('Error processing folder structure:', error);
      }
    }

    await caseDoc.save();
    
    console.log(`Case ${id} now has ${caseDoc.files.length} files`);

    const updatedCase = await Case.findById(id);

    res.status(200).json({
      success: true,
      data: updatedCase,
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
