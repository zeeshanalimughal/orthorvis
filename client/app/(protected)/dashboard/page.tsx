'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Plus, CalendarIcon } from 'lucide-react';
import { CasesDataTable } from '@/components/cases/cases-data-table';
import { CaseFilters, Case } from '@/lib/types/case.types';
import CaseService from '@/lib/services/case.service';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function CasesDashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [cases, setCases] = useState<Case[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    current: 1,
    next: null as { page: number; limit: number } | null,
    prev: null as { page: number; limit: number } | null
  });
  const [filters, setFilters] = useState<CaseFilters>({
    status: 'All',
    page: 1,
    limit: 10,
    sort: '-createdAt'
  });

  useEffect(() => {
    loadCases();
  }, [filters]);

  const loadCases = async () => {
    setIsLoading(true);
    try {
      const response = await CaseService.getCases(filters);
      setCases(response.data);

      const paginationData = {
        total: response.pagination?.total || 0,
        current: response.pagination?.current || 1,
        next: response.pagination?.next || null,
        prev: response.pagination?.prev || null
      };
      setPagination(paginationData);
    } catch (error) {
      console.error('Error fetching cases:', error);
      toast.error('Failed to load cases. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCase = () => {
    router.push('/cases/create');
  };

  const handleFilterChange = (newFilters: Partial<CaseFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 1
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({
      ...prev,
      page
    }));
  };

  return (
    <div className="container p-6 mx-auto ">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Patient Cases</h1>
        <Button onClick={handleAddCase} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Case
        </Button>
      </div>

      <div className="rounded-md border p-4">
        <div className="mb-4 flex items-end gap-2 overflow-x-auto pb-2 px-1">
          {/* Status filter */}
          <div className="flex flex-col gap-1 w-[180px]">
            <label htmlFor="status" className="text-sm font-medium">
              Status
            </label>

            <Select
              value={filters.status || "All"}
              onValueChange={(value) => handleFilterChange({ status: value as 'All' | 'In Process' | 'Cancelled' | 'Completed' })}
            >
              <SelectTrigger className='h-[35px]'>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All</SelectItem>
                <SelectItem value="In Process">In Process</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Patient ID filter */}
          <div className="flex flex-col gap-1 w-[170px]">
            <label htmlFor="patientId" className="text-sm font-medium">
              Patient ID
            </label>
            <Input
              id="patientId"
              type="text"
              value={filters.patientId || ''}
              onChange={(e) => handleFilterChange({ patientId: e.target.value })}
              placeholder="ID"
            />
          </div>

          {/* Name filters */}
          <div className="flex flex-col gap-1 w-[170px]">
            <label htmlFor="firstName" className="text-sm font-medium">
              First Name
            </label>
            <Input
              id="firstName"
              type="text"
              value={filters.firstName || ''}
              onChange={(e) => handleFilterChange({ firstName: e.target.value })}
              placeholder="First"
            />
          </div>

          <div className="flex flex-col gap-1 w-[170px]">
            <label htmlFor="lastName" className="text-sm font-medium">
              Last Name
            </label>
            <Input
              id="lastName"
              type="text"
              value={filters.lastName || ''}
              onChange={(e) => handleFilterChange({ lastName: e.target.value })}
              placeholder="Last"
            />
          </div>

          {/* Date range filters */}
          <div className="flex flex-col gap-1 w-[170px]">
            <label className="text-sm font-medium">
              From
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal px-2 py-4.5"
                  size="sm"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.startDate ? (
                    format(new Date(filters.startDate), 'PPP')
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={filters.startDate ? new Date(filters.startDate) : undefined}
                  onSelect={(date) => handleFilterChange({ startDate: date ? date.toISOString() : undefined })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex flex-col gap-1 w-[170px]">
            <label className="text-sm font-medium">
              To
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal px-2 py-4.5"
                  size="sm"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.endDate ? (
                    format(new Date(filters.endDate), 'PPP')
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={filters.endDate ? new Date(filters.endDate) : undefined}
                  onSelect={(date) => handleFilterChange({ endDate: date ? date.toISOString() : undefined })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Reset filters button */}
          <div className="flex flex-col gap-1 w-[170px]">
            <label className="text-sm font-medium">&nbsp;</label>
            <Button
              variant="default"
              onClick={() => handleFilterChange({
                status: 'All',
                firstName: '',
                lastName: '',
                patientId: '',
                gender: undefined,
                startDate: undefined,
                endDate: undefined
              })}
              size="sm"
              className='py-4.5'
            >
              Reset Filters
            </Button>
          </div>
        </div>

        <CasesDataTable
          data={cases}
          isLoading={isLoading}
          pagination={pagination}
          onPageChange={handlePageChange}
          onRowClick={(caseId) => router.push(`/cases/${caseId}`)}
        />
      </div>
    </div>
  );
}
