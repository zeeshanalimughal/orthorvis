'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PatientInfoForm } from '@/components/cases/patient-info-form';
import { FileUploadForm } from '@/components/cases/file-upload-form';
import { toast } from 'sonner';
import { ArrowLeft, Edit, Trash2, File, X, Eye, Image as ImageIcon } from 'lucide-react';
import CaseService from '@/lib/services/case.service';
import FileService from '@/lib/services/file.service';
import { CaseFormData, Case } from '@/lib/types/case.types';
import { format } from 'date-fns';
import Image from 'next/image';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { getToken } from '@/app/actions/auth.actions';



export default function CaseDetailPage() {


  const params: { id: string } = useParams()
  const { id } = params;
  const router = useRouter();
  // Sonner toast is imported directly
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDeletingFile, setIsDeletingFile] = useState(false);

  useEffect(() => {
    loadCaseData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadCaseData = async () => {
    setIsLoading(true);
    try {
      const token = await getToken()
      const response = await CaseService.getCase(id, token as string);
      if (response.success && response.data) {
        setCaseData(response.data);
      } else {
        toast.error("Failed to load case data");
        router.push('/dashboard');
      }
    } catch (err) {
      console.error('Error loading case:', err);
      toast.error('An error occurred while loading the case');
      router.push('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSubmit = async (data: CaseFormData) => {
    try {
      const token = await getToken()
      const response = await CaseService.updateCase(id, data, token || "");
      if (response.success) {
        setCaseData(response.data);
        setIsEditing(false);
        toast.success('Case information updated successfully');
      }
    } catch (err) {
      console.error('Error updating case:', err);
      toast.error('Failed to update case information');
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const token = await getToken()
      const response = await CaseService.deleteCase(id, token || '');
      if (response.success) {
        toast.success('Case deleted successfully');
        router.push('/dashboard');
      } else {
        throw new Error('Failed to delete case');
      }
    } catch (err) {
      console.error('Error deleting case:', err);
      toast.error('Failed to delete the case');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles(files);
  };

  const handleUploadFiles = async (progressCallback?: (progress: number) => void) => {
    if (selectedFiles.length === 0) return;

    try {
      const token = await getToken()
      const uploadResponse = await FileService.uploadFiles(selectedFiles, progressCallback, token || '');

      if (uploadResponse.success && uploadResponse.data.length > 0) {
        const associateResponse = await FileService.associateFilesWithCase(id, uploadResponse.data, token || '');

        if (associateResponse.success) {
          setCaseData(associateResponse.data);
          setSelectedFiles([]);

          toast.success('Files uploaded and associated with case successfully');

          if (progressCallback) {
            progressCallback(100);
          }
        }
      }
    } catch (err) {
      console.error('Error uploading files:', err);
      toast.error('Failed to upload or associate files');
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!fileId || !id) return;

    setIsDeletingFile(true);
    try {
      const response = await FileService.removeFileFromCase(id, fileId);
      if (response.success) {
        setCaseData(response.data);
        toast.success('File removed successfully');
      }
    } catch (err) {
      console.error('Error deleting file:', err);
      toast.error('Failed to delete the file');
    } finally {
      setIsDeletingFile(false);
    }
  };

  const formatDate = (dateString: string | Date): string => {
    try {
      return format(new Date(dateString), 'PPP');
    } catch (err) {
      console.error('Failed to format date', err);
      return dateString.toString();
    }
  };

  if (isLoading) {
    return (
      <div className="container p-6 mx-auto flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading case information...</p>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="container p-6 mx-auto">
        <div className="text-center py-10">
          <h2 className="text-2xl font-bold mb-2">Case Not Found</h2>
          <p className="mb-4">The requested case could not be found or you don&apos;t have permission to view it.</p>
          <Button onClick={() => router.push('/dashboard')}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const patientFormData: CaseFormData = {
    firstName: caseData.firstName,
    middleName: caseData.middleName || '',
    lastName: caseData.lastName,
    patientId: caseData.patientId,
    gender: caseData.gender,
    status: caseData.status || 'In Process',
    birthDate: caseData.birthDate,
    notes: caseData.notes || '',
  };

  return (
    <div className="container p-6 mx-auto">
      <div className="flex items-center mb-6 gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/dashboard')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>

        <h1 className="text-3xl font-bold flex-1">Case Details</h1>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsEditing(!isEditing)}
            className="gap-2"
          >
            <Edit className="h-4 w-4" />
            {isEditing ? 'Cancel Edit' : 'Edit Case'}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                disabled={isDeleting}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                {isDeleting ? 'Deleting...' : 'Delete Case'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Case</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this case? This action cannot be undone and all associated files will be permanently deleted.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-red-500 hover:bg-red-700"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="details">Patient Details</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-6">
          <Card>
            {isEditing ? (
              <CardContent className="pt-6">
                <PatientInfoForm
                  initialData={patientFormData}
                  onSubmit={handleEditSubmit}
                />
              </CardContent>
            ) : (
              <>
                <CardHeader>
                  <CardTitle>{caseData.fullName || `${caseData.firstName} ${caseData.lastName}`}</CardTitle>
                  <CardDescription>Patient Information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Patient ID</h3>
                      <p>{caseData.patientId}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Gender</h3>
                      <p className="capitalize">{caseData.gender}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Birth Date</h3>
                      <p>{formatDate(caseData.birthDate)}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                      <p>{caseData.status}</p>
                    </div>
                  </div>

                  {caseData.notes && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Notes</h3>
                      <p className="text-sm">{caseData.notes}</p>
                    </div>
                  )}

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Created On</h3>
                    <p>{formatDate(caseData.createdAt)}</p>
                  </div>
                </CardContent>
              </>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="files" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Files</CardTitle>
              <CardDescription>
                {caseData.files && caseData.files.length > 0
                  ? `${caseData.files.length} file${caseData.files.length === 1 ? '' : 's'} uploaded`
                  : 'No files uploaded yet'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {caseData.files && caseData.files.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {caseData.files.map((file) => (
                    <div key={file._id} className="flex items-center p-3 border rounded group relative">
                      {file.mimetype?.startsWith('image/') ? (
                        <div className="relative h-12 w-12 mr-3 border rounded overflow-hidden flex-shrink-0">
                          <Image
                            src={FileService.getFileUrl(file.path)}
                            alt={file.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : file.mimetype?.includes('dicom') || file.name.toLowerCase().endsWith('.dcm') ? (
                        <ImageIcon className="h-12 w-12 mr-3 p-2 border rounded text-blue-500" />
                      ) : (
                        <File className="h-12 w-12 mr-3 p-2 border rounded" />
                      )}
                      <div className="overflow-hidden flex-1">
                        <p className="font-medium truncate">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <div className="flex items-center">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 mr-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                aria-label={`View ${file.name}`}
                                onClick={() => FileService.openFileInNewTab(file.path)}
                              >
                                <Eye className="h-4 w-4 text-blue-500" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>View file</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                              aria-label={`Delete ${file.name}`}
                            >
                              <X className="h-4 w-4 text-red-500" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete File</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this file? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteFile(file._id)}
                                className="bg-red-500 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <p>No files have been uploaded for this case.</p>
                </div>
              )}

              <div className="mt-6">
                <h3 className="font-medium mb-4">Upload Additional Files</h3>
                <FileUploadForm
                  files={selectedFiles}
                  onFilesSelected={handleFilesSelected}
                  onSubmit={handleUploadFiles}
                  isLoading={isDeletingFile}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
