
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  Users, 
  BarChart3,
  Home,
  LogOut,
  UserCog,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const Navigation = () => {
  const location = useLocation();
  const { signOut, user } = useAuth();

  // 获取当前用户的角色
  const { data: userRole } = useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      if (error) return null;
      return data.role;
    },
    enabled: !!user?.id
  });

  const navItems = [
    { path: '/', label: '首页', icon: Home },
    { path: '/products', label: '商品管理', icon: Package },
    { path: '/inventory', label: '库存管理', icon: BarChart3 },
    { path: '/purchase', label: '采购管理', icon: ShoppingCart },
    { path: '/sales', label: '销售管理', icon: TrendingUp },
    { path: '/suppliers', label: '供应商', icon: Users },
  ];

  // 管理者和管理员可以看到角色管理
  if (userRole === 'admin' || userRole === 'manager') {
    navItems.push({ path: '/roles', label: '角色管理', icon: UserCog });
  }

  // 只有管理者可以看到管理面板
  if (userRole === 'manager') {
    navItems.push({ path: '/admin', label: '管理面板', icon: Settings });
  }

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('退出失败:', error);
    }
  };

  const getRoleText = (role: string | null) => {
    switch (role) {
      case 'admin':
        return '管理员';
      case 'manager':
        return '管理者';
      case 'purchaser':
        return '采购员';
      default:
        return '未分配';
    }
  };

  return (
    <nav className="bg-white shadow-lg border-b">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <h1 className="text-xl font-bold text-gray-900">进销存管理系统</h1>
            <div className="flex space-x-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link key={item.path} to={item.path}>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      className="flex items-center space-x-2"
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Button>
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {user && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  欢迎，{user.email}
                </span>
                {userRole && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {getRoleText(userRole)}
                  </span>
                )}
              </div>
            )}
            <Button variant="outline" className="flex items-center space-x-2" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
              <span>退出</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
