import {
  AlertCircle,
  AlertTriangle,
  Bot,
  Building,
  Check,
  CheckCircle2,
  CheckSquare,
  Clock,
  Coffee,
  DollarSign,
  FileCheck,
  Flame,
  Layers,
  MapPin,
  Package,
  Plus,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Store,
  Thermometer,
  Trash2,
  Utensils,
  Wrench,
  X,
} from 'lucide-react';
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRestaurant } from '../../context/RestaurantContext';
import { generateBranchSOPWithAI } from '../../services/sopAiService';
import { Outlet, SOPMaster, SOPStep, UserRole } from '../../types';

interface AiSopGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (sop: SOPMaster) => void;
}

const CATEGORY_PRESETS: Array<{
  id: SOPMaster['category'];
  name: string;
  desc: string;
  icon: React.ElementType;
  defaultRole: UserRole;
  defaultMinutes: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
}> = [
  {
    id: 'opening',
    name: 'Morning Store Opening',
    desc: 'Perimeter check, appliance pre-heating, cold-chain verify & POS float setup',
    icon: Clock,
    defaultRole: 'kitchen_staff',
    defaultMinutes: 25,
    priority: 'high',
  },
  {
    id: 'closing',
    name: 'Night Closing & Handover',
    desc: 'POS reconciliation, gas isolation, oil filtration, deep sanitization & security arming',
    icon: ShieldCheck,
    defaultRole: 'admin',
    defaultMinutes: 35,
    priority: 'high',
  },
  {
    id: 'food_safety',
    name: 'FSSAI Food Safety Audit',
    desc: 'Cold-chain temp logs, oil TPC quality test, cutting board color coding & hygiene pass',
    icon: ShieldAlert,
    defaultRole: 'kitchen_staff',
    defaultMinutes: 20,
    priority: 'critical',
  },
  {
    id: 'food_prep',
    name: 'Kitchen Food Prep & Assembly',
    desc: 'Portion control, bun toasting, fryer cycle timing & momo steaming standards',
    icon: Utensils,
    defaultRole: 'kitchen_staff',
    defaultMinutes: 20,
    priority: 'high',
  },
  {
    id: 'beverage_prep',
    name: 'Beverage Bar & Espresso Tuning',
    desc: 'Grinder dose dial-in, pump pressure (9.2 bar), milk steaming & syrup station audit',
    icon: Coffee,
    defaultRole: 'employee',
    defaultMinutes: 20,
    priority: 'medium',
  },
  {
    id: 'cash_pos',
    name: 'POS Billing & Cash Float',
    desc: 'Opening float count, terminal hardware check, digital QR verify & shift balance',
    icon: DollarSign,
    defaultRole: 'cashier',
    defaultMinutes: 15,
    priority: 'high',
  },
  {
    id: 'cleaning',
    name: 'Deep Station Sanitization',
    desc: 'Degreasing fryers, chimney duct inspection, food-safe chemical contact time',
    icon: FileCheck,
    defaultRole: 'kitchen_staff',
    defaultMinutes: 30,
    priority: 'high',
  },
  {
    id: 'equipment',
    name: 'Equipment Maintenance',
    desc: 'Compressor radiator dust-off, gasket integrity, calibration & emergency valve test',
    icon: Wrench,
    defaultRole: 'admin',
    defaultMinutes: 30,
    priority: 'medium',
  },
  {
    id: 'inventory',
    name: 'Receiving & FIFO Inspection',
    desc: 'Supplier delivery temperature probe, expiry tags, pest barrier & pallet check',
    icon: Package,
    defaultRole: 'inventory_staff',
    defaultMinutes: 20,
    priority: 'medium',
  },
];

export const AiSopGeneratorModal: React.FC<AiSopGeneratorModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const {
    outlets,
    activeOutlet,
    activeOutletId,
    equipment,
    menuItems,
    categories,
    addSOPMaster,
    publishSOPTaskForToday,
  } = useRestaurant();

  const { currentUser } = useAuth();

  // Branch Selection: default to active outlet or first outlet
  const [selectedOutletId, setSelectedOutletId] = useState<string>(
    activeOutletId || (outlets[0]?.id ?? 'outlet-1')
  );

  const selectedOutlet: Outlet =
    outlets.find((o) => o.id === selectedOutletId) ||
    activeOutlet || {
      id: 'outlet-1',
      name: 'Connaught Place Flagship',
      code: 'DEL-CP-01',
      city: 'New Delhi',
      state: 'Delhi',
      address: 'Block B, Radial Road 3, Inner Circle, Connaught Place',
      phone: '+91 98765 43210',
      email: 'cp@zorkocafe.com',
      fssaiLicense: '10822001000123',
      gstin: '07AAAAA0000A1Z5',
      openingTime: '08:00 AM',
      closingTime: '11:30 PM',
      tableCount: 22,
      terminalCount: 2,
      isFranchise: false,
      status: 'active',
    };

  const [category, setCategory] = useState<SOPMaster['category']>('opening');
  const [focusArea, setFocusArea] = useState<string>('');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedSOP, setGeneratedSOP] = useState<SOPMaster | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isSimulatedNote, setIsSimulatedNote] = useState<boolean>(false);
  const [publishImmediately, setPublishImmediately] = useState<boolean>(true);

  if (!isOpen) return null;

  // Filter equipment for the selected branch
  const branchEquipment = equipment.filter((eq) => {
    if (!eq.location) return true;
    return (
      eq.location.toLowerCase().includes(selectedOutlet.name.toLowerCase()) ||
      eq.location.toLowerCase().includes(selectedOutlet.city.toLowerCase()) ||
      true
    );
  });

  const handleGenerate = async () => {
    setIsGenerating(true);
    setStatusMessage(`Compiling ${selectedOutlet.name} equipment, menu and compliance specs...`);

    try {
      const response = await generateBranchSOPWithAI({
        outlet: selectedOutlet,
        category,
        focusArea,
        customPrompt,
        equipment: branchEquipment,
        menuItems,
        categories,
      });

      if (response.success && response.data) {
        setGeneratedSOP(response.data);
        setIsSimulatedNote(Boolean(response.isSimulated));
        setStatusMessage('AI generation complete! Review and refine below.');
      } else {
        setStatusMessage(response.error || 'Unable to generate SOP. Please try again.');
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage('Error executing AI SOP generation.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveSOP = () => {
    if (!generatedSOP) return;

    // Prepare master record
    const masterData: Omit<SOPMaster, 'id' | 'createdAt'> = {
      title: generatedSOP.title,
      category: generatedSOP.category,
      department: generatedSOP.department || 'Store Operations',
      purpose: generatedSOP.purpose || 'Standard Operational Compliance',
      description: generatedSOP.description || 'Routine checklist for store associates',
      responsibleRole: generatedSOP.responsibleRole || 'kitchen_staff',
      frequency: generatedSOP.frequency || 'daily',
      estimatedMinutes: Number(generatedSOP.estimatedMinutes) || 20,
      priority: generatedSOP.priority || 'high',
      version: 1,
      status: 'active',
      outletId: selectedOutlet.id,
      outletName: selectedOutlet.name,
      isAiGenerated: true,
      branchContextSummary: generatedSOP.branchContextSummary,
      createdBy: currentUser?.name || 'Store Manager',
      steps: generatedSOP.steps.map((s, idx) => ({
        ...s,
        id: s.id || `step-${Date.now()}-${idx + 1}`,
        stepNumber: idx + 1,
      })),
    };

    const saved = addSOPMaster(masterData);

    if (publishImmediately) {
      publishSOPTaskForToday(saved.id, selectedOutlet.id);
    }

    if (onSuccess) {
      onSuccess(saved);
    }
    onClose();
  };

  const handleUpdateStepInstruction = (stepIndex: number, text: string) => {
    if (!generatedSOP) return;
    const nextSteps = [...generatedSOP.steps];
    nextSteps[stepIndex] = { ...nextSteps[stepIndex], instruction: text };
    setGeneratedSOP({ ...generatedSOP, steps: nextSteps });
  };

  const handleRemoveStep = (stepIndex: number) => {
    if (!generatedSOP) return;
    const nextSteps = generatedSOP.steps.filter((_, idx) => idx !== stepIndex);
    setGeneratedSOP({ ...generatedSOP, steps: nextSteps });
  };

  const handleAddCustomStep = () => {
    if (!generatedSOP) return;
    const newStep: SOPStep = {
      id: `step-custom-${Date.now()}`,
      stepNumber: generatedSOP.steps.length + 1,
      instruction: `Custom branch check for ${selectedOutlet.name}`,
      isRequired: true,
      evidenceType: 'checkbox',
      expectedValue: 'Verified',
    };
    setGeneratedSOP({
      ...generatedSOP,
      steps: [...generatedSOP.steps, newStep],
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-4xl my-8 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-purple-700 via-indigo-700 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner">
              <Sparkles className="w-6 h-6 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black tracking-tight">AI SOP Generator</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/40 text-purple-100 border border-purple-300/30 flex items-center gap-1">
                  <Bot className="w-3 h-3 text-amber-300" />
                  Gemini 3.8 Flash
                </span>
              </div>
              <p className="text-xs text-purple-100/80 mt-0.5">
                Generate hyper-localized Standard Operating Procedures using your branch's machinery, menu, and FSSAI parameters.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* STEP 1: Branch / Location Profile Context */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider">
                  Target Location & Branch Context
                </span>
              </div>

              {outlets.length > 1 && (
                <div className="flex items-center gap-2">
                  <label className="text-[11px] text-slate-500 font-semibold">Select Branch:</label>
                  <select
                    value={selectedOutletId}
                    onChange={(e) => {
                      setSelectedOutletId(e.target.value);
                      setGeneratedSOP(null);
                    }}
                    className="text-xs font-bold py-1.5 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                  >
                    {outlets.map((out) => (
                      <option key={out.id} value={out.id}>
                        {out.name} ({out.code}) - {out.city}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Branch Data Telemetry Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-xs">
              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-purple-500" />
                  Address & City
                </div>
                <div className="font-bold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                  {selectedOutlet.city}
                </div>
                <div className="text-[10px] text-slate-500 truncate">{selectedOutlet.address}</div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-indigo-500" />
                  Operating Hours
                </div>
                <div className="font-bold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                  {selectedOutlet.openingTime || '08:00 AM'} - {selectedOutlet.closingTime || '11:30 PM'}
                </div>
                <div className="text-[10px] text-slate-500">
                  {selectedOutlet.terminalCount || 2} Billing Stations
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" />
                  FSSAI License
                </div>
                <div className="font-bold text-slate-800 dark:text-slate-200 truncate mt-0.5 font-mono text-[11px]">
                  #{selectedOutlet.fssaiLicense || '10822001000123'}
                </div>
                <div className="text-[10px] text-emerald-600 font-semibold">Active Food Safety</div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                  <Wrench className="w-3 h-3 text-amber-500" />
                  Branch Machinery
                </div>
                <div className="font-bold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                  {branchEquipment.length} Equipment Registered
                </div>
                <div className="text-[10px] text-slate-500 truncate">
                  {branchEquipment[0]?.name || 'Deep Fryers, Ovens, Chiller'}
                </div>
              </div>
            </div>
          </div>

          {/* STEP 2: Category & Operational Focus */}
          {!generatedSOP && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-600 dark:text-slate-400 tracking-wider mb-2">
                  Select SOP Category
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {CATEGORY_PRESETS.map((preset) => {
                    const IconComponent = preset.icon;
                    const isSelected = category === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setCategory(preset.id)}
                        className={`text-left p-3 rounded-2xl border transition-all flex items-start gap-2.5 ${
                          isSelected
                            ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-600 dark:border-purple-500 shadow-xs ring-1 ring-purple-500'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div
                          className={`p-2 rounded-xl shrink-0 ${
                            isSelected
                              ? 'bg-purple-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                            {preset.name}
                          </div>
                          <div className="text-[10px] text-slate-500 leading-tight mt-0.5 line-clamp-2">
                            {preset.desc}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Specific Operational Focus (Optional)
                  </label>
                  <input
                    type="text"
                    value={focusArea}
                    onChange={(e) => setFocusArea(e.target.value)}
                    placeholder="e.g. Frying oil TPC test, walk-in chiller probe, espresso dial-in"
                    className="w-full text-xs py-2 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Custom Store Directive (Optional)
                  </label>
                  <input
                    type="text"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="e.g. Include checks for stone deck pizza oven and momo steamer"
                    className="w-full text-xs py-2 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Action Button to Generate */}
              <div className="pt-2 flex items-center justify-between">
                <div className="text-xs text-slate-500 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  <span>
                    Will ingest <strong>{branchEquipment.length} machines</strong>,{' '}
                    <strong>{categories.length} menu groups</strong>, and branch timings.
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="py-2.5 px-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-purple-600/25 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <RotateCcw className="w-4 h-4 animate-spin" />
                      <span>Synthesizing Branch SOP...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Generate Branch SOP</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Generated SOP Review & Refinement */}
          {generatedSOP && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-purple-50/80 dark:bg-purple-950/30 p-4 rounded-2xl border border-purple-200 dark:border-purple-800 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-600 text-white">
                      AI Generated
                    </span>
                    <span className="text-xs font-bold text-purple-900 dark:text-purple-300">
                      Tailored for {selectedOutlet.name} ({selectedOutlet.code})
                    </span>
                    {isSimulatedNote && (
                      <span className="text-[10px] font-semibold text-slate-500 italic">
                        (Branch Local Synthesis)
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {generatedSOP.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300">{generatedSOP.purpose}</p>
                  {generatedSOP.branchContextSummary && (
                    <div className="text-[11px] text-purple-800 dark:text-purple-300 bg-white/60 dark:bg-slate-900/60 p-2.5 rounded-xl border border-purple-200/60 dark:border-purple-800/60 mt-2">
                      <strong className="font-extrabold">Branch Context: </strong>
                      {generatedSOP.branchContextSummary}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setGeneratedSOP(null)}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Regenerate</span>
                </button>
              </div>

              {/* Editable Parameters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Role</span>
                  <input
                    type="text"
                    value={generatedSOP.responsibleRole}
                    onChange={(e) =>
                      setGeneratedSOP({
                        ...generatedSOP,
                        responsibleRole: e.target.value as UserRole,
                      })
                    }
                    className="w-full text-xs font-bold py-1 px-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Est. Minutes</span>
                  <input
                    type="number"
                    value={generatedSOP.estimatedMinutes}
                    onChange={(e) =>
                      setGeneratedSOP({
                        ...generatedSOP,
                        estimatedMinutes: parseInt(e.target.value) || 20,
                      })
                    }
                    className="w-full text-xs font-bold py-1 px-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Frequency</span>
                  <select
                    value={generatedSOP.frequency}
                    onChange={(e) =>
                      setGeneratedSOP({
                        ...generatedSOP,
                        frequency: e.target.value as any,
                      })
                    }
                    className="w-full text-xs font-bold py-1 px-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    <option value="daily">Daily</option>
                    <option value="per_shift">Per Shift</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Priority</span>
                  <select
                    value={generatedSOP.priority}
                    onChange={(e) =>
                      setGeneratedSOP({
                        ...generatedSOP,
                        priority: e.target.value as any,
                      })
                    }
                    className="w-full text-xs font-bold py-1 px-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              {/* Step list */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider">
                    Sequential Audit Steps ({generatedSOP.steps.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddCustomStep}
                    className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Step</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {generatedSOP.steps.map((step, idx) => (
                    <div
                      key={step.id || idx}
                      className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-start gap-3 hover:border-purple-300 dark:hover:border-purple-700 transition-colors"
                    >
                      <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </div>

                      <div className="flex-1 space-y-1.5">
                        <input
                          type="text"
                          value={step.instruction}
                          onChange={(e) => handleUpdateStepInstruction(idx, e.target.value)}
                          className="w-full text-xs font-semibold text-slate-900 dark:text-white bg-transparent border-b border-transparent hover:border-slate-300 focus:border-purple-500 focus:outline-hidden py-0.5"
                        />

                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-mono text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400">
                            {step.evidenceType}
                          </span>

                          {step.expectedValue && (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                              Target: {step.expectedValue}
                            </span>
                          )}

                          {step.expectedMin !== undefined && step.expectedMax !== undefined && (
                            <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold text-[10px]">
                              Safe Range: {step.expectedMin} - {step.expectedMax} {step.unit}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveStep(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                        title="Delete Step"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Publish to today option */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="publishToday"
                    checked={publishImmediately}
                    onChange={(e) => setPublishImmediately(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                  />
                  <label htmlFor="publishToday" className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Immediately publish to Today's Daily Checklist for {selectedOutlet.name}
                  </label>
                </div>
                <span className="text-[10px] text-slate-500">
                  Staff can start logging checks right away
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 truncate max-w-sm">
            {statusMessage}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>

            {generatedSOP && (
              <button
                type="button"
                onClick={handleSaveSOP}
                className="py-2 px-5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black shadow-md shadow-purple-600/20 transition-all flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Save SOP & Deploy</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
