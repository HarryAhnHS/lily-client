'use client';

import { useAuth } from '@/app/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { authorizedFetch } from '@/services/api';
import { SortFilterSessionsTable } from '@/components/SortFilterSessionsTable';

export default function ReportsPage() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!loading && !session) {
      router.replace('/login');
    }
  }, [loading, session, router]);

  useEffect(() => {
    fetchReports();
  }, [session]);

  const fetchReports = async () => {
    if (!session) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await authorizedFetch('/sessions/sessions', session?.access_token, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch reports: ${response.status}`);
      }
      
      const data = await response.json();
      setReports(data);
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError('Failed to load reports. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    try {
      const response = await authorizedFetch(`/sessions/${sessionId}`, session?.access_token, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete session');
      }

      // Refresh the reports list
      const fetchReports = async () => {
        if (!session) return;
        
        setIsLoading(true);
        setError(null);
        
        try {
          const response = await authorizedFetch('/sessions/sessions', session?.access_token, {
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          if (!response.ok) {
            throw new Error(`Failed to fetch reports: ${response.status}`);
          }
          
          const data = await response.json();
          setReports(data);
        } catch (err) {
          console.error('Error fetching reports:', err);
          setError('Failed to load reports. Please try again later.');
        } finally {
          setIsLoading(false);
        }
      };

      fetchReports();
    } catch (error) {
      console.error('Error deleting session:', error);
      setError('Failed to delete session. Please try again later.');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="h-full container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Reports</h1>
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
      ) : (
        <SortFilterSessionsTable 
          sessions={reports}
          onDeleteSession={handleDeleteSession}
          onSuccess={fetchReports}
        />
      )}
    </div>
  );
}
