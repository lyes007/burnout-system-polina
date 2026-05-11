'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { EmployeeWithPrediction } from '@/types';
import { EmployeeForm } from '@/components/EmployeeForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RiskBadge } from '@/components/RiskBadge';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [employee, setEmployee] = useState<EmployeeWithPrediction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const employeeId = params.id as string;

  useEffect(() => {
    if (employeeId) {
      fetchEmployee();
    }
  }, [employeeId]);

  const fetchEmployee = async () => {
    try {
      const response = await fetch(`/api/employees/${employeeId}`);
      if (!response.ok) throw new Error('Employee not found');
      const data = await response.json();
      setEmployee(data.employee);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      setError(null);
      const response = await fetch(`/api/employees/${employeeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update employee');
      }

      const result = await response.json();
      setEmployee(result.employee);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">Loading employee data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !employee) {
    return (
      <Card className="border-destructive">
        <CardContent className="py-12">
          <div className="text-center">
            <p className="text-destructive font-medium">Error: {error || 'Employee not found'}</p>
            <Link href="/employees">
              <Button variant="outline" className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Employees
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Link href="/employees">
          <Button variant="ghost" size="sm" className="w-full sm:w-auto">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            {employee.name || `Employee ${employee.employee_id.slice(0, 8)}`}
          </h1>
          <p className="text-muted-foreground mt-2">Employee Details & Burnout Prediction</p>
        </div>
      </div>

      {error && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Prediction Card */}
      {employee.burn_rate !== undefined && (
        <Card className="border-2 bg-gradient-to-br from-card to-muted/20">
          <CardHeader>
            <CardTitle className="text-xl">Current Burnout Prediction</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Real-time prediction based on current employee data
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">Burn Rate</p>
                <p className="text-4xl font-bold">
                  {((employee.burn_rate || 0) * 100).toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Risk Level</p>
                <RiskBadge
                  riskLevel={employee.risk_level || 'Low'}
                  burnRate={employee.burn_rate || 0}
                />
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Predicted: {employee.prediction_date ? new Date(employee.prediction_date).toLocaleDateString() : 'N/A'}</p>
                <p>Model: v1.0</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Form */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-xl">Employee Information</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Update employee details to see real-time burnout predictions
          </p>
        </CardHeader>
        <CardContent>
          <EmployeeForm
            initialData={{
              employee_id: employee.employee_id,
              name: employee.name,
              email: employee.email,
              gender: employee.gender,
              company_type: employee.company_type,
              wfh_setup_available: employee.wfh_setup_available,
              designation: employee.designation,
              resource_allocation: employee.resource_allocation,
              mental_fatigue_score: employee.mental_fatigue_score,
              date_of_joining: employee.date_of_joining.toString().split('T')[0],
            }}
            onSubmit={handleSubmit}
            submitLabel="Update Employee"
            isEditMode={true}
          />
        </CardContent>
      </Card>
    </div>
  );
}

