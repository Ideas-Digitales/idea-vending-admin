'use client';
import { createContext, useContext } from 'react';

export const AppShellContext = createContext<{ openSidebar: () => void }>({ openSidebar: () => {} });
export const useAppShell = () => useContext(AppShellContext);
