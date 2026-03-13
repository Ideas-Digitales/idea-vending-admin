"use client";

import PageWrapper from "@/components/PageWrapper";
import UsuariosInfiniteClient from "./UsuariosInfiniteClient";

function UsuariosContent() {
  return <UsuariosInfiniteClient />;
}

export default function UsuariosPage() {
  return (
    <PageWrapper
      requiredPermissions={["users.read.all", "users.read.own"]}
      permissionMatch="any"
    >
      <UsuariosContent />
    </PageWrapper>
  );
}
