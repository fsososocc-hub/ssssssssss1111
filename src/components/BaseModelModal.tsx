import React, { useState } from 'react';
import { X, Check, Sparkles, User, Info, Ruler } from 'lucide-react';
import { PRESET_BASE_MODELS, BaseModel } from '../data/baseModels.ts';

interface BaseModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectModel: (model: BaseModel) => void;
  selectedModelId?: string | null;
  purpose?: 'tryon' | 'photoshoot';
  models?: BaseModel[];
}

export const BaseModelModal: React.FC<BaseModelModalProps> = ({
  isOpen,
  onClose,
  onSelectModel,
  selectedModelId,
  purpose = 'tryon',
  models,
}) => {
  const [activeGender, setActiveGender] = useState<'all' | 'female' | 'male'>('all');
  const availableModels = models && models.length > 0 ? models : PRESET_BASE_MODELS;
  const [previewModel, setPreviewModel] = useState<BaseModel>(
    availableModels.find((m) => m.id === selectedModelId || m.url === selectedModelId) || availableModels[0]
  );

  if (!isOpen) return null;

  const filteredModels = availableModels.filter((m) => {
    if (activeGender === 'all') return true;
    return m.gender === activeGender;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-lg shadow-2xl border border-gray-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-left">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-white shrink-0">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-semibold text-gray-900 tracking-tight">
                打底模特库 · 专业商业摄影标准身型
              </h2>
              <span className="text-[10px] bg-black text-white px-2 py-0.5 rounded font-mono">
                5款全画幅棚拍打底
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              经过 5600K 纯白影棚预置打底校准，肩线、胸腰松量与中轴对称姿态严格符合成衣工业制版与虚拟试衣标准
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {/* Gender filter */}
            <div className="flex items-center space-x-1 border border-gray-200 p-0.5 rounded text-xs bg-gray-50">
              <button
                type="button"
                onClick={() => setActiveGender('all')}
                className={`px-2.5 py-1 rounded text-xs transition-colors ${
                  activeGender === 'all'
                    ? 'bg-white text-gray-900 shadow-xs font-medium'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                全部
              </button>
              <button
                type="button"
                onClick={() => setActiveGender('female')}
                className={`px-2.5 py-1 rounded text-xs transition-colors ${
                  activeGender === 'female'
                    ? 'bg-white text-gray-900 shadow-xs font-medium'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                女模
              </button>
              <button
                type="button"
                onClick={() => setActiveGender('male')}
                className={`px-2.5 py-1 rounded text-xs transition-colors ${
                  activeGender === 'male'
                    ? 'bg-white text-gray-900 shadow-xs font-medium'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                男模
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 p-1 rounded hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6 bg-gray-50/40">
          {/* Left: Model Grid */}
          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredModels.map((m) => {
              const isSelected = selectedModelId === m.id || selectedModelId === m.url;
              const isCurrentPreview = previewModel.id === m.id;

              return (
                <div
                  key={m.id}
                  onClick={() => setPreviewModel(m)}
                  className={`group relative border rounded-md overflow-hidden bg-white cursor-pointer transition-all flex flex-col ${
                    isSelected
                      ? 'border-[#07C2E3] ring-2 ring-[#07C2E3]/20'
                      : isCurrentPreview
                      ? 'border-gray-900 shadow-sm'
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <div className="relative aspect-[3/4] w-full bg-gray-100 overflow-hidden">
                    <img
                      src={m.url}
                      alt={m.name}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                    />
                    <div className="absolute top-1.5 left-1.5">
                      <span className="text-[10px] bg-black/75 text-white backdrop-blur-xs px-1.5 py-0.5 rounded font-medium">
                        {m.code}
                      </span>
                    </div>
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#07C2E3] text-black flex items-center justify-center shadow-xs">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </div>

                  <div className="p-2.5 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-gray-900 leading-tight truncate">
                        {m.name}
                      </h4>
                      <p className="text-[10px] text-gray-500 mt-0.5">{m.ethnicity}</p>
                    </div>

                    <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-600">
                      <span>{m.height}</span>
                      <span className="font-mono text-gray-400">{m.gender === 'female' ? '女' : '男'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Detailed Inspector & Confirmation */}
          <div className="md:col-span-5 bg-white border border-gray-200 rounded-md p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">{previewModel.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">标准商业试衣打底模型档案</p>
                </div>
                <span className="text-xs font-mono bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                  {previewModel.code}
                </span>
              </div>

              {/* Photo preview */}
              <div className="relative aspect-[3/4] w-full max-w-[240px] mx-auto rounded overflow-hidden border border-gray-100 bg-gray-50">
                <img
                  src={previewModel.url}
                  alt={previewModel.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Spec sheet */}
              <div className="space-y-2 text-xs bg-gray-50 p-3 rounded border border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 flex items-center">
                    <Ruler className="w-3.5 h-3.5 mr-1 text-gray-400" />
                    标准身长
                  </span>
                  <span className="font-medium text-gray-900">{previewModel.height}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">成衣尺寸/三围</span>
                  <span className="font-mono font-medium text-gray-900">{previewModel.measurements}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">打底姿态</span>
                  <span className="text-gray-800">{previewModel.pose}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">布光校准</span>
                  <span className="text-gray-800">{previewModel.lighting}</span>
                </div>
              </div>

              <p className="text-xs text-gray-600 leading-relaxed">
                {previewModel.description}
              </p>
            </div>

            {/* Selection Action */}
            <div className="pt-3 border-t border-gray-100 flex items-center space-x-3">
              <button
                type="button"
                onClick={() => {
                  onSelectModel(previewModel);
                  onClose();
                }}
                className="flex-1 py-2.5 px-4 bg-gray-900 hover:bg-black text-white text-xs font-medium rounded transition-colors flex items-center justify-center space-x-1.5 shadow-xs"
              >
                <Check className="w-3.5 h-3.5 mr-1" />
                <span>
                  {purpose === 'tryon' ? '选用为此轮试衣模特' : '选用为此轮棚拍模特'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
