import PageWrapper from '@/components/PageWrapper';
import ProductosInfiniteClient from './ProductosInfiniteClient';

export default function ProductosPage() {
  return (
    <PageWrapper requiredPermissions={['products.read.all', 'products.read.enterprise_owned']} permissionMatch="any">
      <ProductosInfiniteClient />
    </PageWrapper>
  );
}
