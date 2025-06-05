
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import MainLayout from '@/components/Layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const RolesPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');

  // 获取所有用户的角色信息
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
          profiles!inner(email, full_name)
        `);
      if (error) throw error;
      return data;
    }
  });

  // 获取所有用户（用于分配角色）
  const { data: allUsers } = useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name');
      if (error) throw error;
      return data;
    }
  });

  // 分配角色的 mutation
  const assignRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { error } = await supabase
        .from('user_roles')
        .upsert({
          user_id: userId,
          role: role as 'admin' | 'purchaser'
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
      toast({
        title: '角色分配成功',
      });
      setSelectedUser('');
      setSelectedRole('');
    },
    onError: (error: any) => {
      toast({
        title: '角色分配失败',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // 删除角色的 mutation
  const removeRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', roleId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
      toast({
        title: '角色删除成功',
      });
    },
    onError: (error: any) => {
      toast({
        title: '角色删除失败',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const handleAssignRole = () => {
    if (!selectedUser || !selectedRole) {
      toast({
        title: '请选择用户和角色',
        variant: 'destructive',
      });
      return;
    }
    assignRoleMutation.mutate({ userId: selectedUser, role: selectedRole });
  };

  const handleRemoveRole = (roleId: string) => {
    if (confirm('确定要删除此角色吗？')) {
      removeRoleMutation.mutate(roleId);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'purchaser':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin':
        return '管理员';
      case 'purchaser':
        return '采购员';
      default:
        return role;
    }
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
        <h1 className="text-2xl font-bold">用户角色管理</h1>
        
        {/* 分配角色表单 */}
        <Card>
          <CardHeader>
            <CardTitle>分配用户角色</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="user-select">选择用户</Label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger id="user-select">
                    <SelectValue placeholder="选择用户" />
                  </SelectTrigger>
                  <SelectContent>
                    {allUsers?.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name || user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="role-select">选择角色</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger id="role-select">
                    <SelectValue placeholder="选择角色" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">管理员</SelectItem>
                    <SelectItem value="purchaser">采购员</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button 
                  onClick={handleAssignRole}
                  disabled={assignRoleMutation.isPending}
                  className="w-full"
                >
                  {assignRoleMutation.isPending ? '分配中...' : '分配角色'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 用户角色列表 */}
        <Card>
          <CardHeader>
            <CardTitle>当前用户角色</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>用户</TableHead>
                  <TableHead>邮箱</TableHead>
                  <TableHead>角色</TableHead>
                  <TableHead>分配时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userRoles?.map((userRole) => (
                  <TableRow key={userRole.id}>
                    <TableCell>
                      {userRole.profiles?.full_name || '未知用户'}
                    </TableCell>
                    <TableCell>{userRole.profiles?.email}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(userRole.role)}>
                        {getRoleDisplayName(userRole.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(userRole.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveRole(userRole.id)}
                        disabled={removeRoleMutation.isPending}
                      >
                        删除
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
