/**
 * WorkflowBuilder.tsx
 * ===================
 * Visual n8n-style workflow editor using React Flow.
 * Admin can drag-and-drop AI Agent, Email, Condition nodes onto a canvas,
 * connect them, configure each node, and save the workflow to the backend.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  addEdge,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  type Connection,
  type Edge,
  type Node,
  MarkerType,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Mail, GitBranch, ArrowLeft, Save,
  Trash2, ChevronRight, X, Zap, FileText,
  Settings, Power,
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BrandMark } from '../components/layout';

// ── Custom Node Components ──────────────────────────────────



function InputNodeComponent({ data }: any) {
  return (
    <div className="wf-node wf-node--input">
      <Handle type="source" position={Position.Bottom} className="!bg-primary !border-primary" />
      <div className="wf-node__icon" style={{ background: 'linear-gradient(135deg, #4f5bd5, #962fbf)' }}>
        <FileText className="w-4 h-4 text-white" />
      </div>
      <div className="wf-node__body">
        <div className="wf-node__label">{data.label || 'Complaint Input'}</div>
        <div className="wf-node__sub">Entry point</div>
      </div>
    </div>
  );
}

function AIAgentNodeComponent({ data, selected }: any) {
  return (
    <div className={`wf-node wf-node--agent ${selected ? 'wf-node--selected' : ''}`}>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      <div className="wf-node__icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
        <Brain className="w-4 h-4 text-white" />
      </div>
      <div className="wf-node__body">
        <div className="wf-node__label">{data.label || 'AI Agent'}</div>
        <div className="wf-node__sub">{data.agentConfigName || 'Not configured'}</div>
        {data.outputField && (
          <div className="wf-node__tag">→ {data.outputField}</div>
        )}
      </div>
    </div>
  );
}

function EmailNodeComponent({ data, selected }: any) {
  return (
    <div className={`wf-node wf-node--email ${selected ? 'wf-node--selected' : ''}`}>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      <div className="wf-node__icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
        <Mail className="w-4 h-4 text-white" />
      </div>
      <div className="wf-node__body">
        <div className="wf-node__label">{data.label || 'Send Email'}</div>
        <div className="wf-node__sub">To: {data.emailTarget || 'Not set'}</div>
      </div>
    </div>
  );
}

function ConditionNodeComponent({ data, selected }: any) {
  return (
    <div className={`wf-node wf-node--condition ${selected ? 'wf-node--selected' : ''}`}>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} id="true" style={{ left: '30%' }} />
      <Handle type="source" position={Position.Bottom} id="false" style={{ left: '70%' }} />
      <div className="wf-node__icon" style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
        <GitBranch className="w-4 h-4 text-white" />
      </div>
      <div className="wf-node__body">
        <div className="wf-node__label">{data.label || 'Condition'}</div>
        <div className="wf-node__sub">
          {data.field ? `${data.field} ${data.operator || '>='} ${data.value || '?'}` : 'Not configured'}
        </div>
        <div className="wf-node__handles-label">
          <span className="wf-handle-label wf-handle-label--true">{data.trueLabel || '✓ True'}</span>
          <span className="wf-handle-label wf-handle-label--false">{data.falseLabel || '✗ False'}</span>
        </div>
      </div>
    </div>
  );
}

const nodeTypes = {
  input: InputNodeComponent,
  aiAgent: AIAgentNodeComponent,
  email: EmailNodeComponent,
  condition: ConditionNodeComponent,
};

// ── Default edge options ──

const defaultEdgeOptions = {
  animated: true,
  style: { stroke: '#94a3b8', strokeWidth: 2 },
  markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
};

// ── Node palette items ──

const NODE_PALETTE = [
  { type: 'aiAgent', label: 'AI Agent', icon: Brain, color: '#10b981', desc: 'LLM with system prompt' },
  { type: 'email', label: 'Email', icon: Mail, color: '#f59e0b', desc: 'Send notification' },
  { type: 'condition', label: 'Condition', icon: GitBranch, color: '#8b5cf6', desc: 'If/else branching' },
];

// ── Demo workflow data ──

const DEMO_NODES: Node[] = [
  { id: 'input-1', type: 'input', position: { x: 300, y: 20 }, data: { label: 'Complaint Input' } },
  { id: 'agent-classifier', type: 'aiAgent', position: { x: 300, y: 160 }, data: { label: 'Classifier Agent', agentConfigName: 'Classifier Agent', outputField: 'department' } },
  { id: 'agent-priority', type: 'aiAgent', position: { x: 300, y: 320 }, data: { label: 'Priority Agent', agentConfigName: 'Priority Agent', outputField: 'priority' } },
  { id: 'condition-1', type: 'condition', position: { x: 300, y: 480 }, data: { label: 'Route Decision', field: 'confidence', operator: '>=', value: '0.8', trueLabel: 'Auto Route', falseLabel: 'Manual Review' } },
  { id: 'email-auto', type: 'email', position: { x: 100, y: 660 }, data: { label: 'Send to Department', emailTarget: 'department', subject: 'New Ticket: {{title}}', bodyTemplate: 'A new complaint has been routed.\n\nTicket: {{ticket_id}}\nTitle: {{title}}\nPriority: {{priority}}\nDepartment: {{department}}' } },
  { id: 'email-review', type: 'email', position: { x: 500, y: 660 }, data: { label: 'Send to Admin', emailTarget: 'admin', subject: '⚠ Review: {{title}}', bodyTemplate: 'A complaint requires manual review.\n\nTicket: {{ticket_id}}\nTitle: {{title}}\nConfidence: {{confidence}}%' } },
];

const DEMO_EDGES: Edge[] = [
  { id: 'e1', source: 'input-1', target: 'agent-classifier', ...defaultEdgeOptions },
  { id: 'e2', source: 'agent-classifier', target: 'agent-priority', ...defaultEdgeOptions },
  { id: 'e3', source: 'agent-priority', target: 'condition-1', ...defaultEdgeOptions },
  { id: 'e4', source: 'condition-1', target: 'email-auto', sourceHandle: 'true', ...defaultEdgeOptions, style: { stroke: '#10b981', strokeWidth: 2 } },
  { id: 'e5', source: 'condition-1', target: 'email-review', sourceHandle: 'false', ...defaultEdgeOptions, style: { stroke: '#ef4444', strokeWidth: 2 } },
];

// ── Config Panel ──────────────────────────────────────────

function NodeConfigPanel({
  node,
  onUpdate,
  onClose,
  onDelete,
  agentConfigs,
}: {
  node: Node;
  onUpdate: (id: string, data: any) => void;
  onClose: () => void;
  onDelete: (id: string) => void;
  agentConfigs: any[];
}) {
  const [formData, setFormData] = useState<any>({ ...node.data });

  useEffect(() => {
    setFormData({ ...node.data });
  }, [node.id]);

  const handleChange = (field: string, value: any) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    onUpdate(node.id, updated);
  };

  return (
    <motion.div
      initial={{ x: 320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 320, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="wf-config-panel"
    >
      <div className="flex items-center justify-between p-4 border-b border-outline-variant/30">
        <h3 className="text-sm font-semibold text-on-surface flex items-center gap-2">
          <Settings className="w-4 h-4 text-primary" />
          Node Configuration
        </h3>
        <button onClick={onClose} className="p-1.5 hover:bg-surface-container rounded-lg transition-colors">
          <X className="w-4 h-4 text-on-surface-variant" />
        </button>
      </div>

      <div className="p-4 space-y-4 overflow-y-auto flex-1">
        {/* Label */}
        <div>
          <label className="wf-config-label">Label</label>
          <input
            value={formData.label || ''}
            onChange={(e) => handleChange('label', e.target.value)}
            className="wf-config-input"
            placeholder="Node label"
          />
        </div>

        {/* AI Agent specific */}
        {node.type === 'aiAgent' && (
          <>
            <div>
              <label className="wf-config-label">Agent Configuration</label>
              <select
                value={formData.agentConfigName || ''}
                onChange={(e) => handleChange('agentConfigName', e.target.value)}
                className="wf-config-input"
              >
                <option value="">Select agent config…</option>
                {agentConfigs.map((ac: any) => (
                  <option key={ac.id} value={ac.name}>{ac.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="wf-config-label">Output Field</label>
              <input
                value={formData.outputField || ''}
                onChange={(e) => handleChange('outputField', e.target.value)}
                className="wf-config-input"
                placeholder="e.g. department, priority"
              />
              <p className="text-[11px] text-on-surface-variant mt-1">
                The AI result will be stored in this field on the ticket state
              </p>
            </div>
          </>
        )}

        {/* Email specific */}
        {node.type === 'email' && (
          <>
            <div>
              <label className="wf-config-label">Send To</label>
              <select
                value={formData.emailTarget || ''}
                onChange={(e) => handleChange('emailTarget', e.target.value)}
                className="wf-config-input"
              >
                <option value="department">Classified Department</option>
                <option value="admin">Admin Email</option>
                <option value="custom">Custom Email…</option>
              </select>
            </div>
            {formData.emailTarget === 'custom' && (
              <div>
                <label className="wf-config-label">Email Address</label>
                <input
                  value={formData.customEmail || ''}
                  onChange={(e) => handleChange('customEmail', e.target.value)}
                  className="wf-config-input"
                  placeholder="user@example.com"
                />
              </div>
            )}
            <div>
              <label className="wf-config-label">Subject Template</label>
              <input
                value={formData.subject || ''}
                onChange={(e) => handleChange('subject', e.target.value)}
                className="wf-config-input"
                placeholder="New Ticket: {{title}}"
              />
            </div>
            <div>
              <label className="wf-config-label">Body Template</label>
              <textarea
                value={formData.bodyTemplate || ''}
                onChange={(e) => handleChange('bodyTemplate', e.target.value)}
                className="wf-config-input min-h-[120px] resize-y"
                placeholder="Use {{title}}, {{description}}, {{priority}}, {{department}}, {{confidence}}, {{ticket_id}}"
              />
              <p className="text-[11px] text-on-surface-variant mt-1">
                Available variables: {'{{title}}'}, {'{{description}}'}, {'{{priority}}'}, {'{{department}}'}, {'{{confidence}}'}, {'{{ticket_id}}'}
              </p>
            </div>
          </>
        )}

        {/* Condition specific */}
        {node.type === 'condition' && (
          <>
            <div>
              <label className="wf-config-label">Field to Check</label>
              <select
                value={formData.field || ''}
                onChange={(e) => handleChange('field', e.target.value)}
                className="wf-config-input"
              >
                <option value="confidence">AI Confidence</option>
                <option value="priority">Priority</option>
                <option value="department">Department</option>
                <option value="sentiment">Sentiment</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="wf-config-label">Operator</label>
                <select
                  value={formData.operator || '>='}
                  onChange={(e) => handleChange('operator', e.target.value)}
                  className="wf-config-input"
                >
                  <option value=">=">≥ (greater or equal)</option>
                  <option value="<=">≤ (less or equal)</option>
                  <option value="==">= (equals)</option>
                  <option value="!=">≠ (not equals)</option>
                  <option value=">">{'>'} (greater than)</option>
                  <option value="<">{'<'} (less than)</option>
                </select>
              </div>
              <div>
                <label className="wf-config-label">Value</label>
                <input
                  value={formData.value || ''}
                  onChange={(e) => handleChange('value', e.target.value)}
                  className="wf-config-input"
                  placeholder="0.8"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="wf-config-label">True Label</label>
                <input
                  value={formData.trueLabel || ''}
                  onChange={(e) => handleChange('trueLabel', e.target.value)}
                  className="wf-config-input"
                  placeholder="✓ Auto Route"
                />
              </div>
              <div>
                <label className="wf-config-label">False Label</label>
                <input
                  value={formData.falseLabel || ''}
                  onChange={(e) => handleChange('falseLabel', e.target.value)}
                  className="wf-config-input"
                  placeholder="✗ Manual Review"
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Delete button */}
      {node.type !== 'input' && (
        <div className="p-4 border-t border-outline-variant/30">
          <button
            onClick={() => onDelete(node.id)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-error hover:bg-error-container hover:text-on-error-container rounded-lg text-sm font-medium transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Delete Node
          </button>
        </div>
      )}
    </motion.div>
  );
}

// ── Main Workflow Builder ─────────────────────────────────

export function WorkflowBuilder() {
  const navigate = useNavigate();
  const [nodes, setNodes, onNodesChange] = useNodesState(DEMO_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(DEMO_EDGES);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [activeWorkflowId, setActiveWorkflowId] = useState<string>('');
  const [workflowName, setWorkflowName] = useState('Default Complaint Pipeline');
  const [agentConfigs, setAgentConfigs] = useState<any[]>([]);

  const [isSaving, setIsSaving] = useState(false);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [wfRes, agRes] = await Promise.all([
          axios.get('http://localhost:8000/api/admin/workflows'),
          axios.get('http://localhost:8000/api/admin/agent-configs'),
        ]);
        setWorkflows(wfRes.data);
        setAgentConfigs(agRes.data);

        // Load the active workflow
        const active = wfRes.data.find((w: any) => w.is_active);
        if (active) {
          setActiveWorkflowId(active.id);
          setWorkflowName(active.name);
          if (active.graph_data?.nodes?.length) {
            setNodes(active.graph_data.nodes);
            setEdges(active.graph_data.edges || []);
          }
        }
      } catch {
        // Use demo data as fallback
        setAgentConfigs([
          { id: '1', name: 'Classifier Agent' },
          { id: '2', name: 'Priority Agent' },
          { id: '3', name: 'Router Agent' },
        ]);
      }
    };
    fetchData();
  }, []);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, ...defaultEdgeOptions }, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const handleNodeUpdate = useCallback((nodeId: string, newData: any) => {
    setNodes((nds) =>
      nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, ...newData } } : n))
    );
    setSelectedNode((prev) => prev && prev.id === nodeId ? { ...prev, data: { ...prev.data, ...newData } } : prev);
  }, [setNodes]);

  const handleDeleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    setSelectedNode(null);
  }, [setNodes, setEdges]);

  const addNode = useCallback((type: string) => {
    const id = `${type}-${Date.now()}`;
    const newNode: Node = {
      id,
      type,
      position: { x: 300, y: (nodes.length + 1) * 160 },
      data: {
        label: type === 'aiAgent' ? 'New AI Agent'
          : type === 'email' ? 'New Email'
          : type === 'condition' ? 'New Condition' : 'New Node',
      },
    };
    setNodes((nds) => [...nds, newNode]);
    setSelectedNode(newNode);
    toast.success(`${type} node added`);
  }, [nodes, setNodes]);

  const handleSave = async () => {
    setIsSaving(true);
    const graphData = {
      nodes: nodes.map(n => ({ id: n.id, type: n.type, position: n.position, data: n.data })),
      edges: edges.map(e => ({ id: e.id, source: e.source, target: e.target, sourceHandle: e.sourceHandle })),
    };

    try {
      if (activeWorkflowId) {
        await axios.put(`http://localhost:8000/api/admin/workflows/${activeWorkflowId}`, {
          name: workflowName,
          graph_data: graphData,
        });
      } else {
        const res = await axios.post('http://localhost:8000/api/admin/workflows', {
          name: workflowName,
          graph_data: graphData,
        });
        setActiveWorkflowId(res.data.id);
      }
      toast.success('Workflow saved successfully');
    } catch {
      toast.error('Failed to save workflow');
    }
    setIsSaving(false);
  };

  const handleActivate = async () => {
    if (!activeWorkflowId) {
      toast.error('Save the workflow first');
      return;
    }
    try {
      await axios.post(`http://localhost:8000/api/admin/workflows/${activeWorkflowId}/activate`);
      toast.success('Workflow activated — new tickets will use this pipeline');
    } catch {
      toast.error('Failed to activate workflow');
    }
  };

  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-surface flex flex-col font-body-md">
      {/* Header */}
      <header className="h-14 border-b border-outline-variant flex items-center justify-between px-4 sm:px-6 bg-surface z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin')}
            className="p-2 hover:bg-surface-container rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-on-surface-variant" />
          </button>
          <BrandMark compact />
          <ChevronRight className="w-3 h-3 text-on-surface-variant" />
          <input
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="text-sm font-semibold text-on-surface bg-transparent border-none outline-none focus:bg-surface-container px-2 py-1 rounded-lg transition-colors max-w-[240px]"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleActivate}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            <Power className="w-3.5 h-3.5" /> Activate
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-lg bg-primary text-on-primary hover:opacity-90 transition-all disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" /> {isSaving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Palette */}
        <aside className="w-56 border-r border-outline-variant bg-surface flex flex-col">
          <div className="p-3 border-b border-outline-variant/30">
            <p className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">Add Nodes</p>
          </div>
          <div className="p-2 space-y-1 flex-1">
            {NODE_PALETTE.map((item) => (
              <button
                key={item.type}
                onClick={() => addNode(item.type)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-surface-container transition-colors group"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                  style={{ background: `${item.color}15` }}
                >
                  <item.icon className="w-4 h-4" style={{ color: item.color }} />
                </div>
                <div>
                  <p className="text-xs font-medium text-on-surface">{item.label}</p>
                  <p className="text-[10px] text-on-surface-variant">{item.desc}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Workflow list */}
          <div className="p-3 border-t border-outline-variant/30">
            <p className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Workflows</p>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {workflows.length > 0 ? workflows.map((wf: any) => (
                <button
                  key={wf.id}
                  onClick={() => {
                    setActiveWorkflowId(wf.id);
                    setWorkflowName(wf.name);
                    if (wf.graph_data?.nodes?.length) {
                      setNodes(wf.graph_data.nodes);
                      setEdges(wf.graph_data.edges || []);
                    }
                    setSelectedNode(null);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-center gap-2 ${
                    wf.id === activeWorkflowId
                      ? 'bg-secondary-container text-on-secondary-container font-medium'
                      : 'text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  {wf.is_active && <div className="w-1.5 h-1.5 bg-primary rounded-full shrink-0" />}
                  <span className="truncate">{wf.name}</span>
                </button>
              )) : (
                <p className="text-[11px] text-on-surface-variant px-3 py-2">Using demo workflow</p>
              )}
            </div>
          </div>
        </aside>

        {/* Canvas */}
        <div className="flex-1 relative" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={defaultEdgeOptions}
            fitView
            className="wf-canvas"
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1}
              color="#d1d5db"
            />
            <Controls className="wf-controls" />
            <Panel position="bottom-center">
              <div className="glass-card px-4 py-2 rounded-xl text-[11px] text-on-surface-variant flex items-center gap-3 shadow-lg">
                <span>{nodes.length} nodes</span>
                <span className="text-outline">·</span>
                <span>{edges.length} connections</span>
                <span className="text-outline">·</span>
                <span className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-primary" />
                  {workflows.find((w: any) => w.id === activeWorkflowId)?.is_active ? 'Active' : 'Draft'}
                </span>
              </div>
            </Panel>
          </ReactFlow>
        </div>

        {/* Right Config Panel */}
        <AnimatePresence>
          {selectedNode && (
            <NodeConfigPanel
              node={selectedNode}
              onUpdate={handleNodeUpdate}
              onClose={() => setSelectedNode(null)}
              onDelete={handleDeleteNode}
              agentConfigs={agentConfigs}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
