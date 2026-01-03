
export interface ServiceNode {
    id: string;
    url: string;
    health: 'healthy' | 'unhealthy' | 'failed';
    load: number; // 0.0 to 1.0
}

export class BeeHiveLoadBalancer {
    private nodes: ServiceNode[];

    constructor(nodes: ServiceNode[]) {
        this.nodes = nodes;
    }

    getHealthyNodes(): ServiceNode[] {
        return this.nodes.filter(n => n.health === 'healthy');
    }

    getNode(id: string): ServiceNode | undefined {
        return this.nodes.find(n => n.id === id);
    }

    addNode(node: ServiceNode): void {
        this.nodes.push(node);
    }

    selectNode(): ServiceNode {
        const healthy = this.getHealthyNodes();
        if (healthy.length === 0) {
            throw new Error('No healthy nodes available');
        }
        // Select node with lowest load
        return healthy.reduce((prev, curr) => (prev.load < curr.load ? prev : curr));
    }

    async routeRequest(request: any): Promise<void> {
        // Simulation of routing
        const node = this.selectNode();
        node.load = Math.min(1.0, node.load + 0.1); // Simulate load increase
    }

    reportNodeFailure(id: string): void {
        const node = this.getNode(id);
        if (node) {
            node.health = 'failed';
            node.load = 0;
        }
    }
}

export const beeHiveEngine = new BeeHiveLoadBalancer([]);
