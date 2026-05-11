'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { RiskBadge } from '@/components/RiskBadge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

interface Alert {
  employee: {
    id: string;
    employee_id: string;
    name?: string;
    email?: string;
    company_type: string;
    mental_fatigue_score: number;
  };
  prediction: {
    burn_rate: number;
    risk_level: string;
    prediction_date: string;
  };
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/alerts?threshold=0.6');
      const data = await response.json();
      setAlerts(data.alerts || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-8 w-8 text-red-500" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">High-Risk Alerts</h1>
          <p className="text-gray-500 mt-1">Employees requiring immediate attention</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>High-Risk Employees ({alerts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading...</div>
          ) : alerts.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No high-risk employees found. Great job!
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Company Type</TableHead>
                  <TableHead>Mental Fatigue</TableHead>
                  <TableHead>Burn Rate</TableHead>
                  <TableHead>Risk Level</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts.map((alert) => (
                  <TableRow key={alert.employee.id}>
                    <TableCell className="font-mono text-sm">
                      {alert.employee.employee_id.slice(0, 12)}...
                    </TableCell>
                    <TableCell>
                      {alert.employee.name || 'N/A'}
                    </TableCell>
                    <TableCell>{alert.employee.company_type}</TableCell>
                    <TableCell>
                      {alert.employee.mental_fatigue_score.toFixed(1)}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {(alert.prediction.burn_rate * 100).toFixed(1)}%
                    </TableCell>
                    <TableCell>
                      <RiskBadge
                        riskLevel={alert.prediction.risk_level as any}
                        burnRate={alert.prediction.burn_rate}
                      />
                    </TableCell>
                    <TableCell>
                      <Link href={`/employees/${alert.employee.id}`}>
                        <Button variant="ghost" size="sm">
                          View Details
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

