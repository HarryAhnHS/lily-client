import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { authorizedFetch } from '@/services/api';
import { ArrowLeft, ChevronRight, CheckCircle2, XCircle, CircleDot } from 'lucide-react';
import { toast } from 'sonner';
import { SortFilterSessionsTable } from '@/components/SortFilterSessionsTable';
import { useAuth } from '@/app/context/auth-context';
import { Badge } from '@/components/ui/badge';
import { useSidebarContext } from '@/app/context/sidebar-context';

export default function ObjectiveView({ objective, onBack }) {
  const { isExpanded } = useSidebarContext();
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
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  };

  const getStatusIcon = (session) => {
    const progress = session.objective_progress;
    if (progress.is_success === null) {
      return <CircleDot className="h-5 w-5 text-yellow-500" />;
    }
    return progress.is_success ? 
      <CheckCircle2 className="h-5 w-5 text-green-500" /> : 
      <XCircle className="h-5 w-5 text-red-500" />;
  };

  const getTrialText = (session) => {
    const progress = session.objective_progress;
    if (!progress) return null;
    return `${progress.trials_completed}/${progress.trials_total}`;
  };

  const recentSessions = sessions.slice(0, 5);

  if (!objective) return null;

  return (
    <div className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center ${isExpanded ? 'pl-48' : 'pl-16'}`}>
      <div className="relative w-full max-w-6xl bg-gradient-to-br from-green-950/50 via-yellow-950/50 to-black backdrop-blur-xl rounded-3xl overflow-hidden">
        <Button
          variant="ghost"
          onClick={onBack}
          className="absolute left-4 top-4 text-white/80 hover:bg-white/10 flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Student</span>
        </Button>

        <div className="max-h-[90vh] overflow-auto">
          <div className="p-6 pt-16 space-y-6">
            {/* Header with Objective Info */}
            <div className="bg-black/40 rounded-xl p-6">
              <div className="space-y-4">
                {/* Description and Type */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-xl font-semibold text-white/90">{objective.description}</h1>
                    <Badge variant="outline" className="text-xs bg-white/10">
                      {objective.objective_type}
                    </Badge>
                  </div>
                  <p className="text-sm text-white/60">Created {formatDate(objective.created_at)}</p>
                </div>

                {/* Subject Area and Goal */}
                <div className="flex items-center text-sm text-white/80">
                  <span>{objective.subject_area.name}</span>
                  <ChevronRight className="h-4 w-4 mx-1 text-white/40" />
                  <span>{objective.goal.title}</span>
                </div>

                {/* Requirements */}
                <div className="pt-4 border-t border-white/10">
                  <h2 className="text-sm font-medium text-white/60 mb-2">Requirements</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-white/60">Success Criteria</p>
                      <p className="text-white/90">
                        {objective.target_consistency_successes} out of {objective.target_consistency_trials} trials
                      </p>
                    </div>
                    {objective.objective_type === 'trial' && (
                      <div>
                        <p className="text-sm text-white/60">Target Accuracy</p>
                        <p className="text-white/90">{objective.target_accuracy * 100}%</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Sessions Summary */}
            {recentSessions.length > 0 && (
              <div className="bg-black/40 rounded-xl p-6">
                <h2 className="text-lg font-medium text-white/80 mb-4">Recent Progress</h2>
                <div className="space-y-3">
                  {recentSessions.map((session) => (
                    <div 
                      key={session.id} 
                      className="flex items-center justify-between bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(session)}
                        <div>
                          <div className="text-sm text-white/90">
                            {formatDate(session.created_at)}
                          </div>
                          <div className="text-xs text-white/60">
                            {formatTime(session.created_at)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {objective.objective_type === 'trial' && (
                          <div className="text-sm text-white/80 bg-white/10 px-2 py-1 rounded">
                            {getTrialText(session)}
                          </div>
                        )}
                        {session.memo && (
                          <div className="text-sm text-white/60 max-w-[200px] truncate">
                            {session.memo}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sessions Table */}
            <div className="bg-black/40 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-white/80">Progress History</h2>
                <p className="text-sm text-white/60">{sessions.length} sessions recorded</p>
              </div>
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