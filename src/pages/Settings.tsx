import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { KeyRound, Moon, Sun, UserRound } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/admin/PageHeader';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { apiClient, handleApiError } from '@/lib/api';
import { useAdminTheme } from '@/lib/theme';
import { CONFIG } from '@/lib/config';

/** The signed-in admin's own account: profile, password, theme. */
export function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { theme, toggle } = useAdminTheme();
  const base = `/companies/${user?.company_id}/users/me`;

  const [name, setName] = useState(user?.name ?? '');
  const profile = useMutation({
    mutationFn: async () => {
      try {
        await apiClient.put(base, { name });
      } catch (e) {
        throw new Error(handleApiError(e));
      }
    },
    onSuccess: () => {
      // Keep the header in sync without a re-login.
      try {
        const key = CONFIG.STORAGE_KEYS.USER_DATA;
        const stored = JSON.parse(localStorage.getItem(key) || '{}');
        localStorage.setItem(key, JSON.stringify({ ...stored, name }));
      } catch {
        // ignore storage errors
      }
      toast({ title: 'Profile saved' });
    },
    onError: (e: Error) => toast({ title: 'Could not save profile', description: e.message, variant: 'destructive' }),
  });

  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const password = useMutation({
    mutationFn: async () => {
      if (pw.next.length < 8) throw new Error('New password must be at least 8 characters');
      if (pw.next !== pw.confirm) throw new Error('New passwords do not match');
      try {
        await apiClient.post(`${base}/change-password`, { current_password: pw.current, new_password: pw.next });
      } catch (e) {
        throw new Error(handleApiError(e));
      }
    },
    onSuccess: () => {
      setPw({ current: '', next: '', confirm: '' });
      toast({ title: 'Password changed' });
    },
    onError: (e: Error) => toast({ title: 'Could not change password', description: e.message, variant: 'destructive' }),
  });

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="Settings" description="Your admin account." />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg"><UserRound className="h-5 w-5" /> Profile</CardTitle>
          <CardDescription>{user?.email} · {user?.role}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-wrap items-end gap-3" onSubmit={(e) => { e.preventDefault(); profile.mutate(); }}>
            <div className="min-w-64 flex-1 space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <Button type="submit" disabled={profile.isPending || !name.trim()}>{profile.isPending ? 'Saving…' : 'Save'}</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg"><KeyRound className="h-5 w-5" /> Password</CardTitle>
          <CardDescription>At least 8 characters.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 sm:grid-cols-3" onSubmit={(e) => { e.preventDefault(); password.mutate(); }}>
            {([['current', 'Current password', 'current-password'], ['next', 'New password', 'new-password'], ['confirm', 'Confirm new password', 'new-password']] as const).map(([k, label, ac]) => (
              <div key={k} className="space-y-1.5">
                <Label htmlFor={`pw-${k}`}>{label}</Label>
                <Input id={`pw-${k}`} type="password" autoComplete={ac} value={pw[k]} onChange={(e) => setPw({ ...pw, [k]: e.target.value })} required />
              </div>
            ))}
            <div className="sm:col-span-3">
              <Button type="submit" disabled={password.isPending}>{password.isPending ? 'Changing…' : 'Change password'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">{theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />} Appearance</CardTitle>
          <CardDescription>{theme === 'dark' ? 'CRED dark (default)' : 'Light'} · saved in this browser</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={toggle}>Switch to {theme === 'dark' ? 'light' : 'CRED dark'}</Button>
        </CardContent>
      </Card>
    </div>
  );
}
