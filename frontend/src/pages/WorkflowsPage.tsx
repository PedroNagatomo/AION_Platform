import { useEffect, useState } from "react";
import { Sidebar } from "../components/layout/Sidebar";
import {
  getWorkflows,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  toggleWorkflow,
  testWorkflow,
  generateAndSaveWorkflowFromAI,
  getTemplates,
  useTemplate,
  getAnalytics,
  TRIGGER_TYPES,
  ACTION_TYPES,
  type Workflow,
} from "../api/workflows";

interface Condition {
  field: string;
  operator: string;
  value: string;
}

interface Action {
  type: string;
  config: Record<string, any>;
}

export function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [showEditor, setShowEditor] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const [saveStatus, setSaveStatus] = useState("");

  // Editor state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("⚡");
  const [triggerType, setTriggerType] = useState("NOTE_CREATED");
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [actions, setActions] = useState<Action[]>([]);

  // AI Generator state
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [aiDescription, setAiDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiResult, setAiResult] = useState<Workflow | null>(null);

  // Templates state
  const [showTemplates, setShowTemplates] = useState(false);
  const [templates, setTemplates] = useState<Workflow[]>([]);

  // Analytics state
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    try {
      const data = await getWorkflows();
      setWorkflows(data);
    } catch (error) {
      console.error("Error loading workflows:", error);
    }
  };

  const handleNew = () => {
    resetEditor();
    setShowEditor(true);
    setEditingWorkflow(null);
  };

  const handleEdit = (workflow: Workflow) => {
    setName(workflow.name);
    setDescription(workflow.description || "");
    setIcon(workflow.icon);
    setTriggerType(workflow.triggerType);

    try {
      setConditions(workflow.conditions ? JSON.parse(workflow.conditions) : []);
      setActions(workflow.actions ? JSON.parse(workflow.actions) : []);
    } catch {
      setConditions([]);
      setActions([]);
    }

    setEditingWorkflow(workflow);
    setShowEditor(true);
  };

  const resetEditor = () => {
    setName("");
    setDescription("");
    setIcon("⚡");
    setTriggerType("NOTE_CREATED");
    setConditions([]);
    setActions([]);
  };

  const handleSave = async () => {
    if (!name.trim() || actions.length === 0) {
      alert("Name and at least one action are required");
      return;
    }

    setSaveStatus("saving...");

    const data = {
      name: name.trim(),
      description: description.trim(),
      icon,
      triggerType,
      isActive: true,
      conditions: conditions.length > 0 ? JSON.stringify(conditions) : undefined,
      actions: JSON.stringify(actions),
    };

    try {
      if (editingWorkflow) {
        await updateWorkflow(editingWorkflow.id, data);
      } else {
        await createWorkflow(data);
      }

      setSaveStatus("saved ✓");
      setTimeout(() => setSaveStatus(""), 2000);
      setShowEditor(false);
      resetEditor();
      loadWorkflows();
    } catch (error) {
      console.error("Error saving workflow:", error);
      setSaveStatus("error");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Delete this workflow?")) {
      await deleteWorkflow(id);
      loadWorkflows();
    }
  };

  const handleToggle = async (id: string) => {
    await toggleWorkflow(id);
    loadWorkflows();
  };

  const handleTest = async (id: string) => {
    try {
      await testWorkflow(id);
      alert("Workflow triggered! Check executions.");
    } catch (error) {
      console.error("Error testing workflow:", error);
    }
  };

  const addCondition = () => {
    setConditions([
      ...conditions,
      { field: "title", operator: "CONTAINS", value: "" },
    ]);
  };

  const updateCondition = (
    index: number,
    field: keyof Condition,
    value: string,
  ) => {
    const updated = [...conditions];
    updated[index] = { ...updated[index], [field]: value };
    setConditions(updated);
  };

  const removeCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const addAction = () => {
    setActions([
      ...actions,
      { type: "CREATE_NOTE", config: { title: "New Note", content: "" } },
    ]);
  };

  const updateAction = (index: number, updates: Partial<Action>) => {
    const updated = [...actions];
    updated[index] = { ...updated[index], ...updates };
    setActions(updated);
  };

  const updateActionConfig = (index: number, key: string, value: any) => {
    const updated = [...actions];
    updated[index].config = { ...updated[index].config, [key]: value };
    setActions(updated);
  };

  const removeAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index));
  };

  const getTriggerInfo = (type: string) =>
    TRIGGER_TYPES.find((t) => t.id === type);
  const getActionInfo = (type: string) =>
    ACTION_TYPES.find((a) => a.id === type);

  const loadTemplates = async () => {
    try {
      const data = await getTemplates("pt-BR");
      setTemplates(data);
      setShowTemplates(true);
    } catch (error) {
      console.error("Error loading templates:", error);
    }
  };

  const loadAnalytics = async () => {
    try {
      const data = await getAnalytics();
      setAnalytics(data);
      setShowAnalytics(true);
    } catch (error) {
      console.error("Error loading analytics:", error);
    }
  };

  const handleAIGenerate = async () => {
    if (!aiDescription.trim()) return;

    setIsGenerating(true);
    try {
      const result = await generateAndSaveWorkflowFromAI(
        aiDescription,
        "pt-BR",
      );
      setAiResult(result);
      loadWorkflows();

      setTimeout(() => {
        setShowAIGenerator(false);
        setAiDescription("");
        setAiResult(null);
      }, 3000);
    } catch (error) {
      console.error("Error generating workflow:", error);
      alert("Erro ao gerar workflow. Tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUseTemplate = async (index: number) => {
    try {
      await useTemplate(index, "pt-BR");
      loadWorkflows();
      setShowTemplates(false);
    } catch (error) {
      console.error("Error using template:", error);
    }
  };

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 overflow-y-auto bg-terminal-bg">
        <div className="p-3 md:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div>
              <h1 className="font-mono text-xl md:text-2xl text-terminal-accent">
                ❯ Workflows
              </h1>
              <p className="font-mono text-xs md:text-sm text-terminal-dim mt-1">
                &lt;automate_your_platform/&gt;
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setShowAIGenerator(true)}
                className="px-3 py-2 bg-terminal-surface border border-terminal-accent text-terminal-accent font-mono text-xs md:text-sm hover:bg-terminal-accent hover:text-terminal-bg transition-colors"
              >
                [ 🤖 AI Generate ]
              </button>
              <button
                onClick={loadTemplates}
                className="px-3 py-2 bg-terminal-surface border border-terminal-border text-terminal-text font-mono text-xs md:text-sm hover:border-terminal-accent transition-colors"
              >
                [ 📋 Templates ]
              </button>
              <button
                onClick={loadAnalytics}
                className="px-3 py-2 bg-terminal-surface border border-terminal-border text-terminal-text font-mono text-xs md:text-sm hover:border-terminal-accent transition-colors"
              >
                [ 📊 Analytics ]
              </button>
              <button
                onClick={handleNew}
                className="px-3 py-2 bg-terminal-accent text-terminal-bg font-mono text-xs md:text-sm hover:opacity-90 transition-opacity"
              >
                [ + New ]
              </button>
            </div>
          </div>

          {/* Workflows List */}
          {workflows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-terminal-surface border border-terminal-border">
              <div className="text-4xl mb-4">⚡</div>
              <div className="font-mono text-terminal-dim text-sm mb-4">
                &lt;no_workflows_yet/&gt;
              </div>
              <div className="font-mono text-terminal-dim text-xs mb-6 text-center max-w-md">
                Automate repetitive tasks. Example: "When I create a note, add a
                reminder to review it tomorrow"
              </div>
              <div className="flex gap-2 flex-wrap justify-center">
                <button
                  onClick={() => setShowAIGenerator(true)}
                  className="px-6 py-3 bg-terminal-bg border border-terminal-accent text-terminal-accent font-mono text-sm hover:bg-terminal-accent hover:text-terminal-bg transition-colors"
                >
                  [ 🤖 Generate with AI ]
                </button>
                <button
                  onClick={loadTemplates}
                  className="px-6 py-3 bg-terminal-bg border border-terminal-border text-terminal-text font-mono text-sm hover:border-terminal-accent transition-colors"
                >
                  [ 📋 Use a Template ]
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {workflows.map((workflow) => {
                const trigger = getTriggerInfo(workflow.triggerType);
                let actionsList: Action[] = [];
                try {
                  actionsList = JSON.parse(workflow.actions);
                } catch {}

                return (
                  <div
                    key={workflow.id}
                    className={`bg-terminal-surface border p-4 transition-colors ${
                      workflow.isActive
                        ? "border-terminal-accent"
                        : "border-terminal-border opacity-60"
                    }`}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <span className="text-2xl">{workflow.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-mono text-sm text-terminal-text truncate">
                            {workflow.name}
                          </h3>
                          <span
                            className={`px-2 py-0.5 font-mono text-[10px] border ${
                              workflow.isActive
                                ? "bg-terminal-accent text-terminal-bg border-terminal-accent"
                                : "bg-terminal-bg text-terminal-dim border-terminal-border"
                            }`}
                          >
                            {workflow.isActive ? "[ ACTIVE ]" : "[ PAUSED ]"}
                          </span>
                        </div>
                        {workflow.description && (
                          <p className="font-mono text-[10px] text-terminal-dim mt-1">
                            {workflow.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="font-mono text-[10px] text-terminal-dim mb-2">
                      <span className="text-terminal-accent">WHEN</span>{" "}
                      {trigger?.icon} {trigger?.label}
                    </div>

                    {workflow.conditions && workflow.conditions !== "[]" && (
                      <div className="font-mono text-[10px] text-terminal-dim mb-2">
                        <span className="text-yellow-500">IF</span> conditions
                        match
                      </div>
                    )}

                    <div className="font-mono text-[10px] text-terminal-dim mb-3">
                      <span className="text-terminal-accent">THEN</span>
                      <div className="mt-1 space-y-0.5">
                        {actionsList.map((action, i) => {
                          const info = getActionInfo(action.type);
                          return (
                            <div key={i}>
                              {i + 1}. {info?.icon} {info?.label}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="font-mono text-[10px] text-terminal-dim mb-3 pt-2 border-t border-terminal-border">
                      <div>Runs: {workflow.executionCount || 0}</div>
                      {workflow.lastExecutedAt && (
                        <div>
                          Last:{" "}
                          {new Date(workflow.lastExecutedAt).toLocaleString(
                            "pt-BR",
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-1 flex-wrap">
                      <button
                        onClick={() => handleToggle(workflow.id)}
                        className="px-2 py-1 font-mono text-[10px] border border-terminal-border bg-terminal-bg text-terminal-text hover:border-terminal-accent"
                      >
                        {workflow.isActive ? "[ Pause ]" : "[ Resume ]"}
                      </button>
                      <button
                        onClick={() => handleTest(workflow.id)}
                        className="px-2 py-1 font-mono text-[10px] border border-terminal-border bg-terminal-bg text-terminal-text hover:border-terminal-accent"
                      >
                        [ Test ]
                      </button>
                      <button
                        onClick={() => handleEdit(workflow)}
                        className="px-2 py-1 font-mono text-[10px] border border-terminal-border bg-terminal-bg text-terminal-text hover:border-terminal-accent"
                      >
                        [ Edit ]
                      </button>
                      <button
                        onClick={() => handleDelete(workflow.id)}
                        className="px-2 py-1 font-mono text-[10px] border border-red-500 bg-terminal-bg text-red-500 hover:bg-red-500 hover:text-terminal-bg"
                      >
                        [ Delete ]
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ============================================ */}
      {/* AI GENERATOR MODAL */}
      {/* ============================================ */}
      {showAIGenerator && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-terminal-surface border border-terminal-accent p-4 md:p-6 w-full max-w-lg">
            <h3 className="font-mono text-lg text-terminal-accent mb-4">
              &lt;ai_workflow_generator/&gt;
            </h3>
            <p className="font-mono text-xs text-terminal-dim mb-4">
              Describe what you want to automate. AI will create the workflow:
            </p>

            <textarea
              value={aiDescription}
              onChange={(e) => setAiDescription(e.target.value)}
              placeholder="E.g., Every time I create a note with 'meeting', remind me 1 hour later."
              rows={4}
              className="w-full bg-terminal-bg border border-terminal-border text-terminal-text font-mono text-sm p-3 focus:outline-none focus:border-terminal-accent resize-none"
              disabled={isGenerating}
            />

            <div className="mt-2 font-mono text-[10px] text-terminal-dim">
              💡 Examples:
              <br />• "When I add a new contact, create a follow-up note"
              <br />• "Every day at 9 AM, create a summary of my notes."
              <br />• "When I create an urgent note, remind me in 30 minutes."
            </div>

            {aiResult && (
              <div className="mt-4 p-3 bg-terminal-bg border border-terminal-accent">
                <div className="font-mono text-xs text-terminal-accent">
                  ✅ Workflow successfully created!
                </div>
                <div className="font-mono text-sm text-terminal-text mt-1">
                  {aiResult.icon} {aiResult.name}
                </div>
                <div className="font-mono text-[10px] text-terminal-dim mt-1">
                  Trigger: {aiResult.triggerType}
                </div>
              </div>
            )}

            <div className="flex gap-2 mt-4">
              <button
                onClick={handleAIGenerate}
                disabled={!aiDescription.trim() || isGenerating}
                className="flex-1 px-4 py-2 bg-terminal-accent text-terminal-bg font-mono text-sm disabled:opacity-50"
              >
                {isGenerating
                  ? "[ 🤖 Generating... ]"
                  : "[ ✨ Generate Workflow ]"}
              </button>
              <button
                onClick={() => {
                  setShowAIGenerator(false);
                  setAiDescription("");
                  setAiResult(null);
                }}
                className="px-4 py-2 bg-terminal-bg border border-terminal-border text-terminal-text font-mono text-sm"
              >
                [ Cancel ]
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* TEMPLATES MODAL */}
      {/* ============================================ */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-terminal-surface border border-terminal-accent p-4 md:p-6 w-full max-w-3xl max-h-[85vh] overflow-y-auto">
            <h3 className="font-mono text-lg text-terminal-accent mb-4">
              &lt;templates/&gt;
            </h3>
            <p className="font-mono text-xs text-terminal-dim mb-4">
              Choose a ready-made template to get started:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {templates.map((template, index) => {
                let actionCount = 0;
                try {
                  actionCount = JSON.parse(template.actions).length;
                } catch {}

                return (
                  <button
                    key={index}
                    onClick={() => handleUseTemplate(index)}
                    className="text-left p-4 bg-terminal-bg border border-terminal-border hover:border-terminal-accent transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{template.icon}</span>
                      <div className="flex-1">
                        <div className="font-mono text-sm text-terminal-text">
                          {template.name}
                        </div>
                        <div className="font-mono text-[10px] text-terminal-dim mt-1">
                          {template.description}
                        </div>
                        <div className="font-mono text-[10px] text-terminal-accent mt-2">
                          {actionCount} action{actionCount > 1 ? "s" : ""}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowTemplates(false)}
                className="px-4 py-2 bg-terminal-bg border border-terminal-border text-terminal-text font-mono text-sm"
              >
                [ Fechar ]
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* ANALYTICS MODAL */}
      {/* ============================================ */}
      {showAnalytics && analytics && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-terminal-surface border border-terminal-accent p-4 md:p-6 w-full max-w-4xl max-h-[85vh] overflow-y-auto">
            <h3 className="font-mono text-lg text-terminal-accent mb-4">
              &lt;workflow_analytics/&gt;
            </h3>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <div className="bg-terminal-bg border border-terminal-border p-3">
                <div className="font-mono text-2xl text-terminal-accent">
                  {analytics.summary.totalWorkflows}
                </div>
                <div className="font-mono text-[10px] text-terminal-dim mt-1">
                  Workflows
                </div>
              </div>
              <div className="bg-terminal-bg border border-terminal-border p-3">
                <div className="font-mono text-2xl text-terminal-accent">
                  {analytics.summary.totalExecutions}
                </div>
                <div className="font-mono text-[10px] text-terminal-dim mt-1">
                  Executions
                </div>
              </div>
              <div className="bg-terminal-bg border border-terminal-border p-3">
                <div className="font-mono text-2xl text-terminal-accent">
                  {analytics.summary.successRate}%
                </div>
                <div className="font-mono text-[10px] text-terminal-dim mt-1">
                  Success Rate
                </div>
              </div>
              <div className="bg-terminal-bg border border-terminal-border p-3">
                <div className="font-mono text-2xl text-terminal-accent">
                  {analytics.summary.avgDurationMs}ms
                </div>
                <div className="font-mono text-[10px] text-terminal-dim mt-1">
                  Average Time
                </div>
              </div>
            </div>

            {/* Daily Executions Chart */}
            <div className="bg-terminal-bg border border-terminal-border p-4 mb-4">
              <div className="font-mono text-sm text-terminal-accent mb-3">
                📈 Executions (last 7 days)
              </div>
              <div className="flex items-end gap-2 h-32">
                {analytics.dailyExecutions.map((day: any, i: number) => {
                  const maxVal = Math.max(
                    ...analytics.dailyExecutions.map((d: any) => d.executions),
                    1,
                  );
                  const height = (day.executions / maxVal) * 100;
                  return (
                    <div
                      key={i}
                      className="flex-1 flex flex-col items-center gap-1"
                    >
                      <div className="text-terminal-dim font-mono text-[10px]">
                        {day.executions}
                      </div>
                      <div
                        className="w-full bg-terminal-accent transition-all"
                        style={{ height: `${Math.max(height, 5)}%` }}
                      />
                      <div className="text-terminal-dim font-mono text-[10px]">
                        {day.date}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Status Distribution + Top Workflows */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-terminal-bg border border-terminal-border p-4">
                <div className="font-mono text-sm text-terminal-accent mb-3">
                  📊 Stat Distribution
                </div>
                <div className="space-y-2">
                  {analytics.statusDistribution.map((item: any, i: number) => {
                    const total = analytics.statusDistribution.reduce(
                      (sum: number, s: any) => sum + s.value,
                      0,
                    );
                    const pct = total > 0 ? (item.value / total) * 100 : 0;
                    return (
                      <div key={i}>
                        <div className="flex justify-between font-mono text-xs mb-1">
                          <span style={{ color: item.color }}>{item.name}</span>
                          <span className="text-terminal-dim">
                            {item.value} ({pct.toFixed(0)}%)
                          </span>
                        </div>
                        <div className="h-2 bg-terminal-border">
                          <div
                            className="h-full transition-all"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: item.color,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-terminal-bg border border-terminal-border p-4">
                <div className="font-mono text-sm text-terminal-accent mb-3">
                  🏆 Top Workflows
                </div>
                <div className="space-y-2">
                  {analytics.topWorkflows.length === 0 ? (
                    <div className="font-mono text-xs text-terminal-dim">
                      No executions yet{" "}
                    </div>
                  ) : (
                    analytics.topWorkflows.map((w: any, i: number) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 font-mono text-xs"
                      >
                        <span className="text-terminal-dim">#{i + 1}</span>
                        <span>{w.icon}</span>
                        <span className="flex-1 truncate">{w.name}</span>
                        <span className="text-terminal-accent">
                          {w.executionCount} runs
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Recent Executions */}
            <div className="bg-terminal-bg border border-terminal-border p-4 mt-4">
              <div className="font-mono text-sm text-terminal-accent mb-3">
                🕒 Recent Executions
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {analytics.recentExecutions.length === 0 ? (
                  <div className="font-mono text-xs text-terminal-dim">
                    No executions recorded
                  </div>
                ) : (
                  analytics.recentExecutions.map((exec: any, i: number) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 font-mono text-[10px] p-2 border-b border-terminal-border"
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          exec.status === "SUCCESS"
                            ? "bg-terminal-accent"
                            : exec.status === "FAILED"
                              ? "bg-red-500"
                              : "bg-yellow-500"
                        }`}
                      />
                      <span>{exec.workflowIcon}</span>
                      <span className="flex-1 truncate">
                        {exec.workflowName}
                      </span>
                      <span className="text-terminal-dim">
                        {exec.durationMs}ms
                      </span>
                      <span className="text-terminal-dim">
                        {new Date(exec.executedAt).toLocaleString("pt-BR")}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowAnalytics(false)}
                className="px-4 py-2 bg-terminal-bg border border-terminal-border text-terminal-text font-mono text-sm"
              >
                [ Fechar ]
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* EDITOR MODAL (existing) */}
      {/* ============================================ */}
      {showEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-terminal-surface border border-terminal-accent w-full max-w-3xl my-8">
            <div className="p-4 border-b border-terminal-border flex items-center justify-between">
              <h2 className="font-mono text-lg text-terminal-accent">
                {editingWorkflow
                  ? "&lt;edit_workflow/&gt;"
                  : "&lt;new_workflow/&gt;"}
              </h2>
              <span className="font-mono text-xs text-terminal-dim">
                {saveStatus}
              </span>
            </div>

            <div className="p-4 md:p-6 max-h-[80vh] overflow-y-auto space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="font-mono text-xs text-terminal-dim mb-1 block">
                    Icon:
                  </label>
                  <input
                    type="text"
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    className="w-full bg-terminal-bg border border-terminal-border text-terminal-text font-mono text-xl px-3 py-2 text-center focus:outline-none focus:border-terminal-accent"
                    maxLength={2}
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="font-mono text-xs text-terminal-dim mb-1 block">
                    Name:
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Auto remind to review notes"
                    className="w-full bg-terminal-bg border border-terminal-border text-terminal-text font-mono text-sm px-3 py-2 focus:outline-none focus:border-terminal-accent"
                  />
                </div>
              </div>

              <div>
                <label className="font-mono text-xs text-terminal-dim mb-1 block">
                  Description:
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What does this workflow do?"
                  className="w-full bg-terminal-bg border border-terminal-border text-terminal-text font-mono text-sm px-3 py-2 focus:outline-none focus:border-terminal-accent"
                />
              </div>

              {/* Trigger */}
              <div className="bg-terminal-bg border border-terminal-border p-4">
                <div className="font-mono text-sm text-terminal-accent mb-3">
                  🎯 WHEN (Trigger)
                </div>
                <select
                  value={triggerType}
                  onChange={(e) => setTriggerType(e.target.value)}
                  className="w-full bg-terminal-surface border border-terminal-border text-terminal-text font-mono text-sm px-3 py-2 focus:outline-none focus:border-terminal-accent"
                >
                  {TRIGGER_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.icon} {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Conditions */}
              <div className="bg-terminal-bg border border-terminal-border p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-mono text-sm text-yellow-500">
                    ⚙️ IF (Conditions - optional)
                  </div>
                  <button
                    onClick={addCondition}
                    className="px-2 py-1 font-mono text-xs border border-terminal-border text-terminal-text hover:border-terminal-accent"
                  >
                    [ + Add Condition ]
                  </button>
                </div>

                {conditions.length === 0 ? (
                  <div className="font-mono text-xs text-terminal-dim">
                    No conditions - workflow will always run when triggered
                  </div>
                ) : (
                  <div className="space-y-2">
                    {conditions.map((condition, index) => (
                      <div
                        key={index}
                        className="flex flex-wrap gap-2 items-center"
                      >
                        <input
                          type="text"
                          value={condition.field}
                          onChange={(e) =>
                            updateCondition(index, "field", e.target.value)
                          }
                          placeholder="field"
                          className="flex-1 min-w-[100px] bg-terminal-surface border border-terminal-border text-terminal-text font-mono text-xs px-2 py-1 focus:outline-none focus:border-terminal-accent"
                        />
                        <select
                          value={condition.operator}
                          onChange={(e) =>
                            updateCondition(index, "operator", e.target.value)
                          }
                          className="bg-terminal-surface border border-terminal-border text-terminal-text font-mono text-xs px-2 py-1 focus:outline-none focus:border-terminal-accent"
                        >
                          <option value="EQUALS">equals</option>
                          <option value="NOT_EQUALS">not equals</option>
                          <option value="CONTAINS">contains</option>
                          <option value="NOT_CONTAINS">not contains</option>
                          <option value="STARTS_WITH">starts with</option>
                          <option value="ENDS_WITH">ends with</option>
                          <option value="GREATER_THAN">&gt;</option>
                          <option value="LESS_THAN">&lt;</option>
                          <option value="IS_EMPTY">is empty</option>
                          <option value="IS_NOT_EMPTY">is not empty</option>
                        </select>
                        <input
                          type="text"
                          value={condition.value}
                          onChange={(e) =>
                            updateCondition(index, "value", e.target.value)
                          }
                          placeholder="value"
                          className="flex-1 min-w-[100px] bg-terminal-surface border border-terminal-border text-terminal-text font-mono text-xs px-2 py-1 focus:outline-none focus:border-terminal-accent"
                        />
                        <button
                          onClick={() => removeCondition(index)}
                          className="px-2 py-1 font-mono text-xs border border-red-500 text-red-500 hover:bg-red-500 hover:text-terminal-bg"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="bg-terminal-bg border border-terminal-border p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-mono text-sm text-terminal-accent">
                    🚀 THEN (Actions)
                  </div>
                  <button
                    onClick={addAction}
                    className="px-2 py-1 font-mono text-xs border border-terminal-border text-terminal-text hover:border-terminal-accent"
                  >
                    [ + Add Action ]
                  </button>
                </div>

                {actions.length === 0 ? (
                  <div className="font-mono text-xs text-terminal-dim">
                    Add at least one action
                  </div>
                ) : (
                  <div className="space-y-3">
                    {actions.map((action, index) => (
                      <div
                        key={index}
                        className="bg-terminal-surface border border-terminal-border p-3"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-mono text-xs text-terminal-dim">
                            #{index + 1}
                          </span>
                          <select
                            value={action.type}
                            onChange={(e) =>
                              updateAction(index, { type: e.target.value })
                            }
                            className="flex-1 bg-terminal-bg border border-terminal-border text-terminal-text font-mono text-xs px-2 py-1 focus:outline-none focus:border-terminal-accent"
                          >
                            {ACTION_TYPES.map((a) => (
                              <option key={a.id} value={a.id}>
                                {a.icon} {a.label}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => removeAction(index)}
                            className="px-2 py-1 font-mono text-xs border border-red-500 text-red-500 hover:bg-red-500 hover:text-terminal-bg"
                          >
                            ✕
                          </button>
                        </div>

                        {action.type === "CREATE_NOTE" && (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={action.config.title || ""}
                              onChange={(e) =>
                                updateActionConfig(
                                  index,
                                  "title",
                                  e.target.value,
                                )
                              }
                              placeholder="Note title"
                              className="w-full bg-terminal-bg border border-terminal-border text-terminal-text font-mono text-xs px-2 py-1 focus:outline-none focus:border-terminal-accent"
                            />
                            <textarea
                              value={action.config.content || ""}
                              onChange={(e) =>
                                updateActionConfig(
                                  index,
                                  "content",
                                  e.target.value,
                                )
                              }
                              placeholder="Note content (use {{fieldName}} for interpolation)"
                              rows={2}
                              className="w-full bg-terminal-bg border border-terminal-border text-terminal-text font-mono text-xs px-2 py-1 focus:outline-none focus:border-terminal-accent"
                            />
                          </div>
                        )}

                        {action.type === "CREATE_REMINDER" && (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={action.config.title || ""}
                              onChange={(e) =>
                                updateActionConfig(
                                  index,
                                  "title",
                                  e.target.value,
                                )
                              }
                              placeholder="Reminder title"
                              className="w-full bg-terminal-bg border border-terminal-border text-terminal-text font-mono text-xs px-2 py-1 focus:outline-none focus:border-terminal-accent"
                            />
                            <div className="flex gap-2">
                              <input
                                type="number"
                                value={action.config.minutesFromNow || 60}
                                onChange={(e) =>
                                  updateActionConfig(
                                    index,
                                    "minutesFromNow",
                                    parseInt(e.target.value),
                                  )
                                }
                                placeholder="Minutes from now"
                                className="flex-1 bg-terminal-bg border border-terminal-border text-terminal-text font-mono text-xs px-2 py-1 focus:outline-none focus:border-terminal-accent"
                              />
                              <span className="font-mono text-xs text-terminal-dim self-center">
                                minutes from now
                              </span>
                            </div>
                          </div>
                        )}

                        {action.type === "SEND_NOTIFICATION" && (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={action.config.title || ""}
                              onChange={(e) =>
                                updateActionConfig(
                                  index,
                                  "title",
                                  e.target.value,
                                )
                              }
                              placeholder="Notification title"
                              className="w-full bg-terminal-bg border border-terminal-border text-terminal-text font-mono text-xs px-2 py-1 focus:outline-none focus:border-terminal-accent"
                            />
                            <input
                              type="text"
                              value={action.config.message || ""}
                              onChange={(e) =>
                                updateActionConfig(
                                  index,
                                  "message",
                                  e.target.value,
                                )
                              }
                              placeholder="Message"
                              className="w-full bg-terminal-bg border border-terminal-border text-terminal-text font-mono text-xs px-2 py-1 focus:outline-none focus:border-terminal-accent"
                            />
                          </div>
                        )}

                        {action.type === "AI_PROMPT" && (
                          <textarea
                            value={action.config.prompt || ""}
                            onChange={(e) =>
                              updateActionConfig(
                                index,
                                "prompt",
                                e.target.value,
                              )
                            }
                            placeholder="AI prompt (use {{fieldName}} for interpolation)"
                            rows={3}
                            className="w-full bg-terminal-bg border border-terminal-border text-terminal-text font-mono text-xs px-2 py-1 focus:outline-none focus:border-terminal-accent"
                          />
                        )}

                        {action.type === "WEBHOOK" && (
                          <input
                            type="text"
                            value={action.config.url || ""}
                            onChange={(e) =>
                              updateActionConfig(index, "url", e.target.value)
                            }
                            placeholder="https://example.com/webhook"
                            className="w-full bg-terminal-bg border border-terminal-border text-terminal-text font-mono text-xs px-2 py-1 focus:outline-none focus:border-terminal-accent"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-terminal-border flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowEditor(false);
                  resetEditor();
                }}
                className="px-4 py-2 bg-terminal-bg border border-terminal-border text-terminal-text font-mono text-sm"
              >
                [ Cancel ]
              </button>
              <button
                onClick={handleSave}
                disabled={!name.trim() || actions.length === 0}
                className="px-4 py-2 bg-terminal-accent text-terminal-bg font-mono text-sm disabled:opacity-50"
              >
                [ Save Workflow ]
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
