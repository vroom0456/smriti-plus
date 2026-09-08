/**
 * SMRITI+ — Main App Entry Point
 *
 * "Remember. Engage. Connect."
 *
 * SMRITI+ supports cognitive engagement and daily assistance;
 * it does not diagnose or treat dementia.
 */

import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppNavigator from './src/navigation/AppNavigator';

// Inject SF Pro Display globally on Web
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const styleId = 'smriti-sf-pro-fonts';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      * {
        font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
      button, input, textarea, select {
        font-family: inherit !important;
      }
    `;
    document.head.appendChild(style);
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000, // 30s
      retry: 2,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <AppNavigator />
    </QueryClientProvider>
  );
}
