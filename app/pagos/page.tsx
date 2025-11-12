"use client";

import PageWrapper from "@/components/PageWrapper";
import PagosInfiniteClient from "./PagosInfiniteClient";

function PagosContent() {
  return <PagosInfiniteClient />;
}

export default function PagosPage() {
  return (
    <PageWrapper requiredPermissions={["read"]}>
      <PagosContent />
    </PageWrapper>
  );
}
