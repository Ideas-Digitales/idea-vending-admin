"use client";

import { Suspense } from 'react';
import ResetPasswordView from './ResetPasswordView';

export default function PasswordResetPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white">Cargando…</div>}>
      <ResetPasswordView />
    </Suspense>
  );
}
