import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { authorizedFetch } from "@/services/api";
import { toast } from "sonner";
import LoadingSpinner from "@/components/LoadingSpinner";

export function MultiAnalysisReviewModal({ 
  isOpen, 
  onClose, 
  analysisResults, 
  sessionMetadata,
  access_token,
  onComplete,
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [summary, setSummary] = useState("");
  const [progressDelta, setProgressDelta] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [submittedObjectives, setSubmittedObjectives] = useState(new Set());

  const currentResult = analysisResults[currentIndex];
  const currentObjective = sessionMetadata.objectives.find(
    (obj) => obj.id === currentResult?.objective_id
  );

  console.log("currentResult", currentResult);
  console.log("currentObjective", currentObjective);

  console.log("sessionMetadata", sessionMetadata);
  console.log("analysisResults", analysisResults);

  useEffect(() => {
    if (currentResult) {
      setSummary(currentResult.summary || "");
      setProgressDelta(currentResult.progress_delta || 0);
      setIsLoading(false);
    }
  }, [currentResult]);

  const handleSubmit = async () => {
    setIsSaving(true);

    try {
      const response = await authorizedFetch(`/sessions/log`, access_token, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          student_id: sessionMetadata.student.id,
          objective_id: currentObjective.id,
          llm_summary: summary,
          progress_delta: progressDelta,
          raw_input: sessionMetadata.raw_text,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to add session: ${response.status}`);
      }

      toast.success("Session added successfully.");

      const updated = new Set(submittedObjectives);
      updated.add(currentObjective.id);
      setSubmittedObjectives(updated);

      // Move to next page or finish
      if (currentIndex + 1 < analysisResults.length) {
        setCurrentIndex((i) => i + 1);
      } else {
        onClose();
        if (onComplete) onComplete();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to add session. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!analysisResults || analysisResults.length === 0 || !currentResult) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Analysis for Objective {currentIndex + 1} of {analysisResults.length}</DialogTitle>
          <DialogDescription>
            Review and edit this AI-generated summary before submitting.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="medium" />
          </div>
        ) : (
          <div className="space-y-6 py-4">
            <div className="text-sm text-muted-foreground font-medium">
              Objective: <span className="text-foreground">{currentObjective?.description || "Unknown"}</span>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Original Notes</label>
              <div className="p-3 rounded-md bg-muted/30 border border-border/50 text-sm whitespace-pre-wrap min-h-[100px] max-h-[200px] overflow-y-auto">
                {sessionMetadata.raw_text}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Summary</label>
              <Textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="min-h-[120px] resize-none"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">Progress Delta</label>
                <span className="text-sm font-medium">{progressDelta}%</span>
              </div>
              <Slider
                value={[progressDelta]}
                onValueChange={(value) => setProgressDelta(value[0])}
                min={-100}
                max={100}
                step={1}
                className="py-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>-100%</span>
                <span>0%</span>
                <span>+100%</span>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? (
              <>
                <LoadingSpinner size="small" className="mr-2" />
                Saving...
              </>
            ) : currentIndex + 1 === analysisResults.length ? "Submit & Finish" : "Submit & Next"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
