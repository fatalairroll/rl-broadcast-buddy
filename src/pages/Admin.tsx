import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTeams } from '@/hooks/useBroadcast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Gamepad2,
  ArrowLeft,
  Users,
  Shield,
  Plus,
  Trash2,
  Edit,
  Loader2,
} from 'lucide-react';
import type { Team, AppRole } from '@/types/broadcast';

interface UserWithRole {
  id: string;
  email: string;
  role: AppRole | null;
}

export default function Admin() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { teams, createTeam, updateTeam, deleteTeam } = useTeams();

  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Team form state
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [teamForm, setTeamForm] = useState({
    name: '',
    short_name: '',
    logo_url: '',
    primary_color: '#3B82F6',
    secondary_color: '#1E40AF',
  });

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      toast({
        variant: 'destructive',
        title: 'Brak dostępu',
        description: 'Tylko administratorzy mają dostęp do tego panelu.',
      });
      navigate('/dashboard');
    }
  }, [authLoading, isAdmin, navigate, toast]);

  // Fetch users with roles
  useEffect(() => {
    const fetchUsers = async () => {
      const { data: roles } = await supabase.from('user_roles').select('*');
      
      // Get unique user IDs from roles
      const userIds = [...new Set(roles?.map((r) => r.user_id) || [])];
      
      // Create user list with roles
      const usersWithRoles: UserWithRole[] = userIds.map((userId) => {
        const userRole = roles?.find((r) => r.user_id === userId);
        return {
          id: userId,
          email: `user-${userId.slice(0, 8)}@...`, // We don't have access to auth.users
          role: userRole?.role as AppRole | null,
        };
      });

      setUsers(usersWithRoles);
      setLoadingUsers(false);
    };

    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const handleAddRole = async (userId: string, role: AppRole) => {
    const { error } = await supabase.from('user_roles').insert({ user_id: userId, role });
    if (error) {
      toast({ variant: 'destructive', title: 'Błąd', description: error.message });
    } else {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role } : u))
      );
      toast({ title: 'Sukces', description: 'Rola została przypisana.' });
    }
  };

  const handleRemoveRole = async (userId: string) => {
    const { error } = await supabase.from('user_roles').delete().eq('user_id', userId);
    if (error) {
      toast({ variant: 'destructive', title: 'Błąd', description: error.message });
    } else {
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      toast({ title: 'Sukces', description: 'Rola została usunięta.' });
    }
  };

  const handleSaveTeam = async () => {
    if (editingTeam) {
      const { error } = await updateTeam(editingTeam.id, teamForm);
      if (error) {
        toast({ variant: 'destructive', title: 'Błąd', description: error.message });
      } else {
        toast({ title: 'Zaktualizowano', description: 'Drużyna została zaktualizowana.' });
        setTeamDialogOpen(false);
        setEditingTeam(null);
        resetTeamForm();
      }
    } else {
      const { error } = await createTeam(teamForm);
      if (error) {
        toast({ variant: 'destructive', title: 'Błąd', description: error.message });
      } else {
        toast({ title: 'Utworzono', description: 'Nowa drużyna została dodana.' });
        setTeamDialogOpen(false);
        resetTeamForm();
      }
    }
  };

  const handleDeleteTeam = async (id: string) => {
    const { error } = await deleteTeam(id);
    if (error) {
      toast({ variant: 'destructive', title: 'Błąd', description: error.message });
    } else {
      toast({ title: 'Usunięto', description: 'Drużyna została usunięta.' });
    }
  };

  const openEditTeam = (team: Team) => {
    setEditingTeam(team);
    setTeamForm({
      name: team.name,
      short_name: team.short_name || '',
      logo_url: team.logo_url || '',
      primary_color: team.primary_color,
      secondary_color: team.secondary_color,
    });
    setTeamDialogOpen(true);
  };

  const resetTeamForm = () => {
    setTeamForm({
      name: '',
      short_name: '',
      logo_url: '',
      primary_color: '#3B82F6',
      secondary_color: '#1E40AF',
    });
    setEditingTeam(null);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Gamepad2 className="h-6 w-6 text-primary" />
            <h1 className="text-lg font-bold">Panel Administracyjny</h1>
          </div>
        </div>
      </header>

      <main className="container py-6">
        <Tabs defaultValue="users">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="users">
              <Shield className="mr-2 h-4 w-4" />
              Użytkownicy
            </TabsTrigger>
            <TabsTrigger value="teams">
              <Users className="mr-2 h-4 w-4" />
              Drużyny
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="mt-6">
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Zarządzanie rolami
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Dodaj rolę
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Dodaj rolę użytkownikowi</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>User ID</Label>
                          <Input id="new-user-id" placeholder="UUID użytkownika" />
                        </div>
                        <div className="space-y-2">
                          <Label>Rola</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Wybierz rolę" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="moderator">Moderator</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button className="w-full">Dodaj</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingUsers ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User ID</TableHead>
                        <TableHead>Rola</TableHead>
                        <TableHead className="text-right">Akcje</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell className="font-mono text-sm">{u.id.slice(0, 8)}...</TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                u.role === 'admin'
                                  ? 'bg-primary/20 text-primary'
                                  : 'bg-warning/20 text-warning'
                              }`}
                            >
                              {u.role || 'brak'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              onClick={() => handleRemoveRole(u.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {users.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground">
                            Brak użytkowników z przypisanymi rolami
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Teams Tab */}
          <TabsContent value="teams" className="mt-6">
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Zarządzanie drużynami
                  <Dialog open={teamDialogOpen} onOpenChange={setTeamDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" onClick={resetTeamForm}>
                        <Plus className="mr-2 h-4 w-4" />
                        Dodaj drużynę
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {editingTeam ? 'Edytuj drużynę' : 'Dodaj drużynę'}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Nazwa</Label>
                          <Input
                            value={teamForm.name}
                            onChange={(e) =>
                              setTeamForm((prev) => ({ ...prev, name: e.target.value }))
                            }
                            placeholder="Nazwa drużyny"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Skrót</Label>
                          <Input
                            value={teamForm.short_name}
                            onChange={(e) =>
                              setTeamForm((prev) => ({ ...prev, short_name: e.target.value }))
                            }
                            placeholder="np. NRG"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>URL logo</Label>
                          <Input
                            value={teamForm.logo_url}
                            onChange={(e) =>
                              setTeamForm((prev) => ({ ...prev, logo_url: e.target.value }))
                            }
                            placeholder="https://..."
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Kolor główny</Label>
                            <Input
                              type="color"
                              value={teamForm.primary_color}
                              onChange={(e) =>
                                setTeamForm((prev) => ({ ...prev, primary_color: e.target.value }))
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Kolor dodatkowy</Label>
                            <Input
                              type="color"
                              value={teamForm.secondary_color}
                              onChange={(e) =>
                                setTeamForm((prev) => ({ ...prev, secondary_color: e.target.value }))
                              }
                            />
                          </div>
                        </div>
                        <Button className="w-full" onClick={handleSaveTeam}>
                          {editingTeam ? 'Zapisz zmiany' : 'Dodaj drużynę'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Logo</TableHead>
                      <TableHead>Nazwa</TableHead>
                      <TableHead>Skrót</TableHead>
                      <TableHead>Kolory</TableHead>
                      <TableHead className="text-right">Akcje</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teams.map((team) => (
                      <TableRow key={team.id}>
                        <TableCell>
                          {team.logo_url ? (
                            <img
                              src={team.logo_url}
                              alt={team.name}
                              className="w-8 h-8 object-contain"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center">
                              <Users className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{team.name}</TableCell>
                        <TableCell>{team.short_name || '-'}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <div
                              className="w-5 h-5 rounded"
                              style={{ backgroundColor: team.primary_color }}
                            />
                            <div
                              className="w-5 h-5 rounded"
                              style={{ backgroundColor: team.secondary_color }}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditTeam(team)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => handleDeleteTeam(team.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {teams.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          Brak drużyn w bazie
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
