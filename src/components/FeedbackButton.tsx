
'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Star, X, Loader2, Check } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useUser, useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger, 
  SheetDescription, 
  SheetFooter 
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const CATEGORIES = ['Quiz', 'Looking Glass', 'Grapevine', 'Wisdom', 'Village'];

export function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [rating, setRating] = useState(0);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const pathname = usePathname();
  const { user } = useUser();
  const db = useFirestore();

  useEffect(() => {
    const dismissed = sessionStorage.getItem('feedback_dismissed');
    if (dismissed) {
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDismissed(true);
    sessionStorage.setItem('feedback_dismissed', 'true');
  };

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleSubmit = async () => {
    if (!db || !user) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'feedback'), {
        userId: user.uid,
        rating,
        usedToday: selectedCategories,
        feedbackText: feedback,
        route: pathname,
        timestamp: serverTimestamp()
      });
      setIsSubmitted(true);
      // Automatically hide after a moment of success
      setTimeout(() => {
        setIsOpen(false);
        setIsDismissed(true);
        sessionStorage.setItem('feedback_dismissed', 'true');
      }, 2000);
    } catch (err) {
      console.error("Feedback submission error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isDismissed) return null;

  return (
    <div className="fixed bottom-24 right-4 z-50 flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-500">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <div 
            className="relative w-12 h-12 bg-primary text-background rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all group cursor-pointer"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                setIsOpen(true);
              }
            }}
          >
            <MessageSquare className="w-6 h-6" />
            <button 
                onClick={handleDismiss}
                className="absolute -top-1 -left-1 w-5 h-5 bg-background border border-white/10 rounded-full flex items-center justify-center text-muted-foreground hover:text-white transition-colors"
                aria-label="Dismiss feedback"
            >
                <X className="w-3 h-3" />
            </button>
          </div>
        </SheetTrigger>
        <SheetContent side="bottom" className="bg-background border-white/10 rounded-t-3xl h-auto max-h-[90vh] overflow-y-auto outline-none">
          <SheetHeader className="p-4 pt-2">
            <SheetTitle className="italic text-xl text-center">Village Feedback</SheetTitle>
            <SheetDescription className="text-center italic text-muted-foreground">Help us nurture the circle.</SheetDescription>
          </SheetHeader>

          {isSubmitted ? (
            <div className="py-12 flex flex-col items-center gap-4 text-center animate-in zoom-in duration-500">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center text-primary border border-primary/20">
                    <Check className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                    <p className="font-bold italic text-white text-lg">Thank you for your voice.</p>
                    <p className="text-xs text-muted-foreground italic">Your wisdom helps the village grow.</p>
                </div>
            </div>
          ) : (
            <div className="px-4 pb-12 space-y-8 max-w-sm mx-auto">
              <div className="space-y-3 text-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary italic">How was your session?</p>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map(s => (
                    <button 
                      key={s} 
                      onClick={() => setRating(s)}
                      className={cn("p-1 transition-all", rating >= s ? "text-primary" : "text-muted-foreground")}
                    >
                      <Star className={cn("w-8 h-8", rating >= s && "fill-primary")} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary italic text-center">What did you use today?</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => toggleCategory(cat)}
                      className={cn(
                        "px-4 py-2 rounded-full border text-[9px] font-bold uppercase tracking-widest transition-all italic",
                        selectedCategories.includes(cat) ? "bg-primary text-background border-primary" : "bg-white/5 text-muted-foreground border-white/10"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary italic text-center">Improvements or Confusion?</p>
                <Textarea 
                  placeholder="Speak your mind, spirit..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="bg-white/5 border-white/10 italic text-sm min-h-[100px] focus:border-primary/50 transition-all"
                />
              </div>

              <Button 
                onClick={handleSubmit}
                disabled={isSubmitting || rating === 0}
                className="w-full h-12 bg-primary text-background font-bold italic"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Send to the Village
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
