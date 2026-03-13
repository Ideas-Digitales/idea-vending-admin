'use client';
import { createContext, useContext } from 'react';

export interface AppShellContextValue {
  openSidebar: () => void;
  sidebarCollapsed: boolean;
  toggleSidebarCollapsed: () => void;
}

export const AppShellContext = createContext<AppShellContextValue>({
  openSidebar: () => {},
  sidebarCollapsed: false,
  toggleSidebarCollapsed: () => {},
});

export const useAppShell = () => useContext(AppShellContext);
