
"use client"

import { useState, useEffect } from 'react';
import { Shield, Users, UserCheck, UserX, Loader2, ChevronLeft, Search, Filter, ShieldCheck, Star } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useUser, useFirestore, useMemoFirebase, useCollection, useDoc } from '@/firebase';
import { collection, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function AdminDashboard() {
  const { toast } = useToast();
  const { user: currentUser } = useUser();
  const db = useFirestore();
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Check if current user is admin
  const userDocRef = useMemoFirebase(() => currentUser ? doc(db, 'users', currentUser.uid) : null, [db, currentUser]);
  const { data: userProfile } = useDoc(userDocRef);
  const isAdmin = userProfile?.role === 'admin';

  const usersQuery = useMemoFirebase(() => {
    if (!db || !isAdmin) return null;
    return query(collection(db, 'users'), orderBy('onboardingComplete', 'desc'));
  }, [db, isAdmin]);

  const { data: users, isLoading } = useCollection(usersQuery);

  const handleToggleRole = async (userId: string, currentRole: string, targetRole: 'pro' | 'user') => {
    if (!db) return;
    setUpdatingId(userId);
    const newRole = currentRole === targetRole ? 'user' : targetRole;
    
    try {
      await updateDoc(doc(db, 'users', userId), {
        role: newRole
      });
      toast({
        title: "Role updated",
        description: `User is now a ${newRole}.`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: "Update failed",
        description: error.message,
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredUsers = users?.filter(u => 
    u.displayName?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.id?.toLowerCase().includes(search.toLowerCase())
  );

  if (!isAdmin && !isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
        <Shield className="w-12 h-12 text-destructive opacity-50" />
        <h1 className="text-xl font-bold italic">The Archive is Sealed</h1>
        <p className="text-sm text-muted-foreground italic">Only the Village Elders may enter this sanctuary.</p>
        <Link href="/">
          <Button variant="outline" className="border-white/10 italic">Return to the Root</Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md p-5 border-b border-white/5">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/profile">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ChevronLeft className="w-6 h-6" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white italic">Village Council</h1>
            <p className="text-[10px] text-primary font-bold uppercase tracking-widest italic">Admin Management</p>
          </div>
        </div>
        
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search spirits by name or email..." 
            className="pl-10 h-10 bg-white/5 border-white/10 italic text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </header>

      <main className="flex-1 px-5 pt-6 pb-24 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-white italic">User Registry</h2>
          </div>
          <Badge variant="outline" className="text-[9px] border-white/10 italic">
            {users?.length || 0} Souls
          </Badge>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
          {isLoading ? (
            <div className="p-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : (
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground italic">Spirit</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground italic">Role</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right italic">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers?.map((u) => (
                  <TableRow key={u.id} className="border-white/5 hover:bg-white/[0.02]">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white italic truncate max-w-[120px]">{u.displayName || 'Unnamed Spirit'}</span>
                        <span className="text-[10px] text-muted-foreground italic truncate max-w-[120px]">{u.email || 'Private session'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={`text-[8px] font-black uppercase tracking-widest border-none ${
                          u.role === 'admin' ? 'text-primary' : u.role === 'pro' ? 'text-accent' : 'text-muted-foreground'
                        }`}
                      >
                        {u.role || 'user'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className={`h-8 w-8 rounded-lg ${u.role === 'pro' ? 'text-accent bg-accent/10' : 'text-muted-foreground hover:text-accent hover:bg-accent/10'}`}
                          onClick={() => handleToggleRole(u.id, u.role || 'user', 'pro')}
                          disabled={updatingId === u.id || u.role === 'admin'}
                        >
                          {updatingId === u.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Star className="w-3.5 h-3.5" />}
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className={`h-8 w-8 rounded-lg ${u.role === 'admin' ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-primary hover:bg-primary/10'}`}
                          onClick={() => handleToggleRole(u.id, u.role || 'user', 'admin')}
                          disabled={updatingId === u.id || u.id === currentUser?.uid}
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {!isLoading && filteredUsers?.length === 0 && (
          <div className="text-center py-12 space-y-2 opacity-50 italic">
            <UserX className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">No spirits found in this corner of the archive.</p>
          </div>
        )}
      </main>

      <BottomNav />
    </>
  );
}
