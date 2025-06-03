
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, ShoppingCart, TrendingUp, AlertTriangle } from 'lucide-react';

const Dashboard = () => {
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      // 获取商品总数
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      // 获取低库存商品数量
      const { data: lowStockItems } = await supabase
        .from('inventory')
        .select('current_stock, minimum_stock')
        .lt('current_stock', supabase.rpc('minimum_stock'));

      // 获取待处理采购订单
      const { count: pendingPurchases } = await supabase
        .from('purchase_orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // 获取待处理销售订单
      const { count: pendingSales } = await supabase
        .from('sales_orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      return {
        productsCount: productsCount || 0,
        lowStockCount: lowStockItems?.length || 0,
        pendingPurchases: pendingPurchases || 0,
        pendingSales: pendingSales || 0,
      };
    },
  });

  const statsCards = [
    {
      title: '商品总数',
      value: stats?.productsCount || 0,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: '低库存商品',
      value: stats?.lowStockCount || 0,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      title: '待处理采购',
      value: stats?.pendingPurchases || 0,
      icon: ShoppingCart,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: '待处理销售',
      value: stats?.pendingSales || 0,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">仪表盘</h1>
        <p className="text-gray-600 mt-2">欢迎使用进销存管理系统</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {card.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${card.bgColor}`}>
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>快速操作</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
                <Package className="h-6 w-6 text-blue-600 mb-2" />
                <div className="font-medium">添加商品</div>
                <div className="text-sm text-gray-500">录入新商品</div>
              </button>
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
                <ShoppingCart className="h-6 w-6 text-green-600 mb-2" />
                <div className="font-medium">创建采购单</div>
                <div className="text-sm text-gray-500">新建采购订单</div>
              </button>
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
                <TrendingUp className="h-6 w-6 text-purple-600 mb-2" />
                <div className="font-medium">创建销售单</div>
                <div className="text-sm text-gray-500">新建销售订单</div>
              </button>
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
                <AlertTriangle className="h-6 w-6 text-red-600 mb-2" />
                <div className="font-medium">库存盘点</div>
                <div className="text-sm text-gray-500">调整库存数量</div>
              </button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>系统提醒</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <div>
                  <div className="font-medium text-yellow-800">库存预警</div>
                  <div className="text-sm text-yellow-600">
                    有 {stats?.lowStockCount || 0} 个商品库存不足
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                <ShoppingCart className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="font-medium text-blue-800">待处理采购</div>
                  <div className="text-sm text-blue-600">
                    有 {stats?.pendingPurchases || 0} 个采购订单待处理
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
