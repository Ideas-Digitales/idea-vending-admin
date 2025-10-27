import PageWrapper from '@/components/PageWrapper';
import ProductosInfiniteClient from './ProductosInfiniteClient';

export default function ProductosPage() {
  return (
    <PageWrapper requiredPermissions={['read']}>
      <ProductosInfiniteClient />
    </PageWrapper>
  );
}
