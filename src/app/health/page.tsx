"use client"

import { useState } from 'react';
import { Activity, Calendar, AlertCircle, CheckCircle2, Droplets, Scissors, Plus } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export default function HealthPage() {
  const [daysRemaining, setDaysRemaining] = useState(14);
  const totalDays = 56; // 8 weeks

  return (
    <>
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md p-5 border-b border-white/5">
        <h1 className="text-2xl font-bold tracking-tight">Health Regimen</h1>
      </header>

      <main className="flex-1 px-5 pt-6 pb-24 space-y-6">
        {/* Active Protective Style Alert */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-accent" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-white">Active Alert</h2>
          </div>
          <Card className="bg-accent/5 border-accent/20 overflow-hidden glow-accent">
            <CardContent className="p-5 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-accent">Box Braids Takedown</h3>
                  <p className="text-xs text-muted-foreground">Applied: Oct 12, 2023</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-white">{daysRemaining}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Days Left</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-accent/60">
                  <span>Week 6 of 8</span>
                  <span>75% Duration</span>
                </div>
                <Progress value={75} className="h-1.5 bg-accent/10" />
              </div>

              <div className="p-3 bg-accent/10 rounded-lg border border-accent/10">
                <p className="text-xs leading-relaxed italic text-white/90">
                  "Your scalp needs attention. We recommend a lightweight oil treatment today to prevent dryness and tension."
                </p>
              </div>

              <Button className="w-full bg-accent hover:bg-accent/90 text-white font-bold h-11 rounded-lg">
                Log Scalp Treatment
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* Recent Activity Log */}
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Regimen Logs</h2>
            <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
              <Plus className="w-4 h-4 mr-1" /> Add Log
            </Button>
          </div>

          <div className="space-y-3">
            <LogItem 
              icon={Droplets} 
              title="Deep Conditioning" 
              date="Today, 10:30 AM" 
              status="Completed" 
              color="text-primary"
            />
            <LogItem 
              icon={Scissors} 
              title="Ends Trimmed" 
              date="Oct 20, 2023" 
              status="3 weeks ago" 
              color="text-white/60"
            />
            <LogItem 
              icon={Calendar} 
              title="Wash Day" 
              date="Oct 15, 2023" 
              status="Pending Takedown" 
              color="text-white/60"
            />
          </div>
        </section>

        {/* Health Insights */}
        <section>
          <div className="rounded-2xl bg-white/5 border border-white/10 p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Activity className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h4 className="text-sm font-bold">Hair Integrity Score</h4>
              <p className="text-xs text-muted-foreground">Based on your last 3 logs, your hair health is optimal.</p>
            </div>
            <div className="ml-auto">
              <span className="text-xl font-bold text-primary">88</span>
            </div>
          </div>
        </section>
      </main>

      <BottomNav />
    </>
  );
}

function LogItem({ icon: Icon, title, date, status, color }: any) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
      <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-primary">
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <h4 className="text-sm font-bold">{title}</h4>
        <p className="text-[10px] text-muted-foreground">{date}</p>
      </div>
      <div className="text-right">
        <span className={`text-[10px] font-bold uppercase tracking-widest ${color}`}>{status}</span>
      </div>
    </div>
  );
}