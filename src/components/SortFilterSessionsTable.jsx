'use client';

import { useState } from 'react';
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
import { Button } from '@/components/ui/button';
import { 
  ChevronDown, 
  Download, 
  Filter, 
  MoreHorizontal, 
  Search, 
  ArrowUpDown, 
  CalendarIcon, 
  ChevronRight 
} from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useAuth } from '@/app/context/auth-context';
import { toast } from 'sonner';
import { SessionFormModal } from '@/components/SessionFormModal';
import { authorizedFetch } from '@/services/api';

export function SortFilterSessionsTable({ 
  sessions, 
  showActions = true,
  onSuccess  // Add this prop
}) {
  const { session } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStudent, setFilterStudent] = useState('all');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterGoal, setFilterGoal] = useState('all');
  const [dateRange, setDateRange] = useState({
    from: undefined,
    to: undefined
  });
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [showSessionModal, setShowSessionModal] = useState(false);

  console.log("sessions:", sessions);

  const handleDateSelect = (range) => {
    setDateRange(range || { from: undefined, to: undefined });
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getUniqueStudents = () => {
    const uniqueStudents = new Map();
    sessions.forEach(session => {
      if (!uniqueStudents.has(session.student.id)) {
        uniqueStudents.set(session.student.id, session.student);
      }
    });
    return Array.from(uniqueStudents.values());
  };

  const getUniqueSubjects = () => {
    const uniqueSubjects = new Map();
    sessions.forEach(session => {
      if (!uniqueSubjects.has(session.objective.subject_area.id)) {
        uniqueSubjects.set(session.objective.subject_area.id, session.objective.subject_area);
      }
    });
    return Array.from(uniqueSubjects.values());
  };

  const getUniqueGoals = () => {
    const uniqueGoals = new Map();
    sessions.forEach(session => {
      if (session.objective.goal && !uniqueGoals.has(session.objective.goal.id)) {
        uniqueGoals.set(session.objective.goal.id, session.objective.goal);
      }
    });
    return Array.from(uniqueGoals.values());
  };

  const getUniqueObjectiveTypes = () => {
    return [...new Set(sessions.map(session => session.objective.objective_type))];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  const formatOutcome = (session) => {
    const { trials_completed, trials_total } = session.objective_progress;
    return `${trials_completed}/${trials_total}`;
  };

  const getFilteredAndSortedSessions = () => {
    const filtered = sessions.filter(session => {
      const matchesSearch = 
        session.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.objective.subject_area.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.objective.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (session.objective.goal && session.objective.goal.title.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStudent = filterStudent === 'all' ? true : session.student.id === filterStudent;
      const matchesSubject = filterSubject === 'all' ? true : session.objective.subject_area.id === filterSubject;
      const matchesType = filterType === 'all' ? true : session.objective.objective_type === filterType;
      const matchesGoal = filterGoal === 'all' ? true : (session.objective.goal && session.objective.goal.id === filterGoal);
      
      const sessionDate = new Date(session.created_at);
      const matchesDate = (!dateRange.from || sessionDate >= dateRange.from) && 
                         (!dateRange.to || sessionDate <= dateRange.to);
      
      return matchesSearch && matchesStudent && matchesSubject && matchesType && matchesGoal && matchesDate;
    });

    return [...filtered].sort((a, b) => {
      if (sortConfig.key === 'date') {
        const dateA = new Date(a.created_at);
        const dateB = new Date(b.created_at);
        return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
      } else if (sortConfig.key === 'name') {
        const nameA = a.student.name.toLowerCase();
        const nameB = b.student.name.toLowerCase();
        return sortConfig.direction === 'asc' 
          ? nameA.localeCompare(nameB)
          : nameB.localeCompare(nameA);
      }
      return 0;
    });
  };

  const handleExport = () => {
    const headers = [
      "Date",
      "Student",
      "Subject Area",
      "Objective",
      "Goal",
      "Type",
      "Outcome",
      "Success"
    ];
  
    const rows = getFilteredAndSortedSessions().map((session) => [
      formatDate(session.created_at),
      session.student.name,
      session.objective.subject_area.name,
      session.objective.description,
      session.objective.goal?.title || 'N/A',
      session.objective.objective_type,
      formatOutcome(session),
      session.objective_progress.is_success ? 'Yes' : 'No'
    ]);
  
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");
  
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'sessions.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteSession = async (sessionId) => {
    if (!session) return;
    
    try {
      const response = await authorizedFetch(`/sessions/${sessionId}`, session?.access_token, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete session');
      }

      toast.success('Session deleted successfully');
      if (onSuccess) {
        onSuccess(); // Call onSuccess after successful deletion
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error('Failed to delete session. Please try again.');
    }
  };

  const handleEditSession = (session) => {
    setSelectedSession(session);
    setShowSessionModal(true);
  };

  const handleSessionUpdated = () => {
    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <div className="space-y-4 w-full h-full flex flex-col">
      <div className="mb-0 pt-2 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <div className="relative flex-1 w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-emphasis-medium" />
            <Input
              placeholder="Search sessions..."
              className="pl-8 bg-background w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Collapsible
            open={isFiltersOpen}
            onOpenChange={setIsFiltersOpen}
            className="space-y-2 w-full"
          >
            <div className="flex items-center justify-between">
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 w-full md:w-auto">
                  <Filter className="h-4 w-4" />
                  Filters
                  <ChevronRight className={cn(
                    "h-4 w-4 transition-transform",
                    isFiltersOpen && "transform rotate-90"
                  )} />
                </Button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="space-y-4">
              <div className="flex flex-wrap gap-4 p-4 border rounded-lg bg-background border-border">
                <div className="flex flex-col gap-2 w-full sm:w-auto">
                  <label className="text-sm font-medium text-emphasis-high">Date Range</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full sm:w-[300px] justify-start text-left font-normal",
                          !dateRange?.from && "text-emphasis-low"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                          dateRange?.to ? (
                            <>
                              {format(dateRange.from, "LLL dd, y")} -{" "}
                              {format(dateRange.to, "LLL dd, y")}
                            </>
                          ) : (
                            format(dateRange.from, "LLL dd, y")
                          )
                        ) : (
                          <span>Pick a date range</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={handleDateSelect}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="flex flex-col gap-2 w-full sm:w-auto">
                  <label className="text-sm font-medium text-emphasis-high">Student</label>
                  <Select value={filterStudent} onValueChange={setFilterStudent}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Filter by student" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Students</SelectItem>
                      {getUniqueStudents().map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-2 w-full sm:w-auto">
                  <label className="text-sm font-medium text-emphasis-high">Subject Area</label>
                  <Select value={filterSubject} onValueChange={setFilterSubject}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Filter by subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Subjects</SelectItem>
                      {getUniqueSubjects().map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-2 w-full sm:w-auto">
                  <label className="text-sm font-medium text-emphasis-high">Objective Type</label>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {getUniqueObjectiveTypes().map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-2 w-full sm:w-auto">
                  <label className="text-sm font-medium text-emphasis-high">Goal</label>
                  <Select value={filterGoal} onValueChange={setFilterGoal}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Filter by goal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Goals</SelectItem>
                      {getUniqueGoals().map((goal) => (
                        <SelectItem key={goal.id} value={goal.id}>
                          {goal.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
        <Button 
          variant="outline" 
          className="flex items-center gap-2 mt-2 md:mt-0 w-full md:w-auto" 
          onClick={handleExport}
        >
          <Download className="h-4 w-4" />
          Export to CSV
        </Button>
      </div>

      <div className="flex-1 rounded-md border border-border bg-background w-full overflow-hidden">
        <div className="h-full overflow-auto">
          <div className="h-full min-w-[800px]">
            <Table className="divide-y divide-border w-full">
              <TableHeader className="sticky top-0 bg-[var(--surface-raised)] z-10">
                <TableRow className="hover:bg-primary/5 border-b border-border">
                  <TableHead className="w-[10%] min-w-[90px]">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('date')}
                      className="flex items-center gap-1 text-emphasis-high hover:text-emphasis-high"
                    >
                      Date
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="w-[10%] min-w-[100px]">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('name')}
                      className="flex items-center gap-1 text-emphasis-high hover:text-emphasis-high"
                    >
                      Student
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="w-[10%] min-w-[100px] text-emphasis-high">
                    Area of Need
                  </TableHead>
                  <TableHead className="w-[10%] min-w-[120px] text-emphasis-high">
                    Goal
                  </TableHead>
                  <TableHead className="w-[25%] min-w-[200px] text-emphasis-high">
                    Objective
                  </TableHead>
                  <TableHead className="w-[5%] min-w-[70px] text-emphasis-high">
                    Type
                  </TableHead>
                  <TableHead className="w-[5%] min-w-[70px] text-emphasis-high">
                    Outcome
                  </TableHead>
                  <TableHead className="w-[5%] min-w-[70px] text-emphasis-high">
                    Success
                  </TableHead>
                  <TableHead className="w-[15%] min-w-[130px] text-emphasis-high">
                    Memo
                  </TableHead>
                  {showActions && (
                    <TableHead className="w-[5%] min-w-[50px]"></TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {getFilteredAndSortedSessions().length === 0 ? (
                  <TableRow>
                    <TableCell 
                      colSpan={showActions ? 10 : 9} 
                      className="h-[200px] text-center text-emphasis-medium"
                    >
                      No sessions available
                    </TableCell>
                  </TableRow>
                ) : (
                  getFilteredAndSortedSessions().map((session) => (
                    <TableRow 
                      key={`${session.id}-${session.objective_progress.id}`} 
                      className="hover:bg-primary/5 border-b border-border text-emphasis-high"
                    >
                      <TableCell className="font-medium w-[10%] min-w-[90px]">
                        {formatDate(session.created_at)}
                      </TableCell>
                      <TableCell className="w-[10%] min-w-[100px]">
                        {session.student.name}
                      </TableCell>
                      <TableCell className="w-[10%] min-w-[100px] whitespace-normal">
                        {session.objective.subject_area.name}
                      </TableCell>
                      <TableCell className="w-[10%] min-w-[120px] whitespace-normal">
                        {session.objective.goal?.title || 'N/A'}
                      </TableCell>
                      <TableCell className="w-[25%] min-w-[200px] whitespace-normal">
                        <div className="line-clamp-3">
                          {session.objective.description}
                        </div>
                      </TableCell>
                      <TableCell className="w-[5%] min-w-[70px]">
                        {session.objective.objective_type}
                      </TableCell>
                      <TableCell className="w-[5%] min-w-[70px]">
                        {formatOutcome(session)}
                      </TableCell>
                      <TableCell className="w-[5%] min-w-[70px]">
                        <Badge variant={session.objective_progress.is_success ? "success" : "destructive"}>
                          {session.objective_progress.is_success ? "Yes" : "No"}
                        </Badge>
                      </TableCell>
                      <TableCell className="w-[15%] min-w-[100px]">
                        <div className="line-clamp-2">
                          {session.memo || '-'}
                        </div>
                      </TableCell>
                      {showActions && (
                        <TableCell className="w-[5%] min-w-[50px]">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleEditSession(session)}>
                                Edit Session
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-destructive hover:bg-destructive/10"
                                onClick={() => handleDeleteSession(session.id)}
                              >
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <SessionFormModal
        session={selectedSession}
        open={showSessionModal}
        onOpenChange={setShowSessionModal}
        onSuccess={handleSessionUpdated}
      />
    </div>
  );
} 