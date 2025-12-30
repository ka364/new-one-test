# Bio-Protocol Modules

This directory contains the implementation of the 7 bio-protocol modules that form the core of HaderOS.

## Modules

1.  **Arachnid (Anomaly Detection):** Real-time anomaly detection with ML.
2.  **Corvid (Meta-Learning):** Learns from errors and creates prevention rules.
3.  **Mycelium (Resource Distribution):** Balances resources across the network.
4.  **Ant (Route Optimization):** Optimizes delivery routes using ACO.
5.  **Tardigrade (Resilience):** Ensures system resilience and self-healing.
6.  **Chameleon (Adaptive Strategy):** Adapts pricing and strategy to market conditions.
7.  **Cephalopod (Distributed Authority):** Manages distributed decision-making.

## Orchestrator

The `orchestrator.ts` file contains the `BioProtocolOrchestrator` which integrates all 7 modules and provides a unified interface for the system.

## Testing

The `bio-modules.test.ts` file contains a comprehensive test suite for all modules.
