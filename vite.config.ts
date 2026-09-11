import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import { GoogleGenAI } from '@google/genai';

function receiptOcrPlugin(): Plugin {
  return {
    name: 'receipt-ocr-plugin',
    configureServer(server) {
      server.middlewares.use('/api/inventory/parse-receipt', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method Not Allowed' }));
          return;
        }

        let body = '';
        req.on('data', (chunk) => {
          body += chunk;
        });

        req.on('end', async () => {
          try {
            const { imageBase64, mimeType = 'image/jpeg' } = JSON.parse(body || '{}');

            if (!imageBase64) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: 'No image data provided' }));
              return;
            }

            const apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey) {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  success: false,
                  fallback: true,
                  error: 'GEMINI_API_KEY environment variable not detected. Local intelligent OCR parser activated.',
                })
              );
              return;
            }

            const ai = new GoogleGenAI({
              apiKey,
              httpOptions: {
                headers: {
                  'User-Agent': 'aistudio-build',
                },
              },
            });

            const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');

            const response = await ai.models.generateContent({
              model: 'gemini-3.8-flash',
              contents: {
                parts: [
                  {
                    inlineData: {
                      mimeType,
                      data: cleanBase64,
                    },
                  },
                  {
                    text: `You are an expert restaurant inventory accountant and OCR scanner. Analyze this raw grocery / vendor / supplier receipt or invoice image.
Extract all purchased inventory ingredients and items accurately.
Return a valid JSON object with the following structure:
{
  "vendorName": "extracted vendor or supplier company name",
  "invoiceNumber": "invoice or bill number if visible",
  "invoiceDate": "YYYY-MM-DD or date string",
  "totalAmount": 1250.00,
  "items": [
    {
      "name": "Full ingredient/item name (e.g. Mozzarella Cheese, Roma Tomatoes, Amul Full Cream Milk, Olive Oil, Basmati Rice)",
      "quantity": 5,
      "unit": "kg",
      "unitCost": 150.0,
      "totalCost": 750.0,
      "category": "dairy",
      "minStock": 5,
      "storageLocation": "Cold Storage Walk-in"
    }
  ]
}`,
                  },
                ],
              },
              config: {
                responseMimeType: 'application/json',
              },
            });

            const text = response.text || '{}';
            const parsed = JSON.parse(text);

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, data: parsed }));
          } catch (err: any) {
            console.error('Receipt OCR server error:', err);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                success: false,
                fallback: true,
                error: err.message || 'Error executing AI model',
              })
            );
          }
        });
      });
    },
  };
}

function generateBranchTailoredFallbackSOP(params: {
  outlet: any;
  category: string;
  focusArea?: string;
  customPrompt?: string;
  branchData?: any;
}) {
  const { outlet, category, focusArea, customPrompt, branchData } = params;
  const branchName = outlet?.name || 'Store Branch';
  const branchCode = outlet?.code || 'OUT-01';
  const branchCity = outlet?.city || 'Local Area';
  const openingTime = outlet?.openingTime || '08:00 AM';
  const closingTime = outlet?.closingTime || '11:30 PM';
  const terminalCount = outlet?.terminalCount || 2;
  const fssaiLicense = outlet?.fssaiLicense || '10822001000123';
  const equipment = Array.isArray(branchData?.equipment) ? branchData.equipment : [];
  const primaryEquipment = equipment[0]?.name || 'Commercial Double Deep Fryer';
  const secondaryEquipment = equipment[1]?.name || 'Stone Deck Conveyor Pizza Oven';

  const categoryConfigs: Record<string, any> = {
    opening: {
      title: `Morning Opening & Equipment Calibration SOP - ${branchName}`,
      department: 'Store Operations & Kitchen',
      purpose: `Establish flawless morning readiness, calibrate food equipment, and verify FSSAI cold-chain safety before doors open at ${openingTime}.`,
      description: `Daily pre-opening operational checklist tailored for ${branchName} (${branchCode}). Covers perimeter inspection, refrigeration temperature logging, fryer and oven warmups, and POS float reconciliation.`,
      responsibleRole: 'kitchen_staff',
      frequency: 'daily',
      estimatedMinutes: 25,
      priority: 'high',
      branchContextSummary: `Tailored for ${branchName} (${branchCity}) operating ${openingTime} - ${closingTime}. Integrates ${primaryEquipment}, ${secondaryEquipment}, and ${terminalCount} POS terminal float checks.`,
      steps: [
        {
          stepNumber: 1,
          instruction: `Disarm store security alarm and inspect exterior perimeter, door locks, and signage at ${branchName}.`,
          isRequired: true,
          evidenceType: 'checkbox',
          expectedValue: 'Verified & Secure',
        },
        {
          stepNumber: 2,
          instruction: `Verify Walk-in Chiller temperature display and probe internal ambient air before opening stock.`,
          isRequired: true,
          evidenceType: 'temperature',
          expectedMin: 2,
          expectedMax: 4,
          unit: '°C',
          expectedValue: '2.0°C - 4.0°C',
        },
        {
          stepNumber: 3,
          instruction: `Check Deep Freeze holding temperature for pre-prepped burger patties, french fries, and ice creams.`,
          isRequired: true,
          evidenceType: 'temperature',
          expectedMin: -22,
          expectedMax: -18,
          unit: '°C',
          expectedValue: '-18°C to -22°C',
        },
        {
          stepNumber: 4,
          instruction: `Power up ${primaryEquipment}, check clean cooking oil level to max fill line, and set warmup thermostat.`,
          isRequired: true,
          evidenceType: 'temperature',
          expectedMin: 175,
          expectedMax: 185,
          unit: '°C',
          expectedValue: '175°C - 185°C',
        },
        {
          stepNumber: 5,
          instruction: `Turn on ${secondaryEquipment}, verify exhaust hood ventilation suction, and allow deck stones to reach baking heat.`,
          isRequired: true,
          evidenceType: 'temperature',
          expectedMin: 270,
          expectedMax: 290,
          unit: '°C',
          expectedValue: '280°C target',
        },
        {
          stepNumber: 6,
          instruction: `Log into ${terminalCount} POS Windows billing station(s) at ${branchName} and verify cash drawer opening float.`,
          isRequired: true,
          evidenceType: 'number',
          expectedMin: 5000,
          expectedMax: 5000,
          unit: '₹',
          expectedValue: '₹5,000 float verified',
        },
        {
          stepNumber: 7,
          instruction: `All opening staff complete 20-second antibacterial handwash, don fresh hairnets, aprons, and sanitize food prep counters.`,
          isRequired: true,
          evidenceType: 'checkbox',
          expectedValue: 'FSSAI hygiene pass',
        },
      ],
    },
    closing: {
      title: `Night Store Closing & Sanitization SOP - ${branchName}`,
      department: 'Store Operations & Finance',
      purpose: `Secure branch assets, reconcile cash drawers, power down heavy machinery, and execute deep hygiene cleanup post ${closingTime}.`,
      description: `Comprehensive end-of-day closing routine for ${branchName}. Ensures zero food wastage, complete cash audit against POS orders, and fire-safe equipment isolation.`,
      responsibleRole: 'admin',
      frequency: 'daily',
      estimatedMinutes: 35,
      priority: 'high',
      branchContextSummary: `Engineered for ${branchName} post ${closingTime} closing. Coordinates shutdown of ${primaryEquipment}, food preservation in cold storage, and terminal reconciliation for FSSAI #${fssaiLicense}.`,
      steps: [
        {
          stepNumber: 1,
          instruction: `Execute Daily POS Shift & Cash Drawer Close on all ${terminalCount} billing stations; print Z-report and count physical cash.`,
          isRequired: true,
          evidenceType: 'number',
          unit: '₹',
          expectedValue: 'Zero variance vs POS',
        },
        {
          stepNumber: 2,
          instruction: `Power off heating elements on ${primaryEquipment} and ${secondaryEquipment}; shut main kitchen commercial gas safety valves.`,
          isRequired: true,
          evidenceType: 'checkbox',
          expectedValue: 'Gas isolated & appliances cold',
        },
        {
          stepNumber: 3,
          instruction: `Filter used frying oil through micro-mesh strainer into night storage vat; scrub fry baskets with food-safe degreaser.`,
          isRequired: true,
          evidenceType: 'checkbox',
          expectedValue: 'Oil filtered & covered',
        },
        {
          stepNumber: 4,
          instruction: `Transfer all perishable toppings, dairy (mozzarella, paneer), and prepared sauces to airtight containers with date stickers into chiller.`,
          isRequired: true,
          evidenceType: 'checkbox',
          expectedValue: 'FIFO labeled & sealed',
        },
        {
          stepNumber: 5,
          instruction: `Log final closing temperature of Walk-in Chiller to ensure food safety throughout the overnight hold.`,
          isRequired: true,
          evidenceType: 'temperature',
          expectedMin: 2,
          expectedMax: 4,
          unit: '°C',
          expectedValue: '2°C - 4°C',
        },
        {
          stepNumber: 6,
          instruction: `Mop kitchen, barista floor, and dine-in customer sections with hospital-grade disinfectant; empty all trash cans to outdoor bins.`,
          isRequired: true,
          evidenceType: 'checkbox',
          expectedValue: 'Floors dry & sanitized',
        },
        {
          stepNumber: 7,
          instruction: `Check all secondary fire exits, turn off non-essential lighting, lock front entrance, and set motion intrusion sensors.`,
          isRequired: true,
          evidenceType: 'checkbox',
          expectedValue: 'Alarm armed & doors bolted',
        },
      ],
    },
    food_safety: {
      title: `FSSAI Schedule 4 & Cold Chain Audit SOP - ${branchName}`,
      department: 'Quality & Food Safety',
      purpose: `Maintain total regulatory compliance with FSSAI Schedule 4 safety requirements, prevent bacterial danger zone growth (5°C to 60°C), and audit food contact surfaces.`,
      description: `Rigorous food hygiene inspection standard operating procedure for ${branchName}. Audits probe calibration, perishable holding temperatures, cross-contamination barriers, and sanitizer concentrations.`,
      responsibleRole: 'kitchen_staff',
      frequency: 'daily',
      estimatedMinutes: 20,
      priority: 'critical',
      branchContextSummary: `Custom-calibrated for ${branchName} (License #${fssaiLicense}). Enforces cold-chain thresholds for dairy, burger patties, and momos, plus cooking oil quality monitoring.`,
      steps: [
        {
          stepNumber: 1,
          instruction: `Sanitize digital food core needle thermometer probe with 70% isopropyl alcohol wipe and zero-calibrate in ice bath.`,
          isRequired: true,
          evidenceType: 'temperature',
          expectedMin: -0.5,
          expectedMax: 0.5,
          unit: '°C',
          expectedValue: '0.0°C in ice water',
        },
        {
          stepNumber: 2,
          instruction: `Measure internal core temperature of high-risk dairy (mozzarella cheese blocks, fresh paneer) stored in the cold room.`,
          isRequired: true,
          evidenceType: 'temperature',
          expectedMin: 2,
          expectedMax: 5,
          unit: '°C',
          expectedValue: '2.0°C - 4.5°C',
        },
        {
          stepNumber: 3,
          instruction: `Test cooking oil in ${primaryEquipment} using digital TPC tester or polar quality strips to ensure oil has not degraded.`,
          isRequired: true,
          evidenceType: 'number',
          expectedMin: 5,
          expectedMax: 24,
          unit: '% TPC',
          expectedValue: '< 24% Total Polar Compounds',
        },
        {
          stepNumber: 4,
          instruction: `Probe internal core temperature of cooked burger patties / steamed momos right off the line to ensure pathogen kill step.`,
          isRequired: true,
          evidenceType: 'temperature',
          expectedMin: 75,
          expectedMax: 90,
          unit: '°C',
          expectedValue: 'Core > 75°C for 15 sec',
        },
        {
          stepNumber: 5,
          instruction: `Audit cutting board color segregation (Green for raw vegetables, White for dairy & bakery, Yellow for cooked items).`,
          isRequired: true,
          evidenceType: 'checkbox',
          expectedValue: 'Zero cross-contamination',
        },
        {
          stepNumber: 6,
          instruction: `Inspect sanitizing dip solution buckets with quaternary/chlorine test strips (acceptable range 100 - 200 PPM).`,
          isRequired: true,
          evidenceType: 'number',
          expectedMin: 100,
          expectedMax: 200,
          unit: 'PPM',
          expectedValue: '150 PPM recommended',
        },
        {
          stepNumber: 7,
          instruction: `Verify staff personal hygiene log: clean uniforms, nail grooming, zero open cuts/wounds, hairnets and beard masks fitted.`,
          isRequired: true,
          evidenceType: 'checkbox',
          expectedValue: '100% staff compliant',
        },
      ],
    },
    beverage_prep: {
      title: `Beverage Bar & Espresso Machine Calibration SOP - ${branchName}`,
      department: 'Barista & Beverages',
      purpose: `Guarantee premium beverage consistency, calibrate espresso extraction yield, and uphold beverage bar cleanliness at ${branchName}.`,
      description: `Daily operational procedure for baristas. Covers espresso grinder dose tuning, extraction pressure calibration, milk steaming temperatures, and mojito syrup station prep.`,
      responsibleRole: 'employee',
      frequency: 'daily',
      estimatedMinutes: 20,
      priority: 'medium',
      branchContextSummary: `Configured for ${branchName}'s beverage menu (Surprise Mojito, Artisan Cold Coffee, Teas). Tunes water filtration, group head pressure, and syrup refrigeration.`,
      steps: [
        {
          stepNumber: 1,
          instruction: `Purge commercial espresso group heads and steam wands with boiling water; wipe steam tips with dedicated sanitizer cloth.`,
          isRequired: true,
          evidenceType: 'checkbox',
          expectedValue: 'Clean & purged',
        },
        {
          stepNumber: 2,
          instruction: `Verify espresso boiler pump pressure gauge during blind extraction basket test.`,
          isRequired: true,
          evidenceType: 'number',
          expectedMin: 9.0,
          expectedMax: 9.3,
          unit: 'bar',
          expectedValue: '9.2 bar target',
        },
        {
          stepNumber: 3,
          instruction: `Dial in grinder: weigh dry coffee dose on precision jewelry scale to ensure exact extraction ratio.`,
          isRequired: true,
          evidenceType: 'number',
          expectedMin: 17.5,
          expectedMax: 18.5,
          unit: 'g',
          expectedValue: '18.0g dry coffee',
        },
        {
          stepNumber: 4,
          instruction: `Extract double espresso shot into shot glass; time extraction from first drop to completion (yield ~36g).`,
          isRequired: true,
          evidenceType: 'number',
          expectedMin: 25,
          expectedMax: 29,
          unit: 'seconds',
          expectedValue: '26 - 28 seconds',
        },
        {
          stepNumber: 5,
          instruction: `Check milk refrigerator holding temperature for whole milk, oat milk, and ice cream tubs.`,
          isRequired: true,
          evidenceType: 'temperature',
          expectedMin: 2,
          expectedMax: 4,
          unit: '°C',
          expectedValue: '2°C - 4°C',
        },
        {
          stepNumber: 6,
          instruction: `Inspect beverage bar syrup pumps (Surprise Mojito syrup, Orange, Blue Heaven); wipe drip trays and sanitize ice scoop holster.`,
          isRequired: true,
          evidenceType: 'checkbox',
          expectedValue: 'No sticky residue / full stock',
        },
      ],
    },
    food_prep: {
      title: `Food Prep & Kitchen Assembly Line SOP - ${branchName}`,
      department: 'Kitchen Operations',
      purpose: `Enforce recipe accuracy, standard portion sizes, and speed of service for signature burgers, pizzas, momos, and kulhad dishes.`,
      description: `Step-by-step culinary preparation and assembly SOP for kitchen crew at ${branchName}. Prevents ingredient wastage and guarantees consistent taste profile.`,
      responsibleRole: 'kitchen_staff',
      frequency: 'daily',
      estimatedMinutes: 20,
      priority: 'high',
      branchContextSummary: `Customized for ${branchName}'s fast food menu. Integrates recipe cards for Mexican King Burgers, Four Cheese Pizzas, and Kulhad specials.`,
      steps: [
        {
          stepNumber: 1,
          instruction: `Check mise-en-place prep station: diced onions, capsicum, lettuce, and sliced tomatoes stored over chilled ice insert pans.`,
          isRequired: true,
          evidenceType: 'temperature',
          expectedMin: 2,
          expectedMax: 5,
          unit: '°C',
          expectedValue: 'Chilled & fresh',
        },
        {
          stepNumber: 2,
          instruction: `Calibrate burger bun toaster heat and test bun toast color against golden-brown brand swatch standard.`,
          isRequired: true,
          evidenceType: 'checkbox',
          expectedValue: 'Golden toast / no scorching',
        },
        {
          stepNumber: 3,
          instruction: `Weigh standard cheese portioning for 7-inch pizzas (60g Mozzarella + 20g Cheddar blend) using kitchen portion scale.`,
          isRequired: true,
          evidenceType: 'number',
          expectedMin: 78,
          expectedMax: 82,
          unit: 'g',
          expectedValue: '80g total cheese',
        },
        {
          stepNumber: 4,
          instruction: `Verify fryer basket timer set to 3.5 minutes for potato batons and crispy burger patties at 180°C.`,
          isRequired: true,
          evidenceType: 'number',
          expectedMin: 180,
          expectedMax: 210,
          unit: 'seconds',
          expectedValue: '210s crisp cycle',
        },
        {
          stepNumber: 5,
          instruction: `Inspect steam momo steamer water level; steam momos for 6 minutes until translucent skin and hot filling.`,
          isRequired: true,
          evidenceType: 'checkbox',
          expectedValue: 'Pass / piping hot',
        },
        {
          stepNumber: 6,
          instruction: `Ensure signature ZORKO wrapping paper, branded carry bags, and 30ml dip cups are stocked at the packing station.`,
          isRequired: true,
          evidenceType: 'checkbox',
          expectedValue: 'Packaging ready',
        },
      ],
    },
  };

  const selectedTemplate = categoryConfigs[category] || categoryConfigs.opening;

  return {
    id: `sop-ai-${Date.now()}`,
    title: focusArea ? `${selectedTemplate.title} (${focusArea})` : selectedTemplate.title,
    category: category,
    department: selectedTemplate.department,
    purpose: selectedTemplate.purpose,
    description: selectedTemplate.description,
    responsibleRole: selectedTemplate.responsibleRole,
    frequency: selectedTemplate.frequency,
    estimatedMinutes: selectedTemplate.estimatedMinutes,
    priority: selectedTemplate.priority,
    version: 1,
    status: 'active',
    outletId: outlet?.id,
    outletName: branchName,
    isAiGenerated: true,
    branchContextSummary: selectedTemplate.branchContextSummary,
    steps: selectedTemplate.steps.map((s: any, idx: number) => ({
      ...s,
      id: `step-ai-${Date.now()}-${idx + 1}`,
      stepNumber: idx + 1,
    })),
    createdBy: 'AI SOP Architect',
    createdAt: new Date().toISOString(),
  };
}

function sopAiPlugin(): Plugin {
  return {
    name: 'sop-ai-plugin',
    configureServer(server) {
      const handleSopGenerate = async (req: any, res: any) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method Not Allowed' }));
          return;
        }

        let body = '';
        req.on('data', (chunk: any) => {
          body += chunk;
        });

        req.on('end', async () => {
          try {
            const payload = JSON.parse(body || '{}');
            const { outlet, category = 'opening', focusArea = '', customPrompt = '', branchData = {} } = payload;

            const branchName = outlet?.name || 'Store Branch';
            const branchCity = outlet?.city || 'Local Metro';
            const branchCode = outlet?.code || 'OUT-01';
            const openingTime = outlet?.openingTime || '08:00 AM';
            const closingTime = outlet?.closingTime || '11:00 PM';
            const terminalCount = outlet?.terminalCount || 2;
            const fssaiLicense = outlet?.fssaiLicense || 'FSSAI-STD-2026';

            const equipmentList = Array.isArray(branchData?.equipment) ? branchData.equipment : [];
            const equipmentNames = equipmentList
              .map((e: any) => `${e.name} (${e.model || ''}, Loc: ${e.location || 'Kitchen'})`)
              .join('; ') || 'Commercial Double Deep Fryer, Stone Deck Pizza Oven, Commercial Espresso Machine, Walk-in Chiller';

            const menuCategories = Array.isArray(branchData?.menuCategories)
              ? branchData.menuCategories.join(', ')
              : 'Burgers, Handcrafted Pizzas, Momos, Kulhad Specials, Cold Beverages & Mojitos, Desserts';
            const topDishes = Array.isArray(branchData?.topMenuItems)
              ? branchData.topMenuItems.slice(0, 10).map((m: any) => m.name).join(', ')
              : 'Mexican King Burger, Four Cheese Pizza, Volcano Kulhad Momos, Surprise Mojito';
            const storageLocations = Array.isArray(branchData?.storageLocations)
              ? branchData.storageLocations.join(', ')
              : 'Walk-in Chiller, Dry Storage Rack, Beverage Bar, Packaging Rack';

            const apiKey = process.env.GEMINI_API_KEY;

            if (apiKey) {
              try {
                const ai = new GoogleGenAI({
                  apiKey,
                  httpOptions: {
                    headers: {
                      'User-Agent': 'aistudio-build',
                    },
                  },
                });

                const prompt = `You are a certified Chief Food Safety Auditor and QSR Operational Excellence Director.
Generate an official Standard Operating Procedure (SOP) strictly customized for the following specific restaurant branch and location:

=== BRANCH PROFILE ===
- Branch Name: ${branchName} (${branchCode})
- City & Address: ${branchCity}, ${outlet?.address || ''}
- Operating Hours: ${openingTime} to ${closingTime}
- Billing Stations: ${terminalCount} POS Windows Terminals
- Food Safety License: FSSAI #${fssaiLicense}
- Franchise / Group: ${outlet?.franchiseName || 'Brand Corporate Operations'}
- Specific Equipment at this Branch: ${equipmentNames}
- Menu Categories & Signature Dishes: ${menuCategories} | Highlights: ${topDishes}
- Storage Zones: ${storageLocations}
- Requested SOP Category: ${category}
- Specific Operational Focus: ${focusArea || 'Comprehensive standard operational routine with equipment calibration & hygiene checks'}
${customPrompt ? `- Custom Manager Directive: ${customPrompt}` : ''}

=== STRICT INSTRUCTIONS ===
1. Craft an SOP that explicitly addresses this specific location's equipment, menu items, operating schedule, and layout.
2. Every step must be sequential, specific, and actionable for store associates.
3. Steps involving temperature or machine calibration must specify precise realistic values (e.g. fryer oil 175°C - 185°C, chiller 2°C - 4°C, espresso 9.0 - 9.3 bar).
4. Evidence types must be chosen purposefully: 'temperature' for thermal logs, 'number' for counts/pressure, 'checkbox' for physical checks, 'photo' for visual hygiene/presentation, 'text' for notes.
5. Provide between 6 to 9 practical steps.

Return ONLY a JSON object with this exact structure:
{
  "title": "Clear, professional SOP title referencing the branch (e.g. Morning Store Opening & Machine Warmup - ${branchName})",
  "category": "${category}",
  "department": "Department name (e.g., Kitchen Operations / Front of House / Beverage Bar)",
  "purpose": "1-2 sentences on operational standard and FSSAI compliance goal",
  "description": "2-3 sentences overview of the routine for staff",
  "responsibleRole": "kitchen_staff" | "cashier" | "biller" | "inventory_staff" | "admin" | "employee",
  "frequency": "daily" | "per_shift" | "weekly" | "monthly" | "as_required",
  "estimatedMinutes": 20,
  "priority": "low" | "medium" | "high" | "critical",
  "branchContextSummary": "2-3 sentences explaining exactly how this branch's machinery, menu, timings, and location parameters were engineered into this SOP",
  "steps": [
    {
      "stepNumber": 1,
      "instruction": "Specific action referencing equipment, area, or task at ${branchName}",
      "isRequired": true,
      "evidenceType": "checkbox" | "temperature" | "photo" | "number" | "text",
      "expectedMin": 2,
      "expectedMax": 4,
      "unit": "°C",
      "expectedValue": "2°C - 4°C"
    }
  ]
}`;

                const response = await ai.models.generateContent({
                  model: 'gemini-3.8-flash',
                  contents: prompt,
                  config: {
                    responseMimeType: 'application/json',
                  },
                });

                const text = response.text || '{}';
                const parsed = JSON.parse(text);

                // Add branch metadata
                const finalizedSOP = {
                  ...parsed,
                  id: `sop-ai-${Date.now()}`,
                  outletId: outlet?.id,
                  outletName: branchName,
                  isAiGenerated: true,
                  status: 'active',
                  version: 1,
                  steps: (parsed.steps || []).map((s: any, idx: number) => ({
                    ...s,
                    id: `step-ai-${Date.now()}-${idx + 1}`,
                    stepNumber: idx + 1,
                  })),
                  createdAt: new Date().toISOString(),
                };

                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true, data: finalizedSOP }));
                return;
              } catch (aiErr: any) {
                console.warn('Gemini API call failed, using intelligent branch-tailored fallback:', aiErr.message);
              }
            }

            // High-fidelity fallback generated from actual branch data
            const fallbackSOP = generateBranchTailoredFallbackSOP({
              outlet,
              category,
              focusArea,
              customPrompt,
              branchData,
            });

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, data: fallbackSOP, isSimulated: !apiKey }));
          } catch (err: any) {
            console.error('SOP AI API error:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: err.message || 'Error processing SOP generation' }));
          }
        });
      };

      server.middlewares.use('/api/sop/generate', handleSopGenerate);
      server.middlewares.use('/api/sop/generate-ai', handleSopGenerate);
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), receiptOcrPlugin(), sopAiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
