'use client';

import { CaseFormData } from '@/lib/types/case.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { File as FileIcon, ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FileItem } from './file-upload-form';
import { useEffect, useState } from 'react';

interface CasePreviewProps {
  patientData: CaseFormData;
  files: FileItem[] | File[];
  onSubmit: () => void;
  isLoading: boolean;
  uploadProgress: number;
}

export function CasePreview({ patientData, files, onSubmit, isLoading, uploadProgress }: CasePreviewProps) {
  // Use state to avoid hydration mismatch
  const [mounted, setMounted] = useState(false);
  
  // Only render file content on the client side
  useEffect(() => {
    setMounted(true);
  }, []);
  const getGenderDisplay = (gender: string) => {
    const genders = {
      'male': 'Male',
      'female': 'Female',
      'other': 'Other'
    };
    return genders[gender as keyof typeof genders] || gender;
  };

  const getStatusDisplay = (status: string) => {
    const statuses = {
      'In Process': 'In Process',
      'Completed': 'Completed',
      'Cancelled': 'Cancelled'
    };
    return statuses[status as keyof typeof statuses] || status;
  };

  const renderFilePreview = (file: FileItem | File, index: number) => {
    return (
      <div key={index} className="flex items-center p-3 border rounded-md mb-2">
        <div className="h-12 w-12 mr-3 overflow-hidden rounded border flex items-center justify-center">
          <div className="text-center">
            <ImageIcon className="h-6 w-6 text-blue-500 mx-auto opacity-75" />
            <span className="text-[8px] text-blue-300 block mt-1">DICOM</span>
          </div>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium truncate">{file.name}</p>
          <p className="text-xs text-muted-foreground">
            {file.size < 1024 * 1024
              ? `${(file.size / 1024).toFixed(1)} KB`
              : `${(file.size / 1024 / 1024).toFixed(2)} MB`}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-xl font-semibold mb-4">Step 3: Review and Submit</div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Patient Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Name</h4>
                <p>{patientData.firstName} {patientData.middleName} {patientData.lastName}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Patient ID</h4>
                <p>{patientData.patientId}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Gender</h4>
                <p>{getGenderDisplay(patientData.gender)}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Birth Date</h4>
                <p>{format(new Date(patientData.birthDate), 'MMM dd, yyyy')}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
                <p>{getStatusDisplay(patientData.status)}</p>
              </div>
            </div>

            {patientData.notes && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Notes</h4>
                <p className="text-sm whitespace-pre-line">{patientData.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Files ({mounted ? files.length : 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {mounted ? (
              files.length > 0 ? (
                <div className="max-h-[300px] overflow-y-auto">
                  {files.map((file, index) => file ? renderFilePreview(file, index) : null)}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-6">No files attached</p>
              )
            ) : (
              <p className="text-muted-foreground text-center py-6">Loading files...</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Progress bar for file upload */}
      {(isLoading && files.length > 0) && (
        <div className="mt-6">
          <p className="text-sm font-medium mb-1">Upload Progress</p>
          <div className="flex items-center gap-2">
            <Progress value={uploadProgress} className="h-2 flex-1" />
            <span className="text-sm font-medium">{Math.round(uploadProgress)}%</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 text-center">
            {uploadProgress < 80 ? 'Uploading files...' :
              uploadProgress < 100 ? 'Associating files with case...' :
                'Upload complete!'}
          </p>
        </div>
      )}

      <div className="flex justify-end mt-8">
        <Button
          onClick={onSubmit}
          disabled={isLoading}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Creating Case...
            </>
          ) : 'Submit Case'}
        </Button>
      </div>
    </div>
  );
}
