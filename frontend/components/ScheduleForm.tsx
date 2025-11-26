"use client";

import { Input } from "./ui/Input";
import { Card } from "./ui/Card";

interface ScheduleFormProps {
  selectedDate: string;
  targetGoals: string;
  completedGoals: string;
  priority: string;
  onDateChange: (date: string) => void;
  onTargetGoalsChange: (value: string) => void;
  onCompletedGoalsChange: (value: string) => void;
  onPriorityChange: (value: string) => void;
  errors?: {
    targetGoals?: string;
    completedGoals?: string;
    priority?: string;
  };
}

export function ScheduleForm({
  selectedDate,
  targetGoals,
  completedGoals,
  priority,
  onDateChange,
  onTargetGoalsChange,
  onCompletedGoalsChange,
  onPriorityChange,
  errors = {},
}: ScheduleFormProps) {
  return (
    <Card>
      <h2 className="font-semibold text-white text-xl mb-4">Schedule Input</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          type="date"
          label="Date"
          value={selectedDate}
          onChange={(e) => onDateChange(e.target.value)}
        />
        <Input
          type="number"
          label="Target Goals"
          min="1"
          value={targetGoals}
          onChange={(e) => onTargetGoalsChange(e.target.value)}
          error={errors.targetGoals}
        />
        <Input
          type="number"
          label="Completed Goals"
          min="0"
          value={completedGoals}
          onChange={(e) => onCompletedGoalsChange(e.target.value)}
          error={errors.completedGoals}
        />
        <Input
          type="number"
          label="Priority (1-3)"
          min="1"
          max="3"
          value={priority}
          onChange={(e) => onPriorityChange(e.target.value)}
          error={errors.priority}
        />
      </div>
    </Card>
  );
}

