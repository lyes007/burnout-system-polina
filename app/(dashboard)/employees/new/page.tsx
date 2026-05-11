'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { EmployeeForm } from '@/components/EmployeeForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function NewEmployeePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: any) => {
    try {
      setError(null);
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create employee');
      }

      const result = await response.json();
      router.push(`/employees/${result.employee.id}`);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Add New Employee</h1>
        <p className="text-gray-500 mt-1">Add a new employee and get instant burnout prediction</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Employee Information</CardTitle>
        </CardHeader>
        <CardContent>
          <EmployeeForm onSubmit={handleSubmit} />
        </CardContent>
      </Card>
    </div>
  );
}

