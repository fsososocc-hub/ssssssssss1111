import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Paperclip,
  Square,
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
  Maximize2,
  RotateCw,
  BookmarkPlus,
  Play,
  ChevronDown,
  ChevronUp,
  X,
  Upload,
  FolderOpen,
  Sparkles,
  Layers,
  Camera,
  Wand2,
  Film,
  SplitSquareVertical,
  ArrowLeftRight,
} from 'lucide-react';
import { Asset, ChatMessage, ToolType } from '../types/index.ts';
import { AssetPickerModal } from './AssetPickerModal.tsx';

interface StudioViewProps {
  conversationId: string;
  conversationTitle: string;
  messages: ChatMessage[];
  onSendMessage: (
    text: string,
    attachments: string[],
    templateIntent?: string,
    extraSlots?: {
      garmentImage?: string;
      modelImage?: string;
      sourceImage?: string;
      parameters?: Record<string, any>;
    }
  ) => Promise<void>;
  isGenerating: boolean;
  onStopGeneration?: () => void;
  onPreviewAsset: (asset: Asset) => void;
  onCompareAsset?: (asset: Asset, original?: Asset | null) => void;
  onSelectForEdit: (asset: Asset) => void;
  recentAssets: Asset[];
}

export const StudioView: React.FC<StudioViewProps> = ({
  conversationTitle,
  messages,
  onSendMessage,
  isGenerating,
  onStopGeneration,
  onPreviewAsset,
  onCompareAsset,
  onSelectForEdit,
  recentAssets,
}) => {
  const [inputText, setInputText] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [activeIntent, setActiveIntent] = useState<ToolType | undefined>(undefined);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Dynamic slot states
  const [garmentImage, setGarmentImage] = useState<string | null>(null);
  const [modelImage, setModelImage] = useState<string | null>(null);
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [designRefImage, setDesignRefImage] = useState<string | null>(null);
  const [videoRefImage, setVideoRefImage] = useState<string | null>(null);

  // Foldable advanced parameter panels
  const [isParamsCollapsed, setIsParamsCollapsed] = useState(false);

  // 1. AI设计参数
  const [designCategory, setDesignCategory] = useState('外套/大衣');
  const [designStyle, setDesignStyle] = useState('极简高定');
  const [designFabric, setDesignFabric] = useState('100%山羊绒');
  const [designSilhouette, setDesignSilhouette] = useState('直筒H型');
  const [designQuantity, setDesignQuantity] = useState(1);

  // 2. AI换衣参数
  const [tryonFitRange, setTryonFitRange] = useState('整套换装');
  const [tryonGarmentPreserve, setTryonGarmentPreserve] = useState('保留版型与纽扣细节');
  const [tryonPersonPreserve, setTryonPersonPreserve] = useState('保持面部与原姿态');

  // 3. AI棚拍参数
  const [studioScene, setStudioScene] = useState('纯白无影棚');
  const [studioPose, setStudioPose] = useState('全身站姿');
  const [studioLighting, setStudioLighting] = useState('柔和棚灯 (5600K电商柔光)');
  const [studioRatio, setStudioRatio] = useState('3:4 商业画册');
  const [studioCount, setStudioCount] = useState(1);

  // 4. 高清换色参数
  const [selectedColorHex, setSelectedColorHex] = useState('#1A1A1A');
  const [selectedColorName, setSelectedColorName] = useState('纯深黑');
  const [customColorText, setCustomColorText] = useState('');
  const [preserveTexture, setPreserveTexture] = useState(true);

  // 5. 走秀视频参数
  const [runwayVenue, setRunwayVenue] = useState('巴黎大皇宫高定天桥');
  const [runwayCamera, setRunwayCamera] = useState('迎面缓步推镜');
  const [runwayDuration, setRunwayDuration] = useState('8 秒');
  const [runwayRatio, setRunwayRatio] = useState('16:9 横屏');

  // Asset picker modal state
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<
    'garment' | 'model' | 'source' | 'designRef' | 'video' | null
  >(null);
  const [pickerTitle, setPickerTitle] = useState('');

  const [expandedTaskIds, setExpandedTaskIds] = useState<Record<string, boolean>>({});
  const [savedToLibraryStatus, setSavedToLibraryStatus] = useState<Record<string, boolean>>({});

  // File input refs
  const garmentInputRef = useRef<HTMLInputElement>(null);
  const modelInputRef = useRef<HTMLInputElement>(null);
  const sourceInputRef = useRef<HTMLInputElement>(null);
  const designRefInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const generalAttachmentRef = useRef<HTMLInputElement>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  // Exact 5 Core Buttons (Strict names and order)
  const coreFeatures: {
    label: string;
    intent: ToolType;
    icon: React.ComponentType<{ className?: string }>;
    defaultTemplate: string;
  }[] = [
    {
      label: 'AI 设计',
      intent: 'fashion_design',
      icon: Sparkles,
      defaultTemplate: '请设计一款秋冬羊绒大衣，大翻驳领廓形，保留天然牛角扣与双面呢质感。',
    },
    {
      label: 'AI 换衣',
      intent: 'virtual_tryon',
      icon: Layers,
      defaultTemplate: '让模特穿上指定服装，保持面容身姿自然，精准贴合领型与肩线。',
    },
    {
      label: 'AI 棚拍',
      intent: 'model_photoshoot',
      icon: Camera,
      defaultTemplate: '以纯白无影棚拍摄这套服装的商业电商大片，全身站姿，光影通透柔和。',
    },
    {
      label: '高清换色',
      intent: 'image_refine_color',
      icon: Wand2,
      defaultTemplate: '把这件服装的面料颜色重映射为纯深黑，严格锁定原编织纹理与缝线高光。',
    },
    {
      label: '走秀视频',
      intent: 'runway_video',
      icon: Film,
      defaultTemplate: '使用这套服装制作一段 8 秒的高清动态 T 台走秀视频，镜头平稳推近。',
    },
  ];

  // 8款经典成衣色板
  const luxuryColors = [
    { name: '纯深黑', hex: '#1A1A1A' },
    { name: '深海蓝', hex: '#1C2D4E' },
    { name: '经典驼色', hex: '#B88B5F' },
    { name: '鼠尾草绿', hex: '#7A8E7D' },
    { name: '象牙柔白', hex: '#F5F2EB' },
    { name: '勃艮第酒红', hex: '#6E1A29' },
    { name: '焦糖暖棕', hex: '#A45A2A' },
    { name: '莫兰迪灰', hex: '#8E9196' },
  ];

  const handleSelectFeature = (item: (typeof coreFeatures)[0]) => {
    setActiveIntent(item.intent);
    setInputText(item.defaultTemplate);
    setValidationError(null);
    setIsParamsCollapsed(false);

    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = 'auto';
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
        }
      }, 0);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInputText(val);
    setValidationError(null);

    const lower = val.toLowerCase();
    if ((lower.includes('试衣') || lower.includes('换衣') || lower.includes('穿上')) && activeIntent !== 'virtual_tryon') {
      setActiveIntent('virtual_tryon');
    } else if ((lower.includes('改色') || lower.includes('换色') || lower.includes('调色') || lower.includes('精修')) && activeIntent !== 'image_refine_color') {
      setActiveIntent('image_refine_color');
    } else if ((lower.includes('棚拍') || lower.includes('模特') || lower.includes('摄影')) && activeIntent !== 'model_photoshoot') {
      setActiveIntent('model_photoshoot');
    } else if ((lower.includes('走秀') || lower.includes('视频') || lower.includes('runway')) && activeIntent !== 'runway_video') {
      setActiveIntent('runway_video');
    }

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSwapTryOnImages = () => {
    const temp = garmentImage;
    setGarmentImage(modelImage);
    setModelImage(temp);
  };

  const handleSubmit = async () => {
    if (isGenerating) return;

    // Strict validation per feature
    if (activeIntent === 'virtual_tryon') {
      if (!garmentImage && !modelImage) {
        setValidationError('请上传服装图片与模特照片（两张均为必填）。');
        return;
      }
      if (!garmentImage) {
        setValidationError('请上传服装图片。');
        return;
      }
      if (!modelImage) {
        setValidationError('请上传模特照片。');
        return;
      }
    } else if (activeIntent === 'image_refine_color') {
      if (!sourceImage && attachments.length === 0) {
        setValidationError('请提供待处理原图素材。');
        return;
      }
    } else if (activeIntent === 'model_photoshoot') {
      if (!garmentImage && attachments.length === 0 && !inputText.trim()) {
        setValidationError('请提供服装单品图或明确的设计需求。');
        return;
      }
    } else if (activeIntent === 'runway_video') {
      if (!videoRefImage && !garmentImage && attachments.length === 0) {
        setValidationError('请提供走秀参考素材（服装设计图或模特照）。');
        return;
      }
    }

    // Build synthesized prompt
    let promptToSend = inputText.trim();
    if (!promptToSend) {
      if (activeIntent === 'fashion_design') {
        promptToSend = `服装品类：${designCategory}，风格：${designStyle}，材质：${designFabric}，廓形：${designSilhouette}。生成${designQuantity}个方案。`;
      } else if (activeIntent === 'virtual_tryon') {
        promptToSend = `试衣范围：${tryonFitRange}，服装保真：${tryonGarmentPreserve}，人物保真：${tryonPersonPreserve}。完成高精试穿贴合。`;
      } else if (activeIntent === 'model_photoshoot') {
        promptToSend = `场景：${studioScene}，姿势：${studioPose}，布光：${studioLighting}，比例：${studioRatio}。输出${studioCount}张影棚大片。`;
      } else if (activeIntent === 'image_refine_color') {
        promptToSend = `目标颜色：${customColorText || selectedColorName}，保持面料纹理与高光：${preserveTexture ? '是' : '否'}。`;
      } else if (activeIntent === 'runway_video') {
        promptToSend = `秀场：${runwayVenue}，运镜：${runwayCamera}，时长：${runwayDuration}，画幅：${runwayRatio}。8秒高清走秀。`;
      } else {
        promptToSend = '请根据提供的素材执行服装创作。';
      }
    }

    const attsToSend = [...attachments];
    if (designRefImage && !attsToSend.includes(designRefImage)) {
      attsToSend.push(designRefImage);
    }
    if (sourceImage && !attsToSend.includes(sourceImage)) {
      attsToSend.push(sourceImage);
    }
    if (videoRefImage && !attsToSend.includes(videoRefImage)) {
      attsToSend.push(videoRefImage);
    }

    const extraSlots = {
      garmentImage: garmentImage || undefined,
      modelImage: modelImage || undefined,
      sourceImage: sourceImage || undefined,
      parameters: {
        designCategory,
        designStyle,
        designFabric,
        designSilhouette,
        designQuantity,
        tryonFitRange,
        tryonGarmentPreserve,
        tryonPersonPreserve,
        studioScene,
        studioPose,
        studioLighting,
        studioRatio,
        studioCount,
        targetColor: customColorText || selectedColorName,
        preserveTexture,
        runwayVenue,
        runwayCamera,
        runwayDuration,
        runwayRatio,
      },
    };

    setInputText('');
    setAttachments([]);
    setValidationError(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    await onSendMessage(promptToSend, attsToSend, activeIntent, extraSlots);
  };

  const readFileAsDataUrl = (file: File, callback: (url: string) => void) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        callback(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const openAssetPicker = (
    target: 'garment' | 'model' | 'source' | 'designRef' | 'video',
    title: string
  ) => {
    setPickerTarget(target);
    setPickerTitle(title);
    setPickerOpen(true);
  };

  const handleAssetPicked = (asset: Asset) => {
    if (pickerTarget === 'garment') {
      setGarmentImage(asset.url);
    } else if (pickerTarget === 'model') {
      setModelImage(asset.url);
    } else if (pickerTarget === 'source') {
      setSourceImage(asset.url);
    } else if (pickerTarget === 'designRef') {
      setDesignRefImage(asset.url);
    } else if (pickerTarget === 'video') {
      setVideoRefImage(asset.url);
    }
    setValidationError(null);
  };

  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTaskIds((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  const handleSaveToLibrary = (asset: Asset) => {
    setSavedToLibraryStatus((prev) => ({ ...prev, [asset.id]: true }));
    setTimeout(() => {
      setSavedToLibraryStatus((prev) => ({ ...prev, [asset.id]: false }));
    }, 2000);
  };

  const handleDownload = (asset: Asset) => {
    const a = document.createElement('a');
    a.href = asset.url;
    a.download = asset.name || `modagpt-${asset.id}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const hasMessages = messages.length > 0;
  const genuineRecentAssets = recentAssets.slice(0, 3);

  // Dynamic Input Panels for the 5 Core Functions
  const renderDynamicInputPanel = () => {
    if (!activeIntent) return null;

    // 1. AI 设计 Panel
    if (activeIntent === 'fashion_design') {
      const categories = ['外套/大衣', '高级西装', '礼服裙装', '真丝衬衫', '羊绒针织', '风衣夹克'];
      const styles = ['极简高定', '新中式典雅', '先锋剪裁', '摩登商务', '法式复古'];
      const fabrics = ['100%山羊绒', '高支精纺羊毛', '重磅真丝', '天然亚麻', '醋酸缎面'];
      const silhouettes = ['直筒H型', '收腰X型', '伞摆A型', 'Oversized宽松'];

      return (
        <div className="border border-gray-200 rounded-lg p-3.5 bg-gray-50/70 space-y-3 transition-all text-left">
          <div className="flex items-center justify-between pb-1.5 border-b border-gray-200">
            <span className="text-xs font-semibold text-gray-900">AI 设计 · 创作配置</span>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setIsParamsCollapsed(!isParamsCollapsed)}
                className="text-xs text-gray-500 hover:text-gray-900"
              >
                {isParamsCollapsed ? '展开选项' : '收起选项'}
              </button>
              <button
                type="button"
                onClick={() => setActiveIntent(undefined)}
                className="text-gray-400 hover:text-gray-700 p-0.5 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Reference Image Slot (Optional) */}
          <div className="border border-gray-200 bg-white rounded p-2.5 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-700">参考图 (可选)：</span>
            {designRefImage ? (
              <div className="flex items-center space-x-2">
                <img
                  src={designRefImage}
                  alt="参考图"
                  className="w-8 h-8 rounded object-cover border border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => designRefInputRef.current?.click()}
                  className="text-xs text-gray-700 hover:text-black border border-gray-200 px-2 py-0.5 rounded"
                >
                  更换
                </button>
                <button
                  type="button"
                  onClick={() => setDesignRefImage(null)}
                  className="text-xs text-red-600 hover:text-red-700 px-1 py-0.5"
                >
                  移除
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-1.5">
                <input
                  type="file"
                  ref={designRefInputRef}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) readFileAsDataUrl(f, setDesignRefImage);
                    e.target.value = '';
                  }}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => designRefInputRef.current?.click()}
                  className="inline-flex items-center px-2 py-0.5 border border-gray-200 hover:border-gray-400 rounded text-xs text-gray-700"
                >
                  <Upload className="w-3 h-3 mr-1" />
                  本地上传
                </button>
                <button
                  type="button"
                  onClick={() => openAssetPicker('designRef', '选择设计参考图')}
                  className="inline-flex items-center px-2 py-0.5 border border-gray-200 hover:border-gray-400 rounded text-xs text-gray-700"
                >
                  <FolderOpen className="w-3 h-3 mr-1" />
                  素材库
                </button>
              </div>
            )}
          </div>

          {!isParamsCollapsed && (
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-[11px] text-gray-500 font-medium block mb-1">服装品类：</span>
                <div className="flex flex-wrap gap-1.5">
                  {categories.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setDesignCategory(c)}
                      className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                        designCategory === c
                          ? 'bg-black text-white font-medium'
                          : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[11px] text-gray-500 font-medium block mb-1">设计风格：</span>
                <div className="flex flex-wrap gap-1.5">
                  {styles.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setDesignStyle(s)}
                      className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                        designStyle === s
                          ? 'bg-black text-white font-medium'
                          : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <div>
                  <span className="text-[11px] text-gray-500 font-medium block mb-1">面料偏好：</span>
                  <div className="flex flex-wrap gap-1.5">
                    {fabrics.map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setDesignFabric(f)}
                        className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                          designFabric === f
                            ? 'bg-black text-white font-medium'
                            : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-400'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] text-gray-500 font-medium block mb-1">剪裁廓形：</span>
                  <div className="flex flex-wrap gap-1.5">
                    {silhouettes.map((sh) => (
                      <button
                        key={sh}
                        type="button"
                        onClick={() => setDesignSilhouette(sh)}
                        className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                          designSilhouette === sh
                            ? 'bg-black text-white font-medium'
                            : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-400'
                        }`}
                      >
                        {sh}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-1 flex items-center space-x-2">
                <span className="text-[11px] text-gray-500 font-medium">生成方案数量：</span>
                {[1, 2, 3].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setDesignQuantity(num)}
                    className={`px-2 py-0.5 rounded text-[11px] border ${
                      designQuantity === num
                        ? 'bg-black text-white border-black font-medium'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    {num} 方案
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    // 2. AI 换衣 Panel (Two mandatory boxes)
    if (activeIntent === 'virtual_tryon') {
      const fitRanges = ['整套换装', '上装替换', '下装替换'];
      const garmentPreserves = ['保留版型与细节', '保留领型与走线', '面料褶皱自适应'];
      const personPreserves = ['保持面部与原姿态', '保持背景纯净', '自然体态对齐'];

      return (
        <div className="border border-gray-200 rounded-lg p-3.5 bg-gray-50/70 space-y-3 transition-all text-left">
          <div className="flex items-center justify-between pb-1.5 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-gray-900">AI 换衣 · 试衣素材配置</span>
              <span className="text-[11px] text-gray-500">（两张均为必填项）</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleSwapTryOnImages}
                className="text-xs text-gray-500 hover:text-black flex items-center space-x-1 px-1.5 py-0.5 rounded border border-gray-200 bg-white"
                title="互换两张图片"
              >
                <ArrowLeftRight className="w-3 h-3" />
                <span>互换</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveIntent(undefined)}
                className="text-gray-400 hover:text-gray-700 p-0.5 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Box A: 服装图片 */}
            <div className="border border-gray-200 bg-white rounded p-3 flex flex-col justify-between min-h-[140px]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-900">
                  服装图片 <span className="text-red-500">*</span>
                </span>
                {garmentImage && (
                  <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded font-medium">
                    已就绪
                  </span>
                )}
              </div>

              {garmentImage ? (
                <div className="relative aspect-video w-full rounded bg-gray-50 overflow-hidden group border border-gray-100 flex items-center justify-center">
                  <img src={garmentImage} alt="服装素材" className="w-full h-full object-contain" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                    <button
                      type="button"
                      onClick={() => garmentInputRef.current?.click()}
                      className="px-2 py-1 bg-white text-black text-[11px] rounded"
                    >
                      更换
                    </button>
                    <button
                      type="button"
                      onClick={() => setGarmentImage(null)}
                      className="px-2 py-1 bg-red-600 text-white text-[11px] rounded"
                    >
                      移除
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-gray-200 rounded p-3 space-y-2">
                  <span className="text-[11px] text-gray-400">平铺图、单品图或原图</span>
                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      ref={garmentInputRef}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) readFileAsDataUrl(f, setGarmentImage);
                        e.target.value = '';
                      }}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => garmentInputRef.current?.click()}
                      className="inline-flex items-center px-2.5 py-1 bg-white border border-gray-200 hover:border-gray-400 rounded text-xs text-gray-700"
                    >
                      <Upload className="w-3 h-3 mr-1" />
                      本地上传
                    </button>
                    <button
                      type="button"
                      onClick={() => openAssetPicker('garment', '从素材库选择服装图片')}
                      className="inline-flex items-center px-2.5 py-1 bg-white border border-gray-200 hover:border-gray-400 rounded text-xs text-gray-700"
                    >
                      <FolderOpen className="w-3 h-3 mr-1" />
                      素材库
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Box B: 模特照片 */}
            <div className="border border-gray-200 bg-white rounded p-3 flex flex-col justify-between min-h-[140px]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-900">
                  模特照片 <span className="text-red-500">*</span>
                </span>
                {modelImage && (
                  <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded font-medium">
                    已就绪
                  </span>
                )}
              </div>

              {modelImage ? (
                <div className="relative aspect-video w-full rounded bg-gray-50 overflow-hidden group border border-gray-100 flex items-center justify-center">
                  <img src={modelImage} alt="模特素材" className="w-full h-full object-contain" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                    <button
                      type="button"
                      onClick={() => modelInputRef.current?.click()}
                      className="px-2 py-1 bg-white text-black text-[11px] rounded"
                    >
                      更换
                    </button>
                    <button
                      type="button"
                      onClick={() => setModelImage(null)}
                      className="px-2 py-1 bg-red-600 text-white text-[11px] rounded"
                    >
                      移除
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-gray-200 rounded p-3 space-y-2">
                  <span className="text-[11px] text-gray-400">全身或半身人像照片</span>
                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      ref={modelInputRef}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) readFileAsDataUrl(f, setModelImage);
                        e.target.value = '';
                      }}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => modelInputRef.current?.click()}
                      className="inline-flex items-center px-2.5 py-1 bg-white border border-gray-200 hover:border-gray-400 rounded text-xs text-gray-700"
                    >
                      <Upload className="w-3 h-3 mr-1" />
                      本地上传
                    </button>
                    <button
                      type="button"
                      onClick={() => openAssetPicker('model', '从素材库选择模特照片')}
                      className="inline-flex items-center px-2.5 py-1 bg-white border border-gray-200 hover:border-gray-400 rounded text-xs text-gray-700"
                    >
                      <FolderOpen className="w-3 h-3 mr-1" />
                      素材库
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 试衣设置 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
            <div>
              <span className="text-[11px] text-gray-500 font-medium block mb-1">试衣范围：</span>
              <div className="flex flex-wrap gap-1">
                {fitRanges.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setTryonFitRange(r)}
                    className={`px-2 py-0.5 rounded text-[11px] border ${
                      tryonFitRange === r
                        ? 'bg-black text-white border-black font-medium'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[11px] text-gray-500 font-medium block mb-1">服装保真：</span>
              <div className="flex flex-wrap gap-1">
                {garmentPreserves.map((gp) => (
                  <button
                    key={gp}
                    type="button"
                    onClick={() => setTryonGarmentPreserve(gp)}
                    className={`px-2 py-0.5 rounded text-[11px] border ${
                      tryonGarmentPreserve === gp
                        ? 'bg-black text-white border-black font-medium'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    {gp}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[11px] text-gray-500 font-medium block mb-1">人物保真：</span>
              <div className="flex flex-wrap gap-1">
                {personPreserves.map((pp) => (
                  <button
                    key={pp}
                    type="button"
                    onClick={() => setTryonPersonPreserve(pp)}
                    className={`px-2 py-0.5 rounded text-[11px] border ${
                      tryonPersonPreserve === pp
                        ? 'bg-black text-white border-black font-medium'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    {pp}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 3. AI 棚拍 Panel
    if (activeIntent === 'model_photoshoot') {
      const scenes = ['纯白无影棚', '浅灰影棚', '室内空间', '户外场景', '高级时装画册'];
      const poses = ['全身站姿', '半身近景', '正面肖像', '侧身微转', '行走动态'];
      const lightings = [
        '柔和棚灯 (5600K电商柔光)',
        '明暗对比大片光',
        '自然光',
        '电商商品摄影',
        '时装编辑摄影',
      ];
      const ratios = ['3:4 商业画册', '1:1 正方形', '9:16 全身竖屏'];

      return (
        <div className="border border-gray-200 rounded-lg p-3.5 bg-gray-50/70 space-y-3 transition-all text-left">
          <div className="flex items-center justify-between pb-1.5 border-b border-gray-200">
            <span className="text-xs font-semibold text-gray-900">AI 棚拍 · 商业摄影配置</span>
            <button
              type="button"
              onClick={() => setActiveIntent(undefined)}
              className="text-gray-400 hover:text-gray-700 p-0.5 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {/* Clothing Slot */}
            <div className="border border-gray-200 bg-white rounded p-2.5 flex flex-col justify-between min-h-[110px]">
              <span className="text-[11px] font-medium text-gray-900 block mb-1">棚拍服装素材：</span>
              {garmentImage ? (
                <div className="relative h-20 w-full rounded bg-gray-50 overflow-hidden group border border-gray-100 flex items-center justify-center">
                  <img src={garmentImage} alt="服装素材" className="h-full object-contain" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() => garmentInputRef.current?.click()}
                      className="px-1.5 py-0.5 bg-white text-black text-[10px] rounded"
                    >
                      更换
                    </button>
                    <button
                      type="button"
                      onClick={() => setGarmentImage(null)}
                      className="px-1.5 py-0.5 bg-red-600 text-white text-[10px] rounded"
                    >
                      移除
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-gray-200 rounded p-2 space-y-1">
                  <span className="text-[10px] text-gray-400">上传服装或选择已有作品</span>
                  <div className="flex items-center space-x-1.5">
                    <input
                      type="file"
                      ref={garmentInputRef}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) readFileAsDataUrl(f, setGarmentImage);
                        e.target.value = '';
                      }}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => garmentInputRef.current?.click()}
                      className="px-2 py-0.5 bg-white border border-gray-200 hover:border-gray-400 rounded text-[11px]"
                    >
                      上传
                    </button>
                    <button
                      type="button"
                      onClick={() => openAssetPicker('garment', '选择棚拍服装单品')}
                      className="px-2 py-0.5 bg-white border border-gray-200 hover:border-gray-400 rounded text-[11px]"
                    >
                      素材库
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Model & Lighting */}
            <div className="sm:col-span-2 space-y-2">
              <div>
                <span className="text-[11px] text-gray-500 font-medium block mb-1">场景选择：</span>
                <div className="flex flex-wrap gap-1.5">
                  {scenes.map((sc) => (
                    <button
                      key={sc}
                      type="button"
                      onClick={() => setStudioScene(sc)}
                      className={`px-2 py-0.5 rounded text-[11px] border ${
                        studioScene === sc
                          ? 'bg-black text-white border-black font-medium'
                          : 'bg-white border-gray-200 text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      {sc}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[11px] text-gray-500 font-medium block mb-1">姿势与构图：</span>
                <div className="flex flex-wrap gap-1.5">
                  {poses.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setStudioPose(p)}
                      className={`px-2 py-0.5 rounded text-[11px] border ${
                        studioPose === p
                          ? 'bg-black text-white border-black font-medium'
                          : 'bg-white border-gray-200 text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <div>
                  <span className="text-[11px] text-gray-500 font-medium block mb-1">灯光风格：</span>
                  <select
                    value={studioLighting}
                    onChange={(e) => setStudioLighting(e.target.value)}
                    className="w-full px-2 py-1 border border-gray-200 rounded text-[11px] bg-white outline-none focus:border-black"
                  >
                    {lightings.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <span className="text-[11px] text-gray-500 font-medium block mb-1">画幅比例：</span>
                  <div className="flex gap-1.5">
                    {ratios.map((rt) => (
                      <button
                        key={rt}
                        type="button"
                        onClick={() => setStudioRatio(rt)}
                        className={`px-2 py-0.5 rounded text-[11px] border ${
                          studioRatio === rt
                            ? 'bg-black text-white border-black font-medium'
                            : 'bg-white border-gray-200 text-gray-700 hover:border-gray-400'
                        }`}
                      >
                        {rt.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 4. 高清换色 Panel
    if (activeIntent === 'image_refine_color') {
      return (
        <div className="border border-gray-200 rounded-lg p-3.5 bg-gray-50/70 space-y-3 transition-all text-left">
          <div className="flex items-center justify-between pb-1.5 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-gray-900">高清换色 · 原图调色配置</span>
              <span className="text-[11px] text-gray-500">（原图绝不覆盖，生成新版本）</span>
            </div>
            <button
              type="button"
              onClick={() => setActiveIntent(undefined)}
              className="text-gray-400 hover:text-gray-700 p-0.5 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Source Image Box */}
            <div className="border border-gray-200 bg-white rounded p-3 flex flex-col justify-between min-h-[120px]">
              <span className="text-xs font-medium text-gray-900 block mb-1">
                待换色原图 <span className="text-red-500">*</span>
              </span>
              {sourceImage ? (
                <div className="relative h-24 w-full rounded bg-gray-50 overflow-hidden group border border-gray-100 flex items-center justify-center">
                  <img src={sourceImage} alt="待修图素材" className="h-full object-contain" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() => sourceInputRef.current?.click()}
                      className="px-2 py-0.5 bg-white text-black text-[10px] rounded"
                    >
                      更换
                    </button>
                    <button
                      type="button"
                      onClick={() => setSourceImage(null)}
                      className="px-2 py-0.5 bg-red-600 text-white text-[10px] rounded"
                    >
                      移除
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-gray-200 rounded p-2 space-y-1.5">
                  <span className="text-[10px] text-gray-400 text-center">服装或模特原图</span>
                  <div className="flex items-center space-x-1.5">
                    <input
                      type="file"
                      ref={sourceInputRef}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) readFileAsDataUrl(f, setSourceImage);
                        e.target.value = '';
                      }}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => sourceInputRef.current?.click()}
                      className="px-2 py-0.5 bg-white border border-gray-200 hover:border-gray-400 rounded text-[11px]"
                    >
                      上传
                    </button>
                    <button
                      type="button"
                      onClick={() => openAssetPicker('source', '选择待换色原图')}
                      className="px-2 py-0.5 bg-white border border-gray-200 hover:border-gray-400 rounded text-[11px]"
                    >
                      素材库
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Color Palette & Custom Input */}
            <div className="sm:col-span-2 space-y-2 text-xs">
              <span className="text-[11px] text-gray-500 font-medium block">经典成衣色板：</span>
              <div className="grid grid-cols-4 gap-1.5">
                {luxuryColors.map((col) => {
                  const isPicked = selectedColorName === col.name;
                  return (
                    <button
                      key={col.name}
                      type="button"
                      onClick={() => {
                        setSelectedColorHex(col.hex);
                        setSelectedColorName(col.name);
                        setCustomColorText('');
                      }}
                      className={`flex items-center space-x-1.5 p-1 rounded border transition-colors ${
                        isPicked
                          ? 'border-black bg-gray-100 ring-1 ring-black'
                          : 'border-gray-200 bg-white hover:border-gray-400'
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0 border border-gray-300"
                        style={{ backgroundColor: col.hex }}
                      />
                      <span className="text-[11px] truncate text-gray-800">{col.name}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <span className="text-[11px] text-gray-500 shrink-0">自定义颜色/色号：</span>
                <input
                  type="text"
                  value={customColorText}
                  onChange={(e) => setCustomColorText(e.target.value)}
                  placeholder="例如: 深酒红、奶油白、Pantone 19-3911..."
                  className="flex-1 px-2 py-1 border border-gray-200 rounded text-xs outline-none focus:border-black bg-white"
                />
              </div>

              <label className="flex items-center space-x-2 pt-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={preserveTexture}
                  onChange={(e) => setPreserveTexture(e.target.checked)}
                  className="w-3.5 h-3.5 text-black rounded border-gray-300"
                />
                <span className="text-[11px] text-gray-600">锁定原始织物纹理与纽扣光影（高保真保真度）</span>
              </label>
            </div>
          </div>
        </div>
      );
    }

    // 5. 走秀视频 Panel
    if (activeIntent === 'runway_video') {
      const venues = ['巴黎大皇宫高定天桥', '米兰极简光影T台', '现代工业秀场', '户外沉浸秀场'];
      const cameras = ['迎面缓步推镜', '稳态全身跟踪', '360°环绕跟拍'];
      const durations = ['8 秒', '12 秒 (高画质)'];
      const ratios = ['16:9 横屏', '9:16 竖屏'];

      return (
        <div className="border border-gray-200 rounded-lg p-3.5 bg-gray-50/70 space-y-3 transition-all text-left">
          <div className="flex items-center justify-between pb-1.5 border-b border-gray-200">
            <span className="text-xs font-semibold text-gray-900">走秀视频 · 动态时装秀创作</span>
            <button
              type="button"
              onClick={() => setActiveIntent(undefined)}
              className="text-gray-400 hover:text-gray-700 p-0.5 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Reference Slot */}
            <div className="border border-gray-200 bg-white rounded p-3 flex flex-col justify-between min-h-[120px]">
              <span className="text-xs font-medium text-gray-900 block mb-1">
                走秀参考素材 <span className="text-red-500">*</span>
              </span>
              {videoRefImage || garmentImage ? (
                <div className="relative h-24 w-full rounded bg-gray-50 overflow-hidden group border border-gray-100 flex items-center justify-center">
                  <img
                    src={videoRefImage || garmentImage!}
                    alt="走秀参考素材"
                    className="h-full object-contain"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() => videoInputRef.current?.click()}
                      className="px-2 py-0.5 bg-white text-black text-[10px] rounded"
                    >
                      更换
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setVideoRefImage(null);
                        setGarmentImage(null);
                      }}
                      className="px-2 py-0.5 bg-red-600 text-white text-[10px] rounded"
                    >
                      移除
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-gray-200 rounded p-2 space-y-1.5">
                  <span className="text-[10px] text-gray-400 text-center">服装设计图或模特图</span>
                  <div className="flex items-center space-x-1.5">
                    <input
                      type="file"
                      ref={videoInputRef}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) readFileAsDataUrl(f, setVideoRefImage);
                        e.target.value = '';
                      }}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => videoInputRef.current?.click()}
                      className="px-2 py-0.5 bg-white border border-gray-200 hover:border-gray-400 rounded text-[11px]"
                    >
                      上传
                    </button>
                    <button
                      type="button"
                      onClick={() => openAssetPicker('video', '选择走秀参考素材')}
                      className="px-2 py-0.5 bg-white border border-gray-200 hover:border-gray-400 rounded text-[11px]"
                    >
                      素材库
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Video Controls */}
            <div className="sm:col-span-2 space-y-2 text-xs">
              <div>
                <span className="text-[11px] text-gray-500 font-medium block mb-1">秀场场景：</span>
                <div className="flex flex-wrap gap-1.5">
                  {venues.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setRunwayVenue(v)}
                      className={`px-2 py-0.5 rounded text-[11px] border ${
                        runwayVenue === v
                          ? 'bg-black text-white border-black font-medium'
                          : 'bg-white border-gray-200 text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[11px] text-gray-500 font-medium block mb-1">镜头运动：</span>
                <div className="flex flex-wrap gap-1.5">
                  {cameras.map((cm) => (
                    <button
                      key={cm}
                      type="button"
                      onClick={() => setRunwayCamera(cm)}
                      className={`px-2 py-0.5 rounded text-[11px] border ${
                        runwayCamera === cm
                          ? 'bg-black text-white border-black font-medium'
                          : 'bg-white border-gray-200 text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      {cm}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <span className="text-[11px] text-gray-500 font-medium block mb-1">视频时长：</span>
                  <div className="flex gap-1.5">
                    {durations.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setRunwayDuration(d)}
                        className={`px-2 py-0.5 rounded text-[11px] border ${
                          runwayDuration === d
                            ? 'bg-black text-white border-black font-medium'
                            : 'bg-white border-gray-200 text-gray-700 hover:border-gray-400'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] text-gray-500 font-medium block mb-1">画幅比例：</span>
                  <div className="flex gap-1.5">
                    {ratios.map((rt) => (
                      <button
                        key={rt}
                        type="button"
                        onClick={() => setRunwayRatio(rt)}
                        className={`px-2 py-0.5 rounded text-[11px] border ${
                          runwayRatio === rt
                            ? 'bg-black text-white border-black font-medium'
                            : 'bg-white border-gray-200 text-gray-700 hover:border-gray-400'
                        }`}
                      >
                        {rt.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-white overflow-hidden">
      {/* Top minimal title indicator */}
      <div className="h-12 border-b border-gray-200 px-6 flex items-center justify-between shrink-0 bg-white">
        <span className="text-xs font-semibold text-gray-900 truncate">
          {conversationTitle || 'ModaGPT 创作空间'}
        </span>
        <span className="text-[11px] text-gray-400">AI 服装设计与商业视觉创作</span>
      </div>

      {/* Main Workspace Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col justify-between">
        <div className="max-w-4xl mx-auto w-full space-y-6 flex-1 flex flex-col justify-center">
          {/* 1. Empty State (Centered ChatGPT-style creation interface) */}
          {!hasMessages && (
            <div className="w-full max-w-[850px] mx-auto py-8 flex flex-col items-center text-center space-y-5">
              <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight">
                你想创作什么？
              </h1>

              {/* Central Command Box */}
              <div className="w-full space-y-3">
                {/* 5 Locked Core Buttons */}
                <div className="flex items-center justify-center space-x-2 flex-wrap gap-y-1.5 text-xs select-none">
                  {coreFeatures.map((item) => {
                    const isActive = activeIntent === item.intent;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => handleSelectFeature(item)}
                        className={`inline-flex items-center px-3.5 py-1.5 rounded text-xs transition-colors ${
                          isActive
                            ? 'bg-black text-white font-medium shadow-xs'
                            : 'bg-white border border-gray-200 text-gray-800 hover:border-gray-400 hover:text-black'
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 mr-1.5 ${isActive ? 'text-[#07C2E3]' : 'text-gray-500'}`} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Dynamic Input Panel */}
                {renderDynamicInputPanel()}

                {/* Validation Warning Alert */}
                {validationError && (
                  <div className="flex items-center space-x-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded p-2.5 text-left">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>{validationError}</span>
                  </div>
                )}

                {/* Attachments preview */}
                {attachments.length > 0 && (
                  <div className="flex items-center space-x-2 py-1.5 overflow-x-auto justify-start">
                    {attachments.map((att, i) => (
                      <div key={i} className="relative w-14 h-14 border border-gray-200 rounded shrink-0 overflow-hidden">
                        <img src={att} alt="附件预览" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                          className="absolute top-0.5 right-0.5 bg-black/70 hover:bg-black text-white rounded-full p-0.5"
                          title="移除"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Input Container */}
                <div className="border border-gray-300 focus-within:border-black rounded-lg p-3 transition-colors bg-white text-left">
                  <textarea
                    ref={textareaRef}
                    rows={2}
                    value={inputText}
                    onChange={handleTextareaChange}
                    onKeyDown={handleKeyDown}
                    placeholder="描述你想创作的服装需求或上传参考素材 (Enter 发送，Shift+Enter 换行)..."
                    className="w-full resize-none border-none outline-none text-sm text-gray-900 placeholder:text-gray-400 max-h-48 leading-relaxed bg-transparent"
                  />

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="file"
                        ref={generalAttachmentRef}
                        onChange={(e) => {
                          const files = e.target.files;
                          if (!files) return;
                          Array.from(files).forEach((file) => {
                            readFileAsDataUrl(file, (url) => setAttachments((prev) => [...prev, url]));
                          });
                          e.target.value = '';
                        }}
                        multiple
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => generalAttachmentRef.current?.click()}
                        className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors inline-flex items-center space-x-1 text-xs"
                        title="上传图片素材"
                      >
                        <Paperclip className="w-4 h-4" />
                        <span>附加素材</span>
                      </button>

                      {activeIntent && (
                        <span className="text-[11px] bg-gray-100 text-gray-800 px-2 py-0.5 rounded font-medium">
                          {coreFeatures.find((f) => f.intent === activeIntent)?.label || activeIntent}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={
                        !inputText.trim() &&
                        attachments.length === 0 &&
                        !garmentImage &&
                        !modelImage &&
                        !sourceImage &&
                        !videoRefImage &&
                        !designRefImage
                      }
                      className={`p-1.5 rounded transition-colors ${
                        inputText.trim() ||
                        attachments.length > 0 ||
                        garmentImage ||
                        modelImage ||
                        sourceImage ||
                        videoRefImage ||
                        designRefImage
                          ? 'bg-black text-white hover:bg-gray-800'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                      title="发送创作命令"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Recent Works */}
              {genuineRecentAssets.length > 0 && (
                <div className="w-full max-w-[850px] pt-2">
                  <div className="grid grid-cols-3 gap-3">
                    {genuineRecentAssets.map((asset) => (
                      <div
                        key={asset.id}
                        onClick={() => onPreviewAsset(asset)}
                        className="border border-gray-200 hover:border-gray-400 rounded overflow-hidden cursor-pointer transition-colors bg-white group"
                      >
                        <div className="aspect-square bg-gray-50 overflow-hidden">
                          <img
                            src={asset.thumbnailUrl || asset.url}
                            alt={asset.name}
                            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-150"
                          />
                        </div>
                        <div className="p-1.5 text-[11px] text-gray-600 truncate border-t border-gray-100">
                          {asset.name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. Populated Conversation Stream */}
          {hasMessages && (
            <div className="space-y-6 pt-2">
              {messages.map((msg) => (
                <div key={msg.id} className="space-y-3">
                  {/* User Turn */}
                  {msg.role === 'user' && (
                    <div className="flex items-start space-x-3">
                      <div className="w-7 h-7 rounded bg-gray-900 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        U
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="text-xs font-medium text-gray-900 flex items-center space-x-2">
                          <span>用户指令</span>
                          <span className="text-[10px] text-gray-400 font-mono">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded p-3 leading-relaxed inline-block max-w-2xl">
                          {msg.content}
                        </div>

                        {/* User Attachments */}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {msg.attachments.map((att, i) => (
                              <div key={i} className="border border-gray-200 rounded overflow-hidden">
                                <img
                                  src={att}
                                  alt="用户素材"
                                  className="w-20 h-20 object-cover cursor-pointer hover:opacity-90"
                                  onClick={() =>
                                    onPreviewAsset({
                                      id: `user-att-${i}`,
                                      name: '用户输入素材',
                                      type: 'image',
                                      url: att,
                                      createdAt: Date.now(),
                                      metadata: { tool: 'fashion_design', prompt: msg.content, version: 1 },
                                    })
                                  }
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Assistant Turn */}
                  {msg.role === 'assistant' && (
                    <div className="flex items-start space-x-3">
                      <div className="w-7 h-7 rounded bg-black text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        M
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="text-xs font-medium text-gray-900 flex items-center space-x-2">
                          <span>ModaGPT</span>
                          <span className="text-[10px] text-gray-400 font-mono">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {/* Task Progress Status Box */}
                        {msg.taskRecord && (
                          <div className="border border-gray-200 rounded p-3 bg-white space-y-2 max-w-2xl">
                            <div className="flex items-center justify-between pb-1.5 border-b border-gray-100">
                              <div className="flex items-center space-x-2">
                                {msg.taskRecord.status === 'succeeded' ? (
                                  <span className="inline-flex items-center text-xs font-medium text-gray-900">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mr-1.5" />
                                    任务执行完成
                                  </span>
                                ) : msg.taskRecord.status === 'waiting_for_input' ? (
                                  <span className="inline-flex items-center text-xs font-medium text-amber-700">
                                    <AlertCircle className="w-3.5 h-3.5 text-amber-500 mr-1.5" />
                                    等待补充必要素材
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center text-xs font-medium text-red-600">
                                    <AlertCircle className="w-3.5 h-3.5 text-red-500 mr-1.5" />
                                    任务已阻断
                                  </span>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => toggleTaskExpansion(msg.taskRecord!.id)}
                                className="text-xs text-gray-500 hover:text-gray-900 flex items-center space-x-1"
                              >
                                <span>{expandedTaskIds[msg.taskRecord.id] ? '收起' : '步骤详情'}</span>
                                {expandedTaskIds[msg.taskRecord.id] ? (
                                  <ChevronUp className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>

                            <div className="space-y-1">
                              {msg.taskRecord.steps.map((st) => (
                                <div key={st.id} className="flex items-center text-xs space-x-2">
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                      st.status === 'completed'
                                        ? 'bg-emerald-500'
                                        : st.status === 'failed'
                                        ? 'bg-red-500'
                                        : 'bg-gray-400'
                                    }`}
                                  />
                                  <span className="text-gray-700">{st.title}</span>
                                </div>
                              ))}
                            </div>

                            {/* Detailed steps accordion */}
                            {expandedTaskIds[msg.taskRecord.id] && (
                              <div className="pt-2 border-t border-gray-100 space-y-1.5">
                                {msg.taskRecord.steps.map((st, idx) => (
                                  <div
                                    key={idx}
                                    className="p-2 border border-gray-100 rounded bg-gray-50/70 text-xs space-y-0.5"
                                  >
                                    <span className="font-medium text-gray-800 block">
                                      {idx + 1}. {st.title}
                                    </span>
                                    {st.details && (
                                      <div className="text-[11px] text-gray-500">{st.details}</div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Assistant Reply Text */}
                        <div className="text-sm text-gray-900 leading-relaxed max-w-2xl whitespace-pre-line">
                          {msg.content}
                        </div>

                        {/* Deliverable Assets Gallery */}
                        {msg.taskRecord && msg.taskRecord.outputAssets.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                            {msg.taskRecord.outputAssets.map((asset) => (
                              <div
                                key={asset.id}
                                className="border border-gray-200 rounded overflow-hidden bg-white group flex flex-col"
                              >
                                <div
                                  className="relative aspect-square bg-gray-50 overflow-hidden cursor-pointer"
                                  onClick={() => onPreviewAsset(asset)}
                                >
                                  {asset.type === 'video' ? (
                                    <div className="relative w-full h-full flex items-center justify-center bg-black">
                                      <img
                                        src={asset.thumbnailUrl || asset.url}
                                        alt={asset.name}
                                        className="w-full h-full object-cover opacity-80"
                                      />
                                      <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center text-black">
                                          <Play className="w-4 h-4 ml-0.5 fill-black" />
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <img
                                      src={asset.url}
                                      alt={asset.name}
                                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-150"
                                    />
                                  )}
                                </div>

                                <div className="p-2 border-t border-gray-100 flex-1 flex flex-col justify-between space-y-2">
                                  <div className="truncate text-xs font-medium text-gray-900" title={asset.name}>
                                    {asset.name}
                                  </div>

                                  <div className="grid grid-cols-2 gap-1 pt-1 border-t border-gray-100 text-xs">
                                    <button
                                      type="button"
                                      onClick={() => onPreviewAsset(asset)}
                                      className="py-1 text-center text-gray-700 hover:text-black border border-gray-200 hover:border-gray-400 rounded transition-colors inline-flex items-center justify-center space-x-1"
                                    >
                                      <Maximize2 className="w-3 h-3" />
                                      <span>查看大图</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDownload(asset)}
                                      className="py-1 text-center text-gray-700 hover:text-black border border-gray-200 hover:border-gray-400 rounded transition-colors inline-flex items-center justify-center space-x-1"
                                    >
                                      <Download className="w-3 h-3" />
                                      <span>下载</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (onCompareAsset) {
                                          onCompareAsset(asset);
                                        } else {
                                          onPreviewAsset(asset);
                                        }
                                      }}
                                      className="py-1 text-center text-gray-700 hover:text-black border border-gray-200 hover:border-gray-400 rounded transition-colors inline-flex items-center justify-center space-x-1"
                                      title="对比原图或上一版本"
                                    >
                                      <SplitSquareVertical className="w-3 h-3" />
                                      <span>版本对比</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => onSelectForEdit(asset)}
                                      className="py-1 text-center text-gray-700 hover:text-black border border-gray-200 hover:border-gray-400 rounded transition-colors inline-flex items-center justify-center space-x-1"
                                      title="基于当前方案继续改版"
                                    >
                                      <RotateCw className="w-3 h-3" />
                                      <span>继续修改</span>
                                    </button>
                                  </div>

                                  <div className="pt-1 border-t border-gray-50 flex justify-end">
                                    <button
                                      type="button"
                                      onClick={() => handleSaveToLibrary(asset)}
                                      className={`text-[11px] px-2 py-0.5 rounded border transition-colors inline-flex items-center space-x-1 ${
                                        savedToLibraryStatus[asset.id]
                                          ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                                          : 'border-gray-200 text-gray-600 hover:border-gray-400 hover:text-black'
                                      }`}
                                    >
                                      <BookmarkPlus className="w-3 h-3" />
                                      <span>{savedToLibraryStatus[asset.id] ? '已保存' : '存入素材库'}</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Generating Loader */}
              {isGenerating && (
                <div className="flex items-start space-x-3 pt-2">
                  <div className="w-7 h-7 rounded bg-black text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    M
                  </div>
                  <div className="border border-gray-200 rounded p-3 bg-white space-y-2 max-w-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-[#07C2E3] animate-spin" />
                        <span className="text-xs font-semibold text-gray-900">
                          正在创作中，请稍候...
                        </span>
                      </div>
                      {onStopGeneration && (
                        <button
                          type="button"
                          onClick={onStopGeneration}
                          className="text-xs text-gray-500 hover:text-red-600 flex items-center space-x-1"
                        >
                          <Square className="w-3 h-3" />
                          <span>停止</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* 3. Bottom Command Bar (When in active conversation) */}
      {hasMessages && (
        <div className="border-t border-gray-200 p-4 bg-white shrink-0">
          <div className="max-w-[850px] mx-auto space-y-2">
            {/* 5 Locked Core Buttons */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs select-none">
              {coreFeatures.map((item) => {
                const isActive = activeIntent === item.intent;
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => handleSelectFeature(item)}
                    className={`inline-flex items-center px-3 py-1 rounded text-xs transition-colors shrink-0 ${
                      isActive
                        ? 'bg-black text-white font-medium shadow-xs'
                        : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-400 hover:text-black'
                    }`}
                  >
                    <Icon className={`w-3 h-3 mr-1.5 ${isActive ? 'text-[#07C2E3]' : 'text-gray-500'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Dynamic Input Panel */}
            {renderDynamicInputPanel()}

            {/* Validation Warning Alert */}
            {validationError && (
              <div className="flex items-center space-x-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded p-2 text-left">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Attachments preview */}
            {attachments.length > 0 && (
              <div className="flex items-center space-x-2 py-1 overflow-x-auto">
                {attachments.map((att, i) => (
                  <div key={i} className="relative w-14 h-14 border border-gray-200 rounded shrink-0 overflow-hidden">
                    <img src={att} alt="附件预览" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                      className="absolute top-0.5 right-0.5 bg-black/70 hover:bg-black text-white rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Textarea Box */}
            <div className="border border-gray-300 focus-within:border-black rounded-lg p-2.5 transition-colors bg-white">
              <textarea
                ref={textareaRef}
                rows={1}
                value={inputText}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder="描述你想创作的服装需求或上传参考素材 (Enter 发送，Shift+Enter 换行)..."
                className="w-full resize-none border-none outline-none text-sm text-gray-900 placeholder:text-gray-400 max-h-48 leading-relaxed bg-transparent"
              />

              <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="file"
                    ref={generalAttachmentRef}
                    onChange={(e) => {
                      const files = e.target.files;
                      if (!files) return;
                      Array.from(files).forEach((file) => {
                        readFileAsDataUrl(file, (url) => setAttachments((prev) => [...prev, url]));
                      });
                      e.target.value = '';
                    }}
                    multiple
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => generalAttachmentRef.current?.click()}
                    className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors inline-flex items-center space-x-1 text-xs"
                    title="上传图片"
                  >
                    <Paperclip className="w-4 h-4" />
                    <span className="hidden sm:inline">素材</span>
                  </button>

                  {activeIntent && (
                    <span className="text-[11px] bg-gray-100 text-gray-800 px-2 py-0.5 rounded font-medium">
                      {coreFeatures.find((f) => f.intent === activeIntent)?.label || activeIntent}
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  {isGenerating ? (
                    <button
                      type="button"
                      onClick={onStopGeneration}
                      className="px-3 py-1.5 bg-black text-white rounded text-xs font-medium hover:bg-gray-800 transition-colors flex items-center space-x-1"
                    >
                      <Square className="w-3 h-3 text-red-400 fill-red-400" />
                      <span>停止</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={
                        !inputText.trim() &&
                        attachments.length === 0 &&
                        !garmentImage &&
                        !modelImage &&
                        !sourceImage &&
                        !videoRefImage &&
                        !designRefImage
                      }
                      className={`p-1.5 rounded transition-colors ${
                        inputText.trim() ||
                        attachments.length > 0 ||
                        garmentImage ||
                        modelImage ||
                        sourceImage ||
                        videoRefImage ||
                        designRefImage
                          ? 'bg-black text-white hover:bg-gray-800'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                      title="发送"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Asset Picker Modal */}
      <AssetPickerModal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        assets={recentAssets}
        onSelectAsset={handleAssetPicked}
        title={pickerTitle}
      />
    </div>
  );
};
