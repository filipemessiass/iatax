"""
Agent Router - Versão MVP
"""
from dataclasses import dataclass

@dataclass
class RoutingResult:
    primary_agent: str
    confidence: float
    reasoning: str

class AgentRouter:
    def __init__(self, registry):
        self.registry = registry
        print("✅ AgentRouter MVP inicializado")
    
    def route(self, query: str, context: dict = None) -> RoutingResult:
        return RoutingResult(
            primary_agent="irpj",
            confidence=1.0,
            reasoning="MVP - Roteamento fixo para IRPJ"
        )
    
    def get_routing_suggestions(self, query: str):
        return [("irpj", 1.0)]
