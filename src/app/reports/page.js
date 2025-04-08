'use client';

import { useAuth } from '@/app/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { authorizedFetch } from '@/services/api';

import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Download, Filter, MoreHorizontal, Search } from 'lucide-react';

export default function ReportsPage() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStudent, setFilterStudent] = useState('all');
  const [filterSubject, setFilterSubject] = useState('all');

  useEffect(() => {
    if (!loading && !session) {
      router.replace('/login');
    }
  }, [loading, session, router]);

  useEffect(() => {
    const fetchReports = async () => {
      if (!session) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch data from the backend API
        const response = await authorizedFetch('/sessions', session?.access_token, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch reports: ${response.status}`);
        }
        
        const data = await response.json();
        setReports(data);
      } 
      catch (err) {
        console.error('Error fetching reports:', err);
        setError('Failed to load reports. Please try again later.');
      } 
      finally {
        setIsLoading(false);
      }
    };
    
    fetchReports();
  }, [session]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  const getUniqueStudents = () => {
    return [...new Set(reports.map(report => report.student.name))];
  };

  const getUniqueSubjects = () => {
    return [...new Set(reports.map(report => report.objective.subject_area.name))];
  };

  const handleExport = () => {
    const headers = [
      "Date",
      "Student",
      "Subject Area",
      "Objective",
      "Summary",
      "Progress (+/-)"
    ];
  
    const rows = filteredReports.map((report) => [
      formatDate(report.created_at),
      report.student.name,
      report.objective.subject_area.name,
      report.objective.description,
      report.summary || report.raw_input,
      `${report.progress_delta > 0 ? `+${report.progress_delta}%` : `${report.progress_delta || 0}%`}`,
    ]);
  
    // Combine headers and rows
    const csvContent = [
      headers.join(","), // Header row
      ...rows.map(row => row.join(",")) // Data rows
    ].join("\n");
  
    // Create a Blob from the CSV string
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
    // Create an anchor element to trigger the download
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'reports.csv'; // Specify the filename
    document.body.appendChild(link); // Append the link to the body
    link.click(); // Simulate the click to download the file
    document.body.removeChild(link); // Clean up the DOM
  };
  

  const filteredReports = reports.filter(report => {
    const matchesSearch = 
      report.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.objective.subject_area.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.objective.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStudent = filterStudent === 'all' ? true : report.student.name === filterStudent;
    const matchesSubject = filterSubject === 'all' ? true : report.objective.subject_area.name === filterSubject;
    
    return matchesSearch && matchesStudent && matchesSubject;
  });

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Reports</h1>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Export view to CSV
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 mb-6 rounded-md bg-destructive/10 text-destructive">
          {error}
        </div>
      )}

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search reports..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={filterStudent} onValueChange={setFilterStudent}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by student" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Students</SelectItem>
              {getUniqueStudents().map((student) => (
                <SelectItem key={student} value={student}>
                  {student}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterSubject} onValueChange={setFilterSubject}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by subject" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {getUniqueSubjects().map((subject) => (
                <SelectItem key={subject} value={subject}>
                  {subject}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      ) : filteredReports.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Subject Area</TableHead>
                <TableHead>Objective</TableHead>
                <TableHead>Summary</TableHead>
                <TableHead>Progress (+/-)</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-medium">{formatDate(report.created_at)}</TableCell>
                  <TableCell>{report.student.name}</TableCell>
                  <TableCell>{report.objective.subject_area.name}</TableCell>
                  <TableCell>{report.objective.description}</TableCell>
                  <TableCell className="max-w-[300px] truncate">{report.summary || report.raw_input}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 w-32">
                        <div className="relative w-full h-2 bg-muted rounded-full overflow-hidden">
                            {/* Background line */}
                            <div className="absolute top-0 left-1/2 w-px h-full bg-border" />

                            {/* Negative (left side) */}
                            {report.progress_delta < 0 && (
                            <div
                                className="absolute left-1/2 top-0 h-full bg-red-500"
                                style={{ width: `${Math.min(Math.abs(report.progress_delta), 100) / 2}%`, transform: 'translateX(-100%)' }}
                            />
                            )}

                            {/* Positive (right side) */}
                            {report.progress_delta > 0 && (
                            <div
                                className="absolute left-1/2 top-0 h-full bg-green-500"
                                style={{ width: `${Math.min(report.progress_delta, 100) / 2}%` }}
                            />
                            )}
                        </div>
                        <span className="text-sm font-medium">
                            {report.progress_delta > 0 ? `+${report.progress_delta}%` : `${report.progress_delta || 0}%`}
                        </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Edit Report</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium mb-2">No reports found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || filterStudent !== 'all' || filterSubject !== 'all'
              ? "No sessions match your search criteria."
              : "You don't have any sessions yet."}
          </p>
          <Button>Create Your First Session</Button>
        </div>
      )}
    </div>
  );
}
