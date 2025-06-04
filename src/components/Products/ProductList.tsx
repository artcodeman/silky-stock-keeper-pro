
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Plus, Eye } from 'lucide-react';
import ProductDetail from './ProductDetail';

interface Product {
  id: string;
  name: string;
  sku: string;
  unit_price: number;
  cost_price: number;
  description?: string;
  barcode?: string;
  image_url?: string;
  created_at: string;
  categories?: { name: string };
  suppliers?: { name: string };
}

interface ProductListProps {
  onAdd: () => void;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
}

const ProductList = ({ onAdd, onEdit, onDelete }: ProductListProps) => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          sku,
          unit_price,
          cost_price,
          description,
          barcode,
          image_url,
          created_at,
          categories (name),
          suppliers (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Product[];
    }
  });

  const handleViewDetail = (product: Product) => {
    setSelectedProduct(product);
    setDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setDetailOpen(false);
  };

  if (isLoading) {
    return <div className="text-center py-8">加载中...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>商品列表</CardTitle>
        <Button onClick={onAdd} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          添加商品
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>商品名称</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>分类</TableHead>
              <TableHead>供应商</TableHead>
              <TableHead>售价</TableHead>
              <TableHead>成本价</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products?.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>{product.sku}</TableCell>
                <TableCell>{product.categories?.name || '-'}</TableCell>
                <TableCell>{product.suppliers?.name || '-'}</TableCell>
                <TableCell>¥{product.unit_price}</TableCell>
                <TableCell>¥{product.cost_price}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetail(product)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(product)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(product.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      {/* 商品详情对话框 */}
      <ProductDetail 
        product={selectedProduct} 
        open={detailOpen} 
        onClose={handleCloseDetail} 
      />
    </Card>
  );
};

export default ProductList;
