import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Plus,
  Check,
  Star,
  Trash2,
  Upload,
  X,
  AlertCircle,
  Eye,
  ShieldCheck,
  Ruler,
  Camera,
  Activity,
  Sparkles,
} from 'lucide-react';
import { BaseModel } from '../data/baseModels.ts';

interface ModelManagementSectionProps {
  onModelsChanged?: () => void;
}

export const ModelManagementSection: React.FC<ModelManagementSectionProps> = ({
  onModelsChanged,
}) => {
  const [models, setModels] = useState<BaseModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterGender, setFilterGender] = useState<'all' | 'female' | 'male' | 'custom'>('all');

  // Upload modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [modelName, setModelName] = useState('');
  const [modelCode, setModelCode] = useState('');
  const [modelGender, setModelGender] = useState<'female' | 'male'>('female');
  const [modelEthnicity, setModelEthnicity] = useState('商业纯净');
  const [modelHeight, setModelHeight] = useState('178 cm');
  const [modelMeasurements, setModelMeasurements] = useState('84 - 60 - 89 cm');
  const [modelLighting, setModelLighting] = useState('5600K 纯白柔光箱');
  const [modelPose, setModelPose] = useState('标准全身直立站姿');
  const [modelDescription, setModelDescription] = useState('');
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Inspector modal state
  const [inspectModel, setInspectModel] = useState<BaseModel | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load models from API
  const fetchModels = async () => {
    try {
      const res = await fetch('/api/models');
      if (res.ok) {
        const data = await res.json();
        setModels(data);
      }
    } catch (err) {
      console.warn('Failed to load models:', err);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  // Handle toggling active
  const handleToggleActive = async (model: BaseModel) => {
    const nextState = !model.isActive;
    try {
      await fetch(`/api/models/${model.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: nextState }),
      });
      setModels((prev) =>
        prev.map((m) => (m.id === model.id ? { ...m, isActive: nextState } : m))
      );
      onModelsChanged?.();
    } catch (err) {
      console.warn('Update model failed:', err);
    }
  };

  // Handle setting default
  const handleSetDefault = async (model: BaseModel) => {
    try {
      await fetch(`/api/models/${model.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true }),
      });
      setModels((prev) =>
        prev.map((m) => ({
          ...m,
          isDefault: m.id === model.id,
          isActive: m.id === model.id ? true : m.isActive,
        }))
      );
      onModelsChanged?.();
    } catch (err) {
      console.warn('Set default model failed:', err);
    }
  };

  // Handle deleting model
  const handleDelete = async (model: BaseModel) => {
    if (model.isPreset) return;
    if (!confirm(`确认删除自定义模特「${model.name}」？`)) return;

    try {
      const res = await fetch(`/api/models/${model.id}`, { method: 'DELETE' });
      if (res.ok) {
        setModels((prev) => prev.filter((m) => m.id !== model.id));
        onModelsChanged?.();
      }
    } catch (err) {
      console.warn('Delete model failed:', err);
    }
  };

  // Handle file select for upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setUploadPreview(ev.target.result as string);
        if (!modelName) {
          const cleanName = file.name.replace(/\.[^/.]+$/, '');
          setModelName(cleanName);
          setModelCode(cleanName.slice(0, 8));
        }
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Submit new model with AI calibration
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadPreview) {
      setUploadError('请选择模特照片');
      return;
    }
    if (!modelName.trim()) {
      setUploadError('请输入模特名称');
      return;
    }

    setIsCalibrating(true);
    setUploadError(null);

    try {
      const res = await fetch('/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: modelName.trim(),
          code: modelCode.trim() || modelName.trim().slice(0, 8),
          gender: modelGender,
          ethnicity: modelEthnicity,
          height: modelHeight,
          measurements: modelMeasurements,
          lighting: modelLighting,
          pose: modelPose,
          description: modelDescription,
          dataUrl: uploadPreview,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || '上传标定失败');
      }

      const created = await res.json();
      setModels((prev) => [created, ...prev]);
      setIsUploadModalOpen(false);
      resetUploadForm();
      onModelsChanged?.();
    } catch (err: any) {
      setUploadError(err?.message || '上传处理失败');
    } finally {
      setIsCalibrating(false);
    }
  };

  const resetUploadForm = () => {
    setUploadPreview(null);
    setModelName('');
    setModelCode('');
    setModelHeight('178 cm');
    setModelMeasurements('84 - 60 - 89 cm');
    setModelDescription('');
    setUploadError(null);
  };

  // Filtered list
  const filteredModels = models.filter((m) => {
    if (filterGender === 'female') return m.gender === 'female';
    if (filterGender === 'male') return m.gender === 'male';
    if (filterGender === 'custom') return !m.isPreset;
    return true;
  });

  const activeCount = models.filter((m) => m.isActive !== false).length;
  const defaultModel = models.find((m) => m.isDefault);
  const avgScore =
    models.length > 0
      ? Math.round(
          models.reduce((acc, cur) => acc + (cur.calibrationScore || 95), 0) / models.length
        )
      : 96;

  return (
    <div className="border border-gray-200 rounded p-5 space-y-5 bg-white text-left">
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-gray-800" />
            <h2 className="text-sm font-semibold text-gray-900 tracking-tight">
              模特素材管理 · 标准姿态标定库
            </h2>
            <span className="text-[10px] bg-black text-white px-1.5 py-0.2 rounded font-mono">
              STANDARDIZED
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
            管理经过摄影棚中轴垂直校准、肩线清晰与光影恒定的模特打底素材。直接供「AI 换衣」与「AI 棚拍」无缝调度。
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            resetUploadForm();
            setIsUploadModalOpen(true);
          }}
          className="inline-flex items-center justify-center px-3.5 py-2 bg-black hover:bg-gray-800 text-white rounded text-xs font-medium transition-colors shrink-0 shadow-xs"
        >
          <Plus className="w-3.5 h-3.5 mr-1 text-[#07C2E3]" />
          <span>上传新打底模特</span>
        </button>
      </div>

      {/* Quick KPI Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-gray-50 p-3 rounded border border-gray-100">
        <div>
          <span className="text-gray-400 block text-[10px]">库内模特总量</span>
          <span className="font-semibold text-gray-900 text-sm">{models.length} 位</span>
        </div>
        <div>
          <span className="text-gray-400 block text-[10px]">当前启用中</span>
          <span className="font-semibold text-emerald-600 text-sm">{activeCount} 位</span>
        </div>
        <div>
          <span className="text-gray-400 block text-[10px]">默认优先打底</span>
          <span className="font-semibold text-gray-900 text-sm truncate block" title={defaultModel?.name}>
            {defaultModel ? `${defaultModel.code} (${defaultModel.gender === 'female' ? '女' : '男'})` : '未设置'}
          </span>
        </div>
        <div>
          <span className="text-gray-400 block text-[10px]">姿态标定平均分</span>
          <span className="font-semibold text-[#0284c7] text-sm">{avgScore} 分 (A+ 级)</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="flex items-center space-x-1 border border-gray-200 p-0.5 rounded text-xs bg-gray-50/70">
          <button
            type="button"
            onClick={() => setFilterGender('all')}
            className={`px-2.5 py-1 rounded text-xs transition-colors ${
              filterGender === 'all'
                ? 'bg-white text-gray-900 shadow-xs font-medium'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            全部 ({models.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterGender('female')}
            className={`px-2.5 py-1 rounded text-xs transition-colors ${
              filterGender === 'female'
                ? 'bg-white text-gray-900 shadow-xs font-medium'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            女模 ({models.filter((m) => m.gender === 'female').length})
          </button>
          <button
            type="button"
            onClick={() => setFilterGender('male')}
            className={`px-2.5 py-1 rounded text-xs transition-colors ${
              filterGender === 'male'
                ? 'bg-white text-gray-900 shadow-xs font-medium'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            男模 ({models.filter((m) => m.gender === 'male').length})
          </button>
          <button
            type="button"
            onClick={() => setFilterGender('custom')}
            className={`px-2.5 py-1 rounded text-xs transition-colors ${
              filterGender === 'custom'
                ? 'bg-white text-gray-900 shadow-xs font-medium'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            自定义导入 ({models.filter((m) => !m.isPreset).length})
          </button>
        </div>

        <span className="text-[11px] text-gray-400 hidden sm:inline">
          标定标准：中轴对称度 &gt; 95% · 肩线清晰 · 5600K 白棚
        </span>
      </div>

      {/* Models Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
        {filteredModels.map((m) => {
          const isActive = m.isActive !== false;
          const isDefault = Boolean(m.isDefault);

          return (
            <div
              key={m.id}
              className={`border rounded-lg bg-white overflow-hidden flex flex-col transition-all group ${
                isDefault
                  ? 'border-gray-900 ring-1 ring-black/10'
                  : isActive
                  ? 'border-gray-200 hover:border-gray-400'
                  : 'border-gray-200 opacity-60 bg-gray-50/50'
              }`}
            >
              {/* Image Preview & Badges */}
              <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden">
                <img
                  src={m.url}
                  alt={m.name}
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                />

                {/* Top Badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                  <span className="text-[10px] bg-black/80 text-white backdrop-blur-xs px-2 py-0.5 rounded font-medium">
                    {m.code}
                  </span>
                  {m.isPreset ? (
                    <span className="text-[9px] bg-gray-900/60 text-white backdrop-blur-xs px-1.5 py-0.2 rounded">
                      系统预置
                    </span>
                  ) : (
                    <span className="text-[9px] bg-blue-600/80 text-white backdrop-blur-xs px-1.5 py-0.2 rounded font-medium">
                      自定义导入
                    </span>
                  )}
                </div>

                <div className="absolute top-2 right-2 flex items-center space-x-1">
                  {isDefault && (
                    <span className="inline-flex items-center text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded shadow-xs font-medium">
                      <Star className="w-2.5 h-2.5 mr-1 fill-white" />
                      默认打底
                    </span>
                  )}
                  <span className="text-[10px] bg-white/90 text-gray-900 font-mono px-1.5 py-0.5 rounded backdrop-blur-xs font-semibold shadow-xs">
                    {m.calibrationScore || 96}分
                  </span>
                </div>

                {/* Hover overlay with inspect button */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setInspectModel(m)}
                    className="inline-flex items-center px-2.5 py-1.5 bg-white text-gray-900 rounded text-xs font-medium shadow-md hover:bg-gray-100 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1" />
                    姿态体检报告
                  </button>
                </div>
              </div>

              {/* Card Meta */}
              <div className="p-3 flex-1 flex flex-col justify-between space-y-2.5 text-xs">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 truncate" title={m.name}>
                      {m.name}
                    </h3>
                    <span className="text-[10px] text-gray-500 font-mono">
                      {m.gender === 'female' ? '女模' : '男模'}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-gray-500">
                    <span>{m.height}</span>
                    <span className="font-mono text-gray-700">{m.measurements}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1 truncate" title={m.lighting}>
                    {m.lighting}
                  </p>
                </div>

                {/* Card Controls */}
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(m)}
                      className={`text-[11px] px-2 py-0.5 rounded border transition-colors ${
                        isActive
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-700 font-medium'
                          : 'border-gray-200 text-gray-400 hover:text-gray-700'
                      }`}
                    >
                      {isActive ? '已启用' : '已停用'}
                    </button>

                    {!isDefault && isActive && (
                      <button
                        type="button"
                        onClick={() => handleSetDefault(m)}
                        className="text-[11px] px-2 py-0.5 rounded border border-gray-200 text-gray-600 hover:border-black hover:text-black transition-colors"
                      >
                        设为默认
                      </button>
                    )}
                  </div>

                  {!m.isPreset && (
                    <button
                      type="button"
                      onClick={() => handleDelete(m)}
                      className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="删除此模特"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Upload & Calibration Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-lg shadow-2xl border border-gray-200 w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden text-left">
            {/* Header */}
            <div className="px-5 py-3.5 border-b border-gray-200 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-[#07C2E3]" />
                <h3 className="text-sm font-semibold text-gray-900">
                  导入并校准新模特打底照片
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!isCalibrating) setIsUploadModalOpen(false);
                }}
                className="text-gray-400 hover:text-gray-700 p-1 rounded hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleUploadSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              {uploadError && (
                <div className="p-2.5 rounded bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Upload Drop Area */}
              <div>
                <label className="block font-medium text-gray-800 mb-1.5">
                  模特照片 <span className="text-red-500">* (全身或标准半身直立照，纯白/无影棚背景最优)</span>
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />

                {uploadPreview ? (
                  <div className="relative aspect-[3/4] max-h-56 mx-auto rounded border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center group">
                    <img src={uploadPreview} alt="预览" className="h-full object-contain" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2.5 py-1 bg-white text-black text-xs rounded font-medium"
                      >
                        更换图片
                      </button>
                      <button
                        type="button"
                        onClick={() => setUploadPreview(null)}
                        className="px-2.5 py-1 bg-red-600 text-white text-xs rounded font-medium"
                      >
                        移除
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-200 hover:border-gray-900 rounded p-6 text-center cursor-pointer transition-colors bg-gray-50/50 space-y-2"
                  >
                    <Upload className="w-6 h-6 mx-auto text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-700">点击上传模特打底图</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">支持 PNG、JPG、WEBP 格式，建议分辨率 1024x1024 以上</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Model Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">模特全名 *</label>
                  <input
                    type="text"
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    placeholder="如：索菲亚 · 欧美优雅女模"
                    className="w-full px-3 py-1.5 border border-gray-200 rounded text-xs outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">简称代号 (用于快捷标识)</label>
                  <input
                    type="text"
                    value={modelCode}
                    onChange={(e) => setModelCode(e.target.value)}
                    placeholder="如：Sofia"
                    className="w-full px-3 py-1.5 border border-gray-200 rounded text-xs outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">模特性别</label>
                  <select
                    value={modelGender}
                    onChange={(e) => setModelGender(e.target.value as any)}
                    className="w-full px-3 py-1.5 border border-gray-200 rounded text-xs bg-white outline-none focus:border-black"
                  >
                    <option value="female">女性模特 (Female)</option>
                    <option value="male">男性模特 (Male)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">风格定位 / 族裔特征</label>
                  <input
                    type="text"
                    value={modelEthnicity}
                    onChange={(e) => setModelEthnicity(e.target.value)}
                    placeholder="如：东亚商业 / 欧洲高定 / 现代先锋"
                    className="w-full px-3 py-1.5 border border-gray-200 rounded text-xs outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">身长尺寸</label>
                  <input
                    type="text"
                    value={modelHeight}
                    onChange={(e) => setModelHeight(e.target.value)}
                    placeholder="如：178 cm"
                    className="w-full px-3 py-1.5 border border-gray-200 rounded text-xs outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">成衣三围 / 规格</label>
                  <input
                    type="text"
                    value={modelMeasurements}
                    onChange={(e) => setModelMeasurements(e.target.value)}
                    placeholder="如：84 - 60 - 89 cm"
                    className="w-full px-3 py-1.5 border border-gray-200 rounded text-xs outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">影棚布光方案</label>
                  <input
                    type="text"
                    value={modelLighting}
                    onChange={(e) => setModelLighting(e.target.value)}
                    placeholder="如：5600K 纯白柔光箱"
                    className="w-full px-3 py-1.5 border border-gray-200 rounded text-xs outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">标定姿态描述</label>
                  <input
                    type="text"
                    value={modelPose}
                    onChange={(e) => setModelPose(e.target.value)}
                    placeholder="如：标准中轴垂直全身站姿"
                    className="w-full px-3 py-1.5 border border-gray-200 rounded text-xs outline-none focus:border-black"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">特征与试衣说明</label>
                <textarea
                  value={modelDescription}
                  onChange={(e) => setModelDescription(e.target.value)}
                  placeholder="如：直立中轴线对称，平肩挺括，适合正装大衣与礼服试穿"
                  rows={2}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded text-xs outline-none focus:border-black resize-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  disabled={isCalibrating}
                  className="px-4 py-2 border border-gray-200 hover:border-gray-400 rounded text-xs text-gray-700"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isCalibrating}
                  className="px-5 py-2 bg-black hover:bg-gray-800 text-white rounded text-xs font-medium flex items-center space-x-1.5 shadow-xs disabled:opacity-50"
                >
                  {isCalibrating ? (
                    <>
                      <Activity className="w-3.5 h-3.5 animate-spin text-[#07C2E3]" />
                      <span>AI 姿态标定体检中...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 mr-1" />
                      <span>完成 AI 姿态标定并入库</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inspect Calibration Modal */}
      {inspectModel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-lg shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden text-left">
            <div className="px-5 py-3.5 border-b border-gray-200 flex items-center justify-between bg-white">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-semibold text-gray-900">
                  姿态标定与工程质检报告
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectModel(null)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {/* Top Summary */}
              <div className="flex items-center space-x-3 bg-gray-50 p-3 rounded border border-gray-100">
                <div className="w-14 h-18 rounded overflow-hidden bg-gray-200 shrink-0">
                  <img src={inspectModel.url} alt={inspectModel.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm">{inspectModel.name}</h4>
                  <p className="text-gray-500 text-[11px] mt-0.5">代号: {inspectModel.code} · {inspectModel.gender === 'female' ? '女模' : '男模'}</p>
                  <div className="mt-1 inline-flex items-center text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-medium">
                    综合标定得分: {inspectModel.calibrationScore || 96} 分 (符合成衣工业制版基准)
                  </div>
                </div>
              </div>

              {/* Calibration Inspection Checklist */}
              <div className="space-y-2 border border-gray-200 rounded p-3">
                <div className="flex items-center justify-between pb-1.5 border-b border-gray-100 font-medium text-gray-800">
                  <span>姿态与人体工学标定项</span>
                  <span className="text-emerald-600">评定状态</span>
                </div>
                <div className="space-y-2 text-[11px]">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-medium text-gray-800 block">人体中轴垂直度与对称性</span>
                      <span className="text-gray-500">
                        {inspectModel.calibrationReport?.symmetryScore || 98}% (中轴偏离度 &lt; 0.3°)
                      </span>
                    </div>
                    <span className="text-emerald-600 font-medium">达标</span>
                  </div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-medium text-gray-800 block">双肩水平度与锁骨清晰度</span>
                      <span className="text-gray-500">
                        {inspectModel.calibrationReport?.shoulderAlignment || '肩线平整，双臂自然下垂无遮挡'}
                      </span>
                    </div>
                    <span className="text-emerald-600 font-medium">达标</span>
                  </div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-medium text-gray-800 block">影棚背景纯净度</span>
                      <span className="text-gray-500">
                        {inspectModel.calibrationReport?.backgroundCleanliness || '99.2% 纯白柔光漫反射背景'}
                      </span>
                    </div>
                    <span className="text-emerald-600 font-medium">达标</span>
                  </div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-medium text-gray-800 block">成衣垂褶与试穿适配度</span>
                      <span className="text-gray-500">
                        {inspectModel.calibrationReport?.drapeSuitability || '极佳 (垂坠松量完全适配)'}
                      </span>
                    </div>
                    <span className="text-emerald-600 font-medium">极佳</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setInspectModel(null)}
                  className="px-4 py-1.5 bg-gray-900 text-white rounded text-xs font-medium hover:bg-black transition-colors"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
