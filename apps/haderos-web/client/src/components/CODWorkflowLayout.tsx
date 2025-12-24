/**
 * COD Workflow Layout Component
 * Shared layout for all 8 COD workflow stages
 */

import { ReactNode } from 'react';
import { ShippingLayout } from './ShippingLayout';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { CheckCircle, Circle } from 'lucide-react';

interface Stage {
  id: number;
  name: string;
  path: string;
}

const stages: Stage[] = [
  { id: 1, name: 'استلام الطلب', path: '/cod/call-center' },
  { id: 2, name: 'التأكيد', path: '/cod/confirmation' },
  { id: 3, name: 'التجهيز', path: '/cod/preparation' },
  { id: 4, name: 'التنسيق', path: '/cod/supplier' },
  { id: 5, name: 'تخصيص الشحن', path: '/cod/allocation' },
  { id: 6, name: 'التتبع', path: '/cod/tracking' },
  { id: 7, name: 'التحصيل', path: '/cod/collection' },
  { id: 8, name: 'التسوية', path: '/cod/settlement' },
];

interface CODWorkflowLayoutProps {
  currentStage: number;
  title: string;
  description: string;
  children: ReactNode;
}

export function CODWorkflowLayout({
  currentStage,
  title,
  description,
  children,
}: CODWorkflowLayoutProps) {
  return (
    <ShippingLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-500 mt-1">{description}</p>
        </div>

        {/* Stage Progress */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            {stages.map((stage, index) => (
              <div key={stage.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center font-bold
                      ${
                        currentStage === stage.id
                          ? 'bg-[#C62822] text-white'
                          : currentStage > stage.id
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }
                    `}
                  >
                    {currentStage > stage.id ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <Circle className="h-5 w-5" />
                    )}
                  </div>
                  <span className="text-xs mt-2 text-center">{stage.name}</span>
                </div>
                {index < stages.length - 1 && (
                  <div
                    className={`w-12 h-1 mx-2 ${
                      currentStage > stage.id ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Content */}
        {children}
      </div>
    </ShippingLayout>
  );
}
