import { useState, useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Clock, 
  CheckCircle,
  XCircle
} from 'lucide-react';

const TIME_RANGES = {
  LAST_5: 'last_5',
  LAST_10: 'last_10',
  LAST_30: 'last_30',
  ALL: 'all'
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
  } catch (error) {
    return '';
  }
};

const CustomLineTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background p-2 border border-border/50 rounded-md shadow-md text-xs">
        <p className="font-medium">{formatDate(payload[0].payload.date)}</p>
        <p className="text-primary">Accuracy: {payload[0].value}%</p>
      </div>
    );
  }
  return null;
};

export default function PerformanceCharts({ 
  sessions = [], 
  objectiveType = 'binary',
  trialBased = false
}) {
  const [timeRange, setTimeRange] = useState(TIME_RANGES.LAST_5);
  
  // Process data for visualizations
  const chartData = useMemo(() => {
    // Sort sessions by date (newest first)
    const sortedSessions = [...sessions].sort((a, b) => 
      new Date(b.created_at) - new Date(a.created_at)
    );
    
    let filteredSessions;
    // Apply time range filter
    switch (timeRange) {
      case TIME_RANGES.LAST_5:
        filteredSessions = sortedSessions.slice(0, 5).reverse();
        break;
      case TIME_RANGES.LAST_10:
        filteredSessions = sortedSessions.slice(0, 10).reverse();
        break;
      case TIME_RANGES.LAST_30:
        filteredSessions = sortedSessions.slice(0, 30).reverse();
        break;
      case TIME_RANGES.ALL:
        filteredSessions = [...sortedSessions].reverse();
        break;
      default:
        filteredSessions = sortedSessions.slice(0, 5).reverse();
    }
    
    if (objectiveType === 'trial' || trialBased) {
      // For trial-based: calculate accuracy percentages
      return filteredSessions.map(session => {
        const progress = session.objective_progress || {};
        const trialsCompleted = progress.trials_completed || 0;
        const trialsTotal = progress.trials_total || 1; // Avoid division by zero
        const accuracyPercentage = Math.round((trialsCompleted / trialsTotal) * 100);
        
        return {
          date: session.created_at,
          accuracy: accuracyPercentage,
          label: formatDate(session.created_at)
        };
      });
    } else {
      // For binary: success/failure dots
      return filteredSessions.map((session, index) => {
        const progress = session.objective_progress || {};
        const isSuccess = progress.is_success === true;
        
        return {
          date: session.created_at,
          isSuccess: isSuccess,
          label: formatDate(session.created_at)
        };
      });
    }
  }, [sessions, timeRange, objectiveType, trialBased]);
  
  const handleTimeRangeChange = (newRange) => {
    setTimeRange(newRange);
  };
  
  // Calculate appropriate height
  const chartHeight = Math.max(200, Math.min(chartData.length * 40, 300));
  
  // Render binary progress as circles in a line
  const renderBinaryProgress = () => {
    if (chartData.length === 0) return null;
    
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="flex items-center justify-center gap-6 mb-4">
          {chartData.map((session, index) => (
            <div key={index} className="flex flex-col items-center">
              {session.isSuccess ? (
                <div className="w-10 h-10 rounded-full bg-green-500/80 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-red-500/80 flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-white" />
                </div>
              )}
              
              <div className="text-xs mt-2 font-medium">{session.label}</div>
              <div className="text-xs text-emphasis-medium">
                {session.isSuccess ? 'Success' : 'Failure'}
              </div>
            </div>
          ))}
        </div>
        
        <div className="w-full border-t border-border/30 pt-2">
          <div className="w-full h-1 bg-border/30 relative">
            <div 
              className="absolute h-1 bg-primary/50" 
              style={{ 
                width: `${chartData.filter(d => d.isSuccess).length / chartData.length * 100}%` 
              }}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs">
            <span>Progress: {chartData.filter(d => d.isSuccess).length} of {chartData.length}</span>
            <span>{Math.round(chartData.filter(d => d.isSuccess).length / chartData.length * 100)}%</span>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="bg-primary/5 p-4 rounded-xl border border-border/30 mb-6">
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-medium text-sm">Performance Trends</h4>
        
        <div className="flex items-center gap-1 text-xs">
          <Button 
            variant={timeRange === TIME_RANGES.LAST_5 ? "default" : "ghost"} 
            size="sm" 
            className="h-7 px-2 text-xs"
            onClick={() => handleTimeRangeChange(TIME_RANGES.LAST_5)}
          >
            Last 5
          </Button>
          <Button 
            variant={timeRange === TIME_RANGES.LAST_10 ? "default" : "ghost"} 
            size="sm" 
            className="h-7 px-2 text-xs"
            onClick={() => handleTimeRangeChange(TIME_RANGES.LAST_10)}
          >
            Last 10
          </Button>
          <Button 
            variant={timeRange === TIME_RANGES.LAST_30 ? "default" : "ghost"} 
            size="sm" 
            className="h-7 px-2 text-xs"
            onClick={() => handleTimeRangeChange(TIME_RANGES.LAST_30)}
          >
            Last 30
          </Button>
          <Button 
            variant={timeRange === TIME_RANGES.ALL ? "default" : "ghost"} 
            size="sm" 
            className="h-7 px-2 text-xs"
            onClick={() => handleTimeRangeChange(TIME_RANGES.ALL)}
          >
            All
          </Button>
        </div>
      </div>
      
      <div className="border border-border/30 rounded-lg bg-accent/10 p-3">
        {chartData.length === 0 ? (
          <div className="h-[200px] flex items-center justify-center text-emphasis-medium text-sm">
            Not enough data to display chart
          </div>
        ) : (
          <div className="h-[200px]">
            {(objectiveType === 'trial' || trialBased) ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 5, left: -20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                  <XAxis 
                    dataKey="label" 
                    tick={{ fontSize: 11 }} 
                    tickMargin={5}
                    axisLine={{ stroke: 'var(--border)' }}
                  />
                  <YAxis 
                    domain={[0, 100]} 
                    tick={{ fontSize: 11 }} 
                    tickFormatter={(val) => `${val}%`}
                    axisLine={{ stroke: 'var(--border)' }}
                  />
                  <Tooltip content={<CustomLineTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="accuracy" 
                    stroke="var(--primary)" 
                    strokeWidth={2} 
                    dot={{ r: 4, fill: 'var(--primary)', strokeWidth: 1 }}
                    activeDot={{ r: 6, fill: 'var(--primary)', stroke: 'white', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              renderBinaryProgress()
            )}
          </div>
        )}
      </div>
      
      <div className="flex justify-between items-center text-xs text-emphasis-medium mt-3">
        <div className="flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          <span>Time Range: {chartData.length > 0 ? 
            `${formatDate(chartData[0]?.date)} - ${formatDate(chartData[chartData.length - 1]?.date)}` : 
            'No data'
          }</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          <span>Sessions: {chartData.length}</span>
        </div>
      </div>
    </div>
  );
} 