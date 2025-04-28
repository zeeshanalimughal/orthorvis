'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { X, Upload, File, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadFormProps {
  files: File[];
  onFilesSelected: (files: File[]) => void;
  onSubmit: (progressCallback?: (progress: number) => void) => void;
  isLoading: boolean;
}

const validateDicomFile = async (file: File): Promise<boolean> => {
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

  const updateOverallProgress = (progress: number) => {
    setOverallProgress(progress);
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setErrorMessage(null);
    const validFiles: File[] = [];
    const invalidFiles: string[] = [];

    for (const file of acceptedFiles) {
      const isValidDicom = await validateDicomFile(file);
      if (isValidDicom) {
        validFiles.push(file);
      } else {
        invalidFiles.push(file.name || 'Unnamed file');
      }
    }

    if (invalidFiles.length > 0) {
      setErrorMessage(`The following files are not valid DICOM files: ${invalidFiles.join(', ')}`);
      onFilesSelected([]);
    } else {
      onFilesSelected(validFiles);
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
            <p className="mb-1">Drag & drop DICOM files here, or click to select files</p>
            <p className="text-xs text-muted-foreground">Only pure DICOM files are supported</p>
          </div>
        )}
        <Button variant="outline" type="button" className="mt-4">
          Select Files
        </Button>
      </div>

      {files.length > 0 && (
        <div className="space-y-3 mt-6">
          <h3 className="font-medium">Selected Files ({files.length})</h3>
          <div className="space-y-3">
            {files.map((file, index) => (
              <div key={`${file.name}-${index}`} className="flex items-start p-3 border rounded-md">
                <File className="h-12 w-12 mr-3 p-2 border rounded text-blue-500" />
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
            onSubmit(updateOverallProgress);
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
