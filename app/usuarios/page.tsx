"use client";

import PageWrapper from "@/components/PageWrapper";
import UsuariosInfiniteClient from "./UsuariosInfiniteClient";

function UsuariosContent() {
  return <UsuariosInfiniteClient />;
}

export default function UsuariosPage() {
  return (
    <PageWrapper requiredPermissions={["manage_users"]}>
      <UsuariosContent />
    </PageWrapper>
  );
}
