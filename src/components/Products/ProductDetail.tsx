
import React from 'react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
  barcode?: string;
  unit_price: number;
  cost_price: number;
  image_url?: string;
  categories?: { name: string };
  suppliers?: { name: string };
  created_at: string;
}

interface ProductDetailProps {
  product: Product | null;
  open: boolean;
  onClose: () => void;
}

const ProductDetail = ({ product, open, onClose }: ProductDetailProps) => {
  if (!product) return null;

  const formattedDate = product.created_at 
    ? format(new Date(product.created_at), 'yyyy年MM月dd日')
    : '未知';

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{product.name} 详情</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          {/* 左侧：商品图片 */}
          <div className="flex flex-col items-center">
            {product.image_url ? (
              <img 
                src={product.image_url} 
                alt={product.name} 
                className="w-full max-h-60 object-contain rounded-md border" 
              />
            ) : (
              <div className="w-full h-60 bg-gray-100 rounded-md border flex items-center justify-center text-gray-400">
                暂无图片
              </div>
            )}
          </div>
          
          {/* 右侧：商品信息 */}
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">商品名称：</span>
                    <span className="font-medium">{product.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">SKU：</span>
                    <span>{product.sku}</span>
                  </div>
                  {product.barcode && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">条形码：</span>
                      <span>{product.barcode}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">售价：</span>
                    <span className="text-primary font-medium">¥{product.unit_price}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">成本价：</span>
                    <span>¥{product.cost_price}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">分类：</span>
                    <span>{product.categories?.name || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">供应商：</span>
                    <span>{product.suppliers?.name || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">创建日期：</span>
                    <span>{formattedDate}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {product.description && (
              <div className="space-y-2">
                <h3 className="text-md font-medium">商品描述</h3>
                <Separator />
                <p className="text-gray-700 whitespace-pre-wrap">{product.description}</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetail;
