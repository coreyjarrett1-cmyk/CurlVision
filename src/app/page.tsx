
"use client"

import { useState, useEffect, useMemo } from 'react';
import { Activity, Calendar, AlertCircle, Droplets, Plus, Sparkles, Loader2, Camera, ClipboardCheck, RefreshCcw, Clock, AlertTriangle, Flower2, Stars, ChevronRight, Sparkle, Info, X } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useMemoFirebase, useCollection, useAuth, initiateAnonymousSignIn } from '@/firebase';
import { collection, doc, setDoc, query, orderBy, limit, serverTimestamp, getDoc, addDoc } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const SPLASH_KEY = 'last_splash_timestamp';
const ONBOARDING_COMPLETE_KEY = 'curlvision_onboarding_complete';
const PHASE2_INVITATION_SEEN_KEY = 'curlvision_phase2_invitation_seen';
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const HAIRSTYLE_CATEGORIES = [
  {
    name: 'Protective Styles',
    styles: ['Box Braids', 'Cornrows', 'Twists', 'Wig/Weave', 'Crochet']
  },
  {
    name: 'Natural/Free Styles',
    styles: ['Afro', 'TWA (Teeny Weeny Afro)', 'Wash and Go', 'Twist Out', 'Bantu Knots', 'Freeform Locs']
  },
  {
    name: 'Maintained Styles',
    styles: ['Locs (Maintained)', 'Silk Press', 'Waves (360/540)']
  },
  {
    name: 'Short Styles',
    styles: ['Fade/Taper', 'Buzz Cut', 'TWA', 'Bald/Shaved']
  }
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

export default function RootDashboard() {
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  
  const [hasMounted, setHasMounted] = useState(false);
  const [showSplash, setShowSplash] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizStep, setQuizStep] = useState(1);
  const [showPhase2Invitation, setShowPhase2Invitation] = useState(false);
  const [showPhase2Quiz, setShowPhase2Quiz] = useState(false);
  const [phase2Step, setPhase2Step] = useState(1);
  const [showUpdateCrown, setShowUpdateCrown] = useState(false);
  const [updateCrownStep, setUpdateCrownStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [frequencyValue, setFrequencyValue] = useState(0);
  
  const [quizData, setQuizData] = useState({
    currentStyle: '',
    otherStyleText: '',
    scalpConditions: [] as string[],
    weeksInstalled: '0',
    personalDescription: ''
  });

  const [phase2Data, setPhase2Data] = useState({
    curlBehavior: '',
    moistureBehavior: '',
    thicknessBehavior: ''
  });

  const [updateCrownData, setUpdateCrownData] = useState({
    style: '',
    otherStyleText: '',
    duration: '',
    scalpConditions: [] as string[]
  });

  useEffect(() => {
    setHasMounted(true);
    const lastSplash = typeof window !== 'undefined' ? localStorage.getItem(SPLASH_KEY) : null;
    const now = Date.now();
    if (!lastSplash || (now - parseInt(lastSplash)) > ONE_DAY_MS) {
      setShowSplash(true);
      if (typeof window !== 'undefined') localStorage.setItem(SPLASH_KEY, now.toString());
      setTimeout(() => setShowSplash(false), 2500);
    }
  }, []);

  useEffect(() => {
    if (!isUserLoading && !user && auth) {
      initiateAnonymousSignIn(auth);
    }

    const checkOnboarding = async () => {
      if (!user || !db) return;

      const locallyComplete = localStorage.getItem(ONBOARDING_COMPLETE_KEY) === 'true';

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(data);
          
          if (data?.onboardingComplete) {
            setShowQuiz(false);
            localStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
          } else if (!locallyComplete) {
            setShowQuiz(true);
          }
        } else {
          if (!locallyComplete) {
            setShowQuiz(true);
          }
        }
      } catch (error) {
        console.error("Error checking onboarding:", error);
      }
    };
    
    if (user && db) checkOnboarding();
  }, [user, isUserLoading, auth, db]);

  useEffect(() => {
    if (!hasMounted) return;

    const isAnonymous = user?.isAnonymous;
    const isPhase1Done = userData?.onboardingComplete || localStorage.getItem(ONBOARDING_COMPLETE_KEY) === 'true';
    const isPhase2Done = userData?.phase2Complete;
    const hasSeenInvitation = sessionStorage.getItem(PHASE2_INVITATION_SEEN_KEY) === 'true';

    if (!isUserLoading && user && !isAnonymous && isPhase1Done && !isPhase2Done && !hasSeenInvitation && !showQuiz) {
      setShowPhase2Invitation(true);
      sessionStorage.setItem(PHASE2_INVITATION_SEEN_KEY, 'true');
    }
  }, [user, isUserLoading, userData, showQuiz, hasMounted]);

  const logsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'users', user.uid, 'logs'), orderBy('date', 'desc'), limit(5));
  }, [db, user]);

  const { data: logs, isLoading: logsLoading } = useCollection(logsQuery);

  const allStylesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'users', user.uid, 'hairstyles'), orderBy('createdAt', 'desc'));
  }, [db, user]);

  const { data: allStyles } = useCollection(allStylesQuery);
  const latestStyle = allStyles?.[0];

  useEffect(() => {
    if (!hasMounted || !userData) return;

    let score = 0;
    
    if (userData?.onboardingComplete) score += 20;
    if (userData?.phase2Complete) score += 30;
    
    const uploadCount = allStyles?.length || 0;
    score += Math.min(30, uploadCount * 5);
    
    if (userData?.createdAt) {
      const createdDate = new Date(userData.createdAt).getTime();
      const now = Date.now();
      const daysSince = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
      score += Math.min(20, daysSince);
    } else {
      score += 1;
    }
    
    setFrequencyValue(Math.min(100, score));
  }, [userData, allStyles, hasMounted]);

  const frequencyExplanation = useMemo(() => {
    if (frequencyValue <= 30) return 'Getting started — Log your first style to begin your data-driven care.';
    if (frequencyValue <= 60) return 'Building your profile — Regular updates help our AI understand your unique rhythm.';
    if (frequencyValue <= 85) return 'Consistent care — Your hair profile is rich, enabling highly accurate advice.';
    return 'Optimal engagement — Your Crown profile is perfectly tuned for maximum guidance.';
  }, [frequencyValue]);

  const handleQuizSubmit = async () => {
    if (!db || !user) return;
    setIsSubmitting(true);
    
    try {
      const finalStyle = quizData.currentStyle === 'Other' ? quizData.otherStyleText : quizData.currentStyle;
      
      const onboardingData = {
        currentStyle: finalStyle,
        scalpConditions: quizData.scalpConditions,
        weeksInstalled: quizData.weeksInstalled,
        personalDescription: quizData.personalDescription,
        onboardingComplete: true,
        updatedAt: serverTimestamp(),
        id: user.uid,
        email: user.email || 'anonymous',
        displayName: user.displayName || 'Guest User',
        createdAt: userData?.createdAt || new Date().toISOString(),
      };

      await setDoc(doc(db, 'users', user.uid), onboardingData, { merge: true });
      localStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
      setUserData(onboardingData);
      setShowQuiz(false);
      
      toast({
        title: "Profile updated",
        description: "Your hair journey profile has been saved.",
      });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Update failed", description: error.message || "Could not save your profile." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhase2Submit = async () => {
    if (!db || !user) return;
    setIsSubmitting(true);
    
    try {
      const curlMappings: Record<string, string> = {
        'Loose curls — you can see defined S-shapes': 'Loose Curls',
        'Curly — springs and coils that bounce': 'Curly',
        'Tight coils — zig-zag patterns, lots of shrinkage': 'Tight Coils',
        'Waves — more ripple than curl': 'Waves',
        'Straight or mostly straight': 'Straight',
        'I\'m not sure': 'Undetermined'
      };

      const porosityMappings: Record<string, string> = {
        'Soaks in almost immediately': 'High',
        'Takes a while to absorb, water beads up at first': 'Low',
        'Somewhere in between': 'Medium',
        'I\'m not sure': 'Undetermined'
      };

      const densityMappings: Record<string, string> = {
        'Thin — can see my scalp easily through my hair': 'Thin',
        'Medium — good coverage, average fullness': 'Medium',
        'Thick — a lot of hair, takes forever to dry': 'Thick',
        'I\'m not sure': 'Undetermined'
      };

      const finalData = {
        curlPattern: curlMappings[phase2Data.curlBehavior] || 'Undetermined',
        porosity: porosityMappings[phase2Data.moistureBehavior] || 'Undetermined',
        density: densityMappings[phase2Data.thicknessBehavior] || 'Undetermined',
        phase2Complete: true,
        updatedAt: serverTimestamp()
      };

      await setDoc(doc(db, 'users', user.uid), finalData, { merge: true });
      setUserData({ ...userData, ...finalData });
      setShowPhase2Quiz(false);
      
      toast({
        title: "Profile perfected",
        description: "Your crown's data is now complete.",
      });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Update failed", description: "Could not save Phase 2 data." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateCrownSubmit = async () => {
    if (!db || !user) return;
    setIsSubmitting(true);
    
    try {
      const finalStyle = updateCrownData.style === 'Other' ? updateCrownData.otherStyleText : updateCrownData.style;
      const combinedName = `${finalStyle} — ${updateCrownData.duration}`;
      const placeholderUrl = `https://picsum.photos/seed/${Date.now()}/800/1000`;

      await addDoc(collection(db, 'users', user.uid, 'hairstyles'), {
        name: combinedName,
        styleName: finalStyle,
        duration: updateCrownData.duration,
        scalpConditions: updateCrownData.scalpConditions,
        imageUrl: placeholderUrl,
        userId: user.uid,
        styleDate: new Date().toLocaleDateString(),
        createdAt: serverTimestamp(),
        isTextOnly: true
      });

      setShowUpdateCrown(false);
      setUpdateCrownStep(1);
      setUpdateCrownData({ style: '', otherStyleText: '', duration: '', scalpConditions: [] });
      toast({ title: "Crown updated", description: "Your journey has been noted." });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Update failed', description: "Could not update your crown." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateRemainingDays = () => {
    const styleData = latestStyle || userData;
    const styleName = styleData?.styleName || styleData?.currentStyle || "";
    
    if (styleName.toLowerCase().includes('bald') || styleName.toLowerCase().includes('shaved') || styleName.toLowerCase().includes('buzz')) {
      return null;
    }

    const weeksStr = styleData?.weeksInstalled || styleData?.duration?.match(/\d+/)?.[0] || '0';
    if (styleData?.duration === 'Fresh') return 56;
    const weeks = parseInt(weeksStr);
    const maxWeeks = 8;
    const remaining = (maxWeeks - weeks) * 7;
    return Math.max(0, remaining);
  };

  const getAdviceText = () => {
    const styleData = latestStyle || userData;
    const styleName = styleData?.styleName || styleData?.currentStyle || "Natural";
    const duration = styleData?.duration || "Fresh";
    const weeksStr = duration.match(/\d+/)?.[0] || '0';
    const weeks = duration === 'Fresh' ? 0 : parseInt(weeksStr);
    const conditions = styleData?.scalpConditions || [];
    
    const isPhase2 = userData?.phase2Complete;
    const porosity = userData?.porosity;
    const remainingDays = calculateRemainingDays();

    let advice = "";

    if (duration === 'Fresh') {
      advice = `Your ${styleName} is in its prime. This is the perfect time to focus on establishing a gentle moisture routine. Ensure you aren't applying too much tension to the roots.`;
    } else if (weeks >= 6) {
      advice = `Your ${styleName} has been with you for a full season now. To keep your hair thriving, it might be time to consider a refresh or takedown to give your scalp a deep reset.`;
    } else if (weeks >= 3) {
      advice = `Mid-season for your ${styleName}. Focus on keeping your scalp clear of buildup and your strands hydrated to maintain the integrity of the style.`;
    } else {
      advice = `Your current ${styleName} journey is well underway. Consistency in your hydration routine is the key to maintaining your hair's natural vitality.`;
    }

    if (conditions.includes('dry/flaky') || conditions.includes('itchy')) {
      advice += ` We noticed you mentioned some scalp sensitivity—consider a light, soothing mist today to restore balance.`;
    }

    if (isPhase2) {
      if (porosity === 'High') {
        advice += " Since your hair absorbs moisture quickly, remember to seal it in with your favorite oil or butter.";
      } else if (porosity === 'Low') {
        advice += " With your hair's unique breath, using a bit of warmth during conditioning can help your care products work more effectively.";
      }
    }

    if (remainingDays !== null && remainingDays <= 10 && remainingDays > 0) {
      advice += " As your style reaches its mature stage, consider scheduling your next session soon to keep your hair healthy.";
    }

    return advice;
  };

  if (showSplash) {
    return (
      <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center p-8 text-center">
        <div className="relative">
          <div className="w-24 h-24 bg-primary/10 rounded-full animate-pulse absolute inset-0" />
          <div className="relative w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center shadow-2xl">
            <Flower2 className="w-10 h-10 text-primary animate-bounce" />
          </div>
        </div>
        <h1 className="mt-8 text-3xl font-bold tracking-tighter text-white italic">
          Welcome to <span className="text-primary">CurlVision</span>
        </h1>
        <p className="mt-4 text-sm text-muted-foreground italic font-medium">Nurturing your hair journey.</p>
      </div>
    );
  }

  const isAnonymous = user?.isAnonymous;
  const showPhase2Card = hasMounted && !isAnonymous && (userData?.onboardingComplete || localStorage.getItem(ONBOARDING_COMPLETE_KEY) === 'true') && !userData?.phase2Complete;

  return (
    <>
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md p-5 border-b border-white/5">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white italic">CurlVision</h1>
            <p className="text-[10px] text-primary font-bold uppercase tracking-[0.1em] mt-0.5">Your personalized hair care companion</p>
          </div>
          <div className="flex gap-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
              <Flower2 className="w-5 h-5 text-primary" />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 px-5 pt-6 pb-24 space-y-8">
        <section className="grid grid-cols-2 gap-3">
          <Link href="/analysis" className="block">
            <Button className="w-full h-24 bg-primary/5 border border-primary/20 hover:bg-primary/10 text-white rounded-2xl flex flex-col items-center justify-center p-3 group transition-all text-center">
              <div className="p-2.5 bg-primary/10 rounded-xl group-hover:scale-110 transition-transform mb-2">
                <Camera className="w-6 h-6 text-primary" />
              </div>
              <div className="space-y-0.5">
                <h3 className="font-bold text-xs italic">Refreshed Crown</h3>
                <p className="text-[9px] text-muted-foreground uppercase tracking-widest">New style with photo</p>
              </div>
            </Button>
          </Link>
          <Button 
            onClick={() => setShowUpdateCrown(true)}
            className="w-full h-24 bg-primary/5 border border-primary/20 hover:bg-primary/10 text-white rounded-2xl flex flex-col items-center justify-center p-3 group transition-all text-center"
          >
            <div className="p-2.5 bg-primary/10 rounded-xl group-hover:scale-110 transition-transform mb-2">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div className="space-y-0.5">
              <h3 className="font-bold text-xs italic">Updated Crown</h3>
              <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Quick Update</p>
            </div>
          </Button>
        </section>

        {showPhase2Card && (
          <section className="animate-in fade-in slide-in-from-top-4 duration-1000">
            <Card className="bg-primary/5 border border-primary/30 glow-primary overflow-hidden">
              <CardContent className="p-5 space-y-4">
                <div className="flex gap-4">
                  <div className="p-2.5 bg-primary/20 rounded-xl text-primary shrink-0 animate-pulse">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white italic">Complete Your Profile</h4>
                    <p className="text-[11px] text-muted-foreground leading-relaxed italic">Unlock deeper insights — complete your hair profile to see your natural rhythm and moisture breath.</p>
                  </div>
                </div>
                <Button onClick={() => setShowPhase2Quiz(true)} className="w-full bg-primary text-background font-bold h-11 hover:bg-primary/90 italic shadow-lg shadow-primary/20">
                  Refine My Profile
                </Button>
              </CardContent>
            </Card>
          </section>
        )}

        <section>
          <div className="relative rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 p-6 glow-primary">
            <div className="flex items-center justify-between mb-4">
              <div className="space-y-2 flex-1 mr-4">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold text-white italic">Care Consistency Score</h3>
                  <Dialog>
                    <DialogTrigger asChild>
                      <button className="text-muted-foreground hover:text-primary transition-colors">
                        <Info className="w-3.5 h-3.5" />
                      </button>
                    </DialogTrigger>
                    <DialogContent className="bg-background border-white/10 max-w-sm">
                      <DialogHeader>
                        <DialogTitle className="italic text-xl">What is this score?</DialogTitle>
                        <DialogDescription className="italic text-muted-foreground leading-relaxed pt-2">
                          Your consistency score represents how well our AI understands your hair journey.
                          <br /><br />
                          Points are earned for:
                          <ul className="list-disc pl-4 mt-2 space-y-1">
                            <li>Profile completion (milestones)</li>
                            <li>Logging your hairstyles regularly</li>
                            <li>Tracking your daily care activities</li>
                          </ul>
                          <br />
                          A higher score means our AI can provide more precise, data-driven advice for your unique crown.
                        </DialogDescription>
                      </DialogHeader>
                    </DialogContent>
                  </Dialog>
                </div>
                <p className="text-[10px] leading-relaxed text-muted-foreground italic">{frequencyExplanation}</p>
              </div>
              <div className="relative flex items-center justify-center w-20 h-20 shrink-0">
                 <svg className="w-full h-full -rotate-90">
                  <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-white/5" />
                  <circle
                    cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="4" fill="transparent"
                    strokeDasharray={226.2}
                    strokeDashoffset={226.2 * (1 - frequencyValue / 100)}
                    className="text-primary transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-lg font-black text-white leading-none">{frequencyValue}</span>
                  <span className="text-[8px] font-bold text-primary uppercase tracking-widest mt-0.5">{frequencyValue > 85 ? 'OPTIMAL' : frequencyValue > 60 ? 'ACTIVE' : 'GROWING'}</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 pt-2">
              {!userData?.phase2Complete ? (
                <button onClick={() => setShowPhase2Quiz(true)} className="w-full text-left">
                  <Badge variant="outline" className="bg-primary/10 border-primary/30 text-[10px] text-primary py-1.5 px-3 font-bold uppercase tracking-wider w-full justify-between hover:bg-primary/20 transition-colors">
                    <span>Complete Your Crown to reveal metrics</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Badge>
                </button>
              ) : (
                <div className="grid grid-cols-3 gap-2 w-full">
                  <div className="bg-white/5 border border-white/5 rounded-lg p-2 text-center">
                    <p className="text-[7px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Curl Pattern</p>
                    <p className="text-[9px] font-bold text-primary truncate italic">{userData?.curlPattern}</p>
                  </div>
                  <div className="bg-white/5 border border-white/5 rounded-lg p-2 text-center">
                    <p className="text-[7px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Moisture</p>
                    <p className="text-[9px] font-bold text-primary truncate italic">{userData?.porosity}</p>
                  </div>
                  <div className="bg-white/5 border border-white/5 rounded-lg p-2 text-center">
                    <p className="text-[7px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Fullness</p>
                    <p className="text-[9px] font-bold text-primary truncate italic">{userData?.density}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-2">
            <div className="flex items-center gap-2 flex-1">
              <Stars className="w-4 h-4 text-primary" />
              <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary italic truncate">The Grapevine says:</h2>
            </div>
          </div>
          <Card className="bg-primary/5 border-primary/10 overflow-hidden relative">
            <CardContent className="p-5 space-y-5">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-white italic">{(latestStyle?.styleName || userData?.currentStyle || "Natural")} Journey</h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      {latestStyle?.duration === 'Fresh' ? 'New style started' : `Active for ${latestStyle?.duration || (userData?.weeksInstalled + ' weeks')}`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {calculateRemainingDays() !== null ? (
                    <>
                      <p className="text-3xl font-black text-white">{calculateRemainingDays()}</p>
                      <p className="text-[9px] text-primary font-bold uppercase tracking-widest">Days Left</p>
                    </>
                  ) : (
                    <div className="p-1.5 bg-primary/20 rounded-lg">
                      <Stars className="w-6 h-6 text-primary" />
                    </div>
                  )}
                </div>
              </div>
              
              {calculateRemainingDays() !== null && (
                <Progress value={Math.min(100, (parseInt(latestStyle?.duration?.match(/\d+/)?.[0] || userData?.weeksInstalled || '0') / 8) * 100)} className="h-1.5 bg-primary/10" />
              )}

              <div className="p-4 bg-background/40 rounded-xl border border-white/5 flex gap-3 items-start">
                <Flower2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed italic text-white/80">
                  {getAdviceText()}
                </p>
              </div>
            </CardContent>
          </Card>
          <Link href="/analysis" className="block">
            <Button variant="outline" className="w-full border-primary/20 text-primary italic font-bold h-11 hover:bg-primary/5">
              <RefreshCcw className="w-4 h-4 mr-2" /> Update Current Style
            </Button>
          </Link>
        </section>

        <section className="space-y-4">
          <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Recent Activity</h2>
            <button className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-1 hover:opacity-80">
              <Plus className="w-3.5 h-3.5" /> Add Log
            </button>
          </div>

          <div className="space-y-3">
            {logsLoading ? (
               <div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : logs && logs.length > 0 ? (
              logs.map((log) => (
                <LogItem 
                  key={log.id} 
                  title={log.type} 
                  date={log.date ? new Date(log.date).toLocaleDateString() : 'Date unknown'} 
                  status={log.status || "Completed"} 
                />
              ))
            ) : (
              <div className="p-8 text-center bg-white/5 rounded-2xl border border-dashed border-white/10 italic">
                <ClipboardCheck className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-30" />
                <p className="text-xs text-muted-foreground">No recent logs. Start tracking your care.</p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Onboarding Quiz */}
      <Dialog open={showQuiz} onOpenChange={(open) => { if (!isSubmitting) setShowQuiz(open) }}>
        <DialogContent className="max-w-md bg-background border-white/10 p-0 overflow-hidden h-[85vh] flex flex-col">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="text-2xl font-bold italic">Welcome to CurlVision</DialogTitle>
            <DialogDescription className="text-muted-foreground italic">Let's set up your hair profile.</DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 px-6">
            {quizStep === 1 && (
              <div className="space-y-6 py-4 pb-12">
                <Label className="text-sm font-bold uppercase tracking-widest text-primary italic">Current hairstyle</Label>
                <RadioGroup value={quizData.currentStyle} onValueChange={(val) => setQuizData({...quizData, currentStyle: val})}>
                  {HAIRSTYLE_CATEGORIES.map((cat) => (
                    <div key={cat.name} className="space-y-3">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground italic border-b border-white/5 pb-1">{cat.name}</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {cat.styles.map((style) => (
                          <div key={style} className="relative">
                            <RadioGroupItem value={style} id={`quiz-${style}`} className="peer sr-only" />
                            <Label htmlFor={`quiz-${style}`} className="flex flex-col items-center justify-center p-3 border rounded-xl bg-white/5 border-white/10 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 transition-all cursor-pointer text-center h-full min-h-[44px]">
                              <span className="text-xs font-bold italic">{style}</span>
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground italic border-b border-white/5 pb-1">Other</h4>
                    <div className="flex flex-col gap-2">
                      <div className="relative">
                        <RadioGroupItem value="Other" id="quiz-other-style" className="peer sr-only" />
                        <Label htmlFor="quiz-other-style" className={cn(
                          "flex flex-col items-center justify-center p-3 border rounded-xl bg-white/5 border-white/10 transition-all cursor-pointer text-center h-full min-h-[44px]",
                          quizData.currentStyle === 'Other' && "border-primary bg-primary/5"
                        )}>
                          <span className="text-xs font-bold italic">Something else</span>
                        </Label>
                      </div>
                      {quizData.currentStyle === 'Other' && (
                        <Input 
                          placeholder="Tell us about your style..." 
                          className="bg-background/50 border-white/10 text-xs italic"
                          value={quizData.otherStyleText}
                          onChange={(e) => setQuizData({...quizData, otherStyleText: e.target.value})}
                          autoFocus
                        />
                      )}
                    </div>
                  </div>
                </RadioGroup>
              </div>
            )}

            {quizStep === 2 && (
              <div className="space-y-6 py-4">
                <Label className="text-sm font-bold uppercase tracking-widest text-primary italic">Scalp condition</Label>
                <div className="grid grid-cols-1 gap-3 pb-8">
                  {SCALP_CONDITIONS.map((cond) => {
                    const isSelected = quizData.scalpConditions.includes(cond.value);
                    return (
                      <button
                        key={cond.value}
                        type="button"
                        onClick={() => {
                          setQuizData(prev => ({
                            ...prev,
                            scalpConditions: prev.scalpConditions.includes(cond.value)
                              ? prev.scalpConditions.filter(c => c !== cond.value)
                              : [...prev.scalpConditions, cond.value]
                          }));
                        }}
                        className={cn("flex items-start gap-4 p-4 border rounded-xl transition-all cursor-pointer text-left", isSelected ? "border-primary bg-primary/5 text-white" : "bg-white/5 border-white/10 text-white/70")}
                      >
                        <div className={cn("w-5 h-5 rounded border flex items-center justify-center shrink-0 mt-0.5", isSelected ? "bg-primary border-primary" : "border-white/20")}>
                          {isSelected && <div className="w-2 h-2 rounded-full bg-background" />}
                        </div>
                        <div className="space-y-1">
                          <span className="text-sm font-bold italic block">{cond.label}</span>
                          <p className="text-[11px] text-muted-foreground leading-relaxed italic">{cond.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {quizStep === 3 && (
              <div className="space-y-6 py-4">
                <Label className="text-sm font-bold uppercase tracking-widest text-primary italic">Duration of current style</Label>
                <RadioGroup value={quizData.weeksInstalled} onValueChange={(val) => setQuizData({...quizData, weeksInstalled: val})} className="grid grid-cols-1 gap-3">
                  {DURATION_OPTIONS.map((opt) => (
                    <div key={opt} className="relative">
                      <RadioGroupItem value={opt} id={`quiz-dur-${opt}`} className="peer sr-only" />
                      <Label htmlFor={`quiz-dur-${opt}`} className="flex items-center justify-between p-4 border rounded-xl bg-white/5 border-white/10 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 transition-all cursor-pointer">
                        <span className="text-sm font-bold italic">{opt}</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            {quizStep === 4 && (
              <div className="space-y-6 py-4">
                <Label className="text-sm font-bold uppercase tracking-widest text-primary italic">Anything else to share? (Optional)</Label>
                <div className="space-y-4">
                  <Textarea 
                    placeholder="e.g. My hair feels a bit dry at the ends lately..." 
                    className="bg-white/5 border-white/10 italic text-sm min-h-[120px]"
                    value={quizData.personalDescription}
                    onChange={(e) => setQuizData({...quizData, personalDescription: e.target.value})}
                  />
                </div>
              </div>
            )}
          </ScrollArea>

          <DialogFooter className="p-6 border-t border-white/5 flex flex-row gap-2 bg-background">
            {quizStep > 1 && <Button variant="ghost" onClick={() => setQuizStep(v => v - 1)} className="flex-1 italic" disabled={isSubmitting}>Back</Button>}
            {quizStep < 4 ? (
              <Button onClick={() => setQuizStep(v => v + 1)} className="flex-1 italic" disabled={(quizStep === 1 && !quizData.currentStyle) || (quizStep === 2 && quizData.scalpConditions.length === 0) || isSubmitting}>Next</Button>
            ) : (
              <Button onClick={handleQuizSubmit} className="flex-1 italic font-bold" disabled={isSubmitting || !quizData.weeksInstalled}>
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Complete Profile"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Phase 2 Invitation Dialog */}
      <Dialog open={showPhase2Invitation} onOpenChange={setShowPhase2Invitation}>
        <DialogContent className="max-w-md bg-background border-white/10 p-6 text-center space-y-6">
          <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20 shadow-2xl">
            <Sparkles className="w-10 h-10 text-primary animate-pulse" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold italic text-white">Refine Your Profile</DialogTitle>
            <DialogDescription className="italic text-muted-foreground leading-relaxed">
              Now that you've started your journey, would you like to refine your profile? 
              This will reveal deeper insights into your hair's unique behavior and moisture needs.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <Button onClick={() => { setShowPhase2Invitation(false); setShowPhase2Quiz(true); }} className="w-full bg-primary text-background font-bold h-12 italic">
              Refine Now
            </Button>
            <Button variant="ghost" onClick={() => setShowPhase2Invitation(false)} className="w-full italic text-muted-foreground text-xs">
              Maybe Later
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Phase 2 Quiz Dialog */}
      <Dialog open={showPhase2Quiz} onOpenChange={(open) => { if (!isSubmitting) setShowPhase2Quiz(open) }}>
        <DialogContent className="max-w-md bg-background border-white/10 p-0 overflow-hidden h-[85vh] flex flex-col">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="text-2xl font-bold italic flex items-center gap-2"><Sparkles className="w-6 h-6 text-primary" />Profile Refinement</DialogTitle>
          </DialogHeader>

          <ScrollArea className="flex-1 px-6">
            {phase2Step === 1 && (
              <div className="space-y-6 py-4">
                <Label className="text-sm font-bold uppercase tracking-widest text-primary italic">Curl Pattern (Rhythm)</Label>
                <RadioGroup value={phase2Data.curlBehavior} onValueChange={(val) => setPhase2Data({...phase2Data, curlBehavior: val})} className="grid grid-cols-1 gap-3 pb-8">
                  {['Loose curls — you can see defined S-shapes', 'Curly — springs and coils that bounce', 'Tight coils — zig-zag patterns, lots of shrinkage', 'Waves — more ripple than curl', 'Straight or mostly straight', 'I\'m not sure'].map((option) => (
                    <div key={option} className="relative">
                      <RadioGroupItem value={option} id={`p2-curl-${option}`} className="peer sr-only" />
                      <Label htmlFor={`p2-curl-${option}`} className="flex items-center justify-between p-4 border rounded-xl bg-white/5 border-white/10 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 transition-all cursor-pointer text-xs font-bold italic">{option}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}
            {phase2Step === 2 && (
              <div className="space-y-6 py-4">
                <Label className="text-sm font-bold uppercase tracking-widest text-primary italic">Moisture Retention (Breath)</Label>
                <RadioGroup value={phase2Data.moistureBehavior} onValueChange={(val) => setPhase2Data({...phase2Data, moistureBehavior: val})} className="grid grid-cols-1 gap-3 pb-8">
                  {['Soaks in almost immediately', 'Takes a while to absorb, water beads up at first', 'Somewhere in between', 'I\'m not sure'].map((option) => (
                    <div key={option} className="relative">
                      <RadioGroupItem value={option} id={`p2-moist-${option}`} className="peer sr-only" />
                      <Label htmlFor={`p2-moist-${option}`} className="flex items-center justify-between p-4 border rounded-xl bg-white/5 border-white/10 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 transition-all cursor-pointer text-xs font-bold italic">{option}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}
            {phase2Step === 3 && (
              <div className="space-y-6 py-4">
                <Label className="text-sm font-bold uppercase tracking-widest text-primary italic">Volume and Thickness (Fullness)</Label>
                <RadioGroup value={phase2Data.thicknessBehavior} onValueChange={(val) => setPhase2Data({...phase2Data, thicknessBehavior: val})} className="grid grid-cols-1 gap-3 pb-8">
                  {['Thin — can see my scalp easily through my hair', 'Medium — good coverage, average fullness', 'Thick — a lot of hair, takes forever to dry', 'I\'m not sure'].map((option) => (
                    <div key={option} className="relative">
                      <RadioGroupItem value={option} id={`p2-thick-${option}`} className="peer sr-only" />
                      <Label htmlFor={`p2-thick-${option}`} className="flex items-center justify-between p-4 border rounded-xl bg-white/5 border-white/10 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 transition-all cursor-pointer text-xs font-bold italic">{option}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}
          </ScrollArea>

          <DialogFooter className="p-6 border-t border-white/5 flex flex-row gap-2 bg-background">
            {phase2Step > 1 && <Button variant="ghost" onClick={() => setPhase2Step(v => v - 1)} className="flex-1 italic" disabled={isSubmitting}>Back</Button>}
            {phase2Step < 3 ? (
              <Button onClick={() => setPhase2Step(v => v + 1)} className="flex-1 italic" disabled={!(phase2Step === 1 ? phase2Data.curlBehavior : phase2Data.moistureBehavior) || isSubmitting}>Next</Button>
            ) : (
              <Button onClick={handlePhase2Submit} className="flex-1 italic font-bold bg-primary text-background" disabled={isSubmitting || !phase2Data.thicknessBehavior}>
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Complete Profile"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Updated Crown Dialog (Text-Only Update) */}
      <Dialog open={showUpdateCrown} onOpenChange={(open) => { if (!isSubmitting) setShowUpdateCrown(open) }}>
        <DialogContent className="max-w-md bg-background border-white/10 p-0 overflow-hidden h-[85vh] flex flex-col">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="text-2xl font-bold italic flex items-center gap-2"><Sparkles className="w-6 h-6 text-primary" />Quick Update</DialogTitle>
            <DialogDescription className="italic text-muted-foreground">Log your current care status.</DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 px-6">
            {updateCrownStep === 1 && (
              <div className="space-y-6 py-4 pb-12">
                <Label className="text-sm font-bold uppercase tracking-widest text-primary italic">What style is this?</Label>
                <RadioGroup value={updateCrownData.style} onValueChange={(val) => setUpdateCrownData({...updateCrownData, style: val})}>
                  {HAIRSTYLE_CATEGORIES.map((cat) => (
                    <div key={cat.name} className="space-y-3">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground italic border-b border-white/5 pb-1">{cat.name}</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {cat.styles.map((style) => (
                          <div key={style} className="relative">
                            <RadioGroupItem value={style} id={`uc-${style}`} className="peer sr-only" />
                            <Label htmlFor={`uc-${style}`} className="flex flex-col items-center justify-center p-3 border rounded-xl bg-white/5 border-white/10 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 transition-all cursor-pointer text-center h-full min-h-[44px]">
                              <span className="text-xs font-bold italic">{style}</span>
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground italic border-b border-white/5 pb-1">Other</h4>
                    <div className="flex flex-col gap-2">
                      <div className="relative">
                        <RadioGroupItem value="Other" id="uc-other" className="peer sr-only" />
                        <Label htmlFor="uc-other" className={cn(
                          "flex flex-col items-center justify-center p-3 border rounded-xl bg-white/5 border-white/10 transition-all cursor-pointer text-center h-full min-h-[44px]",
                          updateCrownData.style === 'Other' && "border-primary bg-primary/5"
                        )}>
                          <span className="text-xs font-bold italic">Something else</span>
                        </Label>
                      </div>
                      {updateCrownData.style === 'Other' && (
                        <Input 
                          placeholder="Name your style..." 
                          className="bg-background/50 border-white/10 text-xs italic"
                          value={updateCrownData.otherStyleText}
                          onChange={(e) => setUpdateCrownData({...updateCrownData, otherStyleText: e.target.value})}
                          autoFocus
                        />
                      )}
                    </div>
                  </div>
                </RadioGroup>
              </div>
            )}

            {updateCrownStep === 2 && (
              <div className="space-y-6 py-4">
                <Label className="text-sm font-bold uppercase tracking-widest text-primary italic">How long has this been in?</Label>
                <RadioGroup value={updateCrownData.duration} onValueChange={(val) => setUpdateCrownData({...updateCrownData, duration: val})} className="grid grid-cols-1 gap-3">
                  {DURATION_OPTIONS.map((opt) => (
                    <div key={opt} className="relative">
                      <RadioGroupItem value={opt} id={`uc-dur-${opt}`} className="peer sr-only" />
                      <Label htmlFor={`uc-dur-${opt}`} className="flex items-center justify-between p-4 border rounded-xl bg-white/5 border-white/10 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 transition-all cursor-pointer">
                        <span className="text-sm font-bold italic">{opt}</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            {updateCrownStep === 3 && (
              <div className="space-y-6 py-4">
                <Label className="text-sm font-bold uppercase tracking-widest text-primary italic">How's your scalp feeling?</Label>
                <div className="grid grid-cols-1 gap-3 pb-8">
                  {SCALP_CONDITIONS.map((cond) => {
                    const isSelected = updateCrownData.scalpConditions.includes(cond.value);
                    return (
                      <button
                        key={cond.value}
                        type="button"
                        onClick={() => {
                          setUpdateCrownData(prev => ({
                            ...prev,
                            scalpConditions: prev.scalpConditions.includes(cond.value)
                              ? prev.scalpConditions.filter(c => c !== cond.value)
                              : [...prev.scalpConditions, cond.value]
                          }));
                        }}
                        className={cn("flex items-start gap-4 p-4 border rounded-xl transition-all cursor-pointer text-left", isSelected ? "border-primary bg-primary/5 text-white" : "bg-white/5 border-white/10 text-white/70")}
                      >
                        <div className={cn("w-5 h-5 rounded border flex items-center justify-center shrink-0 mt-0.5", isSelected ? "bg-primary border-primary" : "border-white/20")}>
                          {isSelected && <div className="w-2 h-2 rounded-full bg-background" />}
                        </div>
                        <div className="space-y-1">
                          <span className="text-sm font-bold italic block">{cond.label}</span>
                          <p className="text-[11px] text-muted-foreground leading-relaxed italic">{cond.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </ScrollArea>

          <DialogFooter className="p-6 border-t border-white/5 flex flex-row gap-2 bg-background">
            {updateCrownStep > 1 && <Button variant="ghost" onClick={() => setUpdateCrownStep(v => v - 1)} className="flex-1 italic" disabled={isSubmitting}>Back</Button>}
            {updateCrownStep < 3 ? (
              <Button onClick={() => setUpdateCrownStep(v => v + 1)} className="flex-1 italic" disabled={(updateCrownStep === 1 && !updateCrownData.style) || (updateCrownStep === 2 && !updateCrownData.duration) || isSubmitting}>Next</Button>
            ) : (
              <Button onClick={handleUpdateCrownSubmit} className="flex-1 italic font-bold bg-primary text-background" disabled={isSubmitting || updateCrownData.scalpConditions.length === 0}>
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Fulfill the Journey"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </>
  );
}

function LogItem({ title, date, status }: any) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-transparent">
      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white/5 text-muted-foreground"><Droplets className="w-5 h-5" /></div>
      <div className="flex-1">
        <h4 className="text-sm font-bold text-white italic">{title}</h4>
        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{date}</p>
      </div>
      <div className="text-right"><span className="text-[9px] font-black uppercase tracking-widest text-white/30">{status}</span></div>
    </div>
  );
}
