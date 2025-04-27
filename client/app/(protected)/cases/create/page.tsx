'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PatientInfoForm } from '@/components/cases/patient-info-form';
import { FileUploadForm } from '@/components/cases/file-upload-form';
import { CasePreview } from '@/components/cases/case-preview';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileDigit, User, CheckCircle } from 'lucide-react';
import { CaseFormData } from '@/lib/types/case.types';
import { toast } from 'sonner';
import CaseService from '@/lib/services/case.service';
import FileService from '@/lib/services/file.service';
import { getToken } from '@/app/actions/auth.actions';

export default function CreateCasePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [patientData, setPatientData] = useState<CaseFormData>({
    firstName: '',
    middleName: '',
    lastName: '',
    patientId: '',
    gender: 'male',
    status: 'In Process',
    birthDate: new Date(),
    notes: ''
  });
  const [files, setFiles] = useState<File[]>([]);

  const handlePatientInfoSubmit = (data: CaseFormData) => {
    setPatientData(data);
    setStep(2);
    window.scrollTo(0, 0);
  };

  const handleFileUploadComplete = () => {
    setStep(3);
    window.scrollTo(0, 0);
  };

  const handleFilesSelected = (selectedFiles: File[]) => {
    setFiles(selectedFiles);
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      window.scrollTo(0, 0);
    } else {
      router.push('/dashboard');
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setUploadProgress(0);

    try {
      const token = await getToken()
      const caseResponse = await CaseService.createCase(patientData, token || '');
      const caseId = caseResponse.data._id;

      if (files.length > 0) {
        const uploadResponse = await FileService.uploadFiles(files, (progress) => {
          setUploadProgress(progress);
        }, token || '');

        if (uploadResponse.success && uploadResponse.data.length > 0) {
          setUploadProgress(80);
          await FileService.associateFilesWithCase(caseId, uploadResponse.data, token || '');
          setUploadProgress(100);
        }
      }

      toast.success('The patient case has been successfully created with all files.');

      router.push('/dashboard');
    } catch (error) {
      console.error('Error creating case:', error);
      toast.error('Failed to create the patient case. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container p-6 mx-auto">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Add New Case</h1>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between w-full">
          {/* Step 1 */}
          <div className="flex flex-col items-center">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center border-2 ${step === 1 ? 'bg-primary border-primary text-primary-foreground' : step > 1 ? 'bg-primary/20 border-primary text-primary' : 'bg-muted border-muted-foreground text-muted-foreground'}`}>
              <User className="h-6 w-6" />
            </div>
            <div className="text-sm font-medium mt-2 text-center">Patient Info</div>
          </div>

          <div className={`h-1 flex-1 mx-4 ${step > 1 ? 'bg-primary' : 'bg-muted'}`}></div>

          {/* Step 2 */}
          <div className="flex flex-col items-center">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center border-2 ${step === 2 ? 'bg-primary border-primary text-primary-foreground' : step > 2 ? 'bg-primary/20 border-primary text-primary' : 'bg-muted border-muted-foreground text-muted-foreground'}`}>
              <FileDigit className="h-6 w-6" />
            </div>
            <div className="text-sm font-medium mt-2 text-center">Upload Files</div>
          </div>

          <div className={`h-1 flex-1 mx-4 ${step > 2 ? 'bg-primary' : 'bg-muted'}`}></div>

          {/* Step 3 */}
          <div className="flex flex-col items-center">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center border-2 ${step === 3 ? 'bg-primary border-primary text-primary-foreground' : step > 3 ? 'bg-primary/20 border-primary text-primary' : 'bg-muted border-muted-foreground text-muted-foreground'}`}>
              <CheckCircle className="h-6 w-6" />
            </div>
            <div className="text-sm font-medium mt-2 text-center">Preview</div>
          </div>
        </div>
      </div>

      <Card className="p-6">
        {step === 1 ? (
          <PatientInfoForm
            initialData={patientData}
            onSubmit={handlePatientInfoSubmit}
          />
        ) : step === 2 ? (
          <FileUploadForm
            files={files}
            onFilesSelected={handleFilesSelected}
            onSubmit={handleFileUploadComplete}
            isLoading={false}
          />
        ) : (
          <CasePreview
            patientData={patientData}
            files={files}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            uploadProgress={uploadProgress}
          />
        )}
      </Card>
    </div>
  );
}
