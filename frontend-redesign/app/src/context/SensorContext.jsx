import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { SENSORS } from '../utils/constants';
import { MockSensorEngine } from '../utils/mockServer';

const SensorContext = createContext(null);

export function SensorProvider({ children }) {
  const [connectionMode, setConnectionMode] = useState('auto'); // 'backend', 'direct', 'mock'
  const [targetIp, setTargetIp] = useState('127.0.0.1:8000');
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // 'connected' | 'connecting' | 'disconnected' | 'mock'
  const [theme, setTheme] = useState('dark');

  // Active sensor values
  const [sensorValues, setSensorValues] = useState({
    temperature: 25.0,
    humidity: 50.0,
    gas: 300.0,
    light: 500.0,
    soil: 50.0,
    scenario: 'IDLE'
  });

  // Rolling 30s history for sparklines
  const [history, setHistory] = useState(() => {
    const init = {};
    SENSORS.forEach(s => {
      init[s.key] = Array(30).fill(s.defaultVal);
    });
    return init;
  });

  // Cross-view linking (2D <-> 3D)
  const [hoveredSensor, setHoveredSensor] = useState(null);
  const [selectedSensor, setSelectedSensor] = useState(null);

  const wsRef = useRef(null);
  const mockEngineRef = useRef(null);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Handle updates and record into rolling history
  const handleStateUpdate = (data) => {
    setSensorValues(prev => {
      const updated = { ...prev, ...data };
      setHistory(hPrev => {
        const nextH = { ...hPrev };
        SENSORS.forEach(s => {
          if (updated[s.key] !== undefined) {
            const currentArr = nextH[s.key] || [];
            nextH[s.key] = [...currentArr.slice(1), updated[s.key]];
          }
        });
        return nextH;
      });
      return updated;
    });
  };

  // Connection management
  useEffect(() => {
    if (connectionMode === 'mock') {
      if (wsRef.current) wsRef.current.close();
      const mock = new MockSensorEngine(handleStateUpdate);
      mock.start();
      mockEngineRef.current = mock;
      setConnectionStatus('mock');
      return () => mock.stop();
    }

    let ws = null;
    let timer = null;
    let isMounted = true;

    const connect = () => {
      if (!isMounted) return;
      setConnectionStatus('connecting');

      const url = targetIp.startsWith('ws://') ? targetIp : `ws://${targetIp}/ws`;
      try {
        ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
          if (isMounted) setConnectionStatus('connected');
        };

        ws.onmessage = (evt) => {
          try {
            const data = JSON.parse(evt.data);
            if (data.type === 'state') {
              handleStateUpdate(data);
            }
          } catch (e) {
            console.warn('WS message parse error:', e);
          }
        };

        ws.onclose = () => {
          if (isMounted) {
            setConnectionStatus('disconnected');
            timer = setTimeout(connect, 3000);
          }
        };

        ws.onerror = () => {
          if (ws) ws.close();
        };
      } catch (err) {
        setConnectionStatus('disconnected');
        timer = setTimeout(connect, 3000);
      }
    };

    connect();

    return () => {
      isMounted = false;
      if (ws) ws.close();
      if (timer) clearTimeout(timer);
    };
  }, [connectionMode, targetIp]);

  // Command senders
  const sendCommand = (payload) => {
    if (connectionMode === 'mock' && mockEngineRef.current) {
      mockEngineRef.current.send(payload);
    } else if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    }
  };

  const setSingleValue = (sensorKey, value) => {
    sendCommand({ type: 'set', sensor: sensorKey, value });
    handleStateUpdate({ [sensorKey]: value });
  };

  const setBulkValues = (valuesObj) => {
    sendCommand({ type: 'set_values', ...valuesObj });
    handleStateUpdate(valuesObj);
  };

  const startScenario = (sensorKey, start, end, duration_s = 20) => {
    sendCommand({
      type: 'START_SCENARIO',
      scenario: 'ramp',
      sensor: sensorKey,
      start,
      end,
      duration_s
    });
  };

  const stopScenario = () => {
    sendCommand({ type: 'STOP_SCENARIO' });
  };

  const resetAll = () => {
    stopScenario();
    const defaults = {};
    SENSORS.forEach(s => { defaults[s.key] = s.defaultVal; });
    setBulkValues(defaults);
  };

  const freezeAll = () => {
    stopScenario();
  };

  const rampAll = () => {
    startScenario('temperature', 15.0, 45.0, 25);
  };

  return (
    <SensorContext.Provider
      value={{
        sensorValues,
        history,
        connectionStatus,
        connectionMode,
        setConnectionMode,
        targetIp,
        setTargetIp,
        theme,
        setTheme,
        hoveredSensor,
        setHoveredSensor,
        selectedSensor,
        setSelectedSensor,
        setSingleValue,
        setBulkValues,
        startScenario,
        stopScenario,
        resetAll,
        freezeAll,
        rampAll
      }}
    >
      {children}
    </SensorContext.Provider>
  );
}

export function useSensors() {
  return useContext(SensorContext);
}
