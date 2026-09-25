import React, { useState } from 'react';
import Header from './components/Header';
import SensorCard from './components/SensorCard';
import QuickActions from './components/QuickActions';
import PinConfigTable from './components/PinConfigTable';
import CircuitScene from './scene3d/CircuitScene';
import { SENSORS } from './utils/constants';
import { LayoutGrid, Box, Table, SplitSquareVertical } from 'lucide-react';

export default function App() {
  const [layoutMode, setLayoutMode] = useState('split'); // 'split' | '3d' | '2d' | 'wiring'

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-primary)' }}>
      {/* Sticky Top Instrument Header */}
      <Header />

      {/* Main Container */}
      <main style={{ flex: 1, padding: '1.25rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Global Action Bar & Layout Switcher */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <QuickActions />

          {/* View Mode Toggle */}
          <div
            style={{
              display: 'flex',
              padding: '4px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              gap: '4px'
            }}
          >
            <button
              onClick={() => setLayoutMode('split')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                backgroundColor: layoutMode === 'split' ? 'var(--accent-indigo)' : 'transparent',
                color: layoutMode === 'split' ? '#fff' : 'var(--text-secondary)',
                fontSize: '0.8rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              <SplitSquareVertical size={14} />
              Split Studio
            </button>

            <button
              onClick={() => setLayoutMode('3d')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                backgroundColor: layoutMode === '3d' ? 'var(--accent-indigo)' : 'transparent',
                color: layoutMode === '3d' ? '#fff' : 'var(--text-secondary)',
                fontSize: '0.8rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              <Box size={14} />
              3D Circuit
            </button>

            <button
              onClick={() => setLayoutMode('2d')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                backgroundColor: layoutMode === '2d' ? 'var(--accent-indigo)' : 'transparent',
                color: layoutMode === '2d' ? '#fff' : 'var(--text-secondary)',
                fontSize: '0.8rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              <LayoutGrid size={14} />
              2D Controls
            </button>

            <button
              onClick={() => setLayoutMode('wiring')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                backgroundColor: layoutMode === 'wiring' ? 'var(--accent-indigo)' : 'transparent',
                color: layoutMode === 'wiring' ? '#fff' : 'var(--text-secondary)',
                fontSize: '0.8rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              <Table size={14} />
              Pin Routing
            </button>
          </div>
        </div>

        {/* 3D Visualizer Section */}
        {(layoutMode === 'split' || layoutMode === '3d') && (
          <div
            className="glass-panel"
            style={{
              height: layoutMode === '3d' ? 'calc(100vh - 200px)' : '460px',
              overflow: 'hidden',
              position: 'relative'
            }}
          >
            <CircuitScene />
          </div>
        )}

        {/* 2D Sensor Cards Grid */}
        {(layoutMode === 'split' || layoutMode === '2d') && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.25rem'
            }}
          >
            {SENSORS.map((sensor) => (
              <SensorCard key={sensor.id} sensor={sensor} />
            ))}
          </div>
        )}

        {/* Hardware Wiring Table View */}
        {(layoutMode === 'wiring' || layoutMode === 'split') && (
          <PinConfigTable />
        )}
      </main>
    </div>
  );
}
