
export interface WorkflowMetric {
    workflowId: string;
    modulesUsed: string[];
    performanceMetrics: {
        totalTime: number; // ms
        success: boolean;
    }
}

export interface Alert {
    id: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    timestamp: number;
}

export class HawkMonitoringSystem {
    private alerts: Alert[] = [];

    monitorWorkflow(workflowType: string, metric: any): void { // Using any broadly to match test flexibility
        // Logic to detect anomalies in workflow
        if (metric.performanceMetrics.totalTime > 2000 && metric.performanceMetrics.totalTime !== undefined) { // > 2s
            this.triggerAlert('high', `Workflow ${workflowType} slow performance: ${metric.performanceMetrics.totalTime}ms`);
        }

        if (metric.performanceMetrics.success === false) {
            this.triggerAlert('medium', `Workflow ${workflowType} failed`);
        }
    }

    triggerAlert(severity: Alert['severity'], message: string): void {
        this.alerts.push({
            id: `alert-${Date.now()}`,
            severity,
            message,
            timestamp: Date.now()
        });
    }

    getAlerts(): Alert[] {
        return this.alerts;
    }

    clearAlerts(): void {
        this.alerts = [];
    }
}

export const hawkEngine = new HawkMonitoringSystem();
