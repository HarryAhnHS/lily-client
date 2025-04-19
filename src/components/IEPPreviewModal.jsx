'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { authorizedFetch } from '@/services/api';
import { useAuth } from '@/app/context/auth-context';
import { toast } from 'sonner';
import { ChevronLeft, Users } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import ObjectiveView from '@/components/ObjectiveView';

export function IEPPreviewModal({ 
  isOpen, 
  onClose, 
  iepData, 
  onSave,
  onBack
}) {
  const { session } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [selectedAreas, setSelectedAreas] = useState({});
  const [selectedObjective, setSelectedObjective] = useState(null);
  
  // Initialize the selected areas when iepData changes
  useEffect(() => {
    if (iepData && iepData.areas_of_need) {
      const initialAreas = {};
      iepData.areas_of_need.forEach(area => {
        initialAreas[area.area_name] = false;
      });
      setSelectedAreas(initialAreas);
    }
  }, [iepData]);

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
      toast.success(`Student ${data.student_name} added successfully with areas of need, goals, and objectives`);
      
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

  // Toggle area selection
  const toggleArea = (areaName) => {
    setSelectedAreas(prev => ({
      ...prev,
      [areaName]: !prev[areaName]
    }));
  };

  // Handle objective click
  const handleObjectiveClick = (objective, area, goal) => {
    // Enhance the objective with subject area and goal information
    const enhancedObjective = {
      ...objective,
      // Add the goal and subject area information since this is a preview
      subject_area: { name: area.area_name },
      goal: { title: goal.goal_description }
    };
    setSelectedObjective(enhancedObjective);
  };

  if (!iepData) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-7xl max-w-[100vw] h-[90vh] p-0 border-0 bg-[#e0e0e0] overflow-hidden">
          <DialogTitle className="sr-only">IEP Preview</DialogTitle>
          <div className="w-full h-full overflow-y-auto bg-[#e0e0e0] p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <div className="bg-black rounded-md p-1">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <span className="text-[#1a1a1a] font-medium">IEP Preview</span>
              </div>
            </div>

            <div className="mb-4">
              <button 
                onClick={onBack} 
                className="text-[#595959] flex items-center gap-1 hover:text-black transition-colors duration-200 hover:scale-105 transform p-1 rounded-md"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            </div>

            <div className="bg-[#f0f0f0] rounded-[16px] p-4 mb-6">
              <div className="mb-4">
                <h2 className="text-xl font-medium text-[#1a1a1a]">{iepData.student_name}</h2>
                <div className="mt-2 grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-[#595959]">Grade Level</span>
                    <p className="text-[#1a1a1a]">Grade {iepData.grade_level || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-[#595959]">Disability Type</span>
                    <p className="text-[#1a1a1a]">{iepData.disability_type || 'Not specified'}</p>
                  </div>
                </div>
              </div>

              <div className="max-h-[400px] overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <div className="mb-6">
                  <h3 className="font-medium text-[#1a1a1a] mb-2">Student Summary</h3>
                  <p className="text-sm text-[#1a1a1a]">{iepData.summary || 'No summary available'}</p>
                </div>

                <div className="mb-6">
                  <div className="mb-4">
                    <h3 className="font-medium text-[#1a1a1a]">Areas of Need</h3>
                    <p className="text-sm text-[#595959] mt-1">Select areas to view objectives</p>
                  </div>

                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2 mb-4">
                      {iepData.areas_of_need.map((area, index) => (
                        <button
                          key={index}
                          onClick={() => toggleArea(area.area_name)}
                          className={`px-4 py-2 rounded-md ${
                            selectedAreas[area.area_name] ? "bg-black text-white" : "bg-[#d0d0d0] text-[#1a1a1a]"
                          }`}
                        >
                          {area.area_name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {iepData.areas_of_need.map((area, areaIndex) => (
                      selectedAreas[area.area_name] && (
                        <div key={areaIndex} className="mb-4">
                          <h4 className="text-[#1a1a1a] font-medium mb-2">{area.area_name}</h4>
                          <div className="space-y-4">
                            {area.goals.map((goal, goalIndex) => (
                              <div key={goalIndex} className="space-y-2">
                                <p className="font-medium text-black">Goal: {goal.goal_description}</p>
                                
                                <div className="space-y-2">
                                  {goal.objectives.map((objective, objIndex) => (
                                    <div
                                      key={objIndex}
                                      className="bg-white rounded-md p-3 text-sm text-[#1a1a1a] mb-2 flex justify-between items-center group cursor-pointer hover:bg-gray-100 hover:shadow-md transition-all relative"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        console.log("Preview objective clicked:", objective.description);
                                        handleObjectiveClick(objective, area, goal);
                                      }}
                                    >
                                      <div className="flex-1 flex items-center">
                                        <span>{objective.description}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    ))}
                  </div>

                  {(!iepData.areas_of_need || iepData.areas_of_need.length === 0) && (
                    <div className="text-center py-8 text-[#595959]">
                      No areas of need defined yet.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Confirmation section */}
            <div className="bg-[#f0f0f0] rounded-[16px] p-4 mb-6">
              <div className="flex flex-col items-center space-y-4">
                <h3 className="font-medium text-[#1a1a1a]">Ready to add this student?</h3>
                <p className="text-sm text-[#595959] text-center">
                  This will add the student with all areas of need, goals, and objectives to your database.
                </p>
                <div className="flex gap-4 mt-4">
                  <Button 
                    onClick={onBack}
                    disabled={isSaving}
                    className="bg-[#d0d0d0] text-[#1a1a1a] hover:bg-[#c0c0c0]"
                  >
                    Go Back
                  </Button>
                  <Button 
                    onClick={handleSave} 
                    disabled={isSaving}
                    className="bg-black text-white hover:bg-gray-800 font-medium"
                  >
                    {isSaving ? 'Adding Student...' : 'Confirm & Add Student'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Objective View Modal */}
      {selectedObjective && (
        <ObjectiveView
          objective={selectedObjective}
          isOpen={!!selectedObjective}
          onClose={() => setSelectedObjective(null)}
          previewMode={true}
        />
      )}
    </>
  );
} 