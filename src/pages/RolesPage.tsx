
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Trash2 } from 'lucide-react';
import MainLayout from '@/components/Layout/MainLayout';

interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'purchaser';
  created_at: string;
  profiles: {
    full_name: string | null;
    email: string | null;
  } | null;
}

const RolesPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<'admin' | 'purchaser'>('purchaser');

  // 获取所有用户角色
  const { data: userRoles, isLoading } = useQuery({
    queryKey: ['user-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          id,
          user_id,
          role,
          created_at,
          profiles!inner (
            full_name,
            email
          )
        `);
      
      if (error) throw error;
      return data as UserRole[];
    }
  });

  // 获取所有用户（没有角色的）
  const { data: allUsers } = useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email');
      
      if (error) throw error;
      return data;
    }
  });

  // 获取没有角色的用户
  const usersWithoutRoles = allUsers?.filter(user => 
    !userRoles?.some(role => role.user_id === user.id)
  ) || [];

  // 添加角色
  const addRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: 'admin' | 'purchaser' }) => {
      const { error } = await supabase
        .from('user_roles')
        .insert([{ user_id: userId, role }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      setSelectedUserId('');
      setSelectedRole('purchaser');
      toast({
        title: '角色添加成功',
      });
    },
    onError: (error: any) => {
      toast({
        title: '添加角色失败',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // 删除角色
  const deleteRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', roleId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      toast({
        title: '角色删除成功',
      });
    },
    onError: (error: any) => {
      toast({
        title: '删除角色失败',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const handleAddRole = () => {
    if (!selectedUserId) {
      toast({
        title: '请选择用户',
        variant: 'destructive',
      });
      return;
    }
    addRoleMutation.mutate({ userId: selectedUserId, role: selectedRole });
  };

  const handleDeleteRole = (roleId: string) => {
    if (confirm('确定要删除此角色吗？')) {
      deleteRoleMutation.mutate(roleId);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    return role === 'admin' ? 'default' : 'secondary';
  };

  const getRoleText = (role: string) => {
    return role === 'admin' ? '管理员' : '采购员';
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="text-center py-8">加载中...</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">角色管理</h1>
          <p className="text-muted-foreground">管理用户角色和权限</p>
        </div>

        {/* 添加角色 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              添加用户角色
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="text-sm font-medium">选择用户</label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择用户" />
                  </SelectTrigger>
                  <SelectContent>
                    {usersWithoutRoles.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name || user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium">选择角色</label>
                <Select value={selectedRole} onValueChange={(value: 'admin' | 'purchaser') => setSelectedRole(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">管理员</SelectItem>
                    <SelectItem value="purchaser">采购员</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleAddRole}
                disabled={addRoleMutation.isPending || !selectedUserId}
              >
                {addRoleMutation.isPending ? '添加中...' : '添加角色'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 用户角色列表 */}
        <Card>
          <CardHeader>
            <CardTitle>用户角色列表</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>用户</TableHead>
                  <TableHead>邮箱</TableHead>
                  <TableHead>角色</TableHead>
                  <TableHead>添加时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userRoles?.map((userRole) => (
                  <TableRow key={userRole.id}>
                    <TableCell className="font-medium">
                      {userRole.profiles?.full_name || '未设置'}
                    </TableCell>
                    <TableCell>
                      {userRole.profiles?.email || '未设置'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(userRole.role)}>
                        {getRoleText(userRole.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(userRole.created_at).toLocaleDateString('zh-CN')}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteRole(userRole.id)}
                        disabled={deleteRoleMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default RolesPage;
