
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, AlertTriangle, ShoppingCart, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const Dashboard = () => {
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [products, lowStock, purchaseOrders, salesOrders] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact' }),
        supabase.from('inventory').select('*', { count: 'exact' }).lt('current_stock', 10),
        supabase.from('purchase_orders').select('*', { count: 'exact' }).eq('status', 'pending'),
        supabase.from('sales_orders').select('*', { count: 'exact' }).eq('status', 'pending')
      ]);

      return {
        totalProducts: products.count || 0,
        lowStockItems: lowStock.count || 0,
        pendingPurchases: purchaseOrders.count || 0,
        pendingSales: salesOrders.count || 0
      };
    }
  });

  const dashboardCards = [
    {
      title: '商品总数',
      value: stats?.totalProducts || 0,
      icon: Package,
      color: 'text-blue-600'
    },
    {
      title: '低库存商品',
      value: stats?.lowStockItems || 0,
      icon: AlertTriangle,
      color: 'text-red-600'
    },
    {
      title: '待处理采购',
      value: stats?.pendingPurchases || 0,
      icon: ShoppingCart,
      color: 'text-orange-600'
    },
    {
      title: '待处理销售',
      value: stats?.pendingSales || 0,
      icon: TrendingUp,
      color: 'text-green-600'
    }
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">仪表盘</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Dashboard;
