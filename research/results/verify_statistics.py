#!/usr/bin/env python3
"""
verify_statistics.py — Independent Statistical & Mathematical Verification Script
Audits DAC transfer linearity, Pearson r, R^2, error residuals, and latency metrics.
"""

import numpy as np
import pandas as pd

def audit_dac_linearity():
    print("=" * 60)
    print("1. AUDITING PHYSICAL DAC LINEARITY & ERROR RESIDUALS")
    print("=" * 60)
    df = pd.read_csv(r"C:\blockchain\suyog\One-Sensor\research\results\bench_dac_linearity_data.csv", comment="#")
    print(df.to_string(index=False))

    x = df["commanded_temp_c"].values
    y_v = df["measured_voltage_v"].values
    y_rec = df["reconstructed_temp_c"].values
    y_exp_v = df["expected_voltage_v"].values

    # Pearson correlation r and R^2 between commanded setpoint and measured voltage
    r_matrix = np.corrcoef(x, y_v)
    r = r_matrix[0, 1]
    r_squared = r ** 2

    # Linear regression fit line
    slope, intercept = np.polyfit(x, y_v, 1)

    print("\n--- Statistical Verification ---")
    print(f"Sample Count (N):            {len(x)}")
    print(f"Pearson Correlation (r):     {r:.6f}")
    print(f"Coefficient of Det. (R^2):   {r_squared:.6f} (Paper Claim: 0.9998)")
    print(f"Regression Fit:              V_meas = {slope:.5f} * T_cmd + {intercept:.5f}")
    
    # Error residuals
    errors = y_rec - x
    max_abs_err = np.max(np.abs(errors))
    mean_abs_err = np.mean(np.abs(errors))
    fsr_err_pct = (max_abs_err / 50.0) * 100.0

    print(f"Maximum Absolute Error:      {max_abs_err:.2f} °C (Paper Claim: <= 0.5 °C)")
    print(f"Mean Absolute Error (MAE):   {mean_abs_err:.2f} °C")
    print(f"Full-Scale Error (% FSR):    {fsr_err_pct:.2f}% (Paper Claim: 1.0%)")

    assert r_squared >= 0.9998, "R^2 does not meet 0.9998 claim!"
    assert max_abs_err <= 0.5, "Max error exceeds 0.5 deg C!"
    print("\n>>> DAC LINEARITY AUDIT PASSED: ALL CLAIMS STATISTICALLY VERIFIED <<<\n")

def audit_latency():
    print("=" * 60)
    print("2. AUDITING END-TO-END LATENCY BREAKDOWN")
    print("=" * 60)
    df = pd.read_csv(r"C:\blockchain\suyog\One-Sensor\research\results\bench_latency_breakdown_data.csv", comment="#")
    print(df.to_string(index=False))

    stages = df[df["pipeline_stage"].str.startswith("Stage")]
    total_row = df[df["pipeline_stage"] == "Total"]

    sum_latencies = stages["latency_ms"].sum()
    reported_total = total_row["latency_ms"].values[0]

    print("\n--- Latency Verification ---")
    print(f"Sum of Individual Stages:    {sum_latencies:.2f} ms")
    print(f"Reported Total Round-Trip:   {reported_total:.2f} ms (Paper Claim: < 18.0 ms)")

    assert abs(sum_latencies - reported_total) < 0.01, "Stage sum does not match total!"
    assert reported_total < 18.0, "Total latency exceeds 18.0 ms target!"
    print("\n>>> LATENCY AUDIT PASSED: ALL CLAIMS STATISTICALLY VERIFIED <<<\n")

if __name__ == "__main__":
    audit_dac_linearity()
    audit_latency()
