
"use client"

import { useState, useEffect } from 'react';
import { Heart, Search, Plus, LayoutGrid, Loader2, Flower2, MoreVertical, Calendar as CalendarIcon, Pencil, Trash2, Check, X } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useUser, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { collection, query, orderBy, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { AuthGate } from '@/components/AuthGate';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import Link from 'next/link';

// Constants for editing
const HAIRSTYLE_CATEGORIES = [
  { name: 'Protective Styles', styles: ['Box Braids', 'Cornrows', 'Twists', 'Wig/Weave', 'Crochet'] },
  { name: 'Natural/Free Styles', styles: ['Afro', 'TWA (Teeny Weeny Afro)', 'Wash and Go', 'Twist Out', 'Bantu Knots', 'Freeform Locs'] },
  { name: 'Maintained Styles', styles: ['Locs (Maintained)', 'Silk Press', 'Waves (360/540)'] },
  { name: 'Short Styles', styles: ['Fade/Taper', 'Buzz Cut', 'TWA', 'Bald/Shaved'] }
];

const SCALP_CONDITIONS = [
  { label: 'Normal', value: 'normal', description: 'No major complaints, scalp feels balanced' },
  { label: 'Dry/Flaky', value: 'dry/flaky', description: 'Tight feeling, white flakes, especially after washing' },
  { label: 'Oily/Greasy', value: 'oily/greasy', description: 'Hair feels heavy or looks shiny at the roots quickly' },
  { label: 'Itchy', value: 'itchy', description: 'Frequent urge to scratch, not just after a new style' },
  { label: 'Sensitive/Tender', value: 'sensitive/tender', description: 'Scalp hurts when touched or after tight styles' },
  { label: 'Buildup', value: 'buildup', description: 'Products seem to layer up, hair feels coated' }
];

const DURATION_OPTIONS = [
  "Fresh",
  "Less than 1 week",
  "1-2 weeks",
  "3-4 weeks",
  "More than 1 month"
];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function VaultPage() {
  const { toast } = useToast();
  const { user } = useUser();
  const db = useFirestore();

  const [selectedStyle, setSelectedStyle] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [editData, setEditData] = useState({
    style: '',
    duration: '',
    scalpConditions: [] as string[]
  });

  const [tempDate, setTempDate] = useState({
    month: new Date().getMonth(),
    day: new Date().getDate(),
    year: new Date().getFullYear()
  });

  const stylesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'users', user.uid, 'hairstyles'), orderBy('createdAt', 'desc'));
  }, [db, user]);

  const { data: savedStyles, isLoading } = useCollection(stylesQuery);

  const handleDelete = async () => {
    if (!db || !user || !selectedStyle) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'hairstyles', selectedStyle.id));
      toast({ title: "Reflection removed", description: "The vision has faded from the glass." });
      setIsDeleteDialogOpen(false);
    } catch (error) {
      toast({ variant: 'destructive', title: "Delete failed", description: "We couldn't remove the memory." });
    }
  };

  const handleUpdateDate = async () => {
    if (!db || !user || !selectedStyle) return;
    try {
      const newDate = new Date(tempDate.year, tempDate.month, tempDate.day);
      const dateStr = newDate.toLocaleDateString();
      await updateDoc(doc(db, 'users', user.uid, 'hairstyles', selectedStyle.id), {
        styleDate: dateStr
      });
      toast({ title: "Timeline updated", description: "The memory is now properly placed." });
      setIsDatePickerOpen(false);
    } catch (error) {
      toast({ variant: 'destructive', title: "Update failed", description: "Could not shift the timeline." });
    }
  };

  const handleUpdateInfo = async () => {
    if (!db || !user || !selectedStyle) return;
    setIsSaving(true);
    try {
      const combinedName = `${editData.style} — ${editData.duration}`;
      await updateDoc(doc(db, 'users', user.uid, 'hairstyles', selectedStyle.id), {
        name: combinedName,
        styleName: editData.style,
        duration: editData.duration,
        scalpConditions: editData.scalpConditions
      });
      toast({ title: "Vision refined", description: "Your details have been preserved." });
      setIsEditDialogOpen(false);
    } catch (error) {
      toast({ variant: 'destructive', title: "Save failed", description: "Could not update the vision." });
    } finally {
      setIsSaving(false);
    }
  };

  const openEditDialog = (style: any) => {
    setSelectedStyle(style);
    setEditData({
      style: style.styleName || style.name?.split(' — ')[0] || '',
      duration: style.duration || style.name?.split(' — ')[1] || '',
      scalpConditions: style.scalpConditions || []
    });
    setIsEditDialogOpen(true);
  };

  const openDatePicker = (style: any) => {
    const d = style.styleDate ? new Date(style.styleDate) : new Date();
    setTempDate({
      month: d.getMonth(),
      day: d.getDate(),
      year: d.getFullYear()
    });
    setSelectedStyle(style);
    setIsDatePickerOpen(true);
  };

  const toggleScalpCondition = (val: string) => {
    setEditData(prev => ({
      ...prev,
      scalpConditions: prev.scalpConditions.includes(val)
        ? prev.scalpConditions.filter(c => c !== val)
        : [...prev.scalpConditions, val]
    }));
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1962 + 1 }, (_, i) => currentYear - i);
  const daysInMonth = new Date(tempDate.year, tempDate.month + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <>
      <AuthGate>
        <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md p-5 border-b border-white/5">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-white italic">The Looking Glass</h1>
            <Link href="/analysis">
              <Button size="icon" className="rounded-full bg-primary text-background hover:bg-primary/90">
                <Plus className="w-6 h-6" />
              </Button>
            </Link>
          </div>
          
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input placeholder="Search your past reflections..." className="pl-10 h-12 bg-white/5 border-white/10 focus:border-primary/50 transition-all italic" />
          </div>
        </header>

        <main className="flex-1 px-5 pt-4 pb-24 min-h-[60vh]">
          {isLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : savedStyles && savedStyles.length > 0 ? (
            <>
              <div className="flex justify-between items-center mb-4 italic">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{savedStyles.length} Visions Saved</p>
                <LayoutGrid className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-8">
                {savedStyles.map((style) => (
                  <div key={style.id} className="group flex flex-col gap-3 animate-in fade-in zoom-in duration-300">
                    <div className="relative aspect-[4/5] rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/5 bg-white/5">
                      <img src={style.imageUrl} alt={style.name} className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110" />
                      
                      <div className="absolute top-2 right-2 flex gap-1">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" className="h-8 w-8 rounded-full bg-black/40 backdrop-blur-md text-white border-none hover:bg-black/60 shadow-lg">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-background/95 border-white/10 backdrop-blur-md italic min-w-[140px]">
                            <DropdownMenuItem onClick={() => openEditDialog(style)} className="gap-2 cursor-pointer">
                              <Pencil className="w-3.5 h-3.5" />
                              Edit Info
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openDatePicker(style)} className="gap-2 cursor-pointer">
                              <CalendarIcon className="w-3.5 h-3.5" />
                              Change Date
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-white/5" />
                            <DropdownMenuItem onClick={() => { setSelectedStyle(style); setIsDeleteDialogOpen(true); }} className="gap-2 text-destructive cursor-pointer">
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/90 via-black/20 to-transparent">
                        <p className="text-[9px] text-white/70 font-black uppercase tracking-widest italic">{style.styleDate}</p>
                      </div>
                    </div>
                    <div className="space-y-1.5 px-0.5">
                      <div className="flex flex-col">
                        <h3 className="text-[13px] font-bold text-white italic truncate leading-tight">
                          {style.styleName || style.name?.split(' — ')[0]}
                        </h3>
                        <p className="text-[10px] text-muted-foreground italic truncate">
                          {style.duration || style.name?.split(' — ')[1]}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {style.scalpConditions?.slice(0, 2).map((c: string) => (
                          <Badge 
                            key={c} 
                            variant="outline" 
                            className="text-[7px] font-black uppercase tracking-[0.15em] px-2 py-0.5 border-white/5 bg-white/5 text-white/40 italic leading-none"
                          >
                            {c}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center space-y-4 italic">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center border border-dashed border-white/20">
                <Flower2 className="w-8 h-8 text-muted-foreground opacity-20" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">Your looking glass is clear</h3>
                <p className="text-xs text-muted-foreground max-w-[200px] mx-auto opacity-60">Save the moments when your crown shines. This is your personal sanctuary of memory.</p>
              </div>
              <Link href="/analysis" className="block pt-2">
                <Button variant="outline" className="border-primary/50 text-primary hover:bg-primary/10 italic">Capture First Reflection</Button>
              </Link>
            </div>
          )}
        </main>
      </AuthGate>

      {/* Edit Info Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md bg-background border-white/10 p-0 overflow-hidden h-[85vh] flex flex-col">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="italic text-xl">Refine the Vision</DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 px-6">
            <div className="space-y-6 py-4">
              <div className="space-y-3">
                <Label className="text-xs font-bold uppercase tracking-widest text-primary italic">Style</Label>
                <div className="grid grid-cols-2 gap-2">
                  {HAIRSTYLE_CATEGORIES.flatMap(c => c.styles).map(s => (
                    <button
                      key={s}
                      onClick={() => setEditData({...editData, style: s})}
                      className={cn(
                        "p-2 border rounded-lg text-[10px] italic transition-all",
                        editData.style === s ? "border-primary bg-primary/5 text-primary shadow-[0_0_10px_-2px_hsl(var(--primary)/0.2)]" : "border-white/5 bg-white/5"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-bold uppercase tracking-widest text-primary italic">Duration</Label>
                <RadioGroup value={editData.duration} onValueChange={(v) => setEditData({...editData, duration: v})} className="grid grid-cols-2 gap-2">
                  {DURATION_OPTIONS.map(o => (
                    <div key={o} className="relative">
                      <RadioGroupItem value={o} id={`edit-${o}`} className="peer sr-only" />
                      <Label htmlFor={`edit-${o}`} className="flex items-center justify-center p-2 border rounded-lg bg-white/5 border-white/5 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer text-[10px] italic">
                        {o}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-3 pb-8">
                <Label className="text-xs font-bold uppercase tracking-widest text-primary italic">Scalp Condition</Label>
                <div className="space-y-2">
                  {SCALP_CONDITIONS.map(c => (
                    <button
                      key={c.value}
                      onClick={() => toggleScalpCondition(c.value)}
                      className={cn(
                        "w-full p-3 border rounded-lg text-left transition-all flex justify-between items-center",
                        editData.scalpConditions.includes(c.value) ? "border-primary bg-primary/5" : "border-white/5 bg-white/5"
                      )}
                    >
                      <div>
                        <p className="text-xs font-bold italic">{c.label}</p>
                        <p className="text-[9px] text-muted-foreground italic">{c.description}</p>
                      </div>
                      {editData.scalpConditions.includes(c.value) && <Check className="w-4 h-4 text-primary" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="p-6 border-t border-white/5 bg-background">
            <Button onClick={handleUpdateInfo} disabled={isSaving || !editData.style || !editData.duration} className="w-full font-bold italic h-12 shadow-lg shadow-primary/10">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Update Vision
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Date Picker Dialog */}
      <Dialog open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
        <DialogContent className="max-w-sm bg-background border-white/10 p-6">
          <DialogHeader>
            <DialogTitle className="italic text-xl">Shift the Timeline</DialogTitle>
          </DialogHeader>
          
          <div className="py-6 flex flex-col gap-6">
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Month</Label>
                <Select value={String(tempDate.month)} onValueChange={(v) => setTempDate({...tempDate, month: parseInt(v)})}>
                  <SelectTrigger className="bg-white/5 border-white/10 italic h-10 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-white/10 italic max-h-[200px]">
                    {MONTHS.map((m, i) => (
                      <SelectItem key={m} value={String(i)}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Day</Label>
                <Select value={String(tempDate.day)} onValueChange={(v) => setTempDate({...tempDate, day: parseInt(v)})}>
                  <SelectTrigger className="bg-white/5 border-white/10 italic h-10 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-white/10 italic max-h-[200px]">
                    {days.map((d) => (
                      <SelectItem key={d} value={String(d)}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Year</Label>
                <Select value={String(tempDate.year)} onValueChange={(v) => setTempDate({...tempDate, year: parseInt(v)})}>
                  <SelectTrigger className="bg-white/5 border-white/10 italic h-10 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-white/10 italic max-h-[200px]">
                    {years.map((y) => (
                      <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button 
              onClick={handleUpdateDate} 
              className="w-full bg-primary text-background font-bold italic h-12 shadow-lg shadow-primary/10"
            >
              Update Timeline
            </Button>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDatePickerOpen(false)} className="italic text-xs text-muted-foreground">Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-background border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="italic text-white">Erase the Memory?</AlertDialogTitle>
            <AlertDialogDescription className="italic text-muted-foreground">
              This vision will be removed from your looking glass forever. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="italic border-white/10">Keep it</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground italic">
              Erase it
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNav />
    </>
  );
}
