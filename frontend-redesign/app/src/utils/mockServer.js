/**
 * Mock WebSocket simulation service for standalone UI development & testing.
 */
export class MockSensorEngine {
  constructor(onStateUpdate) {
    this.onStateUpdate = onStateUpdate;
    this.values = {
      temperature: 25.0,
      humidity: 50.0,
      gas: 300.0,
      light: 500.0,
      soil: 50.0,
      scenario: 'IDLE'
    };
    this.activeScenario = null;
    this.intervalId = null;
  }

  start() {
    this.intervalId = setInterval(() => {
      this.tick();
    }, 250); // 4Hz broadcast rate matching ESP32
  }

  stop() {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  tick() {
    // If scenario active, advance it
    if (this.activeScenario && this.activeScenario.type === 'ramp') {
      const now = Date.now();
      const elapsed = (now - this.activeScenario.startTime) / 1000;
      const progress = Math.min(1.0, elapsed / this.activeScenario.duration);
      
      const s = this.activeScenario;
      const current = s.start + (s.end - s.start) * progress;
      this.values[s.sensor] = parseFloat(current.toFixed(1));

      if (progress >= 1.0) {
        this.activeScenario = null;
        this.values.scenario = 'IDLE';
      }
    } else {
      // Add subtle natural sensor jitter (+- 0.1%)
      this.values.temperature += (Math.random() - 0.5) * 0.05;
      this.values.humidity += (Math.random() - 0.5) * 0.1;
      this.values.gas += (Math.random() - 0.5) * 1.5;
      this.values.light += (Math.random() - 0.5) * 2.0;
      this.values.soil += (Math.random() - 0.5) * 0.1;

      // Clamp
      this.values.temperature = Math.max(0, Math.min(50, parseFloat(this.values.temperature.toFixed(2))));
      this.values.humidity = Math.max(0, Math.min(100, parseFloat(this.values.humidity.toFixed(2))));
      this.values.gas = Math.max(0, Math.min(1000, parseFloat(this.values.gas.toFixed(1))));
      this.values.light = Math.max(0, Math.min(1000, parseFloat(this.values.light.toFixed(1))));
      this.values.soil = Math.max(0, Math.min(100, parseFloat(this.values.soil.toFixed(2))));
    }

    if (this.onStateUpdate) {
      this.onStateUpdate({ type: 'state', ...this.values });
    }
  }

  send(msg) {
    if (typeof msg === 'string') msg = JSON.parse(msg);

    if (msg.type === 'set') {
      this.values[msg.sensor] = parseFloat(msg.value);
    } else if (msg.type === 'set_values') {
      ['temperature', 'humidity', 'gas', 'light', 'soil'].forEach(k => {
        if (msg[k] !== undefined) this.values[k] = parseFloat(msg[k]);
      });
    } else if (msg.type === 'START_SCENARIO' && msg.scenario === 'ramp') {
      this.activeScenario = {
        type: 'ramp',
        sensor: msg.sensor,
        start: parseFloat(msg.start),
        end: parseFloat(msg.end),
        duration: parseFloat(msg.duration_s || 20),
        startTime: Date.now()
      };
      this.values.scenario = `RAMP (${msg.sensor})`;
    } else if (msg.type === 'STOP_SCENARIO') {
      this.activeScenario = null;
      this.values.scenario = 'IDLE';
    }
  }
}
