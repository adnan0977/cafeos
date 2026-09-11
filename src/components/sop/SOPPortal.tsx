import {
  AlertCircle,
  Award,
  Bot,
  Building,
  Calendar,
  Check,
  CheckCircle2,
  CheckSquare,
  ChevronRight,
  ClipboardList,
  Clock,
  Coffee,
  FileCheck,
  Flame,
  Gauge,
  MapPin,
  Plus,
  RotateCw,
  Send,
  ShieldCheck,
  Sparkles,
  Store,
  Thermometer,
  Wrench,
  X,
} from 'lucide-react';
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRestaurant } from '../../context/RestaurantContext';
import { Equipment, SOPMaster, SOPTask } from '../../types';
import { formatDate, formatDateTime } from '../../utils/formatters';
import { AiSopGeneratorModal } from './AiSopGeneratorModal';

export const SOPPortal: React.FC = () => {
  const {
    sopTasks,
    sopMasters,
    equipment,
    maintenanceRecords,
    submitSOPTask,
    reviewSOPTask,
    addSOPMaster,
    publishSOPTaskForToday,
    logMaintenance,
    generateDailySOPTasks,
    outlets,
    activeOutlet,
    activeOutletId,
  } = useRestaurant();
  const { currentUser, hasPermission } = useAuth();

  const [activeTab, setActiveTab] = useState<'tasks' | 'masters' | 'equipment'>('tasks');
  const [selectedTask, setSelectedTask] = useState<SOPTask | null>(null);
  const [taskStepResults, setTaskStepResults] = useState<{ [stepId: string]: { completed: boolean; value?: string; notes?: string } }>({});
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>(equipment[0]?.id || 'eq-1');
  const [maintType, setMaintType] = useState<'routine' | 'preventive' | 'breakdown' | 'repair'>('routine');
  const [maintCost, setMaintCost] = useState('1500');
  const [maintNotes, setMaintNotes] = useState('Descaling completed and gaskets replaced');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const filteredTasks = sopTasks.filter((t) => {
    if (branchFilter === 'all') return true;
    return t.outletId === branchFilter;
  });

  const filteredMasters = sopMasters.filter((m) => {
    if (branchFilter === 'all') return true;
    return !m.outletId || m.outletId === branchFilter;
  });

  const pendingTasks = filteredTasks.filter((t) => t.status === 'pending');
  const completedTasks = filteredTasks.filter((t) => t.status === 'completed' || t.status === 'approved');

  const handleOpenTask = (task: SOPTask) => {
    setSelectedTask(task);
    const initialResults: { [stepId: string]: { completed: boolean; value?: string; notes?: string } } = {};
    task.results.forEach((r) => {
      initialResults[r.stepId] = {
        completed: Boolean(r.isCompleted || r.status === 'pass'),
        value: String(r.value ?? r.enteredValue ?? ''),
        notes: r.notes || r.comment || '',
      };
    });
    setTaskStepResults(initialResults);
  };

  const handleToggleStep = (stepId: string) => {
    setTaskStepResults((prev) => ({
      ...prev,
      [stepId]: {
        ...prev[stepId],
        completed: !prev[stepId]?.completed,
      },
    }));
  };

  const handleValueChange = (stepId: string, val: string) => {
    setTaskStepResults((prev) => ({
      ...prev,
      [stepId]: {
        ...prev[stepId],
        value: val,
      },
    }));
  };

  const handleSubmitTaskResults = () => {
    if (!selectedTask) return;

    const finalResults = selectedTask.results.map((r) => ({
      stepId: r.stepId,
      isCompleted: taskStepResults[r.stepId]?.completed || false,
      value: taskStepResults[r.stepId]?.value,
      notes: taskStepResults[r.stepId]?.notes,
      timestamp: new Date().toISOString(),
    }));

    submitSOPTask(selectedTask.id, finalResults);
    setSelectedTask(null);
    showToast(`Checklist "${selectedTask.sopTitle || selectedTask.title}" submitted successfully!`);
  };

  const handleDeploySopToToday = (sop: SOPMaster) => {
    const targetOutletId = sop.outletId || activeOutletId || outlets[0]?.id;
    const task = publishSOPTaskForToday(sop.id, targetOutletId);
    if (task) {
      showToast(`Published "${sop.title}" to Today's Checklist!`);
      setActiveTab('tasks');
    }
  };

  const handleLogMaintenanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const eq = equipment.find((e) => e.id === selectedEquipmentId);
    if (!eq) return;

    logMaintenance({
      equipmentId: eq.id,
      equipmentName: eq.name,
      maintenanceType: maintType,
      date: new Date().toISOString(),
      performedBy: 'Authorized Service Tech',
      cost: parseFloat(maintCost) || 0,
      notes: maintNotes,
    });
    setIsMaintenanceModalOpen(false);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-100 dark:bg-slate-950 p-4 sm:p-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30 flex items-center justify-center">
            <ClipboardList className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                SOP Compliance & Store Operations
              </h2>
              {activeOutlet && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {activeOutlet.name}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Branch-tailored audit checklists, FSSAI cold chain standards, temperature logs & machine calibrations
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={() => setIsAiModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:to-indigo-800 text-white rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-lg shadow-purple-600/25 active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>Generate Branch SOP with AI</span>
          </button>

          <button
            onClick={() => generateDailySOPTasks(branchFilter !== 'all' ? branchFilter : undefined)}
            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Generate Today's Checklists</span>
          </button>

          <button
            onClick={() => setIsMaintenanceModalOpen(true)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <Wrench className="w-3.5 h-3.5 text-amber-400" />
            <span>Log Equipment Service</span>
          </button>
        </div>
      </div>

      {/* Branch / Location Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 overflow-x-auto py-1 max-w-full">
          <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1 pl-2">
            <Store className="w-3.5 h-3.5 text-purple-600" />
            Branch View:
          </span>
          <button
            onClick={() => setBranchFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${
              branchFilter === 'all'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            All Locations ({outlets.length})
          </button>
          {outlets.map((out) => (
            <button
              key={out.id}
              onClick={() => setBranchFilter(out.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                branchFilter === out.id
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              <span>{out.name}</span>
              <span className="text-[10px] opacity-75 font-mono">({out.code})</span>
            </button>
          ))}
        </div>

        {toastMessage && (
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all text-center ${
            activeTab === 'tasks'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Daily Checklists ({pendingTasks.length} Due)
        </button>
        <button
          onClick={() => setActiveTab('masters')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all text-center ${
            activeTab === 'masters'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          SOP Catalog ({filteredMasters.length})
        </button>
        <button
          onClick={() => setActiveTab('equipment')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all text-center ${
            activeTab === 'equipment'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Equipment Assets ({equipment.length})
        </button>
      </div>

      {/* TAB 1: Tasks */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          {filteredTasks.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3">
              <ClipboardList className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                No active checklists for this branch selection
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Generate today's task instances from your SOP library or use the AI generator to formulate a new procedure.
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  onClick={() => generateDailySOPTasks(branchFilter !== 'all' ? branchFilter : undefined)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
                >
                  Generate from Masters
                </button>
                <button
                  onClick={() => setIsAiModalOpen(true)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Generate New SOP with AI</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTasks.map((task) => {
                const master = sopMasters.find((m) => m.id === task.sopMasterId || m.id === task.sopId);
                const isCompleted = task.status === 'completed' || task.status === 'approved';
                const completedStepCount = task.results.filter((r) => r.isCompleted || r.status === 'pass').length;

                return (
                  <div
                    key={task.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                              {task.category}
                            </span>
                            {task.outletName && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center gap-1">
                                <Store className="w-2.5 h-2.5 text-purple-500" />
                                {task.outletName}
                              </span>
                            )}
                          </div>
                          <h3 className="font-extrabold text-base text-slate-900 dark:text-white mt-1.5">
                            {task.sopTitle || task.title}
                          </h3>
                          <div className="text-xs text-slate-500 mt-0.5">
                            Due: {task.dueDate || task.date} • Assigned: {task.assignedToName || task.assignedRole}
                          </div>
                        </div>

                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                            task.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : task.status === 'completed'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {task.status}
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-4 space-y-1">
                        <div className="flex justify-between text-[11px] font-semibold text-slate-500">
                          <span>Checklist Completion</span>
                          <span>
                            {completedStepCount} / {task.results.length} Steps
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-purple-600 rounded-full transition-all duration-300"
                            style={{
                              width: `${(completedStepCount / Math.max(task.results.length, 1)) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleOpenTask(task)}
                        className="flex-1 py-2 px-3 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                      >
                        <CheckSquare className="w-4 h-4" />
                        <span>{isCompleted ? 'Review Answers' : 'Execute Checklist'}</span>
                      </button>

                      {task.status === 'completed' && hasPermission('approve_sop') && (
                        <button
                          onClick={() => reviewSOPTask(task.id, 'approved', 'Verified and compliant')}
                          className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors"
                        >
                          Approve
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SOP Masters */}
      {activeTab === 'masters' && (
        <div className="space-y-4">
          {/* AI Banner in Catalog */}
          <div className="bg-gradient-to-r from-purple-900/90 via-indigo-900/90 to-slate-900 text-white p-5 rounded-2xl border border-purple-700/50 shadow-lg flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-300">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black tracking-tight">
                  AI Standard Operating Procedure Synthesizer
                </h3>
                <p className="text-xs text-purple-200/80">
                  Generate tailored SOP protocols utilizing real equipment models, menu items, storage zones and FSSAI standards.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsAiModalOpen(true)}
              className="py-2 px-4 bg-white text-purple-900 hover:bg-purple-50 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4 text-purple-700" />
              <span>Create SOP with AI</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMasters.map((m) => (
              <div
                key={m.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3 flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] uppercase font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/60 px-2 py-0.5 rounded-full">
                          {m.category} • {m.frequency}
                        </span>
                        {m.isAiGenerated && (
                          <span className="text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                            AI
                          </span>
                        )}
                        {m.outletName && (
                          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Store className="w-2.5 h-2.5" />
                            {m.outletName}
                          </span>
                        )}
                      </div>
                      <h3 className="font-extrabold text-base text-slate-900 dark:text-white mt-1.5">
                        {m.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">{m.description}</p>
                    </div>
                  </div>

                  {m.branchContextSummary && (
                    <div className="p-2.5 bg-purple-50/60 dark:bg-purple-950/30 rounded-xl border border-purple-200/50 dark:border-purple-900/50 text-[11px] text-purple-900 dark:text-purple-200">
                      <strong className="font-extrabold">Branch Context: </strong>
                      {m.branchContextSummary}
                    </div>
                  )}

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-1.5 text-xs">
                    <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center justify-between">
                      <span>Audit Steps ({m.steps.length}):</span>
                      <span>Est: {m.estimatedMinutes || 20}m</span>
                    </div>
                    {m.steps.map((s, idx) => (
                      <div key={s.id} className="text-slate-700 dark:text-slate-300 flex items-start gap-1.5">
                        <span className="text-slate-400 font-bold">{idx + 1}.</span>
                        <span className="flex-1">{s.instruction}</span>
                        {s.expectedValue && (
                          <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 shrink-0 font-semibold">
                            {s.expectedValue}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <button
                    onClick={() => handleDeploySopToToday(m)}
                    className="flex-1 py-2 px-3 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Deploy to Today's Tasks</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Equipment Assets & Maintenance */}
      {activeTab === 'equipment' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {equipment.map((eq) => (
              <div
                key={eq.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                      {eq.name}
                    </h3>
                    <div className="text-xs text-slate-500">{eq.model} • S/N: {eq.serialNumber}</div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      eq.status === 'operational'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {eq.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Location</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{eq.location}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Next Due</span>
                    <span className="font-bold text-amber-600">{formatDate(eq.nextMaintenanceDate)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Maintenance Records Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 font-bold text-sm text-slate-900 dark:text-white">
              Recent Maintenance & Service Logs
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase">
                <tr>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Equipment</th>
                  <th className="py-2.5 px-4">Service Type</th>
                  <th className="py-2.5 px-4">Technician</th>
                  <th className="py-2.5 px-4">Cost</th>
                  <th className="py-2.5 px-4">Service Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {maintenanceRecords.map((m) => (
                  <tr key={m.id}>
                    <td className="py-2.5 px-4 text-slate-500">{formatDate(m.date)}</td>
                    <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-white">{m.equipmentName}</td>
                    <td className="py-2.5 px-4 uppercase font-semibold text-[10px] text-purple-600">{m.maintenanceType}</td>
                    <td className="py-2.5 px-4 text-slate-600 dark:text-slate-300">{m.performedBy}</td>
                    <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-white">₹{m.cost}</td>
                    <td className="py-2.5 px-4 text-slate-500">{m.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Task Execution Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl overflow-hidden my-8">
            <div className="px-6 py-4 bg-purple-50 dark:bg-purple-950/40 border-b border-purple-200 dark:border-purple-900/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {selectedTask.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {selectedTask.results.map((step, idx) => {
                const isChecked = taskStepResults[step.stepId]?.completed || false;
                const master = sopMasters.find((m) => m.id === selectedTask.sopMasterId);
                const stepMaster = master?.steps.find((s) => s.id === step.stepId);

                return (
                  <div
                    key={step.stepId}
                    className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs"
                  >
                    <div className="flex items-start gap-2.5">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleStep(step.stepId)}
                        className="mt-0.5 w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                      />
                      <div className="flex-1">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {idx + 1}. {stepMaster?.instruction || 'Checklist Step'}
                        </span>
                        {stepMaster?.expectedValue && (
                          <div className="text-[11px] text-purple-600 mt-0.5 font-semibold">
                            Target Standard: {stepMaster.expectedValue}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pl-6">
                      <input
                        type="text"
                        placeholder="Enter logged reading / notes (e.g. 4.2°C, calibrated, clean)"
                        value={taskStepResults[step.stepId]?.value || ''}
                        onChange={(e) => handleValueChange(step.stepId, e.target.value)}
                        className="w-full px-2.5 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setSelectedTask(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
              >
                Close
              </button>
              <button
                onClick={handleSubmitTaskResults}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
              >
                Submit Completed Checklist
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Equipment Maintenance Modal */}
      {isMaintenanceModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden my-8">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Log Equipment Maintenance
                </h3>
              </div>
              <button
                onClick={() => setIsMaintenanceModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLogMaintenanceSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Select Equipment
                </label>
                <select
                  value={selectedEquipmentId}
                  onChange={(e) => setSelectedEquipmentId(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                >
                  {equipment.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.name} ({eq.location})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Service Type
                  </label>
                  <select
                    value={maintType}
                    onChange={(e) => setMaintType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold"
                  >
                    <option value="routine">Routine Check</option>
                    <option value="preventive">Preventive Service</option>
                    <option value="repair">Repair</option>
                    <option value="breakdown">Breakdown</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Service Cost (₹)
                  </label>
                  <input
                    type="number"
                    value={maintCost}
                    onChange={(e) => setMaintCost(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Service Notes / Parts Replaced
                </label>
                <textarea
                  rows={2}
                  value={maintNotes}
                  onChange={(e) => setMaintNotes(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsMaintenanceModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md transition-colors"
                >
                  Save Maintenance Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI SOP Generator Modal */}
      <AiSopGeneratorModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onSuccess={(sop) => {
          showToast(`Generated & published "${sop.title}" for ${sop.outletName || 'branch'}!`);
          setActiveTab('masters');
        }}
      />
    </div>
  );
};
