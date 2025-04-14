'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { authorizedFetch } from '@/services/api';
import { useAuth } from '@/app/context/auth-context';
import { toast } from 'sonner';
import { FileText, Check, X, ChevronRight, ChevronLeft } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export function IEPPreviewModal({ 
  isOpen, 
  onClose, 
  iepData, 
  onSave,
  onBack
}) {
  const { session } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('student');

  const handleSave = async () => {
    if (!session) {
      toast.error('You must be logged in to save IEP data');
      return;
    }

    setIsSaving(true);

    try {
      const response = await authorizedFetch('/iep-upload/save', session.access_token, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(iepData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to save IEP data');
      }

      const data = await response.json();
      toast.success(`Student ${data.student_name} added successfully`);
      
      if (onSave) {
        onSave(data);
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving IEP data:', error);
      toast.error(`Failed to save IEP data: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (!iepData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Preview IEP Data</DialogTitle>
          <DialogDescription>
            Review the parsed IEP information before saving to the database.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="student">Student Info</TabsTrigger>
              <TabsTrigger value="areas">Areas of Need</TabsTrigger>
              <TabsTrigger value="summary">Summary</TabsTrigger>
            </TabsList>
            
            <TabsContent value="student" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Student Information</CardTitle>
                  <CardDescription>Basic information about the student</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Name</p>
                      <p className="text-lg">{iepData.student_name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Grade Level</p>
                      <p className="text-lg">{iepData.grade_level}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Disability Type</p>
                      <p className="text-lg">{iepData.disability_type || 'Not specified'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="areas" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Areas of Need</CardTitle>
                  <CardDescription>Subject areas and associated goals</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {iepData.areas_of_need.map((area, areaIndex) => (
                    <div key={areaIndex} className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-base px-3 py-1">
                          {area.area_name}
                        </Badge>
                      </div>
                      
                      <div className="pl-4 space-y-4">
                        {area.goals.map((goal, goalIndex) => (
                          <div key={goalIndex} className="space-y-2">
                            <p className="font-medium">Goal: {goal.goal_description}</p>
                            
                            <div className="pl-4 space-y-2">
                              {goal.objectives.map((objective, objIndex) => (
                                <div key={objIndex} className="flex items-start gap-2">
                                  <div className="mt-1.5">
                                    <Check className="h-4 w-4 text-primary" />
                                  </div>
                                  <p>{objective.description}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {areaIndex < iepData.areas_of_need.length - 1 && (
                        <Separator className="my-4" />
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="summary" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Summary</CardTitle>
                  <CardDescription>Overview of the IEP data</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Student Name</p>
                      <p className="text-lg">{iepData.student_name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Grade Level</p>
                      <p className="text-lg">{iepData.grade_level}</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Areas of Need</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {iepData.areas_of_need.map((area, index) => (
                        <Badge key={index} variant="secondary">
                          {area.area_name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Goals</p>
                    <p className="text-lg">
                      {iepData.areas_of_need.reduce((total, area) => total + area.goals.length, 0)}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Objectives</p>
                    <p className="text-lg">
                      {iepData.areas_of_need.reduce((total, area) => 
                        total + area.goals.reduce((goalTotal, goal) => goalTotal + goal.objectives.length, 0), 0
                      )}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        <DialogFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={onBack}
            disabled={isSaving}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save to Database'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 