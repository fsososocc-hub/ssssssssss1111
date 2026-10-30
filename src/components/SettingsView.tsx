import React, { useState } from 'react';
import { User, Globe, Bell, Shield, CreditCard, Download, Trash, Check, Activity } from 'lucide-react';
import { UserSettings } from '../types/index.ts';
import { ModelManagementSection } from './ModelManagementSection.tsx';

interface SettingsViewProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  onExportData: () => void;
  onOpenOperationsCenter?: () => void;
  onModelsChanged?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onExportData,
  onOpenOperationsCenter,
  onModelsChanged,
}) => {
  const [userName, setUserName] = useState(settings.userName);
  const [email, setEmail] = useState(settings.email);
  const [language, setLanguage] = useState(settings.language);
  const [region, setRegion] = useState(settings.region);
  const [emailNotifications, setEmailNotifications] = useState(settings.emailNotifications);
  const [twoFactorAuth, setTwoFactorAuth] = useState(settings.twoFactorAuth);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      userName,
      email,
      language,
      region,
      emailNotifications,
      twoFactorAuth,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-white p-6 sm:p-10">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="border-b border-gray-200 pb-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 tracking-tight">总设置</h1>
            <p className="text-xs text-gray-500 mt-1">
              管理您的个人资料、系统偏好、安全认证与额度账单
            </p>
          </div>
          {savedSuccess && (
            <div className="inline-flex items-center text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded">
              <Check className="w-3.5 h-3.5 mr-1" />
              已保存更改
            </div>
          )}
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-6">
          {/* 1. Account & Profile */}
          <div className="border border-gray-200 rounded p-5 space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-gray-100">
              <User className="w-4 h-4 text-gray-700" />
              <h2 className="text-sm font-semibold text-gray-900">账户与个人资料</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-medium text-gray-700 mb-1">用户姓名 / 创作者代号</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded text-xs outline-none focus:border-gray-900 transition-colors"
                />
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">注册邮箱</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded text-xs outline-none focus:border-gray-900 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* 2. Language & Region */}
          <div className="border border-gray-200 rounded p-5 space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-gray-100">
              <Globe className="w-4 h-4 text-gray-700" />
              <h2 className="text-sm font-semibold text-gray-900">语言与地区偏好</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-medium text-gray-700 mb-1">界面语言</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded text-xs outline-none focus:border-gray-900 bg-white"
                >
                  <option value="zh-CN">简体中文 (Simplified Chinese)</option>
                  <option value="en-US">English (US)</option>
                </select>
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">时区与数据节点</label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded text-xs outline-none focus:border-gray-900 bg-white"
                >
                  <option value="中国 / 亚太">亚太节点 (Asia-Pacific / Tokyo / HK)</option>
                  <option value="欧洲 / 伦敦">欧洲节点 (Europe / London)</option>
                  <option value="美洲 / 硅谷">北美节点 (US-Central / Iowa)</option>
                </select>
              </div>
            </div>
          </div>

          {/* 3. Notification & Security */}
          <div className="border border-gray-200 rounded p-5 space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-gray-100">
              <Shield className="w-4 h-4 text-gray-700" />
              <h2 className="text-sm font-semibold text-gray-900">安全与通知</h2>
            </div>

            <div className="space-y-3 text-xs">
              <label className="flex items-center justify-between p-2 border border-gray-100 rounded hover:bg-gray-50 cursor-pointer">
                <div>
                  <span className="font-medium text-gray-900 block">长任务完成通知</span>
                  <span className="text-[11px] text-gray-500">当走秀视频或多步渲染任务完成时发送邮件推送</span>
                </div>
                <input
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.target.checked)}
                  className="w-4 h-4 text-gray-900 rounded border-gray-300 focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between p-2 border border-gray-100 rounded hover:bg-gray-50 cursor-pointer">
                <div>
                  <span className="font-medium text-gray-900 block">两步身份认证 (2FA)</span>
                  <span className="text-[11px] text-gray-500">登录或进行高额任务调度时校验一次性验证码</span>
                </div>
                <input
                  type="checkbox"
                  checked={twoFactorAuth}
                  onChange={(e) => setTwoFactorAuth(e.target.checked)}
                  className="w-4 h-4 text-gray-900 rounded border-gray-300 focus:ring-0"
                />
              </label>
            </div>
          </div>

          {/* 4. Plan & Quota */}
          <div className="border border-gray-200 rounded p-5 space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-gray-100">
              <CreditCard className="w-4 h-4 text-gray-700" />
              <h2 className="text-sm font-semibold text-gray-900">订阅套餐与额度</h2>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-gray-900 block">{settings.planName}</span>
                  <span className="text-[11px] text-gray-500">按月自动续订，尊享专业服装设计与商业视觉创作权益</span>
                </div>
                <span className="text-xs font-mono font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  有效中
                </span>
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1">
                  <span>创作点数消耗</span>
                  <span className="font-mono">
                    {settings.quotaTotal - settings.quotaRemaining} / {settings.quotaTotal} 点 (剩余 {settings.quotaRemaining} 点)
                  </span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#07C2E3] h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${((settings.quotaTotal - settings.quotaRemaining) / settings.quotaTotal) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 5. Model Asset Management */}
          <ModelManagementSection onModelsChanged={onModelsChanged} />

          {/* 6. Data Privacy & Export */}
          <div className="border border-gray-200 rounded p-5 space-y-3">
            <h2 className="text-sm font-semibold text-gray-900">数据管理与合规</h2>
            <p className="text-xs text-gray-500 leading-relaxed">
              根据隐私合规要求，您可以随时打包下载所有生成素材、参数记录及历史任务元数据，或执行账户注销。
            </p>
            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={onExportData}
                className="inline-flex items-center px-3 py-1.5 border border-gray-200 hover:border-gray-400 rounded text-xs text-gray-700 transition-colors"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                导出创作数据 (JSON)
              </button>
            </div>
          </div>

          {/* 6. Operations Management System */}
          <div className="border border-gray-200 rounded p-5 space-y-3 bg-gray-50/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-sm font-semibold text-gray-900">平台运营与服务监控控制台</h2>
                  <span className="text-[10px] bg-black text-white px-1.5 py-0.2 rounded font-mono">INTERNAL</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  服务性能遥测、模型供应商配额、工具调用审计与生产数据库运维
                </p>
              </div>
              {onOpenOperationsCenter && (
                <button
                  type="button"
                  onClick={onOpenOperationsCenter}
                  className="inline-flex items-center justify-center px-4 py-2 bg-black hover:bg-gray-800 text-white rounded text-xs font-medium transition-colors shrink-0"
                >
                  <Activity className="w-3.5 h-3.5 mr-1.5 text-[#07C2E3]" />
                  <span>打开运营管理中心</span>
                </button>
              )}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2 bg-gray-900 hover:bg-black text-white text-xs font-medium rounded transition-colors"
            >
              保存所有设置
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
