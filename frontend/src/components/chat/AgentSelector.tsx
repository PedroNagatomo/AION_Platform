import { useEffect, useState } from "react";
import { useAgentStore } from "../../store/agentStore";
import { getAgents, initializeAgents, type Agent } from "../../api/agents";

export function AgentSelector() {
  const { agents, selectedAgent, setAgents, setSelectedAgent } =
    useAgentStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    setIsLoading(true);
    try {
      let data = await getAgents();

      // Se não houver agentes, inicializar os padrão
      if (data.length === 0) {
        data = await initializeAgents();
      }

      setAgents(data);
      if (!selectedAgent && data.length > 0) {
        setSelectedAgent(data[0]);
      }
    } catch (error) {
      console.error("Error loading agents:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-terminal-bg border border-terminal-border text-terminal-text font-mono text-xs hover:border-terminal-accent transition-colors"
      >
        <span>{selectedAgent?.icon || "🤖"}</span>
        <span>{selectedAgent?.name || "Select Agent"}</span>
        <span className="text-terminal-dim">▼</span>
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1 bg-terminal-surface border border-terminal-border z-50 w-64 max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="px-4 py-3 font-mono text-xs text-terminal-dim">
              Loading...
            </div>
          ) : agents.length === 0 ? (
            <div className="px-4 py-3 font-mono text-xs text-terminal-dim">
              No agents available
            </div>
          ) : (
            agents.map((agent) => (
              <button
                key={agent.id}
                onClick={() => {
                  setSelectedAgent(agent);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 transition-colors ${
                  selectedAgent?.id === agent.id
                    ? "bg-terminal-bg text-terminal-accent border-l-2 border-terminal-accent"
                    : "text-terminal-text hover:bg-terminal-bg hover:text-terminal-accent"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{agent.icon}</span>
                  <div>
                    <div className="font-mono text-xs">{agent.name}</div>
                    <div className="font-mono text-[10px] text-terminal-dim truncate">
                      {agent.description}
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
