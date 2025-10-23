import React from "react";
import { TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { ComponentType, SVGProps } from "react";

type Stat = {
  title: string;
  value: string;
  change?: string;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  color?: string;
};
export default function StatsGrid({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card
          key={stat.title}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-2">
                  {stat.title}
                </p>
                <p className="text-3xl font-bold text-gray-900 mb-3">
                  {stat.value}
                </p>
                {stat.change && (
                  <div className="flex items-center gap-2 text-sm font-medium text-green-600">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    {stat.change}
                  </div>
                )}
              </div>
              <div
                className={`p-3 rounded-xl bg-gray-100 ${
                  stat.color || "text-primary"
                } ml-4`}
              >
                {stat.icon ? (
                  <stat.icon className="h-6 w-6" />
                ) : (
                  <TrendingUp className="h-6 w-6" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
