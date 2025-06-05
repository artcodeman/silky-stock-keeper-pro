
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { users, Edit, Trash2, UserCog } from 'lucide-react';
import MainLayout from '@/components/Layout/MainLayout';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';

interface UserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
  user_roles: Array<{
    id: string;
    role: 'admin' | 'purchaser' | 'manager';
  }>;
}

interface EditUserForm {
  full_name: string;
  email: string;
  role: 'admin' | 'purchaser' | 'manager' | '';
}

const AdminPanel = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const form = useForm<EditUserForm>({
    defaultValues: {
      full_name: '',
      email: '',
      role: '',
    },
  });

  // 获取所有用户及其角色
  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          created_at,
          user_roles (
            id,
            role
          )
        `);
      
      if (error) throw error;
      return data as UserProfile[];
    }
  });

  // 更新用户信息
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, userData }: { userId: string; userData: Partial<EditUserForm> }) => {
      // 更新用户基本信息
      if (userData.full_name || userData.email) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: userData.full_name,
            email: userData.email,
          })
          .eq('id', userId);
        
        if (profileError) throw profileError;
      }

      // 更新用户角色
      if (userData.role) {
        // 先删除现有角色
        const { error: deleteError } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId);
        
        if (deleteError) throw deleteError;

        // 添加新角色
        const { error: insertError } = await supabase
          .from('user_roles')
          .insert([{ user_id: userId, role: userData.role }]);
        
        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setIsEditDialogOpen(false);
      setEditingUser(null);
      form.reset();
      toast({
        title: '用户信息更新成功',
      });
    },
    onError: (error: any) => {
      toast({
        title: '更新用户信息失败',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // 删除用户
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      // 先删除角色
      const { error: roleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);
      
      if (roleError) throw roleError;

      // 删除用户资料
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
      
      if (profileError) throw profileError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({
        title: '用户删除成功',
      });
    },
    onError: (error: any) => {
      toast({
        title: '删除用户失败',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const handleEditUser = (user: UserProfile) => {
    setEditingUser(user);
    form.setValue('full_name', user.full_name || '');
    form.setValue('email', user.email || '');
    form.setValue('role', user.user_roles[0]?.role || '');
    setIsEditDialogOpen(true);
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm('确定要删除此用户吗？此操作不可逆！')) {
      deleteUserMutation.mutate(userId);
    }
  };

  const onSubmit = (data: EditUserForm) => {
    if (!editingUser) return;
    updateUserMutation.mutate({
      userId: editingUser.id,
      userData: data,
    });
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive' as const;
      case 'manager':
        return 'default' as const;
      default:
        return 'secondary' as const;
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin':
        return '管理员';
      case 'manager':
        return '管理者';
      default:
        return '采购员';
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
        <div>
          <h1 className="text-3xl font-bold">管理面板</h1>
          <p className="text-muted-foreground">查看和管理所有用户账号信息</p>
        </div>

        {/* 用户列表 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <users className="h-5 w-5" />
              用户管理
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>用户名</TableHead>
                  <TableHead>邮箱</TableHead>
                  <TableHead>角色</TableHead>
                  <TableHead>注册时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.full_name || '未设置'}
                    </TableCell>
                    <TableCell>{user.email || '未设置'}</TableCell>
                    <TableCell>
                      {user.user_roles.length > 0 ? (
                        <Badge variant={getRoleBadgeVariant(user.user_roles[0].role)}>
                          {getRoleText(user.user_roles[0].role)}
                        </Badge>
                      ) : (
                        <Badge variant="outline">无角色</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString('zh-CN')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditUser(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={deleteUserMutation.isPending}
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
        </Card>

        {/* 编辑用户对话框 */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>编辑用户信息</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>用户名</FormLabel>
                      <FormControl>
                        <Input placeholder="请输入用户名" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>邮箱</FormLabel>
                      <FormControl>
                        <Input placeholder="请输入邮箱" type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>角色</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="选择角色" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="admin">管理员</SelectItem>
                          <SelectItem value="manager">管理者</SelectItem>
                          <SelectItem value="purchaser">采购员</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                  >
                    取消
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateUserMutation.isPending}
                  >
                    {updateUserMutation.isPending ? '更新中...' : '保存'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

export default AdminPanel;
