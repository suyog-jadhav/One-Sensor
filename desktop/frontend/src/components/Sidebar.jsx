import React from 'react';
import {
  LayoutDashboard,
  Activity,
  TrendingUp,
  ShieldOff,
  Cpu,
  Sliders,
  Zap,
  Terminal,
  HelpCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export const WORKFLOW_NAV = [
  {
    category: 'Workbench',
    items: [
      { id: 'overview', label: 'Overview', icon: LayoutDashboard },
      { id: 'live', label: 'Live Sensors', icon: Activity },
      { id: 'scenario', label: 'Scenarios', icon: TrendingUp },
      { id: 'fault_inject', label: 'Fault Lab', icon: ShieldOff },
    ]
  },
  {
    category: 'Hardware',
    items: [
      { id: 'hardware_3d', label: 'Devices & 3D', icon: Cpu },
      { id: 'config', label: 'Configuration', icon: Sliders },
      { id: 'flash', label: 'Firmware', icon: Zap },
      { id: 'logs', label: 'Serial Console', icon: Terminal },
    ]
  },
  {
    category: 'System',
    items: [
      { id: 'wizard', label: 'Device Setup', icon: HelpCircle },
    ]
  }
];

export default function Sidebar({ activeTab, onSelectTab, isCollapsed = false, onToggleCollapse }) {
  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`} aria-label="Navigation Sidebar">
      <div className="sidebar-inner">
        {WORKFLOW_NAV.map((section) => (
          <div key={section.category} className="sidebar-section">
            {!isCollapsed && (
              <div className="sidebar-section-title">{section.category}</div>
            )}
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => onSelectTab(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon size={16} className="nav-icon" />
                  {!isCollapsed && <span className="nav-label">{item.label}</span>}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="sidebar-footer">
        <button
          className="sidebar-collapse-btn"
          onClick={onToggleCollapse}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          {!isCollapsed && <span>Collapse Sidebar</span>}
        </button>
      </div>
    </aside>
  );
}
