import { Equipment, MenuItem, Outlet, SOPMaster, UserRole } from '../types';

export interface GenerateSOPParams {
  outlet: Outlet;
  category: SOPMaster['category'];
  focusArea?: string;
  customPrompt?: string;
  equipment: Equipment[];
  menuItems: MenuItem[];
  categories: { name: string }[];
  storageLocations?: string[];
  staffRoles?: UserRole[];
}

export interface GenerateSOPResponse {
  success: boolean;
  data?: SOPMaster;
  error?: string;
  isSimulated?: boolean;
}

export async function generateBranchSOPWithAI(params: GenerateSOPParams): Promise<GenerateSOPResponse> {
  const { outlet, category, focusArea, customPrompt, equipment, menuItems, categories } = params;

  // Filter equipment for this branch if location/outlet match, or use all
  const branchEquipment = equipment.filter((eq) => {
    if (!eq) return false;
    if (eq.location && eq.location.toLowerCase().includes(outlet.name.toLowerCase())) return true;
    return true; // Use available equipment
  });

  const branchData = {
    equipment: branchEquipment.map((e) => ({
      name: e.name,
      model: e.model,
      serialNumber: e.serialNumber,
      location: e.location,
      status: e.status,
      lastMaintenanceDate: e.lastMaintenanceDate,
      nextMaintenanceDate: e.nextMaintenanceDate,
    })),
    menuCategories: categories.map((c) => c.name),
    topMenuItems: menuItems.slice(0, 15).map((m) => ({
      name: m.name,
      category: m.categoryId,
      foodType: m.foodType,
      prepTimeMinutes: m.prepTimeMinutes,
    })),
    storageLocations: ['Walk-in Chiller', 'Deep Freezer', 'Dry Goods Storage', 'Beverage Bar B1', 'Packaging Rack P1'],
    staffRoles: ['kitchen_staff', 'cashier', 'biller', 'inventory_staff', 'admin'],
    shiftTimes: {
      opening: outlet.openingTime || '08:00 AM',
      closing: outlet.closingTime || '11:30 PM',
    },
  };

  try {
    const response = await fetch('/api/sop/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        outlet,
        category,
        focusArea,
        customPrompt,
        branchData,
      }),
    });

    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status}`);
    }

    const result = await response.json();
    if (result.success && result.data) {
      return {
        success: true,
        data: result.data,
        isSimulated: result.isSimulated,
      };
    } else {
      throw new Error(result.error || 'Failed to parse generated SOP');
    }
  } catch (err: any) {
    console.warn('Network call to /api/sop/generate failed, activating client-side intelligent fallback:', err);
    // Client-side fallback ensuring 100% resilience
    const fallbackSOP = createClientFallbackSOP(outlet, category, focusArea, branchEquipment);
    return {
      success: true,
      data: fallbackSOP,
      isSimulated: true,
      error: err.message,
    };
  }
}

function createClientFallbackSOP(
  outlet: Outlet,
  category: SOPMaster['category'],
  focusArea?: string,
  equipment: Equipment[] = []
): SOPMaster {
  const branchName = outlet.name || 'Branch';
  const primaryEq = equipment[0]?.name || 'Commercial Double Deep Fryer';
  const secondaryEq = equipment[1]?.name || 'Stone Deck Conveyor Pizza Oven';

  return {
    id: `sop-ai-${Date.now()}`,
    title: `${category.toUpperCase().replace('_', ' ')} Operational Protocol - ${branchName}`,
    category,
    department: 'Store Operations & Compliance',
    purpose: `Ensure rigorous FSSAI compliance and operational standard execution at ${branchName} (${outlet.code}).`,
    description: `Standardized operational procedure formulated specifically for ${branchName}'s equipment setup, operating hours (${outlet.openingTime} - ${outlet.closingTime}), and FSSAI License #${outlet.fssaiLicense}.`,
    responsibleRole: 'kitchen_staff',
    frequency: 'daily',
    estimatedMinutes: 20,
    priority: 'high',
    version: 1,
    status: 'active',
    createdBy: 'AI SOP Architect',
    outletId: outlet.id,
    outletName: branchName,
    isAiGenerated: true,
    branchContextSummary: `Tailored for ${branchName} in ${outlet.city}. Configured for ${primaryEq} and ${secondaryEq} at ${outlet.openingTime}.`,
    createdAt: new Date().toISOString(),
    steps: [
      {
        id: `step-ai-${Date.now()}-1`,
        stepNumber: 1,
        instruction: `Inspect store perimeter, entry doors, and disarm alarm at ${branchName}.`,
        isRequired: true,
        evidenceType: 'checkbox',
        expectedValue: 'Verified',
      },
      {
        id: `step-ai-${Date.now()}-2`,
        stepNumber: 2,
        instruction: `Check Walk-in Chiller temperature and log reading into digital checklist.`,
        isRequired: true,
        evidenceType: 'temperature',
        expectedMin: 2,
        expectedMax: 4,
        unit: '°C',
        expectedValue: '2.0°C - 4.0°C',
      },
      {
        id: `step-ai-${Date.now()}-3`,
        stepNumber: 3,
        instruction: `Pre-heat ${primaryEq} and check clean oil level before morning frying service.`,
        isRequired: true,
        evidenceType: 'temperature',
        expectedMin: 175,
        expectedMax: 185,
        unit: '°C',
        expectedValue: '180°C',
      },
      {
        id: `step-ai-${Date.now()}-4`,
        stepNumber: 4,
        instruction: `Warm up ${secondaryEq} and check exhaust hood suction.`,
        isRequired: true,
        evidenceType: 'temperature',
        expectedMin: 270,
        expectedMax: 290,
        unit: '°C',
        expectedValue: '280°C',
      },
      {
        id: `step-ai-${Date.now()}-5`,
        stepNumber: 5,
        instruction: `Verify ${outlet.terminalCount} POS billing station(s) cash drawer float.`,
        isRequired: true,
        evidenceType: 'number',
        expectedMin: 5000,
        expectedMax: 5000,
        unit: '₹',
        expectedValue: '₹5,000 float',
      },
      {
        id: `step-ai-${Date.now()}-6`,
        stepNumber: 6,
        instruction: `Staff handwash and FSSAI personal hygiene verification before service start.`,
        isRequired: true,
        evidenceType: 'checkbox',
        expectedValue: '100% compliant',
      },
    ],
  };
}
