'use client';

import { useAuth } from '@/app/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { authorizedFetch } from '@/services/api';
import { StudentFormModal } from '@/components/StudentFormModal';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Avatar, 
  AvatarFallback, 
  AvatarImage 
} from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { ObjectiveFormModal } from '@/components/ObjectiveFormModal';

export default function StudentsPage() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showObjectiveModal, setShowObjectiveModal] = useState(false);

  useEffect(() => {
    if (!loading && !session) {
      router.replace('/login');
    }
  }, [loading, session, router]);

  const fetchStudents = async () => {
    if (!session) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await authorizedFetch('/students', session?.access_token, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch students: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Students data", data);
      setStudents(data);
    } 
    catch (err) {
      console.error('Error fetching students:', err);
      setError('Failed to load students. Please try again later.');
    } 
    finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [session]);

  const formatDate = (dateString) => {
    if (!dateString) return 'No sessions yet';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const handleStudentAdded = () => {
    fetchStudents();
    toast.success('Student added successfully');
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Students</h1>
        <StudentFormModal onSuccess={handleStudentAdded} open={showStudentModal}
      onOpenChange={setShowStudentModal}/>
        <ObjectiveFormModal onSuccess={handleStudentAdded} students={students} open={showObjectiveModal}
      onOpenChange={setShowObjectiveModal} onStudentOpenChange={setShowStudentModal}/>
      </div>

      {error && (
        <div className="p-4 mb-6 rounded-md bg-destructive/10 text-destructive">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      ) : students.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {students.map((student) => (
            <Card key={student.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={student.avatar_url} alt={student.name} />
                    <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle>{student.name}</CardTitle>
                    <CardDescription>Grade {student.grade}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant={student.status === 'active' ? 'default' : 'secondary'}>
                    {student.status}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Last session: {formatDate(student.last_session_date)}
                  </span>
                </div>
                
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Current Objectives</h4>
                  {student.objectives && student.objectives.length > 0 ? (
                    student.objectives.map((objective, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">
                            {objective.description}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {objective.progress}%
                          </span>
                        </div>
                        <Progress value={objective.progress} className="h-2" />
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No objectives set yet
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium mb-2">No students found</h3>
          <p className="text-muted-foreground mb-4">
            You don&apos;t have any students assigned to you yet.
          </p>
          <StudentFormModal onSuccess={handleStudentAdded} />
        </div>
      )}
    </div>
  );
}
