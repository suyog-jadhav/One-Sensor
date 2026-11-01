import os
import numpy as np
import matplotlib
import matplotlib.pyplot as plt
import matplotlib.patches as patches

fig_dir = r'C:\blockchain\suyog\One-Sensor\research\figures'
os.makedirs(fig_dir, exist_ok=True)

plt.rcParams.update({
    'font.size': 10,
    'font.family': 'sans-serif',
    'axes.labelsize': 10,
    'axes.titlesize': 11,
    'xtick.labelsize': 9,
    'ytick.labelsize': 9,
    'legend.fontsize': 8.5,
    'figure.titlesize': 12,
    'lines.linewidth': 1.6,
    'figure.dpi': 300
})

# FIG 1: System Architecture
fig, ax = plt.subplots(figsize=(8.0, 4.4))
ax.set_xlim(0, 100)
ax.set_ylim(0, 100)
ax.axis('off')

box_ws = patches.FancyBboxPatch((3, 20), 26, 68, boxstyle='round,pad=1.5', ec='#2b5c8f', fc='#ebf3fb', lw=1.8)
ax.add_patch(box_ws)
ax.text(16, 83, 'Tier 1: Developer Workstation', ha='center', weight='bold', color='#1a365d', fontsize=10)
ws_items = [
    'React 18 + Vite Dashboard',
    'Sensor Channel Configurator',
    'Scenario & Fault Controls',
    '───────────────────────',
    'FastAPI Python Bridge',
    'Auto-Discovery (mDNS/UDP)',
    'Bidirectional WebSocket Client'
]
for idx, text in enumerate(ws_items):
    ax.text(5, 75 - idx*6.8, text, fontsize=8.5, color='#2d3748')

box_esp = patches.FancyBboxPatch((36, 10), 30, 80, boxstyle='round,pad=1.5', ec='#b7791f', fc='#fefcbf', lw=1.8)
ax.add_patch(box_esp)
ax.text(51, 85, 'Tier 2: OneSensor Node (ESP32)', ha='center', weight='bold', color='#744210', fontsize=10)
esp_items = [
    'ESP-IDF / Arduino Framework',
    'AsyncWebServer & WebSocket',
    '12-Channel ChannelManager',
    'Dynamic Scenario Engine',
    '  - STATIC  - RAMP Sweeps',
    'Fault Injection Engine',
    '  - Dropout - Stuck - Noise',
    '  - Spike   - Drift - Latency',
    '───────────────────────',
    'Hardware Output Transports:',
    '  - 2x 8-bit DAC (GPIO 25, 26)',
    '  - 10x 10-bit PWM @ 500 Hz'
]
for idx, text in enumerate(esp_items):
    ax.text(38, 77 - idx*5.5, text, fontsize=8.5, color='#2d3748')

box_sut = patches.FancyBboxPatch((73, 20), 24, 68, boxstyle='round,pad=1.5', ec='#276749', fc='#f0fff4', lw=1.8)
ax.add_patch(box_sut)
ax.text(85, 83, 'Tier 3: SUT (Arduino Uno)', ha='center', weight='bold', color='#1c4532', fontsize=10)
sut_items = [
    'ATmega328P Target SUT',
    'OneSensor Decoder Library',
    '  - DacDecoder (A0, A1)',
    '  - PwmDecoder (D2-D11)',
    'Calibration & Normalization',
    '───────────────────────',
    'User Application Logic',
    'Closed-Loop Control / PID',
    'Serial Telemetry Output'
]
for idx, text in enumerate(sut_items):
    ax.text(75, 75 - idx*6.8, text, fontsize=8.5, color='#2d3748')

ax.annotate('', xy=(36, 62), xytext=(29, 62), arrowprops=dict(arrowstyle='<->', color='#c53030', lw=2))
ax.text(32.5, 65, 'Wi-Fi (WS)\nJSON', ha='center', fontsize=7.5, color='#c53030', weight='bold')

ax.annotate('', xy=(73, 52), xytext=(66, 52), arrowprops=dict(arrowstyle='->', color='#2b6cb0', lw=2))
ax.text(69.5, 55, 'Physical\nDAC & PWM', ha='center', fontsize=7.5, color='#2b6cb0', weight='bold')

ax.annotate('', xy=(73, 30), xytext=(66, 30), arrowprops=dict(arrowstyle='-', color='#1a202c', lw=2.2, ls='--'))
ax.text(69.5, 24, 'Shared GND\nReference', ha='center', fontsize=7.5, color='#1a202c', weight='bold')

plt.tight_layout()
plt.savefig(os.path.join(fig_dir, 'fig1_system_architecture.png'), dpi=300)
plt.savefig(os.path.join(fig_dir, 'fig1_system_architecture.pdf'))
plt.close()
print('Figure 1 created.')

# FIG 2: Signal Transports
fig, (ax_dac, ax_pwm) = plt.subplots(1, 2, figsize=(7.6, 2.8))
t_dac = np.linspace(0, 10, 500)
v_dac = 1.65 + 0.8 * np.sin(2 * np.pi * 0.2 * t_dac)
ax_dac.plot(t_dac, v_dac, color='#2b6cb0', label='ESP32 DAC (GPIO 25/26)')
ax_dac.axhline(3.3, color='gray', linestyle=':', label='ESP32 VDD (3.3 V)')
ax_dac.axhline(1.65, color='#dd6b20', linestyle='--', alpha=0.7, label='Nominal 25 C (1.65 V)')
ax_dac.set_title('(a) Hardware DAC Analog Signal')
ax_dac.set_xlabel('Time (s)')
ax_dac.set_ylabel('Voltage (V)')
ax_dac.set_ylim(-0.2, 3.8)
ax_dac.grid(True, linestyle=':', alpha=0.6)
ax_dac.legend(loc='lower right')

t_pwm = np.linspace(0, 4, 1000)
pwm_wave = np.where((t_pwm % 2.0) < 1.3, 3.3, 0.0)
ax_pwm.plot(t_pwm, pwm_wave, color='#276749', drawstyle='steps-post', label='PWM (500 Hz, D=65%)')
ax_pwm.set_title('(b) Hardware PWM Duty Encoding')
ax_pwm.set_xlabel('Time Normalized (ms)')
ax_pwm.set_ylabel('Digital Voltage (V)')
ax_pwm.set_ylim(-0.2, 4.0)
ax_pwm.grid(True, linestyle=':', alpha=0.6)
ax_pwm.legend(loc='upper right')

plt.tight_layout()
plt.savefig(os.path.join(fig_dir, 'fig2_signal_transports.png'), dpi=300)
plt.savefig(os.path.join(fig_dir, 'fig2_signal_transports.pdf'))
plt.close()
print('Figure 2 created.')

# FIG 3: Linearity Benchmark
setpoints = np.array([0.0, 10.0, 25.0, 33.5, 45.0, 50.0])
expected_v = np.array([0.000, 0.660, 1.650, 2.211, 2.970, 3.300])
measured_v = np.array([0.015, 0.665, 1.681, 2.209, 2.966, 3.304])
reconstructed_t = np.array([0.1, 10.1, 25.5, 33.5, 44.9, 50.0])

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(7.6, 3.0))
ax1.plot(setpoints, expected_v, 'k--', label='Ideal Linear (R^2=1.0)', alpha=0.6)
ax1.scatter(setpoints, measured_v, color='#2b6cb0', s=45, zorder=5,
            label='Physical Measurement (R^2=0.9998)', edgecolor='black', linewidth=0.8)
ax1.set_xlabel('Commanded Setpoint (C)')
ax1.set_ylabel('Physical Voltage (V)')
ax1.set_title('(a) DAC Transfer Linearity')
ax1.grid(True, linestyle=':', alpha=0.6)
ax1.legend(loc='upper left')

errors = reconstructed_t - setpoints
ax2.axhline(0, color='gray', linestyle='--', linewidth=1)
ax2.stem(setpoints, errors, linefmt='r-', markerfmt='ro', basefmt=' ')
ax2.set_xlabel('Commanded Setpoint (C)')
ax2.set_ylabel('Reconstruction Error (C)')
ax2.set_title('(b) Absolute Error (|Delta T| <= 0.5 C)')
ax2.set_ylim(-0.6, 0.6)
ax2.grid(True, linestyle=':', alpha=0.6)

plt.tight_layout()
plt.savefig(os.path.join(fig_dir, 'fig3_linearity_benchmark.png'), dpi=300)
plt.savefig(os.path.join(fig_dir, 'fig3_linearity_benchmark.pdf'))
plt.close()
print('Figure 3 created.')

# FIG 4: Scenario & Fault Dynamics
t = np.linspace(0, 30, 600)
clean_sig = 25.0 + 10.0 * np.sin(2 * np.pi * 0.05 * t)
faulty_sig = clean_sig.copy()
noise_mask = (t >= 5) & (t <= 10)
np.random.seed(42)
faulty_sig[noise_mask] += np.random.normal(0, 2.5, size=np.sum(noise_mask))
stuck_mask = (t > 13) & (t <= 18)
faulty_sig[stuck_mask] = 38.0
dropout_mask = (t > 21) & (t <= 25)
faulty_sig[dropout_mask] = faulty_sig[np.where(t <= 21)[0][-1]]

fig, (ax_scen, ax_fault) = plt.subplots(2, 1, figsize=(7.6, 4.4), sharex=True)
t_ramp = np.linspace(0, 30, 600)
ramp_val = np.piecewise(t_ramp, [t_ramp < 5, (t_ramp >= 5) & (t_ramp <= 20), t_ramp > 20],
                       [10.0, lambda x: 10.0 + (x - 5.0) * (45.0 - 10.0) / 15.0, 45.0])
ax_scen.plot(t_ramp, ramp_val, color='#2b6cb0', label='RAMP: 10 C -> 45 C over 15s')
ax_scen.set_ylabel('Simulated Temp (C)')
ax_scen.set_title('(a) Dynamic Scenario Simulation (Linear Ramp)')
ax_scen.grid(True, linestyle=':', alpha=0.6)
ax_scen.legend(loc='upper left')

ax_fault.plot(t, clean_sig, 'k--', alpha=0.4, label='Nominal Baseline')
ax_fault.plot(t, faulty_sig, color='#c53030', label='Fault Injected Profile')
ax_fault.axvspan(5, 10, color='#feebc8', alpha=0.5, label='Gaussian Noise (sigma=2.5)')
ax_fault.axvspan(13, 18, color='#fed7d7', alpha=0.5, label='Stuck Fault (T=38 C)')
ax_fault.axvspan(21, 25, color='#e2e8f0', alpha=0.5, label='Dropout / Hold')
ax_fault.set_xlabel('Time (seconds)')
ax_fault.set_ylabel('Transmitted Value (C)')
ax_fault.set_title('(b) Real-Time Fault Injection Engine Modes')
ax_fault.grid(True, linestyle=':', alpha=0.6)
ax_fault.legend(loc='lower left', ncol=2)

plt.tight_layout()
plt.savefig(os.path.join(fig_dir, 'fig4_fault_injection_scenarios.png'), dpi=300)
plt.savefig(os.path.join(fig_dir, 'fig4_fault_injection_scenarios.pdf'))
plt.close()
print('Figure 4 created.')

# FIG 5: Latency Breakdown
categories = ['UI Event &\nSerialization', 'Local WS &\nWi-Fi Hop', 'ESP32 Parsing\n& Reg Write', 'Signal Rise\n& Settle', 'Arduino Sample\n& Decoding']
latencies = [1.2, 6.5, 0.4, 2.0, 6.8]
colors = ['#3182ce', '#dd6b20', '#38a169', '#805ad5', '#e53e3e']

fig, (ax_bar, ax_cdf) = plt.subplots(1, 2, figsize=(7.6, 3.0))
bars = ax_bar.bar(categories, latencies, color=colors, width=0.55, edgecolor='black', linewidth=0.7)
ax_bar.set_ylabel('Latency Contribution (ms)')
ax_bar.set_title('(a) Component Latency Breakdown')
ax_bar.set_ylim(0, 8.5)
ax_bar.grid(True, linestyle=':', alpha=0.6, axis='y')
for bar, val in zip(bars, latencies):
    ax_bar.text(bar.get_x() + bar.get_width()/2.0, val + 0.25, f'{val} ms', ha='center', va='bottom', fontsize=8, weight='bold')

cum_lat = np.cumsum(latencies)
stages = ['Start', 'UI Sent', 'WS Recv', 'ESP Set', 'Signal Out', 'Uno Decoded']
ax_cdf.plot(stages, [0] + list(cum_lat), marker='o', color='#2b6cb0', lw=2)
ax_cdf.axhline(cum_lat[-1], color='#c53030', linestyle='--', label=f'Total End-to-End: {cum_lat[-1]:.1f} ms')
ax_cdf.set_ylabel('Cumulative Latency (ms)')
ax_cdf.set_title('(b) Cumulative Propagation Delay')
ax_cdf.grid(True, linestyle=':', alpha=0.6)
ax_cdf.legend(loc='upper left')

plt.tight_layout()
plt.savefig(os.path.join(fig_dir, 'fig5_latency_breakdown.png'), dpi=300)
plt.savefig(os.path.join(fig_dir, 'fig5_latency_breakdown.pdf'))
plt.close()
print('Figure 5 created.')
