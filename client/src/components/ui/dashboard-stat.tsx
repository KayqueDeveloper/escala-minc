import * as React from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface DashboardStatProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconClassName?: string;
  footerLabel?: string;
  footerHref?: string;
  className?: string;
}

export function DashboardStat({
  title,
  value,
  icon: Icon,
  iconClassName,
  footerLabel,
  footerHref,
  className,
}: DashboardStatProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Icon className={cn("h-6 w-6 text-primary-600", iconClassName)} />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd>
                <div className="text-lg font-medium text-gray-900">{value}</div>
              </dd>
            </dl>
          </div>
        </div>
      </CardContent>
      {footerLabel && (
        <CardFooter className="bg-gray-50 px-5 py-3">
          <div className="text-sm">
            {footerHref ? (
              <a href={footerHref} className="font-medium text-primary-600 hover:text-primary-900">
                {footerLabel}
              </a>
            ) : (
              <span className="font-medium text-gray-600">{footerLabel}</span>
            )}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
