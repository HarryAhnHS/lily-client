import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { authorizedFetch } from '@/services/api';
import { X, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { SortFilterSessionsTable } from '@/components/SortFilterSessionsTable';
import { useAuth } from '@/app/context/auth-context';
import { Badge } from '@/components/ui/badge';

export default function ObjectiveView({ objective, onBack }) {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { session } = useAuth();

  const fetchSessions = async () => {
    if (!session) return;
    
    setIsLoading(true);
    try {
      const response = await authorizedFetch(`/sessions/objective/${objective.id}`, session?.access_token);
      if (!response.ok) throw new Error('Failed to fetch sessions');
      const data = await response.json();
      setSessions(data);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Failed to load sessions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [session, objective.id]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (!objective) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-6xl bg-gradient-to-br from-green-950/50 via-yellow-950/50 to-black backdrop-blur-xl rounded-3xl overflow-hidden">
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="absolute right-4 top-4 rounded-full bg-white/10 text-white/80 hover:bg-white/20 z-10"
        >
          <X className="h-4 w-4" />
        </Button>

        <div className="max-h-[90vh] overflow-auto">
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">
                <Activity className="w-6 h-6 text-white/80" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-semibold text-white/80">
                    {objective.description}
                  </h1>
                  <Badge variant="outline" className="text-xs bg-white/10">
                    {objective.objective_type}
                  </Badge>
                </div>
                <p className="text-sm text-white/60">Created {formatDate(objective.created_at)}</p>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column - Progress */}
              <div className="space-y-6">
                <div className="bg-black/40 rounded-xl p-6 space-y-4">
                  <h2 className="text-lg font-medium text-white/80">Progress Requirements</h2>
                  <div className="space-y-4">
                    {objective.objective_type === 'trial' && (
                      <div>
                        <p className="text-sm text-white/60">Target Accuracy</p>
                        <p className="text-white/90">{objective.target_accuracy * 100}%</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-white/60">Consistency Target</p>
                      <p className="text-white/90">
                        {objective.target_consistency_successes} successes in {objective.target_consistency_trials} trials
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Stats */}
              <div className="bg-black/40 rounded-xl p-6 space-y-4">
                <h2 className="text-lg font-medium text-white/80">Current Progress</h2>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-white/60">Session Count</span>
                      <span className="text-sm font-medium text-white/80">
                        {sessions.length} sessions
                      </span>
                    </div>
                    <Progress value={sessions.length > 0 ? (sessions.length / 10) * 100 : 0} className="h-2 bg-white/10" />
                  </div>
                  <div>
                    <p className="text-sm text-white/60">Last Session</p>
                    <p className="text-white/90">
                      {sessions.length > 0 
                        ? formatDate(sessions[0].created_at)
                        : 'No sessions yet'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sessions Table */}
            <div className="bg-black/40 rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-medium text-white/80">Sessions</h2>
              <SortFilterSessionsTable 
                sessions={sessions}
                showActions={true}
                onSuccess={fetchSessions}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 