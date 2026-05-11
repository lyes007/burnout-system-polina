'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from 'recharts';
import { Users, AlertTriangle, Activity, Target } from 'lucide-react';

const COLORS = {
  Service: '#3b82f6',
  Product: '#10b981',
  Male: '#3b82f6',
  Female: '#ec4899',
  'Yes': '#10b981',
  'No': '#ef4444',
  Low: '#10b981',
  Medium: '#f59e0b',
  High: '#f97316',
  Critical: '#ef4444',
};

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('/api/analytics');
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">Loading analytics...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">No data available</div>
        </CardContent>
      </Card>
    );
  }

  const riskDistributionData = Object.entries(data.overview.risk_distribution).map(
    ([name, value]) => ({ name, value })
  );

  const burnRateStats = data.statistics?.burn_rate_stats || {};
  const employeesWithPredictions = data.statistics?.employees_with_predictions || 0;

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Analytics
        </h1>
        <p className="text-muted-foreground mt-2">Comprehensive insights and breakdowns</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="border-2 hover:border-primary/50 transition-all duration-200 hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Employees</CardTitle>
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.overview.total_employees}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {employeesWithPredictions} with predictions
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-orange-500/50 transition-all duration-200 hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">High Risk</CardTitle>
            <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {data.overview.high_risk_count}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Requires attention</p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-red-500/50 transition-all duration-200 hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Critical Risk</CardTitle>
            <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <Activity className="h-5 w-5 text-red-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {data.overview.critical_risk_count}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Immediate action needed</p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-blue-500/50 transition-all duration-200 hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Burn Rate</CardTitle>
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Target className="h-5 w-5 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {(data.overview.average_burn_rate * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">Organization average</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Min Burn Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {burnRateStats.min_burn_rate ? (burnRateStats.min_burn_rate * 100).toFixed(1) + '%' : 'N/A'}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Max Burn Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {burnRateStats.max_burn_rate ? (burnRateStats.max_burn_rate * 100).toFixed(1) + '%' : 'N/A'}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Median Burn Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {burnRateStats.median_burn_rate ? (burnRateStats.median_burn_rate * 100).toFixed(1) + '%' : 'N/A'}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Std Deviation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {burnRateStats.stddev_burn_rate ? (burnRateStats.stddev_burn_rate * 100).toFixed(2) + '%' : 'N/A'}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-xl">Risk Level Distribution</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Breakdown of employees by burnout risk level
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={riskDistributionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {riskDistributionData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[entry.name as keyof typeof COLORS] || '#8884d8'}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `${value} employees`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-xl">Average Burn Rate by Company Type</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Comparison between Service and Product companies
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.breakdowns.by_company_type}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="company_type" />
                <YAxis />
                <Tooltip formatter={(value: number) => `${(value * 100).toFixed(1)}%`} />
                <Legend />
                <Bar dataKey="avg_burn_rate" fill="#3b82f6" name="Avg Burn Rate" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-xl">Average Burn Rate by Gender</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Gender-based burnout analysis
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.breakdowns.by_gender}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="gender" />
                <YAxis />
                <Tooltip formatter={(value: number) => `${(value * 100).toFixed(1)}%`} />
                <Legend />
                <Bar dataKey="avg_burn_rate" fill="#ec4899" name="Avg Burn Rate" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-xl">Average Burn Rate by WFH Setup</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Impact of work-from-home availability
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.breakdowns.by_wfh}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="wfh_setup_available" />
                <YAxis />
                <Tooltip formatter={(value: number) => `${(value * 100).toFixed(1)}%`} />
                <Legend />
                <Bar dataKey="avg_burn_rate" fill="#10b981" name="Avg Burn Rate" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-xl">Average Burn Rate by Designation Level</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Burnout rates across different seniority levels
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.breakdowns.by_designation || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="designation_group" />
                <YAxis />
                <Tooltip formatter={(value: number) => `${(value * 100).toFixed(1)}%`} />
                <Legend />
                <Bar dataKey="avg_burn_rate" fill="#8b5cf6" name="Avg Burn Rate" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-xl">Average Burn Rate by Resource Allocation</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              How workload affects burnout rates
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.breakdowns.by_resource_allocation || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="resource_group" />
                <YAxis />
                <Tooltip formatter={(value: number) => `${(value * 100).toFixed(1)}%`} />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="avg_burn_rate" 
                  fill="#f59e0b" 
                  stroke="#f59e0b" 
                  name="Avg Burn Rate" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-xl">Average Burn Rate by Mental Fatigue Level</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Correlation between fatigue and burnout
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.breakdowns.by_mental_fatigue || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="fatigue_group" />
                <YAxis />
                <Tooltip formatter={(value: number) => `${(value * 100).toFixed(1)}%`} />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="avg_burn_rate" 
                  fill="#ef4444" 
                  stroke="#ef4444" 
                  name="Avg Burn Rate" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
