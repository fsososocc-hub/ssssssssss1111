import React, { useState, useMemo } from 'react';
import {
  Palette,
  Search,
  Check,
  Copy,
  Sparkles,
  X,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Wand2,
} from 'lucide-react';
import {
  PANTONE_COLOR_PALETTE,
  PANTONE_CATEGORIES,
  PantoneColor,
} from '../data/pantoneColors.ts';

interface FloatingPantonePickerProps {
  onInjectColor: (color: PantoneColor) => void;
  onApplyToColorRefine?: (color: PantoneColor) => void;
  isOpen?: boolean;
  onToggleOpen?: (open: boolean) => void;
  activeIntent?: string;
}

export const FloatingPantonePicker: React.FC<FloatingPantonePickerProps> = ({
  onInjectColor,
  onApplyToColorRefine,
  isOpen: externalIsOpen,
  onToggleOpen,
  activeIntent,
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = (val: boolean) => {
    if (onToggleOpen) {
      onToggleOpen(val);
    } else {
      setInternalIsOpen(val);
    }
  };

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColor, setSelectedColor] = useState<PantoneColor>(PANTONE_COLOR_PALETTE[2]); // Default Classic Blue
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [injectedFeedback, setInjectedFeedback] = useState<string | null>(null);

  // Filter colors based on category and search query
  const filteredColors = useMemo(() => {
    return PANTONE_COLOR_PALETTE.filter((c) => {
      const matchCategory = activeCategory === 'all' || c.category === activeCategory;
      if (!matchCategory) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.nameZh.includes(q) ||
        c.hex.toLowerCase().includes(q) ||
        c.season.includes(q)
      );
    });
  }, [activeCategory, searchQuery]);

  const handleCopyCode = (color: PantoneColor, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const text = `${color.code} (${color.nameZh} ${color.hex})`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text);
      setCopiedId(color.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleInject = (color: PantoneColor) => {
    onInjectColor(color);
    setInjectedFeedback(`已注入 ${color.code} (${color.nameZh})`);
    setTimeout(() => setInjectedFeedback(null), 2400);
  };

  const handleApplyRefine = (color: PantoneColor) => {
    if (onApplyToColorRefine) {
      onApplyToColorRefine(color);
      setInjectedFeedback(`已设定目标颜色为 ${color.nameZh}`);
      setTimeout(() => setInjectedFeedback(null), 2400);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-40 select-none text-left">
      {/* Expanded Floating Panel */}
      {isOpen && (
        <div className="mb-3 w-96 max-w-[calc(100vw-2.5rem)] bg-white border border-gray-200 rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[82vh] animate-in fade-in slide-in-from-bottom-3 duration-200">
          {/* Header */}
          <div className="px-4 py-3 bg-white border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div
                className="w-3.5 h-3.5 rounded-full border border-gray-300 shadow-2xs"
                style={{ backgroundColor: selectedColor.hex }}
              />
              <div>
                <div className="flex items-center space-x-1.5">
                  <h3 className="text-xs font-semibold text-gray-900 tracking-tight">
                    PANTONE® 流行色彩库
                  </h3>
                  <span className="text-[10px] bg-black text-white px-1.5 py-0.2 rounded font-mono">
                    TCX 标准
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  商业成衣与国际时装周权威色卡 · 一键注入 Prompt
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-800 p-1 rounded hover:bg-gray-100 transition-colors"
                title="关闭色卡面板"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="p-3 border-b border-gray-100 bg-gray-50/50">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索色号、颜色名 (如 19-4052、经典蓝、Peach Fuzz)..."
                className="w-full bg-white border border-gray-200 rounded pl-8 pr-7 py-1.5 text-xs text-gray-900 placeholder:text-gray-400 outline-none focus:border-black transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 text-gray-400 hover:text-gray-700"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center space-x-1 overflow-x-auto pt-2 scrollbar-none text-[11px]">
              {PANTONE_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-2 py-0.5 rounded text-[11px] whitespace-nowrap transition-colors shrink-0 ${
                    activeCategory === cat.id
                      ? 'bg-black text-white font-medium shadow-2xs'
                      : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-400'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Color Palette Grid */}
          <div className="flex-1 overflow-y-auto p-3 grid grid-cols-4 sm:grid-cols-5 gap-2 bg-white min-h-[160px] max-h-[260px]">
            {filteredColors.length === 0 ? (
              <div className="col-span-full py-8 text-center text-xs text-gray-400">
                未找到匹配的 Pantone 色卡
              </div>
            ) : (
              filteredColors.map((color) => {
                const isSelected = selectedColor.id === color.id;
                return (
                  <button
                    key={color.id}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`group relative rounded border text-left p-1 transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-black ring-2 ring-[#07C2E3]/40 bg-gray-50'
                        : 'border-gray-200 hover:border-gray-400 bg-white'
                    }`}
                  >
                    <div
                      className="w-full aspect-square rounded-xs border border-black/5 relative overflow-hidden"
                      style={{ backgroundColor: color.hex }}
                    >
                      {isSelected && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <Check className="w-3.5 h-3.5 text-white drop-shadow stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <div className="mt-1 leading-tight">
                      <span className="block text-[10px] font-medium text-gray-900 truncate">
                        {color.nameZh}
                      </span>
                      <span className="block text-[9px] text-gray-500 font-mono truncate">
                        {color.code.replace('PANTONE ', '')}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Selected Color Inspector & Actions */}
          <div className="p-3.5 bg-gray-50 border-t border-gray-200 space-y-3 shrink-0">
            <div className="flex items-start space-x-3">
              <div
                className="w-12 h-14 rounded border border-gray-300 shadow-2xs shrink-0 relative overflow-hidden"
                style={{ backgroundColor: selectedColor.hex }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-900 truncate">
                    {selectedColor.nameZh} · {selectedColor.name}
                  </h4>
                  <span className="text-[10px] font-mono text-gray-500 bg-white border border-gray-200 px-1 py-0.2 rounded">
                    {selectedColor.hex}
                  </span>
                </div>
                <div className="flex items-center space-x-1.5 mt-0.5">
                  <span className="text-[10px] font-mono text-gray-700 font-medium">
                    {selectedColor.code}
                  </span>
                  <span className="text-[9px] text-gray-400">·</span>
                  <span className="text-[10px] text-gray-500">{selectedColor.season}</span>
                </div>
                <p className="text-[10px] text-gray-600 line-clamp-1 mt-1 leading-tight">
                  {selectedColor.description}
                </p>
                {selectedColor.recommendedFabrics && selectedColor.recommendedFabrics.length > 0 && (
                  <div className="flex items-center space-x-1 mt-1">
                    <span className="text-[9px] text-gray-400 shrink-0">适配面料：</span>
                    <span className="text-[10px] text-gray-700 truncate">
                      {selectedColor.recommendedFabrics.join(' / ')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Injected Notification Banner */}
            {injectedFeedback && (
              <div className="text-[11px] text-black bg-[#07C2E3]/15 border border-[#07C2E3]/40 rounded px-2.5 py-1 flex items-center space-x-1.5 animate-in fade-in duration-150">
                <Sparkles className="w-3.5 h-3.5 text-[#07C2E3] shrink-0" />
                <span className="font-medium truncate">{injectedFeedback}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center space-x-2 pt-0.5">
              <button
                type="button"
                onClick={() => handleInject(selectedColor)}
                className="flex-1 py-2 px-3 bg-black hover:bg-gray-800 text-white rounded text-xs font-medium transition-colors flex items-center justify-center space-x-1.5 shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#07C2E3]" />
                <span>一键注入创作指令</span>
              </button>

              {onApplyToColorRefine && (
                <button
                  type="button"
                  onClick={() => handleApplyRefine(selectedColor)}
                  title="套用至高清换色目标颜色"
                  className={`py-2 px-2.5 rounded text-xs transition-colors flex items-center space-x-1 border ${
                    activeIntent === 'image_refine_color'
                      ? 'bg-white border-black text-black font-medium'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-gray-400'
                  }`}
                >
                  <Wand2 className="w-3.5 h-3.5 text-gray-500" />
                  <span className="hidden sm:inline">换色</span>
                </button>
              )}

              <button
                type="button"
                onClick={(e) => handleCopyCode(selectedColor, e)}
                title="复制 Pantone 色号"
                className="p-2 bg-white border border-gray-200 hover:border-gray-400 text-gray-700 rounded transition-colors"
              >
                {copiedId === selectedColor.id ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Trigger Pill Badge */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex items-center space-x-2 bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-400 px-3.5 py-2 rounded-full shadow-lg transition-all duration-200 hover:shadow-xl"
        title="打开 Pantone 色彩库并注入指令"
      >
        <div className="relative">
          <div
            className="w-3.5 h-3.5 rounded-full border border-gray-300 shadow-2xs group-hover:scale-110 transition-transform"
            style={{ backgroundColor: selectedColor.hex }}
          />
        </div>

        <div className="flex items-center space-x-1.5">
          <Palette className="w-3.5 h-3.5 text-gray-700 group-hover:text-black" />
          <span className="text-xs font-semibold text-gray-900 tracking-tight">
            Pantone 色卡
          </span>
          <span className="text-[10px] text-gray-500 hidden sm:inline">
            ({selectedColor.nameZh})
          </span>
        </div>

        {isOpen ? (
          <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-700" />
        ) : (
          <ChevronUp className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-700" />
        )}
      </button>
    </div>
  );
};
