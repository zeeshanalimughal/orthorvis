'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { X, Upload, File, Loader2, AlertCircle, FileIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
// Define a custom file interface that includes the properties we need
export interface FileItem {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  path?: string;
  relativePath?: string;
  webkitRelativePath?: string;
  slice: (start?: number, end?: number, contentType?: string) => Blob;
}

export interface FolderStructure {
  [key: string]: {
    files: FileItem[];
    folders: FolderStructure;
  };
}

interface FileUploadFormProps {
  files: FileItem[];
  onFilesSelected: (files: FileItem[], folderStructure?: FolderStructure) => void;
  onSubmit: (progressCallback?: (progress: number) => void, folderStructure?: FolderStructure) => void;
  isLoading: boolean;
}

const validateDicomFile = async (file: any): Promise<boolean> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const buffer = event.target?.result;
      if (buffer && buffer instanceof ArrayBuffer) {
        const bytes = new Uint8Array(buffer);
        const dicmSignature = String.fromCharCode(...bytes.slice(128, 132));
        resolve(dicmSignature === 'DICM');
      } else {
        resolve(false);
      }
    };
    reader.onerror = () => resolve(false);
    reader.readAsArrayBuffer(file.slice(0, 132));
  });
};

export function FileUploadForm({
  files,
  onFilesSelected,
  onSubmit,
  isLoading
}: FileUploadFormProps) {
  const [overallProgress, setOverallProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [folderStructure, setFolderStructure] = useState<FolderStructure>({});

  const updateOverallProgress = (progress: number) => {
    setOverallProgress(progress);
  };

  // Helper function to count total files in a folder structure (including nested folders)
  const countTotalFiles = useCallback((structure: FolderStructure): number => {
    let count = 0;
    
    Object.values(structure).forEach(folder => {
      // Count files in this folder
      count += folder.files.length;
      
      // Count files in nested folders
      if (Object.keys(folder.folders).length > 0) {
        count += countTotalFiles(folder.folders);
      }
    });
    
    return count;
  }, []);
  
  const processFiles = useCallback((files: FileItem[]) => {
    const structure: FolderStructure = {};
    
    files.forEach(file => {
      const relativePath = file.relativePath || file.webkitRelativePath || '';
      
      if (relativePath) {
        const pathParts = relativePath.split('/');
        
        if (pathParts.length <= 1) {
          return;
        }
        let currentLevel = structure;
        
        for (let i = 0; i < pathParts.length - 1; i++) {
          const folder = pathParts[i];
          if (!folder) continue;
          
          if (!currentLevel[folder]) {
            currentLevel[folder] = { files: [], folders: {} };
          }
          if (i === pathParts.length - 2) {
            currentLevel[folder].files.push(file);
          } else {
            currentLevel = currentLevel[folder].folders;
          }
        }
      }
    });
    
    return structure;
  }, []);

  const onDrop = useCallback(async (acceptedFiles: any[]) => {
    setErrorMessage(null);
    const validFiles: FileItem[] = [];
    const invalidFiles: string[] = [];

    for (const file of acceptedFiles) {
      if (file.webkitRelativePath) {
        file.relativePath = file.webkitRelativePath;
      }
      
      const hasExtension = file.name.includes('.') && file.name.split('.').pop()?.length > 0;
      
      if (!hasExtension || file.name === 'DICOMDIR') {
        validFiles.push(file);
        continue;
      }
      
      const isValidDicom = await validateDicomFile(file);
      if (isValidDicom) {
        validFiles.push(file);
      } else {
        const filePath = file.relativePath || file.name || 'Unnamed file';
        invalidFiles.push(filePath);
      }
    }

    if (invalidFiles.length > 0) {
      setErrorMessage(`The following files are not valid DICOM files: ${invalidFiles.join(', ')}`);
      onFilesSelected([]);
      setFolderStructure({});
    } else {
      const structure = processFiles(validFiles);
      setFolderStructure(structure);
      
      onFilesSelected(validFiles, structure);
      if (validFiles.length > 0) {
        updateOverallProgress(0);
      }
    }
  }, [onFilesSelected]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noDragEventsBubbling: true,
    multiple: true,
    noClick: false,
    noKeyboard: true,
    accept: {},
    // Enable directory (folder) uploads
    // @ts-ignore - directory is a valid property but not in the type definition
    directory: true,
  });

  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    onFilesSelected(newFiles);

    if (newFiles.length === 0) {
      setOverallProgress(0);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-xl font-semibold mb-4">Step 2: Upload Files</div>

      {errorMessage && (
        <div className="flex items-center gap-2 p-4 border border-red-400 bg-red-100 text-red-700 rounded-md">
          <AlertCircle className="h-5 w-5" />
          <span className="text-sm">{errorMessage}</span>
        </div>
      )}

      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-md p-10 text-center cursor-pointer transition-colors",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50"
        )}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <div className="text-center">
            <Upload className="h-10 w-10 mx-auto mb-2 text-primary" />
            <p>Drop the DICOM files here...</p>
          </div>
        ) : (
          <div className="text-center">
            <Upload className="h-10 w-10 mx-auto mb-2" />
            <p className="mb-1">Drag & drop DICOM files or folders here</p>
            <p className="text-xs text-muted-foreground">Only pure DICOM files are supported</p>
            <div className="flex justify-center gap-2 mt-4">
              <Button variant="outline" type="button" size="sm">
                Select Files
              </Button>
              <Button 
                variant="outline" 
                type="button" 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.webkitdirectory = true;
                  input.onchange = (e) => {
                    if (e.target && (e.target as HTMLInputElement).files) {
                      const fileList = (e.target as HTMLInputElement).files;
                      if (fileList) {
                        const filesArray = Array.from(fileList) as FileItem[];
                        onDrop(filesArray);
                      }
                    }
                  };
                  input.click();
                }}
              >
                Select Folder
              </Button>
            </div>
          </div>
        )}
      </div>

      {files.length > 0 && (
        <div className="space-y-3 mt-6">
          <h3 className="font-medium">Selected Files ({files.length})</h3>
          
          <div className="space-y-3 border rounded-md p-4">
            {files.filter(file => !file.relativePath).map((file, index) => (
              <div key={`${file.name}-${index}`} className="flex items-start p-3 border rounded-md">
                <div className="h-16 w-16 mr-3 overflow-hidden rounded border flex items-center justify-center bg-gray-100">
                  <FileIcon className="h-8 w-8 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name || 'Unnamed file'}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => removeFile(index)}
                  type="button"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            
            {Object.keys(folderStructure).length > 0 && (
              <div className="space-y-2">
                {Object.entries(folderStructure).map(([folderName, content]) => (
                  <div key={folderName} className="border rounded-md p-3">
                    <div className="flex items-center mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4l2 2h4a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium">{folderName}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        ({content.files.length} files{Object.keys(content.folders).length > 0 ? `, ${Object.keys(content.folders).length} folders` : ''})
                      </span>
                    </div>
                    
                    <div className="pl-4 space-y-2">
                      {content.files.map((file, idx) => (
                        <div key={`${folderName}-${file.name}-${idx}`} className="flex items-center p-2 border-b last:border-0">
                          <div className="h-10 w-10 mr-2 overflow-hidden rounded border flex items-center justify-center bg-gray-100">
                            <FileIcon className="h-5 w-5 text-gray-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                      ))}
                      
                      {Object.keys(content.folders).length > 0 && (
                        <div className="pl-4 pt-2">
                          {Object.entries(content.folders).map(([nestedFolder, nestedContent]) => (
                            <div key={`${folderName}-${nestedFolder}`} className="border-l-2 border-blue-200 pl-3 py-1">
                              <div className="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4l2 2h4a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                                </svg>
                                <span className="text-sm">{nestedFolder}</span>
                                <span className="text-xs text-muted-foreground ml-2">
                                  ({nestedContent.files.length} files{Object.keys(nestedContent.folders).length > 0 ? `, ${Object.keys(nestedContent.folders).length} folders` : ''})
                                </span>
                              </div>
                              
                              {Object.keys(nestedContent.folders).length > 0 && (
                                <div className="pl-4 pt-1">
                                  {Object.entries(nestedContent.folders).map(([deepNestedFolder, deepNestedContent]) => (
                                    <div key={`${folderName}-${nestedFolder}-${deepNestedFolder}`} className="border-l-2 border-blue-100 pl-3 py-1">
                                      <div className="flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-2 text-blue-300" viewBox="0 0 20 20" fill="currentColor">
                                          <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4l2 2h4a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                                        </svg>
                                        <span className="text-xs">{deepNestedFolder}</span>
                                        <span className="text-xs text-muted-foreground ml-2">({deepNestedContent.files.length} files)</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              {nestedContent.files.length > 0 && (
                                <div className="pl-4 pt-1">
                                  {nestedContent.files.slice(0, 3).map((file, idx) => (
                                    <div key={`${folderName}-${nestedFolder}-file-${idx}`} className="flex items-center py-1">
                                      <FileIcon className="h-3 w-3 mr-2 text-gray-400" />
                                      <span className="text-xs truncate">{file.name}</span>
                                    </div>
                                  ))}
                                  {nestedContent.files.length > 3 && (
                                    <div className="text-xs text-muted-foreground pl-5 py-1">
                                      + {nestedContent.files.length - 3} more files
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {files.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium mb-1">Upload Progress</p>
          <div className="flex items-center gap-2">
            <Progress value={overallProgress} className="h-2 flex-1" />
            <span className="text-sm font-medium">{Math.round(overallProgress)}%</span>
          </div>
        </div>
      )}

      <div className="flex justify-between mt-8">
        <p className="text-sm text-muted-foreground">
          {files.length === 0
            ? "No files selected"
            : `${files.length} file${files.length === 1 ? '' : 's'} selected`}
        </p>
        <Button
          type="button"
          onClick={() => {
            if (files.length > 0) {
              updateOverallProgress(100);
            }
            onSubmit(updateOverallProgress, folderStructure);
          }}
          disabled={isLoading || files.length === 0}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            'Next: Review & Submit'
          )}
        </Button>
      </div>
    </div>
  );
}
