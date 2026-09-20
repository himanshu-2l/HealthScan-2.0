import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Mic, Activity, Eye, FileText, Download } from 'lucide-react';

export const Timeline: React.FC = () => {
  // Mock data - in real app this would come from state management
  const sessions = [
    {
      id: '1',
      lab: 'voice',
      date: new Date(),
      duration: '5:23',
      status: 'completed',
      metrics: {
        pitch: '145 Hz',
        jitter: '0.03',
        risk: 'Low'
      }
    }
  ];

  const getLabIcon = (lab: string) => {
    switch (lab) {
      case 'voice': return Mic;
      case 'motor': return Activity;
      case 'eye': return Eye;
      default: return FileText;
    }
  };

  const getLabColor = (lab: string) => {
    switch (lab) {
      case 'voice': return 'primary';
      case 'motor': return 'accent'; 
      case 'eye': return 'neural';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Session Timeline</h2>
          <p className="text-muted-foreground">
            Track your screening sessions and progress over time
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Export Data
        </Button>
      </div>

      {sessions.length === 0 ? (
        <Card className="lab-card">
          <CardContent className="text-center py-12">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold mb-2">No Sessions Yet</h3>
            <p className="text-muted-foreground mb-6">
              Complete your first lab session to start building your timeline
            </p>
            <Button variant="medical">Start First Session</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => {
            const IconComponent = getLabIcon(session.lab);
            const color = getLabColor(session.lab);
            
            return (
              <Card key={session.id} className="lab-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-${color}/10`}>
                        <IconComponent className={`w-5 h-5 text-${color}`} />
                      </div>
                      <div>
                        <CardTitle className="text-lg capitalize">
                          {session.lab} Lab Session
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          {session.date.toLocaleDateString()} • {session.duration}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge 
                      variant={session.status === 'completed' ? 'default' : 'secondary'}
                      className={session.status === 'completed' ? 'status-normal' : ''}
                    >
                      {session.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(session.metrics).map(([key, value]) => (
                      <div key={key} className="text-center">
                        <div className="metric-label">{key}</div>
                        <div className="metric-value">{value}</div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm">View Details</Button>
                    <Button variant="outline" size="sm">Generate Report</Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};