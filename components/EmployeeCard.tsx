import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RiskBadge } from './RiskBadge';
import { EmployeeWithPrediction } from '@/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface EmployeeCardProps {
  employee: EmployeeWithPrediction;
}

export function EmployeeCard({ employee }: EmployeeCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">
              {employee.name || `Employee ${employee.employee_id.slice(0, 8)}`}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              ID: {employee.employee_id}
            </p>
          </div>
          {employee.prediction && (
            <RiskBadge
              riskLevel={employee.prediction.risk_level}
              burnRate={employee.prediction.burn_rate}
            />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Company:</span>
            <span>{employee.company_type}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Gender:</span>
            <span>{employee.gender}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">WFH Setup:</span>
            <span>{employee.wfh_setup_available ? 'Yes' : 'No'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Mental Fatigue:</span>
            <span>{employee.mental_fatigue_score.toFixed(1)}</span>
          </div>
          {employee.prediction && (
            <div className="pt-2 border-t">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Burn Rate:</span>
                <span className="font-semibold">
                  {(employee.prediction.burn_rate * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          )}
        </div>
        <div className="mt-4">
          <Link href={`/employees/${employee.id}`}>
            <Button variant="outline" className="w-full">
              View Details
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

