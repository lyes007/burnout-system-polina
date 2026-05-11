'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PredictionRequest, PredictionResponse } from '@/types';
import { RiskBadge } from './RiskBadge';

interface EmployeeFormProps {
  initialData?: Partial<PredictionRequest & { name?: string; email?: string; employee_id?: string }>;
  onSubmit: (data: any) => Promise<void>;
  onPrediction?: (prediction: PredictionResponse) => void;
  submitLabel?: string;
  isEditMode?: boolean; // If true, some fields are read-only
}

export function EmployeeForm({
  initialData,
  onSubmit,
  onPrediction,
  submitLabel = 'Save Employee',
  isEditMode = false,
}: EmployeeFormProps) {
  // Calculate estimated mental fatigue score based on other factors
  // Based on correlations: Resource Allocation (0.85), Designation (0.74), WFH (negative)
  const calculateMentalFatigue = (
    resourceAllocation: number,
    designation: number,
    wfhAvailable: boolean
  ): number => {
    // Base calculation: higher resource allocation and designation = higher fatigue
    // WFH reduces fatigue
    let baseFatigue = (resourceAllocation * 0.6) + (designation * 0.8);
    if (wfhAvailable) {
      baseFatigue = baseFatigue * 0.85; // WFH reduces fatigue by ~15%
    }
    // Clamp between 0 and 10
    return Math.max(0, Math.min(10, baseFatigue));
  };

  const [formData, setFormData] = useState({
    employee_id: initialData?.employee_id || '',
    name: initialData?.name || '',
    email: initialData?.email || '',
    gender: (initialData?.gender as 'Male' | 'Female') || 'Male',
    company_type: (initialData?.company_type as 'Service' | 'Product') || 'Service',
    wfh_setup_available: initialData?.wfh_setup_available ?? true,
    designation: initialData?.designation?.toString() || '2.0',
    resource_allocation: initialData?.resource_allocation?.toString() || '3.0',
    date_of_joining: initialData?.date_of_joining || '2008-01-01',
  });

  // Calculate mental fatigue score dynamically
  const mentalFatigueScore = calculateMentalFatigue(
    parseFloat(formData.resource_allocation) || 0,
    parseFloat(formData.designation) || 0,
    formData.wfh_setup_available
  );

  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Debounce function to avoid too many API calls
  const useDebounce = (value: any, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      return () => {
        clearTimeout(handler);
      };
    }, [value, delay]);

    return debouncedValue;
  };

  // Debounce the prediction to avoid too many API calls
  const debouncedMentalFatigue = useDebounce(mentalFatigueScore, 300);
  const debouncedDesignation = useDebounce(formData.designation, 300);
  const debouncedResourceAllocation = useDebounce(formData.resource_allocation, 300);

  // Auto-predict when relevant fields change
  useEffect(() => {
    // Only predict if we have all required fields
    if (
      !formData.gender ||
      !formData.company_type ||
      !formData.designation ||
      !formData.resource_allocation ||
      !formData.date_of_joining
    ) {
      return;
    }

    let cancelled = false;

    setIsPredicting(true);
    const predict = async () => {
      try {
        const response = await fetch('/api/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gender: formData.gender,
            company_type: formData.company_type,
            wfh_setup_available: formData.wfh_setup_available,
            designation: parseFloat(debouncedDesignation),
            resource_allocation: parseFloat(debouncedResourceAllocation),
            mental_fatigue_score: debouncedMentalFatigue,
            date_of_joining: formData.date_of_joining,
          }),
        });

        if (cancelled) return;

        if (!response.ok) throw new Error('Prediction failed');

        const pred: PredictionResponse = await response.json();
        if (!cancelled) {
          setPrediction(pred);
          if (onPrediction) onPrediction(pred);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Prediction error:', error);
        }
      } finally {
        if (!cancelled) {
          setIsPredicting(false);
        }
      }
    };

    const timeoutId = setTimeout(predict, 300); // Small delay to debounce

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [
    formData.gender,
    formData.company_type,
    formData.wfh_setup_available,
    debouncedDesignation,
    debouncedResourceAllocation,
    formData.date_of_joining,
    debouncedMentalFatigue,
    onPrediction,
  ]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      // If resource_allocation, designation, or wfh_setup_available changes, recalculate mental fatigue
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        designation: parseFloat(formData.designation),
        resource_allocation: parseFloat(formData.resource_allocation),
        mental_fatigue_score: mentalFatigueScore,
      });
    } catch (error) {
      console.error('Submit error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="employee_id">Employee ID *</Label>
          <Input
            id="employee_id"
            value={formData.employee_id}
            onChange={(e) => handleChange('employee_id', e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="gender">Gender {isEditMode && '(Read-only)'}</Label>
          <Select
            value={formData.gender}
            onValueChange={(value) => handleChange('gender', value)}
            disabled={isEditMode}
          >
            <SelectTrigger className={isEditMode ? 'bg-muted cursor-not-allowed' : ''}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
            </SelectContent>
          </Select>
          {isEditMode && (
            <p className="text-xs text-muted-foreground mt-1">
              Gender cannot be changed after employee creation
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="company_type">Company Type *</Label>
          <Select
            value={formData.company_type}
            onValueChange={(value) => handleChange('company_type', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Service">Service</SelectItem>
              <SelectItem value="Product">Product</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="wfh_setup_available">WFH Setup Available *</Label>
        <Select
          value={formData.wfh_setup_available ? 'Yes' : 'No'}
          onValueChange={(value) => handleChange('wfh_setup_available', value === 'Yes')}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Yes">Yes</SelectItem>
            <SelectItem value="No">No</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="designation">Designation Level *</Label>
          <Input
            id="designation"
            type="number"
            step="0.1"
            min="0"
            max="5"
            value={formData.designation}
            onChange={(e) => handleChange('designation', e.target.value)}
            required
          />
          <p className="text-xs text-muted-foreground mt-1">
            0.0 = Entry, 1.0 = Junior, 2.0 = Mid, 3.0 = Senior, 4.0+ = Executive
          </p>
        </div>
        <div>
          <Label htmlFor="resource_allocation">Resource Allocation (Workload) *</Label>
          <Input
            id="resource_allocation"
            type="number"
            step="0.1"
            min="0"
            max="10"
            value={formData.resource_allocation}
            onChange={(e) => handleChange('resource_allocation', e.target.value)}
            required
          />
          <p className="text-xs text-muted-foreground mt-1">
            Higher values indicate more workload/responsibilities
          </p>
        </div>
      </div>

      {/* Calculated Mental Fatigue Score */}
      <div className="bg-muted/50 p-4 rounded-lg border">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base font-semibold">Estimated Mental Fatigue Score</Label>
            <p className="text-xs text-muted-foreground mt-1">
              Calculated based on Designation, Resource Allocation, and WFH Setup
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">
              {mentalFatigueScore.toFixed(1)} / 10
            </div>
            <div className="text-xs text-muted-foreground">
              {mentalFatigueScore < 3 ? 'Low' : mentalFatigueScore < 6 ? 'Medium' : 'High'}
            </div>
          </div>
        </div>
        <div className="mt-3">
          <div className="w-full bg-background rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                mentalFatigueScore < 3
                  ? 'bg-green-500'
                  : mentalFatigueScore < 6
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
              }`}
              style={{ width: `${(mentalFatigueScore / 10) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="date_of_joining">Date of Joining {isEditMode && '(Read-only)'}</Label>
        <Input
          id="date_of_joining"
          type="date"
          value={formData.date_of_joining}
          onChange={(e) => handleChange('date_of_joining', e.target.value)}
          required
          disabled={isEditMode}
          className={isEditMode ? 'bg-muted cursor-not-allowed' : ''}
        />
        {isEditMode && (
          <p className="text-xs text-muted-foreground mt-1">
            Date of joining cannot be changed after employee creation
          </p>
        )}
      </div>

      {/* Auto-updating Prediction Display */}
      <div className="bg-card border rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base font-semibold">Burnout Risk Prediction</Label>
            <p className="text-xs text-muted-foreground mt-1">
              Updates automatically as you change fields
            </p>
          </div>
          {isPredicting && (
            <div className="text-sm text-muted-foreground">Calculating...</div>
          )}
        </div>
        {prediction ? (
          <div className="mt-4 flex items-center gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Burn Rate</p>
              <p className="text-2xl font-bold">
                {(prediction.burn_rate * 100).toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Risk Level</p>
              <RiskBadge
                riskLevel={prediction.risk_level}
                burnRate={prediction.burn_rate}
              />
            </div>
          </div>
        ) : (
          <div className="mt-4 text-sm text-muted-foreground">
            Fill in the form to see burnout prediction
          </div>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Saving...' : submitLabel}
      </Button>
    </form>
  );
}

