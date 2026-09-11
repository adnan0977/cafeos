import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle,
  AlertTriangle,
  FileText,
  RefreshCw,
  Plus,
  UtensilsCrossed,
  ArrowRight,
  Sparkles,
  Table,
  Check,
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { MenuItem, FoodType } from '../../types';
import { exportToCSV } from '../../utils/exportUtils';
import { formatCurrency } from '../../utils/formatters';

interface ParsedCSVRow {
  name: string;
  category: string;
  basePrice: number;
  foodType: FoodType;
  sku: string;
  description: string;
  taxPercent: number;
  isValid: boolean;
  validationError?: string;
}

const SAMPLE_CSV_CONTENT = `Item Name,Category,Base Price,Food Type,SKU,Description,Tax Percent
Signature Flat White,Coffee,240,veg,COF-101,Double shot espresso with silky microfoam,5
Spanish Iced Latte,Coffee,280,veg,COF-102,Condensed milk and chilled espresso on ice,5
Wild Truffle Mushroom Pizza,Pizzas,495,veg,PIZ-201,Forest mushrooms with black truffle oil and mozzarella,5
Smoked Pepperoni Pizza,Pizzas,560,non_veg,PIZ-202,Pork pepperoni with San Marzano tomato sauce,5
Smashed Avocado Toast,Breakfast,320,vegan,BRK-301,Sourdough toast with guacamole and chili flakes,5
Grilled Chicken Club Sandwich,Sandwiches,380,non_veg,SND-401,Triple decker sourdough with bacon and fried egg,5
Matcha Green Tea Cooler,Beverages,260,vegan,BEV-501,Ceremonial grade Uji matcha with oat milk and honey,5
Belgian Dark Chocolate Brownie,Desserts,220,veg,DST-601,Fudgy warm brownie with Callebaut 70% chocolate,5`;

export const BulkMenuManagement: React.FC = () => {
  const { menuItems = [], categories = [], addMenuItem, addCategory } = useRestaurant();

  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [pastedCSV, setPastedCSV] = useState(SAMPLE_CSV_CONTENT);
  const [parsedRows, setParsedRows] = useState<ParsedCSVRow[]>([]);
  const [importStatus, setImportStatus] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Parse CSV string into validated rows
  const parseCSVText = (text: string) => {
    const lines = text.trim().split('\n');
    if (lines.length <= 1) {
      setParsedRows([]);
      return;
    }

    const rows: ParsedCSVRow[] = [];
    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Handle simple CSV splitting
      const parts = line.split(',').map((p) => p.trim());
      if (parts.length >= 3) {
        const name = parts[0] || '';
        const category = parts[1] || 'General';
        const priceNum = parseFloat(parts[2]) || 0;
        let foodType: FoodType = 'veg';
        if (parts[3]) {
          const ft = parts[3].toLowerCase();
          if (ft.includes('non')) foodType = 'non_veg';
          else if (ft.includes('vegan')) foodType = 'vegan';
          else foodType = 'veg';
        }
        const sku = parts[4] || `SKU-${Math.floor(1000 + Math.random() * 9000)}`;
        const description = parts[5] || `${name} freshly crafted.`;
        const taxPercent = parseFloat(parts[6]) || 5;

        const isValid = name.length > 0 && priceNum > 0;
        const validationError = !name
          ? 'Missing Item Name'
          : priceNum <= 0
          ? 'Price must be greater than 0'
          : undefined;

        rows.push({
          name,
          category,
          basePrice: priceNum,
          foodType,
          sku,
          description,
          taxPercent,
          isValid,
          validationError,
        });
      }
    }
    setParsedRows(rows);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          setPastedCSV(content);
          parseCSVText(content);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleDownloadSampleCSV = () => {
    const blob = new Blob([SAMPLE_CSV_CONTENT], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'RoyalPOS_Menu_Upload_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportLiveMenu = () => {
    const exportData = menuItems.map((item) => {
      const cat = categories.find((c) => c.id === item.categoryId);
      return {
        'Item Name': item.name,
        Category: cat?.name || 'General',
        'Base Price (INR)': item.basePrice,
        'Food Type': item.foodType,
        SKU: item.sku,
        Description: item.description,
        'Tax Percent': item.taxPercent || 5,
        'Available Status': item.isAvailable ? 'In Stock' : 'Out of Stock',
      };
    });
    exportToCSV(`RoyalPOS_Full_Menu_Catalog_${new Date().toISOString().split('T')[0]}`, exportData);
  };

  const handleExecuteImport = () => {
    if (parsedRows.length === 0) return;
    setIsProcessing(true);

    const validRows = parsedRows.filter((r) => r.isValid);
    let importedCount = 0;

    // Helper map of category names to category ID
    const catNameToId: { [name: string]: string } = {};
    categories.forEach((c) => {
      catNameToId[c.name.toLowerCase()] = c.id;
    });

    validRows.forEach((row) => {
      let targetCatId = catNameToId[row.category.toLowerCase()];
      if (!targetCatId) {
        // Create category on the fly!
        const createdCat = addCategory({
          name: row.category,
          icon: '🍽️',
          sortOrder: categories.length + 1,
          isActive: true,
        });
        if (createdCat) {
          targetCatId = createdCat.id;
          catNameToId[row.category.toLowerCase()] = createdCat.id;
        } else {
          targetCatId = categories[0]?.id || 'cat-1';
        }
      }

      addMenuItem({
        name: row.name,
        categoryId: targetCatId,
        basePrice: row.basePrice,
        costPrice: Math.round(row.basePrice * 0.35),
        taxPercent: row.taxPercent,
        foodType: row.foodType,
        sku: row.sku,
        description: row.description,
        image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=600&auto=format&fit=crop&q=80',
        isAvailable: true,
      });
      importedCount++;
    });

    setIsProcessing(false);
    setImportStatus(`Successfully imported ${importedCount} dishes into live menu catalog!`);
    setParsedRows([]);
    setTimeout(() => setImportStatus(''), 5000);
  };

  return (
    <div className="space-y-5">
      {/* Header Bar */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-sky-500/20 shrink-0">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Bulk Menu CSV Upload &amp; Catalog Export
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                RoyalPOS Quick Setup
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Upload hundreds of items, recipes, SKUs, and categories via Excel/CSV spreadsheets in seconds with automated validation.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleDownloadSampleCSV}
            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
            title="Download CSV format template"
          >
            <Download className="w-3.5 h-3.5 text-sky-600" />
            <span>Download CSV Template</span>
          </button>
          <button
            type="button"
            onClick={handleExportLiveMenu}
            className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-black shadow-md shadow-sky-600/20 transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Live Menu ({menuItems.length})</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {importStatus && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 flex items-center gap-3 text-xs text-emerald-800 dark:text-emerald-300 animate-in fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{importStatus}</span>
        </div>
      )}

      {/* CSV Input Selection */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                activeTab === 'upload'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload CSV File</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('paste');
                parseCSVText(pastedCSV);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                activeTab === 'paste'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Paste Excel / CSV Raw Text</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => parseCSVText(pastedCSV)}
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5 text-sky-600" />
            <span>Validate &amp; Preview Rows</span>
          </button>
        </div>

        {activeTab === 'upload' ? (
          <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center hover:border-sky-500 transition-colors bg-slate-50/50 dark:bg-slate-900/50">
            <Upload className="w-10 h-10 text-sky-600 mx-auto mb-2" />
            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
              Drag and drop your Menu CSV here, or browse files
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Supports standard UTF-8 .csv files with headers (Item Name, Category, Base Price, Food Type, SKU)
            </p>
            <div className="mt-4">
              <label className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-black shadow-md cursor-pointer inline-flex items-center gap-2">
                <span>Select File from Computer</span>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              CSV Data Text (First row must be column headers)
            </label>
            <textarea
              rows={6}
              value={pastedCSV}
              onChange={(e) => {
                setPastedCSV(e.target.value);
                parseCSVText(e.target.value);
              }}
              className="w-full p-3 font-mono text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl leading-relaxed"
            />
          </div>
        )}
      </div>

      {/* CSV Rows Validation Preview Table */}
      {parsedRows.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden space-y-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Table className="w-4 h-4 text-sky-600" />
                <span>Validated Import Preview ({parsedRows.length} items parsed)</span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                {parsedRows.filter((r) => r.isValid).length} valid dishes ready for import. Non-existent categories will be created automatically.
              </p>
            </div>

            <button
              type="button"
              disabled={isProcessing || parsedRows.filter((r) => r.isValid).length === 0}
              onClick={handleExecuteImport}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-black rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Import {parsedRows.filter((r) => r.isValid).length} Dishes to Menu Catalog</span>
            </button>
          </div>

          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-bold text-[10px] sticky top-0">
                <tr>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Item Name</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Base Price</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">SKU</th>
                  <th className="py-2.5 px-3">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {parsedRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-2 px-3">
                      {row.isValid ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                          <CheckCircle className="w-3 h-3" /> Ready
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                          <AlertTriangle className="w-3 h-3" /> {row.validationError}
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">{row.name}</td>
                    <td className="py-2 px-3 font-semibold text-sky-600">{row.category}</td>
                    <td className="py-2 px-3 font-black text-amber-600">{formatCurrency(row.basePrice)}</td>
                    <td className="py-2 px-3">
                      <span
                        className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          row.foodType === 'veg'
                            ? 'bg-emerald-100 text-emerald-800'
                            : row.foodType === 'vegan'
                            ? 'bg-teal-100 text-teal-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {row.foodType}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-mono text-slate-500">{row.sku}</td>
                    <td className="py-2 px-3 text-slate-500 max-w-xs truncate">{row.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
