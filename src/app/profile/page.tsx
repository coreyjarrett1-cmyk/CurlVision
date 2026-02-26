
"use client"

import { useState } from 'react';
import { User, Mail, Shield, LogOut, Settings, Award, ChevronRight, Loader2, Sparkles, Flower2, Stars, ShieldCheck, RefreshCcw, MessageSquare, Check, Star as StarIcon, Heart } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useUser, useAuth, useFirestore, useMemoFirebase, useDoc, errorEmitter, FirestorePermissionError } from '@/firebase';
import { signOut, GoogleAuthProvider, linkWithPopup, signInWithPopup } from 'firebase/auth';
import { doc, updateDoc, collection, query, getDocs, deleteDoc, setDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

const FEEDBACK_CATEGORIES = ['Quiz', 'Looking Glass', 'Grapevine', 'Wisdom', 'Village'];

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const pathname = usePathname();
  const { toast } = useToast();
  
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isPromoting, setIsPromoting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  
  // Feedback state
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [feedback, setFeedback] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [isFeedbackSubmitted, setIsFeedbackSubmitted] = useState(false);

  const userDocRef = useMemoFirebase(() => user ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: userProfile } = useDoc(userDocRef);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast({ title: "Signed out", description: "You have stepped away from the circle." });
    } catch (error: any) {
      toast({ variant: 'destructive', title: "Sign out failed", description: "Could not complete the sign out process." });
    }
  };

  const handleReset = async () => {
    if (!db || !user || !auth) return;
    setIsResetting(true);

    try {
      const subcollections = ['hairstyles', 'hairAnalyses', 'logs'];
      for (const colName of subcollections) {
        const q = query(collection(db, 'users', user.uid, colName));
        const snapshot = await getDocs(q);
        for (const docSnap of snapshot.docs) {
          await deleteDoc(docSnap.ref);
        }
      }

      await setDoc(doc(db, 'users', user.uid), { 
        onboardingComplete: false,
        phase2Complete: false,
        currentStyle: '',
        scalpConditions: [],
        weeksInstalled: '0',
        personalDescription: '',
        curlPattern: null,
        porosity: null,
        density: null
      }, { merge: true });
      
      localStorage.removeItem('curlvision_onboarding_complete');
      sessionStorage.removeItem('curlvision_phase2_invitation_seen');
      await signOut(auth);
      
      toast({
        title: "Journey reset",
        description: "Your profile and history have been cleared.",
      });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Reset failed", description: "An error occurred." });
    } finally {
      setIsResetting(false);
    }
  };

  const handleGoogleSync = async () => {
    if (!user || !auth) return;
    setIsLoggingIn(true);
    const provider = new GoogleAuthProvider();
    
    try {
      if (user.isAnonymous) {
        try {
          await linkWithPopup(user, provider);
          toast({ title: "Account Linked", description: "Your journey is now anchored to your Google account." });
        } catch (linkError: any) {
          if (linkError.code === 'auth/credential-already-in-use') {
            await signInWithPopup(auth, provider);
            toast({ title: "Welcome back", description: "We found your existing account; you are now reunited." });
          } else {
            toast({ variant: 'destructive', title: "Sync failed", description: "Could not link your account." });
          }
        }
      } else {
        await signInWithPopup(auth, provider);
        toast({ title: "Welcome back", description: "Your journey has been reunited." });
      }
    } catch (error: any) {
      if (error.code !== 'auth/cancelled-popup-request') {
        toast({ variant: 'destructive', title: "Login failed", description: "We couldn't sign you in right now." });
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSubmitFeedback = () => {
    if (!db || !user) return;
    setIsSubmittingFeedback(true);
    const feedbackData = {
      userId: user.uid,
      rating,
      usedToday: selectedCategories,
      feedbackText: feedback,
      route: pathname,
      timestamp: serverTimestamp()
    };

    addDoc(collection(db, 'feedback'), feedbackData)
      .then(() => {
        setIsFeedbackSubmitted(true);
        setTimeout(() => {
          setIsFeedbackOpen(false);
          setRating(0);
          setSelectedCategories([]);
          setFeedback('');
          setIsFeedbackSubmitted(false);
        }, 2000);
      })
      .catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'feedback',
          operation: 'create',
          requestResourceData: feedbackData
        }));
      })
      .finally(() => {
        setIsSubmittingFeedback(false);
      });
  };

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handlePromoteToAdmin = () => {
    if (!user || !db) return;
    setIsPromoting(true);
    const docRef = doc(db, 'users', user.uid);
    const updateData = { role: 'admin' };

    updateDoc(docRef, updateData)
      .then(() => {
        toast({ title: "Role Updated", description: "You are now a Village Elder." });
      })
      .catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: docRef.path,
          operation: 'update',
          requestResourceData: updateData
        }));
      })
      .finally(() => {
        setIsPromoting(false);
      });
  };

  if (isUserLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const isAnonymous = user?.isAnonymous;
  const isAdmin = userProfile?.role === 'admin';

  return (
    <>
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md p-5 border-b border-white/5">
        <h1 className="text-2xl font-bold tracking-tight text-white italic">Your Inner Sun</h1>
      </header>

      <main className="flex-1 px-5 pt-6 pb-24 space-y-8">
        <section className="flex flex-col items-center text-center space-y-4">
          <div className="relative">
            <Avatar className="w-24 h-24 border-2 border-primary/20 p-1 bg-background">
              <AvatarImage src={user?.photoURL || ''} />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold italic">
                {user?.displayName?.[0] || user?.email?.[0] || <User className="w-10 h-10" />}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1.5 border-2 border-background shadow-lg">
              <Stars className="w-3 h-3 text-background" />
            </div>
          </div>
          
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white italic">{user?.displayName || (isAnonymous ? 'Traveling Spirit' : 'Community Soul')}</h2>
            <div className="flex items-center justify-center gap-2">
               <p className="text-xs text-muted-foreground italic">{user?.email || 'A private session'}</p>
               {userProfile?.role && <Badge className="bg-primary/10 text-primary border-primary/20 text-[8px] font-black uppercase">{userProfile.role}</Badge>}
            </div>
          </div>
        </section>

        {isAdmin && (
          <Link href="/admin">
            <Button className="w-full h-14 bg-primary text-background font-bold gap-3 italic">
              <ShieldCheck className="w-5 h-5" />
              Village Council Dashboard
            </Button>
          </Link>
        )}

        {isAnonymous && (
          <Card className="bg-primary/5 border-primary/20 overflow-hidden">
            <CardContent className="p-5 space-y-4">
              <div className="flex gap-4">
                <div className="p-2 bg-primary/10 rounded-lg text-primary shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white italic">Protect your journey</h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed italic">
                    Anchor your account to the collective to save your roots and reflections forever.
                  </p>
                </div>
              </div>
              <Button onClick={handleGoogleSync} disabled={isLoggingIn} className="w-full bg-white text-black font-bold h-11 hover:bg-white/90 italic">
                {isLoggingIn ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <div className="w-4 h-4 mr-2 bg-black flex items-center justify-center rounded-sm"><span className="text-[10px] text-white">G</span></div>}
                Sync with Google
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Temporary Developer Button to test RBAC */}
        {!userProfile?.role && !isUserLoading && (
          <Button 
            variant="outline" 
            className="w-full border-dashed border-primary/30 text-primary text-xs italic opacity-50 hover:opacity-100"
            onClick={handlePromoteToAdmin}
            disabled={isPromoting}
          >
            {isPromoting ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <ShieldCheck className="w-3 h-3 mr-2" />}
            (Dev) Become Village Elder
          </Button>
        )}

        <section className="space-y-4">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground border-b border-white/5 pb-2 italic">Spirit Stats</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1">
              <p className="text-xl font-black text-white italic">0</p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold italic">Circle Voices</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1">
              <p className="text-xl font-black text-white italic">0</p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold italic">Visions Held</p>
            </div>
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground border-b border-white/5 pb-2 italic">Preferences</h3>
          
          <Sheet open={isFeedbackOpen} onOpenChange={setIsFeedbackOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" className="w-full justify-between h-14 hover:bg-white/5 px-2">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium italic">Share Feedback</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="bg-background border-white/10 rounded-t-3xl h-auto max-h-[90vh] overflow-y-auto outline-none">
              <SheetHeader className="p-4 pt-2">
                <SheetTitle className="italic text-xl text-center">Village Feedback</SheetTitle>
                <SheetDescription className="text-center italic text-muted-foreground">Help us nurture the circle.</SheetDescription>
              </SheetHeader>
              {isFeedbackSubmitted ? (
                <div className="py-12 flex flex-col items-center gap-4 text-center">
                  <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center text-primary border border-primary/20">
                    <Check className="w-8 h-8" />
                  </div>
                  <p className="font-bold italic text-white text-lg">Thank you for your voice.</p>
                </div>
              ) : (
                <div className="px-4 pb-12 space-y-8 max-w-sm mx-auto">
                  <div className="space-y-3 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary italic">How was your session?</p>
                    <div className="flex justify-center gap-2">
                      {[1, 2, 3, 4, 5].map(s => (
                        <button key={s} onClick={() => setRating(s)} className={cn("p-1 transition-all", rating >= s ? "text-primary" : "text-muted-foreground")}>
                          <StarIcon className={cn("w-8 h-8", rating >= s && "fill-primary")} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary italic">What did you use today?</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {FEEDBACK_CATEGORIES.map(cat => (
                        <button key={cat} onClick={() => toggleCategory(cat)} className={cn("px-4 py-2 rounded-full border text-[9px] font-bold uppercase tracking-widest transition-all italic", selectedCategories.includes(cat) ? "bg-primary text-background border-primary" : "bg-white/5 text-muted-foreground border-white/10")}>
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary italic text-center">Improvements or Confusion?</p>
                    <Textarea placeholder="Speak your mind, spirit..." value={feedback} onChange={(e) => setFeedback(e.target.value)} className="bg-white/5 border-white/10 italic text-sm min-h-[100px]" />
                  </div>
                  <Button onClick={handleSubmitFeedback} disabled={isSubmittingFeedback || rating === 0} className="w-full h-12 bg-primary text-background font-bold italic">
                    {isSubmittingFeedback ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Send to the Village
                  </Button>
                </div>
              )}
            </SheetContent>
          </Sheet>

          <Button variant="ghost" className="w-full justify-between h-14 hover:bg-white/5 px-2">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium italic">Quiet Reminders</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" className="w-full justify-between h-14 hover:bg-white/5 px-2 text-primary">
                <div className="flex items-center gap-3">
                  <RefreshCcw className="w-4 h-4" />
                  <span className="text-sm font-medium italic">Reset Journey</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-background border-white/10">
              <AlertDialogHeader>
                <AlertDialogTitle className="italic text-white">Reset your journey?</AlertDialogTitle>
                <AlertDialogDescription className="italic text-muted-foreground">
                  This will clear your profile and history from the Village logs. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="italic border-white/10">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleReset} className="bg-primary text-background font-bold italic">
                  {isResetting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Yes, reset all
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button variant="ghost" className="w-full justify-between h-14 hover:bg-white/5 px-2 text-destructive" onClick={handleSignOut}>
            <div className="flex items-center gap-3">
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium italic">Sign out</span>
            </div>
          </Button>

          <div className="pt-8 pb-4 text-center">
            <p className="text-[11px] text-muted-foreground italic leading-relaxed px-6">
              Thank you for being a part of the CurlVision circle. Your commitment to your crown inspires this entire sanctuary.
            </p>
          </div>
        </section>

        <footer className="text-center pt-4 pb-12">
          <Flower2 className="w-4 h-4 text-primary mx-auto mb-2 opacity-30" />
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest italic">CurlVision v1.0.5</p>
          <p className="text-[9px] text-muted-foreground mt-1 opacity-50 italic">"Be still, and let your hair speak."</p>
        </footer>
      </main>

      <BottomNav />
    </>
  );
}
