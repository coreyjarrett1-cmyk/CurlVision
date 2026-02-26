
'use client';

import { useState } from 'react';
import { useUser, useAuth } from '@/firebase';
import { 
  GoogleAuthProvider, 
  linkWithPopup, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  EmailAuthProvider,
  linkWithCredential
} from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Shield, Mail, Lock, ChevronLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailFields, setShowEmailFields] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (isUserLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // If user is authenticated (not anonymous), show content
  if (user && !user.isAnonymous) {
    return <>{children}</>;
  }

  const handleGoogleSignIn = async () => {
    if (!auth || !user) return;
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      if (user.isAnonymous) {
        // This links the current anonymous session to the Google account
        // preserving the UID and Firestore data
        await linkWithPopup(user, provider);
        toast({ title: "Journey Secured", description: "Your anonymous profile is now permanent." });
      } else {
        await signInWithPopup(auth, provider);
      }
    } catch (error: any) {
      if (error.code === 'auth/credential-already-in-use') {
        // If the Google account is already used, we have to sign in with it
        await signInWithPopup(auth, provider);
        toast({ title: "Welcome back", description: "Signed in to your existing account." });
      } else {
        toast({ variant: 'destructive', title: "Auth failed", description: "Please try again." });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAction = async () => {
    if (!auth || !user || !email || !password) return;
    setIsLoading(true);
    try {
      if (isSignUp) {
        const credential = EmailAuthProvider.credential(email, password);
        if (user.isAnonymous) {
          await linkWithCredential(user, credential);
          toast({ title: "Account Created", description: "Your journey is now tied to your email." });
        } else {
          await createUserWithEmailAndPassword(auth, email, password);
        }
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast({ title: "Welcome back", description: "Successfully signed in." });
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: "Auth error", description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-8 animate-in fade-in duration-700 bg-background min-h-[80vh]">
      <div className="relative">
        <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center border border-primary/20 shadow-2xl">
          <Shield className="w-12 h-12 text-primary" />
        </div>
        <div className="absolute top-0 right-0 p-2 bg-primary text-background rounded-full shadow-lg">
          <Lock className="w-4 h-4" />
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-2xl font-bold tracking-tight italic">Join the community to unlock this feature</h2>
        <p className="text-sm text-muted-foreground italic max-w-[260px] mx-auto leading-relaxed">
          The Village Circle and your personal Looking Glass are spaces held for our permanent members.
        </p>
      </div>

      <Card className="w-full bg-white/5 border-white/10 overflow-hidden backdrop-blur-sm">
        <CardContent className="p-6 space-y-4">
          {!showEmailFields ? (
            <>
              <Button 
                onClick={handleGoogleSignIn} 
                disabled={isLoading} 
                className="w-full bg-white text-black font-bold h-12 hover:bg-white/90 italic transition-all active:scale-95"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Continue with Google
              </Button>

              <div className="relative flex items-center gap-4 py-2">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">or</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              <Button 
                variant="outline" 
                onClick={() => setShowEmailFields(true)} 
                className="w-full border-white/10 h-12 italic hover:bg-white/5"
              >
                <Mail className="w-4 h-4 mr-2" />
                Use Email address
              </Button>
            </>
          ) : (
            <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-2 mb-2">
                <Button variant="ghost" size="icon" onClick={() => setShowEmailFields(false)} className="h-8 w-8 rounded-full">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <h3 className="text-sm font-bold italic text-white">{isSignUp ? 'Create your profile' : 'Sign in to your soul'}</h3>
              </div>
              
              <div className="space-y-3">
                <div className="space-y-1 text-left">
                  <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground ml-1">Email</Label>
                  <Input 
                    placeholder="spirit@curlvision.ai" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    className="bg-background/50 border-white/10 italic h-12" 
                  />
                </div>
                <div className="space-y-1 text-left">
                  <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground ml-1">Password</Label>
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    className="bg-background/50 border-white/10 italic h-12" 
                  />
                </div>
              </div>

              <Button onClick={handleEmailAction} disabled={isLoading} className="w-full bg-primary text-background font-bold h-12 italic">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {isSignUp ? 'Create Permanent Journey' : 'Reunite with Journey'}
              </Button>

              <button 
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-[10px] text-primary font-bold uppercase tracking-widest italic hover:underline"
              >
                {isSignUp ? 'Already have a profile? Sign In' : 'New to the Circle? Sign Up'}
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="pt-4 flex flex-col items-center gap-4">
        <p className="text-[9px] text-muted-foreground uppercase tracking-[0.2em] italic">Your privacy is sacred</p>
        <div className="w-8 h-px bg-white/10" />
      </div>
    </div>
  );
}
