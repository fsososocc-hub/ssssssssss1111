import React, { useState } from 'react';
import {
  Pin,
  X,
  Trash2,
  Maximize2,
  SplitSquareVertical,
  Layers,
  Sparkles,
  ArrowRight,
  UserCheck,
  Wand2,
  Plus,
  HelpCircle,
  Copy,
  Check,
} from 'lucide-react';
import { Asset } from '../types/index.ts';

interface DesignMoodboardProps {
  isOpen: boolean;
  onClose: () => void;
  items: Asset[];
  onRemoveItem: (id: string) => void;
  onClearAll: () => void;
  onUseAsReference: (asset: Asset) => void;
  onUseAsGarment: (asset: Asset) => void;
  onUseAsModel: (asset: Asset) => void;
  onUseForColorRefine?: (asset: Asset) => void;
  onCompareAsset?: (asset: Asset) => void;
  onPreviewAsset: (asset: Asset) => void;
  onDropAsset: (asset: Asset) => void;
  onInjectAllReferences?: () => void;
}

export const DesignMoodboard: React.FC<DesignMoodboardProps> = ({
  isOpen,
  onClose,
  items,
  onRemoveItem,
  onClearAll,
  onUseAsReference,
  onUseAsGarment,
  onUseAsModel,
  onUseForColorRefine,
  onCompareAsset,
  onPreviewAsset,
  onDropAsset,
  onInjectAllReferences,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'garment' | 'model' | 'design'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2200);
  };

  // Drag-and-drop event handlers on the Moodboard container
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    try {
      const jsonStr = e.dataTransfer.getData('application/json');
      if (jsonStr) {
        const parsed = JSON.parse(jsonStr);
        if (parsed.url) {
          onDropAsset(parsed);
          showToast(`已固定【${parsed.name || '创作素材'}】至灵感板`);
          return;
        }
      }

      const textUrl = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('text/uri-list');
      if (textUrl && (textUrl.startsWith('http') || textUrl.startsWith('/storage/') || textUrl.startsWith('data:image'))) {
        const fallbackAsset: Asset = {
          id: `dragged-${Date.now()}`,
          name: '拖拽固定素材',
          type: 'image',
          url: textUrl,
          createdAt: Date.now(),
          metadata: {
            tool: 'fashion_design',
            prompt: '用户通过画板拖拽固定的参考图片',
            version: 1,
          },
        };
        onDropAsset(fallbackAsset);
        showToast('已成功固定参考素材至灵感板');
      }
    } catch (err) {
      console.warn('Drop asset parsing error:', err);
    }
  };

  const filteredItems = items.filter((item) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'garment') return item.metadata.tool === 'virtual_tryon' || item.name.includes('服装');
    if (activeTab === 'model') return item.metadata.tool === 'model_photoshoot' || item.name.includes('模特');
    if (activeTab === 'design') return item.metadata.tool === 'fashion_design' || item.name.includes('设计') || item.name.includes('CAD');
    return true;
  });

  return (
    <aside
      onDragOver={handleDragOver}
      onDragEnter={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`fixed lg:static top-0 right-0 h-full z-40 bg-white border-l border-gray-200 transition-all duration-300 ease-in-out flex flex-col shrink-0 select-none shadow-xl lg:shadow-none text-left ${
        isOpen
          ? 'w-80 sm:w-96 translate-x-0'
          : 'w-0 translate-x-full lg:translate-x-0 lg:w-0 overflow-hidden border-none pointer-events-none'
      }`}
    >
      {/* Header */}
      <div className="h-12 px-4 border-b border-gray-200 flex items-center justify-between bg-white shrink-0">
        <div className="flex items-center space-x-2">
          <Pin className="w-4 h-4 text-black stroke-[2.5]" />
          <h2 className="text-xs font-semibold text-gray-900 tracking-tight">
            设计灵感板 · Moodboard
          </h2>
          <span className="text-[10px] bg-black text-white px-1.5 py-0.2 rounded font-mono">
            {items.length}
          </span>
        </div>

        <div className="flex items-center space-x-1.5">
          {items.length > 0 && (
            <button
              type="button"
              onClick={onClearAll}
              className="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-gray-100 transition-colors"
              title="清空灵感板"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-800 p-1 rounded hover:bg-gray-100 transition-colors"
            title="收起灵感板"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sub-header Tabs & Filter */}
      <div className="px-3 py-2 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
              activeTab === 'all'
                ? 'bg-black text-white font-medium'
                : 'text-gray-500 hover:text-gray-900 bg-white border border-gray-200'
            }`}
          >
            全部 ({items.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('design')}
            className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
              activeTab === 'design'
                ? 'bg-black text-white font-medium'
                : 'text-gray-500 hover:text-gray-900 bg-white border border-gray-200'
            }`}
          >
            设计
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('garment')}
            className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
              activeTab === 'garment'
                ? 'bg-black text-white font-medium'
                : 'text-gray-500 hover:text-gray-900 bg-white border border-gray-200'
            }`}
          >
            试衣
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('model')}
            className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
              activeTab === 'model'
                ? 'bg-black text-white font-medium'
                : 'text-gray-500 hover:text-gray-900 bg-white border border-gray-200'
            }`}
          >
            模特
          </button>
        </div>

        <span className="text-[10px] text-gray-400 font-mono hidden sm:inline">
          可直接拖拽注入
        </span>
      </div>

      {/* Drag Over Active Notification Overlay */}
      {isDragOver && (
        <div className="m-3 p-4 border-2 border-dashed border-[#07C2E3] bg-[#07C2E3]/5 rounded-lg flex flex-col items-center justify-center text-center animate-in fade-in duration-150">
          <Pin className="w-6 h-6 text-[#07C2E3] mb-1 animate-bounce" />
          <span className="text-xs font-semibold text-gray-900">松开鼠标固定至灵感板</span>
          <span className="text-[10px] text-gray-500 mt-0.5">
            将作为后续 AI 创作的持久参考素材
          </span>
        </div>
      )}

      {/* Toast Alert */}
      {toastMessage && (
        <div className="mx-3 my-2 px-3 py-1.5 bg-black text-white rounded text-xs flex items-center space-x-1.5 shadow-md animate-in fade-in slide-in-from-top-1">
          <Check className="w-3.5 h-3.5 text-[#07C2E3]" />
          <span className="truncate">{toastMessage}</span>
        </div>
      )}

      {/* Items Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {filteredItems.length === 0 ? (
          <div className="py-12 px-4 flex flex-col items-center justify-center text-center space-y-3 text-gray-400">
            <div className="w-12 h-12 rounded-full border border-dashed border-gray-300 flex items-center justify-center text-gray-400 bg-gray-50">
              <Pin className="w-5 h-5 stroke-[1.5]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-semibold text-gray-800">暂无固定灵感素材</h3>
              <p className="text-[11px] text-gray-400 max-w-[220px] leading-relaxed">
                可将左侧聊天记录中生成的任意作品或素材直接拖拽至此处，也可点击卡片上的【固定到灵感板】。
              </p>
            </div>
            <div className="pt-2 text-[10px] text-gray-400 bg-gray-50 border border-gray-200 rounded px-3 py-1.5 max-w-[220px]">
              支持在创作时快速将固定图设为服装单品、模特底图或设计版型参照。
            </div>
          </div>
        ) : (
          filteredItems.map((item, index) => {
            return (
              <div
                key={item.id}
                draggable={true}
                onDragStart={(e) => {
                  e.dataTransfer.setData('application/json', JSON.stringify(item));
                  e.dataTransfer.setData('text/plain', item.url);
                  e.dataTransfer.effectAllowed = 'copyMove';
                }}
                className="group border border-gray-200 hover:border-black rounded-md overflow-hidden bg-white transition-all shadow-2xs hover:shadow-xs flex flex-col cursor-grab active:cursor-grabbing"
              >
                {/* Image Card */}
                <div className="relative aspect-[4/3] w-full bg-gray-50 overflow-hidden">
                  <img
                    src={item.thumbnailUrl || item.url}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-200"
                  />

                  {/* Top Bar on Image */}
                  <div className="absolute top-1.5 left-1.5 right-1.5 flex items-center justify-between">
                    <span className="text-[9px] bg-black/80 text-white backdrop-blur-xs px-1.5 py-0.5 rounded font-medium">
                      #{index + 1} {item.metadata?.tool === 'virtual_tryon' ? '试衣' : item.metadata?.tool === 'model_photoshoot' ? '棚拍' : '设计'}
                    </span>
                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.id)}
                      className="w-5 h-5 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center transition-colors"
                      title="移出灵感板"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Quick Preview Hover Trigger */}
                  <div className="absolute bottom-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => onPreviewAsset(item)}
                      className="px-2 py-1 rounded bg-white/90 hover:bg-white text-black text-[10px] font-medium shadow-2xs flex items-center space-x-1"
                    >
                      <Maximize2 className="w-3 h-3" />
                      <span>大图</span>
                    </button>
                  </div>
                </div>

                {/* Card Info & Quick Injection Actions */}
                <div className="p-2.5 space-y-2 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-gray-900 truncate leading-tight" title={item.name}>
                      {item.name}
                    </h4>
                    <span className="text-[10px] text-gray-400 font-mono shrink-0">
                      {new Date(item.createdAt).toLocaleDateString([], { month: '2-digit', day: '2-digit' })}
                    </span>
                  </div>

                  {/* Primary 1-Click Injection Buttons */}
                  <div className="grid grid-cols-3 gap-1 text-[10px]">
                    <button
                      type="button"
                      onClick={() => {
                        onUseAsReference(item);
                        showToast(`已将【${item.name.slice(0, 8)}】注入当轮设计参考`);
                      }}
                      className="py-1 px-1 bg-gray-50 hover:bg-black hover:text-white text-gray-700 rounded border border-gray-200 transition-colors flex items-center justify-center space-x-0.5"
                      title="注入作为设计参考图"
                    >
                      <Sparkles className="w-2.5 h-2.5 text-[#07C2E3]" />
                      <span>设计参考</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onUseAsGarment(item);
                        showToast(`已设为试衣服装单品`);
                      }}
                      className="py-1 px-1 bg-gray-50 hover:bg-black hover:text-white text-gray-700 rounded border border-gray-200 transition-colors flex items-center justify-center space-x-0.5"
                      title="设为 AI 换衣服装素材 (Box A)"
                    >
                      <Layers className="w-2.5 h-2.5 text-gray-500" />
                      <span>换衣服装</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onUseAsModel(item);
                        showToast(`已设为打底模特图`);
                      }}
                      className="py-1 px-1 bg-gray-50 hover:bg-black hover:text-white text-gray-700 rounded border border-gray-200 transition-colors flex items-center justify-center space-x-0.5"
                      title="设为 AI 试衣/棚拍模特底模 (Box B)"
                    >
                      <UserCheck className="w-2.5 h-2.5 text-gray-500" />
                      <span>打底模特</span>
                    </button>
                  </div>

                  {/* Secondary Actions */}
                  <div className="flex items-center justify-between pt-1 border-t border-gray-50 text-[10px] text-gray-500">
                    {onCompareAsset && (
                      <button
                        type="button"
                        onClick={() => onCompareAsset(item)}
                        className="hover:text-black flex items-center space-x-1"
                      >
                        <SplitSquareVertical className="w-3 h-3 text-gray-400" />
                        <span>版本对比</span>
                      </button>
                    )}

                    {onUseForColorRefine && (
                      <button
                        type="button"
                        onClick={() => {
                          onUseForColorRefine(item);
                          showToast(`已载入为高清换色原图`);
                        }}
                        className="hover:text-black flex items-center space-x-1"
                      >
                        <Wand2 className="w-3 h-3 text-gray-400" />
                        <span>换色原图</span>
                      </button>
                    )}

                    <span className="text-gray-300">|</span>

                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.id)}
                      className="hover:text-red-600"
                    >
                      移除
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Master Actions Bar */}
      {items.length > 0 && (
        <div className="p-3 border-t border-gray-200 bg-gray-50/80 space-y-2 shrink-0">
          {onInjectAllReferences && (
            <button
              type="button"
              onClick={() => {
                onInjectAllReferences();
                showToast(`已将 ${items.length} 张灵感图批量注入参考槽位`);
              }}
              className="w-full py-2 px-3 bg-black hover:bg-gray-800 text-white rounded text-xs font-medium transition-colors flex items-center justify-center space-x-1.5 shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#07C2E3]" />
              <span>全量注入当轮创作参考</span>
            </button>
          )}

          <p className="text-[10px] text-gray-500 text-center leading-tight">
            提示：可随时拖动卡片至画布输入框或试衣格中
          </p>
        </div>
      )}
    </aside>
  );
};
