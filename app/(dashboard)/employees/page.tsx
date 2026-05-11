'use client';

import { useEffect, useState } from 'react';
import { EmployeeWithPrediction } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RiskBadge } from '@/components/RiskBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { Plus, Search } from 'lucide-react';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<EmployeeWithPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [companyFilter, setCompanyFilter] = useState<string>('all');

  useEffect(() => {
    fetchEmployees();
  }, [riskFilter, companyFilter, search]);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (riskFilter !== 'all') params.append('risk_level', riskFilter);
      if (companyFilter !== 'all') params.append('company_type', companyFilter);
      if (search) params.append('search', search);

      const response = await fetch(`/api/employees?${params.toString()}`);
      const data = await response.json();
      setEmployees(data.employees || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Employees
          </h1>
          <p className="text-muted-foreground mt-2">Manage employee data and burnout predictions</p>
        </div>
        <Link href="/employees/new">
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Add Employee
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search employees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={riskFilter} onValueChange={setRiskFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by risk" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Risk Levels</SelectItem>
            <SelectItem value="Low">Low</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="High">High</SelectItem>
            <SelectItem value="Critical">Critical</SelectItem>
          </SelectContent>
        </Select>
        <Select value={companyFilter} onValueChange={setCompanyFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by company" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Companies</SelectItem>
            <SelectItem value="Service">Service</SelectItem>
            <SelectItem value="Product">Product</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {loading ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
              <p className="text-muted-foreground">Loading employees...</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-2 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Company Type</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>WFH Setup</TableHead>
                <TableHead>Mental Fatigue</TableHead>
                <TableHead>Burn Rate</TableHead>
                <TableHead>Risk Level</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-12">
                    No employees found
                  </TableCell>
                </TableRow>
              ) : (
                employees.map((employee) => (
                  <TableRow key={employee.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-mono text-sm">
                      {employee.employee_id.slice(0, 12)}...
                    </TableCell>
                    <TableCell className="font-medium">{employee.name || 'N/A'}</TableCell>
                    <TableCell className="hidden sm:table-cell">{employee.company_type}</TableCell>
                    <TableCell className="hidden md:table-cell">{employee.gender}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {employee.wfh_setup_available ? (
                        <span className="text-green-600">Yes</span>
                      ) : (
                        <span className="text-muted-foreground">No</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {employee.mental_fatigue_score.toFixed(1)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {employee.burn_rate !== undefined
                        ? `${(employee.burn_rate * 100).toFixed(1)}%`
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {employee.risk_level ? (
                        <RiskBadge riskLevel={employee.risk_level} burnRate={employee.burn_rate || 0} />
                      ) : (
                        'N/A'
                      )}
                    </TableCell>
                    <TableCell>
                      <Link href={`/employees/${employee.id}`}>
                        <Button variant="ghost" size="sm" className="hover:bg-primary/10">
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </div>
        </Card>
      )}
    </div>
  );
}

