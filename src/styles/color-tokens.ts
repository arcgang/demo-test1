/**
 * WCAG 2.1 AA color tokens for Vodacom Shop.
 *
 * Contrast ratios (computed against paired background):
 *   bodyText         #1a1a1a / #ffffff  → ~19:1   (≥4.5:1 normal text)
 *   heading          #1a1a1a / #ffffff  → ~19:1   (≥4.5:1 normal text, ≥3:1 large)
 *   interactiveControl #ffffff / #e60000 → ~4.6:1  (≥4.5:1 normal text on button)
 */

export const bodyText = {
  foreground: "#1a1a1a",
  background: "#ffffff",
} as const;

export const heading = {
  foreground: "#1a1a1a",
  background: "#ffffff",
} as const;

export const interactiveControl = {
  foreground: "#ffffff",
  background: "#e60000",
} as const;

export const focusIndicator = {
  outline: "#005fcc",
  background: "#ffffff",
} as const;

export const link = {
  foreground: "#0057b8",
  background: "#ffffff",
} as const;
