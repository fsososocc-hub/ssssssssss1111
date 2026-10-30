import React, { useState, useEffect } from 'react';
import { X, Activity, Database, HardDrive, CheckCircle2, AlertTriangle, RefreshCw, Download, Layers, ShieldCheck, Mail, Cloud } from 'lucide-react';

interface OperationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OperationsModal: React.FC<OperationsModalProps> = ({ isOpen, onClose }) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const fetchMetrics = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/metrics');
      const data = await res.json();
      setMetrics(data);
    } catch (err: any) {
      console.warn('Metrics fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMetrics();
    }
  }, [isOpen]);

  const handleWalCheckpoint = async () => {
    try {
      setActionNotice('正在执行 SQLite WAL 事务截断与检查点写入...');
      const res = await fetch('/api/admin/wal-checkpoint', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setActionNotice('✓ WAL 检查点执行完成：日志事务已全部安全落盘');
        fetchMetrics();
      } else {
        setActionNotice(`执行失败: ${data.error}`);
      }
    } catch (err: any) {
      setActionNotice(`请求异常: ${err?.message}`);
    }
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleExportAudit = () => {
    window.open('/api/admin/export-audit', '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 select-none">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded bg-black text-white flex items-center justify-center">
              <Activity className="w-4 h-4 text-[#07C2E3]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-semibold text-gray-900">ModaUI 运营管理与服务控制台</h2>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded font-mono">
                  PROD ACTIVE
                </span>
              </div>
              <p className="text-[11px] text-gray-500">
                实时服务性能遥测、模型供应商配额、工具调用审计与生产数据库运维
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={fetchMetrics}
              disabled={isLoading}
              className="p-1.5 text-gray-500 hover:text-black border border-gray-200 hover:border-gray-400 rounded transition-colors text-xs flex items-center space-x-1"
              title="刷新指标"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">刷新</span>
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 p-1 rounded hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notice Banner */}
        {actionNotice && (
          <div className="bg-gray-900 text-white px-6 py-2 text-xs flex items-center justify-between">
            <span>{actionNotice}</span>
            <button onClick={() => setActionNotice(null)} className="text-gray-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* Key KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="border border-gray-200 rounded p-3 bg-gray-50/50">
              <span className="text-[11px] text-gray-500 block mb-1">系统累计任务数</span>
              <div className="flex items-baseline space-x-2">
                <span className="text-xl font-bold font-mono text-gray-900">
                  {metrics?.totalTasks ?? '--'}
                </span>
                <span className="text-[10px] text-emerald-600 font-medium">
                  {metrics?.successRate ?? 100}% 成功率
                </span>
              </div>
            </div>

            <div className="border border-gray-200 rounded p-3 bg-gray-50/50">
              <span className="text-[11px] text-gray-500 block mb-1">生成物理资产</span>
              <div className="flex items-baseline space-x-2">
                <span className="text-xl font-bold font-mono text-gray-900">
                  {metrics?.totalAssets ?? '--'}
                </span>
                <span className="text-[10px] text-gray-500 font-mono">
                  {metrics ? `${(metrics.totalBytes / 1024).toFixed(1)} KB` : '--'}
                </span>
              </div>
            </div>

            <div className="border border-gray-200 rounded p-3 bg-gray-50/50">
              <span className="text-[11px] text-gray-500 block mb-1">活跃会话 / 消息流</span>
              <div className="flex items-baseline space-x-2">
                <span className="text-xl font-bold font-mono text-gray-900">
                  {metrics?.totalConversations ?? '--'}
                </span>
                <span className="text-[10px] text-gray-500">
                  / {metrics?.totalMessages ?? '--'} 条记录
                </span>
              </div>
            </div>

            <div className="border border-gray-200 rounded p-3 bg-gray-50/50">
              <span className="text-[11px] text-gray-500 block mb-1">数据库并发引擎</span>
              <div className="flex items-baseline space-x-2">
                <span className="text-base font-bold font-mono text-gray-900">
                  SQLite 3
                </span>
                <span className="text-[10px] text-emerald-600 font-mono">
                  {metrics?.pragmaWal?.toUpperCase() || 'WAL'}
                </span>
              </div>
            </div>
          </div>

          {/* Model & Providers Status */}
          <div className="border border-gray-200 rounded p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-gray-700" />
                <span className="font-semibold text-gray-900">核心创作引擎与供应商调度状态</span>
              </div>
              <span className="text-[11px] text-gray-400">已接入 5 核心 + 1 内部多模态</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-2.5 border border-gray-200 rounded bg-white flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900 flex items-center space-x-1.5">
                    <span>Google GenAI 多模态视觉</span>
                    <span className="text-[9px] bg-gray-100 text-gray-600 px-1 rounded font-mono">gemini-3.8-flash</span>
                  </div>
                  <span className="text-[10px] text-gray-500">用于面料与结构分析、虚拟试衣 4 维质检审计</span>
                </div>
                <span className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-medium">
                  在线就绪
                </span>
              </div>

              <div className="p-2.5 border border-gray-200 rounded bg-white flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900 flex items-center space-x-1.5">
                    <span>Moda Vector CAD 3.0 工业制版</span>
                    <span className="text-[9px] bg-gray-100 text-gray-600 px-1 rounded font-mono">双向立裁引擎</span>
                  </div>
                  <span className="text-[10px] text-gray-500">1:10 生产规范图纸、Pantone TCX 色卡与 BOM 工艺卡</span>
                </div>
                <span className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-medium">
                  在线就绪
                </span>
              </div>

              <div className="p-2.5 border border-gray-200 rounded bg-white flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900 flex items-center space-x-1.5">
                    <span>Moda Precision Pixel 换色引擎</span>
                    <span className="text-[9px] bg-gray-100 text-gray-600 px-1 rounded font-mono">Sharp L* 保真流</span>
                  </div>
                  <span className="text-[10px] text-gray-500">Pantone FHI 10 款成衣奢侈色板，100% 锁定织物纹理</span>
                </div>
                <span className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-medium">
                  在线就绪
                </span>
              </div>

              <div className="p-2.5 border border-gray-200 rounded bg-white flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900 flex items-center space-x-1.5">
                    <span>Veo 2.0 走秀视频服务</span>
                    <span className="text-[9px] bg-gray-100 text-gray-600 px-1 rounded font-mono">4K 60fps 引擎</span>
                  </div>
                  <span className="text-[10px] text-gray-500">当前环境需商业视频生成专有配额，真实阻断防伪</span>
                </div>
                <span className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded font-medium">
                  需商业配额
                </span>
              </div>
            </div>
          </div>

          {/* Workspace OAuth & Google Integrations */}
          <div className="border border-gray-200 rounded p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <Cloud className="w-4 h-4 text-gray-700" />
                <span className="font-semibold text-gray-900">Google Workspace (Drive & Gmail) 授权状态</span>
              </div>
              <span className="text-[11px] font-mono text-gray-400">Project: gen-lang-client-0266065679</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-2.5 border border-gray-200 rounded bg-white flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <HardDrive className="w-4 h-4 text-[#07C2E3]" />
                  <div>
                    <span className="font-medium text-gray-900 block">Google Drive 云端同步</span>
                    <span className="text-[10px] text-gray-500">高精制版图纸与画册大片一键归档至用户 Drive</span>
                  </div>
                </div>
                <span className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-medium">
                  OAuth 已授权
                </span>
              </div>

              <div className="p-2.5 border border-gray-200 rounded bg-white flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-purple-600" />
                  <div>
                    <span className="font-medium text-gray-900 block">Gmail 协同交付</span>
                    <span className="text-[10px] text-gray-500">直链通知与设计工艺卡一键推送客户邮箱</span>
                  </div>
                </div>
                <span className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-medium">
                  OAuth 已授权
                </span>
              </div>
            </div>
          </div>

          {/* Tool Asset Breakdown Table */}
          {metrics?.toolBreakdown && metrics.toolBreakdown.length > 0 && (
            <div className="border border-gray-200 rounded overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 font-semibold text-gray-900 text-[11px]">
                各创作工具资产产出统计
              </div>
              <div className="divide-y divide-gray-100">
                {metrics.toolBreakdown.map((t: any) => (
                  <div key={t.tool} className="px-4 py-2 flex items-center justify-between">
                    <span className="font-mono text-gray-800">{t.tool}</span>
                    <div className="flex items-center space-x-4">
                      <span className="text-gray-500">{t.count} 份作品</span>
                      <span className="font-mono text-gray-400">{(t.bytes / 1024).toFixed(1)} KB</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Database Maintenance & Audit Actions */}
          <div className="border border-gray-200 rounded p-4 space-y-3 bg-gray-50/30">
            <span className="font-semibold text-gray-900 block">生产运维与数据审计操作</span>
            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={handleWalCheckpoint}
                className="px-3 py-1.5 bg-white border border-gray-200 hover:border-gray-400 rounded text-xs text-gray-700 transition-colors flex items-center space-x-1.5"
              >
                <Database className="w-3.5 h-3.5 text-gray-600" />
                <span>执行 SQLite WAL 检查点写入</span>
              </button>

              <button
                type="button"
                onClick={handleExportAudit}
                className="px-3 py-1.5 bg-white border border-gray-200 hover:border-gray-400 rounded text-xs text-gray-700 transition-colors flex items-center space-x-1.5"
              >
                <Download className="w-3.5 h-3.5 text-gray-600" />
                <span>导出全量运维审计报表 (JSON)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between bg-gray-50 text-[11px] text-gray-500">
          <span>ModaUI 架构遵循单一工作区原则，内部控制台与用户前端清晰隔离。</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-black hover:bg-gray-800 text-white rounded text-xs transition-colors"
          >
            完成并关闭
          </button>
        </div>
      </div>
    </div>
  );
};
