import React, { useState } from 'react';
import { Home, Sparkles, Folder, Settings, Plus, MessageSquare, ChevronLeft, ChevronRight, Trash2, Share2, Check } from 'lucide-react';
import { Conversation } from '../types/index.ts';

interface SidebarProps {
  currentTab: 'home' | 'studio' | 'library' | 'settings';
  onSelectTab: (tab: 'home' | 'studio' | 'library' | 'settings') => void;
  conversations: Conversation[];
  activeConversationId: string;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation?: (id: string) => void;
  onShareConversation?: (conv: Conversation) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onShareConversation,
  collapsed,
  onToggleCollapse,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const navItems = [
    { id: 'home', label: '首页', icon: Home },
    { id: 'studio', label: 'AI 创作中心', icon: Sparkles },
    { id: 'library', label: '素材库', icon: Folder },
    { id: 'settings', label: '总设置', icon: Settings },
  ] as const;

  const handleShareClick = (e: React.MouseEvent, conv: Conversation) => {
    e.stopPropagation();
    if (onShareConversation) {
      onShareConversation(conv);
    } else {
      const shareUrl = `${window.location.origin}/?conv=${conv.id}`;
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopiedId(conv.id);
        setTimeout(() => setCopiedId(null), 2000);
      });
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (onDeleteConversation) {
      onDeleteConversation(id);
    }
  };

  return (
    <aside
      className={`h-screen bg-white border-r border-gray-200 flex flex-col transition-all duration-200 select-none ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-14 border-b border-gray-200 flex items-center justify-between px-4">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-black flex items-center justify-center rounded text-white font-bold text-xs tracking-wider">
              M
            </div>
            <span className="font-semibold text-base text-gray-900 tracking-tight">ModaUI</span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 bg-black flex items-center justify-center rounded text-white font-bold text-xs mx-auto">
            M
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className="text-gray-400 hover:text-gray-700 p-1 rounded hover:bg-gray-100 transition-colors"
          title={collapsed ? '展开导航' : '收起导航'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Main 4 Navigation Items */}
      <nav className="p-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center px-3 py-2 text-sm rounded transition-colors ${
                isActive
                  ? 'bg-gray-100 text-gray-900 font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  isActive ? 'text-[#07C2E3]' : 'text-gray-500'
                }`}
              />
              {!collapsed && <span className="ml-3 truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Dynamic Chat Records Section: Located below "总设置" */}
      {!collapsed && (
        <div className="flex-1 overflow-y-auto px-3 py-3 border-t border-gray-200 flex flex-col">
          <div className="flex items-center justify-between px-1 mb-2">
            <span className="text-[11px] font-semibold text-gray-500 tracking-wider">创作对话记录</span>
            <button
              onClick={() => {
                onSelectTab('studio');
                onNewConversation();
              }}
              className="p-1 text-gray-500 hover:text-black hover:bg-gray-100 rounded transition-colors flex items-center space-x-1"
              title="新建创作会话"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1">
            {conversations.map((conv) => {
              const isSelected = activeConversationId === conv.id;
              const isCopied = copiedId === conv.id;
              return (
                <div
                  key={conv.id}
                  onClick={() => {
                    onSelectTab('studio');
                    onSelectConversation(conv.id);
                  }}
                  className={`w-full group px-2.5 py-1.5 rounded text-xs flex items-center justify-between cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-gray-100 text-gray-900 font-medium'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate min-w-0 flex-1">
                    <MessageSquare className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="truncate">{conv.title}</span>
                  </div>

                  {/* Action Icons: Share & Delete */}
                  <div className="flex items-center space-x-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                    <button
                      type="button"
                      onClick={(e) => handleShareClick(e, conv)}
                      className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 rounded"
                      title={isCopied ? '已复制分享直链' : '分享此对话'}
                    >
                      {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Share2 className="w-3 h-3" />}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteClick(e, conv.id)}
                      className="p-1 text-gray-400 hover:text-red-600 hover:bg-gray-200/60 rounded"
                      title="删除此对话"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="p-3 border-t border-gray-200 text-xs text-gray-400">
        {!collapsed && (
          <div className="flex items-center justify-between text-[11px] text-gray-400">
            <span>ModaUI Studio</span>
            <span>专业时装视觉</span>
          </div>
        )}
      </div>
    </aside>
  );
};
