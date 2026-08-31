// Approval Workflow Service - Firebase Sync
import { COLLECTIONS } from './firebase';
import { syncToFirestore, getFromStorage, saveToStorage } from './firebaseSync';

export interface ApprovalStep {
  id: string;
  label: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  timestamp?: string;
  comment?: string;
}

export interface WorkflowItem {
  id: string;
  type: 'quote' | 'order';
  itemId: string;
  steps: ApprovalStep[];
  currentStep: number;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

const WORKFLOW_KEY = 'tradelink_workflows';

function generateId() { return 'wf_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }

export function createWorkflow(type: 'quote' | 'order', itemId: string): WorkflowItem {
  const wf: WorkflowItem = {
    id: generateId(),
    type,
    itemId,
    steps: [
      { id: 's1', label: 'Creation', status: 'approved', timestamp: new Date().toISOString() },
      { id: 's2', label: 'Verification', status: 'pending' },
      { id: 's3', label: 'Validation Manager', status: 'pending' },
      { id: 's4', label: 'App finale', status: 'pending' },
    ],
    currentStep: 1,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  const wfs = getFromStorage<WorkflowItem>(WORKFLOW_KEY);
  wfs.push(wf);
  saveToStorage(WORKFLOW_KEY, wfs);
  syncToFirestore(COLLECTIONS.WORKFLOWS, wf as any, WORKFLOW_KEY);
  return wf;
}

export function approveStep(workflowId: string, stepIndex: number, approvedBy: string, comment?: string): boolean {
  const wfs = getFromStorage<WorkflowItem>(WORKFLOW_KEY);
  const wf = wfs.find(w => w.id === workflowId);
  if (!wf) return false;
  if (stepIndex >= wf.steps.length) return false;
  wf.steps[stepIndex] = { ...wf.steps[stepIndex], status: 'approved', approvedBy, timestamp: new Date().toISOString(), comment };
  if (stepIndex < wf.steps.length - 1) {
    wf.currentStep = stepIndex + 1;
  } else {
    wf.status = 'approved';
  }
  saveToStorage(WORKFLOW_KEY, wfs);
  syncToFirestore(COLLECTIONS.WORKFLOWS, wf as any, WORKFLOW_KEY);
  return true;
}

export function rejectStep(workflowId: string, stepIndex: number, rejectedBy: string, comment?: string): boolean {
  const wfs = getFromStorage<WorkflowItem>(WORKFLOW_KEY);
  const wf = wfs.find(w => w.id === workflowId);
  if (!wf) return false;
  wf.steps[stepIndex] = { ...wf.steps[stepIndex], status: 'rejected', approvedBy: rejectedBy, timestamp: new Date().toISOString(), comment };
  wf.status = 'rejected';
  saveToStorage(WORKFLOW_KEY, wfs);
  syncToFirestore(COLLECTIONS.WORKFLOWS, wf as any, WORKFLOW_KEY);
  return true;
}

export function getWorkflowForItem(type: string, itemId: string): WorkflowItem | undefined {
  return getFromStorage<WorkflowItem>(WORKFLOW_KEY).find(w => w.type === type && w.itemId === itemId);
}

export function getAllWorkflows(): WorkflowItem[] {
  return getFromStorage<WorkflowItem>(WORKFLOW_KEY);
}

export function getPendingApprovals(): WorkflowItem[] {
  return getFromStorage<WorkflowItem>(WORKFLOW_KEY).filter(w => w.status === 'pending');
}

export function deleteWorkflow(workflowId: string) {
  const wfs = getFromStorage<WorkflowItem>(WORKFLOW_KEY).filter(w => w.id !== workflowId);
  saveToStorage(WORKFLOW_KEY, wfs);
}
