'use client';

import { useAuth } from '@/app/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mic, MicOff } from 'lucide-react';

// Mock API data
const mockStudents = [
  { id: '1', name: 'John Doe' },
  { id: '2', name: 'Jane Smith' },
  { id: '3', name: 'Bob Johnson' },
];

const mockObjectives = {
  '1': [
    { id: '1-1', title: 'Reading Comprehension' },
    { id: '1-2', title: 'Writing Skills' },
  ],
  '2': [
    { id: '2-1', title: 'Math Problem Solving' },
    { id: '2-2', title: 'Algebra Basics' },
  ],
  '3': [
    { id: '3-1', title: 'Science Projects' },
    { id: '3-2', title: 'Lab Safety' },
  ],
};

export default function Home() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [students, setStudents] = useState([]);
  const [objectives, setObjectives] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedObjective, setSelectedObjective] = useState('');
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!loading && !session) {
      router.replace('/login');
    }
  }, [loading, session, router]);

  useEffect(() => {
    const fetchData = async () => {
      if (!session) return;
      
      setIsLoadingData(true);
      setError(null);
      
      try {
        // Mock API call for students
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
        setStudents(mockStudents);
      } 
      catch (err) {
        console.error('Error fetching students:', err);
        setError('Failed to load students');
      } 
      finally {
        setIsLoadingData(false);
      }
    };
    
    fetchData();
  }, [session]);

  // Update objectives when student is selected
  useEffect(() => {
    if (selectedStudent) {
      setObjectives(mockObjectives[selectedStudent] || []);
      setSelectedObjective(''); // Reset objective selection
    } else {
      setObjectives([]);
      setSelectedObjective('');
    }
  }, [selectedStudent]);

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // Here you would implement the actual recording functionality
    // For now, we're just toggling the state
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="flex flex-col items-center justify-center p-6 min-h-screen">
      <div className="w-full max-w-2xl rounded-lg bg-card p-6 shadow space-y-6">
        <h1 className="text-2xl font-bold text-center">Record Your Notes</h1>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Student</label>
              {isLoadingData ? (
                <div className="h-10 flex items-center justify-center">
                  <LoadingSpinner size="small" />
                </div>
              ) : students.length > 0 ? (
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="h-10 flex items-center justify-center text-muted-foreground">
                  No students available
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Objective</label>
              {!selectedStudent ? (
                <div className="h-10 flex items-center justify-center text-muted-foreground">
                  Select a student first
                </div>
              ) : objectives.length > 0 ? (
                <Select value={selectedObjective} onValueChange={setSelectedObjective}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an objective" />
                  </SelectTrigger>
                  <SelectContent>
                    {objectives.map((objective) => (
                      <SelectItem key={objective.id} value={objective.id}>
                        {objective.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="h-10 flex items-center justify-center text-muted-foreground">
                  No objectives available
                </div>
              )}
            </div>
          </div>
          
          {error && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Notes</label>
            <Textarea 
              placeholder="Your notes will appear here..." 
              className="min-h-[200px] resize-none"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
            />
          </div>
          
          <div className="flex justify-center">
            <Button 
              onClick={toggleRecording} 
              variant={isRecording ? "destructive" : "default"}
              size="lg"
              className="rounded-full w-16 h-16 p-0 flex items-center justify-center"
            >
              {isRecording ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}