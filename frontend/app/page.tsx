"use client";

import { StudyScheduleDemo } from "@/components/StudyScheduleDemo";

export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <main className="w-full">
      <StudyScheduleDemo />
    </main>
  );
}

