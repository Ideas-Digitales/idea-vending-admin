"use client";

import PageWrapper from "@/components/PageWrapper";
import MaquinasInfiniteClient from "./MaquinasInfiniteClient";

function MaquinasContent() {
  return <MaquinasInfiniteClient />;
}

export default function MaquinasPage() {
  return (
    <PageWrapper
      requiredPermissions={["machines.read.all", "machines.read.enterprise_owned"]}
      permissionMatch="any"
    >
      <MaquinasContent />
    </PageWrapper>
  );
}

