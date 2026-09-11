import {
  ChefHat,
  Check,
  Flame,
  Plus,
  Sparkles,
  Utensils,
  X,
  MessageSquare,
} from 'lucide-react';
import React, { useState } from 'react';

interface ItemCookingNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemName: string;
  currentNotes?: string;
  onSaveNotes: (notes: string) => void;
}

const PRESET_COOKING_TAGS = [
  { label: 'Jain Prep', desc: 'No onion, no garlic, pure veg' },
  { label: 'No Onion Garlic', desc: 'Exclude onion and garlic' },
  { label: 'Extra Spicy 🌶️', desc: 'High chili / spice level' },
  { label: 'Less Spicy / Mild', desc: 'Kid friendly, low spice' },
  { label: 'Make it Crispy', desc: 'Extra crisp texture' },
  { label: 'Extra Cheese 🧀', desc: 'Heavy cheese topping' },
  { label: 'Serve Hot 🔥', desc: 'Serve piping hot from kitchen' },
  { label: 'Pack Separately 📦', desc: 'Individual packing' },
  { label: 'Without Mayo', desc: 'Skip mayonnaise' },
  { label: 'Less Oil / Low Oil', desc: 'Diet / light preparation' },
  { label: 'Extra Chutney / Dip', desc: 'Include extra dips on side' },
  { label: 'No Sugar / Diet', desc: 'Sugar-free preparation' },
];

export const ItemCookingNoteModal: React.FC<ItemCookingNoteModalProps> = ({
  isOpen,
  onClose,
  itemName,
  currentNotes = '',
  onSaveNotes,
}) => {
  const [noteText, setNoteText] = useState(currentNotes);

  if (!isOpen) return null;

  const handleToggleTag = (tagLabel: string) => {
    const trimmed = noteText.trim();
    if (!trimmed) {
      setNoteText(tagLabel);
      return;
    }

    const tags = trimmed.split(',').map((t) => t.trim());
    if (tags.includes(tagLabel)) {
      const remaining = tags.filter((t) => t !== tagLabel);
      setNoteText(remaining.join(', '));
    } else {
      setNoteText(`${trimmed}, ${tagLabel}`);
    }
  };

  const handleSave = () => {
    onSaveNotes(noteText.trim());
    onClose();
  };

  const currentTags = noteText
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-500/15 via-slate-800 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>Cooking Instructions</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  [F7]
                </span>
              </h3>
              <p className="text-xs text-slate-400 truncate max-w-xs font-semibold">
                Item: <span className="text-white font-bold">{itemName}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Preset Quick Chips (Petpooja / RoyalPOS Style) */}
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">
              Popular Kitchen Instructions
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PRESET_COOKING_TAGS.map((tag) => {
                const isSelected = currentTags.includes(tag.label);
                return (
                  <button
                    key={tag.label}
                    type="button"
                    onClick={() => handleToggleTag(tag.label)}
                    className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>{tag.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <span
                      className={`text-[9px] mt-0.5 ${
                        isSelected ? 'text-slate-900 font-medium' : 'text-slate-500'
                      }`}
                    >
                      {tag.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Kitchen Notes Textarea */}
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
              <span>Chef / Custom Cooking Instruction</span>
              <span className="text-[10px] text-slate-500">Prints on KOT thermal slip</span>
            </label>
            <div className="relative">
              <textarea
                rows={3}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="e.g. Jain preparation, make extra crispy, serve mint chutney separately..."
                className="w-full p-3.5 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-2xl text-xs text-white placeholder-slate-600 outline-hidden font-medium resize-none"
              />
              {noteText && (
                <button
                  type="button"
                  onClick={() => setNoteText('')}
                  className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 text-xs font-bold"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* KOT Preview Callout */}
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-start gap-2.5">
            <Utensils className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Printed on Kitchen Ticket (KOT):</span>
              <p className="text-[11px] text-amber-200/80 mt-0.5">
                Kitchen chefs will see this note highlighted in bold red on the KDS display and on the thermal KOT paper.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              setNoteText('');
              onSaveNotes('');
              onClose();
            }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors"
          >
            Remove Note
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Apply Instruction</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
