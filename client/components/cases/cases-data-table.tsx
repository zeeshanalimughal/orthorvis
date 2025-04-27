'use client';

import { Case } from '@/lib/types/case.types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface PaginationProps {
  total: number;
  current: number;
  next?: { page: number; limit: number } | null;
  prev?: { page: number; limit: number } | null;
}

interface CasesDataTableProps {
  data: Case[];
  isLoading: boolean;
  pagination: PaginationProps;
  onPageChange: (page: number) => void;
  onRowClick: (id: string) => void;
}

const StatusBadge = ({ status }: { status: string }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Process':
        return 'bg-blue-100 text-blue-800';
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
      {status}
    </span>
  );
};

export function CasesDataTable({
  data,
  isLoading,
  pagination,
  onPageChange,
  onRowClick,
}: CasesDataTableProps) {
  const formatDate = (dateString: string | Date) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch {
      return 'Invalid date';
    }
  };

  return (
    <div className="w-full">
      <div className="rounded-md border bg-background">
        <Table className="bg-background">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Patient ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>Birth Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Files</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <div className="flex justify-center items-center">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    Loading cases...
                  </div>
                </TableCell>
              </TableRow>
            ) : !data || data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No cases found.
                </TableCell>
              </TableRow>
            ) : (
              data.map((caseItem) => (
                <TableRow 
                  key={caseItem._id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onRowClick(caseItem._id)}
                >
                  <TableCell className="font-medium">{caseItem.patientId}</TableCell>
                  <TableCell>{caseItem.fullName || `${caseItem.firstName} ${caseItem.lastName}`}</TableCell>
                  <TableCell className="capitalize">{caseItem.gender}</TableCell>
                  <TableCell>{formatDate(caseItem.birthDate)}</TableCell>
                  <TableCell>
                    <StatusBadge status={caseItem.status} />
                  </TableCell>
                  <TableCell>{formatDate(caseItem.createdAt)}</TableCell>
                  <TableCell>{caseItem.files?.length || 0}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination controls */}
      <div className="flex items-center justify-between py-4">
        <div className="text-sm text-muted-foreground">
          Showing page {pagination.current} of {pagination.total || 1}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.current - 1)}
            disabled={!pagination.prev || isLoading}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.current + 1)}
            disabled={!pagination.next || isLoading}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
