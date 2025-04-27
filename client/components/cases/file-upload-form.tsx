'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { X, Upload, File, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface FileUploadFormProps {
  files: File[];
  onFilesSelected: (files: File[]) => void;
  onSubmit: (progressCallback?: (progress: number) => void) => void;
  isLoading: boolean;
}

export function FileUploadForm({
  files,
  onFilesSelected,
  onSubmit,
  isLoading
}: FileUploadFormProps) {
  const [overallProgress, setOverallProgress] = useState<number>(0);

  const updateOverallProgress = (progress: number) => {
    setOverallProgress(progress);
  };

  const [filePreviews, setFilePreviews] = useState<Record<string, string>>({});

  const createFilePreview = (file: File) => {
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setFilePreviews(prev => ({
          ...prev,
          [file.name]: e.target?.result as string
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const validFiles = acceptedFiles.filter(
      file => file.type === 'application/dicom' ||
        file.name.endsWith('.dcm') ||
        file.type === 'image/jpeg' ||
        file.type === 'image/png'
    );

    validFiles.forEach(file => {
      createFilePreview(file);
    });

    onFilesSelected(validFiles);

    if (validFiles.length > 0) {
      updateOverallProgress(0);
    }
  }, [onFilesSelected]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/dicom': ['.dcm', '.dicom'],
      'application/octet-stream': ['.dcm', '.dicom'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    }
  });

  const removeFile = (index: number) => {
    const fileToRemove = files[index];
    const newFiles = [...files];
    newFiles.splice(index, 1);
    onFilesSelected(newFiles);

    setFilePreviews(prev => {
      const updated = { ...prev };
      delete updated[fileToRemove.name];
      return updated;
    });

    if (newFiles.length === 0) {
      setOverallProgress(0);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-xl font-semibold mb-4">Step 2: Upload Files</div>

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
        <div className="flex flex-col items-center justify-center">
          <Upload className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium mb-1">Drag & drop files here</p>
          <p className="text-sm text-muted-foreground mb-4">or click to select files</p>
          <Button variant="outline" type="button">
            Select Files
          </Button>
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-3 mt-6">
          <h3 className="font-medium">Selected Files ({files.length})</h3>
          <div className="space-y-3">
            {files.map((file, index) => (
              <div key={`${file.name}-${index}`} className="flex items-start p-3 border rounded-md">
                {filePreviews[file.name] ? (
                  <div className="relative h-12 w-12 mr-3">
                    <Image
                      src={filePreviews[file.name]}
                      alt={file.name}
                      fill
                      className="object-cover rounded"
                    />
                  </div>
                ) : (
                  <File className="h-12 w-12 text-muted-foreground mr-3 p-2 border rounded" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
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
            // Force progress to 100% for all files before submitting
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
