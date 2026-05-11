import { Badge } from '@/components/ui/badge';
import { RiskLevel } from '@/types';

interface RiskBadgeProps {
  riskLevel: RiskLevel;
  burnRate?: number;
  className?: string;
}

export function RiskBadge({ riskLevel, burnRate, className }: RiskBadgeProps) {
  const getVariant = (level: RiskLevel) => {
    switch (level) {
      case 'Low':
        return 'default';
      case 'Medium':
        return 'secondary';
      case 'High':
        return 'destructive';
      case 'Critical':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const getColor = (level: RiskLevel) => {
    switch (level) {
      case 'Low':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'High':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Critical':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return '';
    }
  };

  return (
    <Badge
      variant={getVariant(riskLevel)}
      className={`${getColor(riskLevel)} ${className || ''}`}
    >
      {riskLevel}
      {burnRate !== undefined && (
        <span className="ml-1 text-xs">({(burnRate * 100).toFixed(1)}%)</span>
      )}
    </Badge>
  );
}

