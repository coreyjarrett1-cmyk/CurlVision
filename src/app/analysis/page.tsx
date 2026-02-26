
"use client"

import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Camera, Loader2, Upload, Stars, Check, Info, MoreVertical, Calendar as CalendarIcon, X } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';

// Hairstyle categories consistent with onboarding
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

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

async function compressImage(dataUri: string, maxWidth = 800, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => reject(new Error("Image processing failed."));
    img.src = dataUri;
  });
}

export default function AnalysisPage() {
  const { toast } = useToast();
  const { user } = useUser();
  const db = useFirestore();
  
  const [step, setStep] = useState<0 | 1 | 2 | 3 | 4>(0); // 0: Capture, 1: Style, 2: Duration, 3: Scalp, 4: Success
  const [isSaving, setIsSaving] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [photoTakenDate, setPhotoTakenDate] = useState<Date | null>(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  
  const [tempDate, setTempDate] = useState({
    month: new Date().getMonth(),
    day: new Date().getDate(),
    year: new Date().getFullYear()
  });

  const [selection, setSelection] = useState({
    style: '',
    otherStyleText: '',
    duration: '',
    scalpConditions: [] as string[]
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        setHasCameraPermission(true);
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
      }
    };
    if (!previewImage && step === 0) {
      getCameraPermission();
    }

    return () => {
      stopCamera();
    };
  }, [previewImage, step]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const handlePhotoCaptured = async (dataUri: string) => {
    const compressed = await compressImage(dataUri);
    setPreviewImage(compressed);
    stopCamera();
    setStep(1);
  };

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0);
    const dataUri = canvas.toDataURL('image/jpeg');
    const now = new Date();
    setPhotoTakenDate(now); 
    setTempDate({ month: now.getMonth(), day: now.getDate(), year: now.getFullYear() });
    handlePhotoCaptured(dataUri);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let extractedDate = new Date(file.lastModified);

    try {
      const ExifReader = (await import('exifreader')).default;
      const tags = await ExifReader.load(file);
      if (tags.DateTimeOriginal?.description) {
        const parts = tags.DateTimeOriginal.description.split(/[:\s]/);
        if (parts.length >= 3) {
          extractedDate = new Date(
            parseInt(parts[0]),
            parseInt(parts[1]) - 1,
            parseInt(parts[2]),
            parts[3] ? parseInt(parts[3]) : 0,
            parts[4] ? parseInt(parts[4]) : 0,
            parts[5] ? parseInt(parts[5]) : 0
          );
        }
      }
    } catch (err) {
      console.warn("Could not extract EXIF metadata:", err);
    }
    
    setPhotoTakenDate(extractedDate);
    setTempDate({ month: extractedDate.getMonth(), day: extractedDate.getDate(), year: extractedDate.getFullYear() });

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUri = event.target?.result as string;
      handlePhotoCaptured(dataUri);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveVision = async () => {
    if (!user || !db || !previewImage) return;
    setIsSaving(true);
    
    try {
      const finalStyle = selection.style === 'Other' ? selection.otherStyleText : selection.style;
      const combinedName = `${finalStyle} — ${selection.duration}`;
      
      await addDoc(collection(db, 'users', user.uid, 'hairstyles'), {
        name: combinedName,
        styleName: finalStyle,
        duration: selection.duration,
        scalpConditions: selection.scalpConditions,
        imageUrl: previewImage,
        userId: user.uid,
        styleDate: (photoTakenDate || new Date()).toLocaleDateString(),
        createdAt: serverTimestamp()
      });

      setStep(4);
      toast({ 
        title: "Memory preserved", 
        description: "Your reflection has been safely stored." 
      });
    } catch (error: any) {
      toast({ 
        variant: 'destructive', 
        title: 'Save failed', 
        description: "We couldn't preserve your memory right now." 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleScalpCondition = (val: string) => {
    setSelection(prev => ({
      ...prev,
      scalpConditions: prev.scalpConditions.includes(val)
        ? prev.scalpConditions.filter(c => c !== val)
        : [...prev.scalpConditions, val]
    }));
  };

  const handleDiscard = () => {
    setStep(0);
    setPreviewImage(null);
    setPhotoTakenDate(null);
  };

  const handleConfirmTempDate = () => {
    const d = new Date(tempDate.year, tempDate.month, tempDate.day);
    setPhotoTakenDate(d);
    setIsDatePickerOpen(false);
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1962 + 1 }, (_, i) => currentYear - i);
  const daysInMonth = new Date(tempDate.year, tempDate.month + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <>
      <header className="sticky top-0 z-50 flex items-center justify-between p-4 bg-background/90 backdrop-blur-md border-b border-white/5">
        <Link href="/">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ChevronLeft className="w-6 h-6" />
          </Button>
        </Link>
        <h2 className="text-lg font-bold tracking-tight italic">The Morning Mirror</h2>
        {step === 0 && (
          <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} className="rounded-full text-primary">
            <Upload className="w-5 h-5" />
          </Button>
        )}
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
        {step !== 0 && <div className="w-10" />}
      </header>

      <main className="flex-1 flex flex-col gap-6 px-5 pb-24">
        <div className="text-center mt-4 space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-white italic">
            {step === 0 ? "Reflect Your Crown" : step === 4 ? "Memory Held" : "Describe the Vision"}
          </h1>
          <p className="text-sm text-muted-foreground italic">
            {step === 0 ? "Capture or upload a photo." : step === 4 ? "Your looking glass is updated." : "Honoring your journey."}
          </p>
        </div>

        {step === 0 ? (
          <div className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 bg-black">
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <div className="w-48 h-48 border-2 border-dashed border-primary/30 rounded-full animate-pulse flex items-center justify-center">
                <Stars className="w-8 h-8 text-primary/30" />
              </div>
            </div>
          </div>
        ) : (
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-xl border border-white/10 bg-white/5">
            <img src={previewImage!} className="w-full h-full object-cover" alt="Reflection preview" />
            <div className="absolute inset-0 bg-black/40" />
            
            {step < 4 && (
              <div className="absolute top-2 right-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" className="h-8 w-8 rounded-full bg-black/40 backdrop-blur-md border-none text-white hover:bg-black/60">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-background/95 border-white/10 backdrop-blur-md italic">
                    <DropdownMenuItem onClick={() => setIsDatePickerOpen(true)} className="gap-2 cursor-pointer">
                      <CalendarIcon className="w-3.5 h-3.5" />
                      Add Date Yourself
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDiscard} className="gap-2 text-destructive cursor-pointer">
                      <X className="w-3.5 h-3.5" />
                      Discard Photo
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            <div className="absolute bottom-2 left-3">
              <p className="text-[10px] text-white/70 font-bold italic">
                Taken: {photoTakenDate?.toLocaleDateString()}
              </p>
            </div>

            {step === 4 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-primary/20 backdrop-blur-md p-4 rounded-full border border-primary/30">
                  <Check className="w-12 h-12 text-primary animate-in zoom-in duration-500" />
                </div>
              </div>
            )}
          </div>
        )}

        {step === 1 && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
            <Label className="text-sm font-bold uppercase tracking-widest text-primary italic">What style is this?</Label>
            <ScrollArea className="h-[320px] pr-4">
              <RadioGroup value={selection.style} onValueChange={(v) => setSelection({...selection, style: v})} className="space-y-6">
                {HAIRSTYLE_CATEGORIES.map(cat => (
                  <div key={cat.name} className="space-y-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground italic border-b border-white/5 pb-1">{cat.name}</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {cat.styles.map(style => (
                        <div key={style} className="relative">
                          <RadioGroupItem value={style} id={`mirror-${style}`} className="peer sr-only" />
                          <Label htmlFor={`mirror-${style}`} className="flex items-center justify-center p-3 border rounded-xl bg-white/5 border-white/10 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 transition-all cursor-pointer text-center text-xs italic h-full min-h-[44px]">
                            {style}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="space-y-2 pb-6">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground italic border-b border-white/5 pb-1">Other</h4>
                  <div className="flex flex-col gap-2">
                    <div className="relative">
                      <RadioGroupItem value="Other" id="mirror-other" className="peer sr-only" />
                      <Label htmlFor="mirror-other" className={cn("flex items-center justify-center p-3 border rounded-xl bg-white/5 border-white/10 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 transition-all cursor-pointer text-center text-xs italic h-full min-h-[44px]", selection.style === 'Other' && "border-primary bg-primary/5")}>
                        Something else
                      </Label>
                    </div>
                    {selection.style === 'Other' && (
                      <Input 
                        placeholder="Name your style..." 
                        className="bg-background/50 border-white/10 text-xs italic"
                        value={selection.otherStyleText}
                        onChange={(e) => setSelection({...selection, otherStyleText: e.target.value})}
                        autoFocus
                      />
                    )}
                  </div>
                </div>
              </RadioGroup>
            </ScrollArea>
            <Button className="w-full h-12 font-bold italic" disabled={!selection.style || (selection.style === 'Other' && !selection.otherStyleText)} onClick={() => setStep(2)}>
              Next
            </Button>
          </section>
        )}

        {step === 2 && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
            <Label className="text-sm font-bold uppercase tracking-widest text-primary italic">How long has this style been in?</Label>
            <RadioGroup value={selection.duration} onValueChange={(v) => setSelection({...selection, duration: v})} className="space-y-3">
              {DURATION_OPTIONS.map(opt => (
                <div key={opt} className="relative">
                  <RadioGroupItem value={opt} id={`duration-${opt}`} className="peer sr-only" />
                  <Label htmlFor={`duration-${opt}`} className="flex items-center justify-between p-4 border rounded-xl bg-white/5 border-white/10 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 transition-all cursor-pointer text-sm italic">
                    {opt}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 italic" onClick={() => setStep(1)}>Back</Button>
              <Button className="flex-[2] italic font-bold" disabled={!selection.duration} onClick={() => setStep(3)}>Next</Button>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
            <Label className="text-sm font-bold uppercase tracking-widest text-primary italic">How's your scalp feeling right now?</Label>
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-3 pb-4">
                {SCALP_CONDITIONS.map(cond => {
                  const isSelected = selection.scalpConditions.includes(cond.value);
                  return (
                    <button
                      key={cond.value}
                      type="button"
                      onClick={() => toggleScalpCondition(cond.value)}
                      className={cn(
                        "w-full flex items-start gap-4 p-4 border rounded-xl transition-all text-left",
                        isSelected ? "border-primary bg-primary/5" : "bg-white/5 border-white/10"
                      )}
                    >
                      <div className={cn("w-5 h-5 rounded border flex items-center justify-center shrink-0 mt-0.5", isSelected ? "bg-primary border-primary" : "border-white/20")}>
                        {isSelected && <div className="w-2 h-2 rounded-full bg-background" />}
                      </div>
                      <div className="space-y-1">
                        <span className="text-sm font-bold italic block">{cond.label}</span>
                        <p className="text-[11px] text-muted-foreground italic leading-relaxed">{cond.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 italic" onClick={() => setStep(2)}>Back</Button>
              <Button className="flex-[2] italic font-bold" disabled={isSaving || selection.scalpConditions.length === 0} onClick={handleSaveVision}>
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Preserve Memory
              </Button>
            </div>
          </section>
        )}

        {step === 4 && (
          <section className="animate-in fade-in zoom-in duration-500 space-y-6 text-center">
            <div className="space-y-2">
              <p className="text-primary font-bold italic">Memory Preserved</p>
              <p className="text-xs text-muted-foreground italic">Your reflection has been safely stored in the glass.</p>
            </div>
            <div className="pt-4 space-y-3">
              <Link href="/vault" className="w-full block">
                <Button className="w-full h-12 bg-primary text-background font-bold italic">View the Glass</Button>
              </Link>
              <Button variant="ghost" className="text-muted-foreground text-xs italic" onClick={() => { setStep(0); setPreviewImage(null); setPhotoTakenDate(null); setSelection({ style:'', otherStyleText: '', duration: '', scalpConditions: [] }); }}>
                Capture Another
              </Button>
            </div>
          </section>
        )}

        {step === 0 && (
          <div className="pt-2 pb-8">
            <Button onClick={handleCapture} className="w-full h-14 bg-primary hover:bg-primary/90 text-background font-bold text-base rounded-xl transition-all active:scale-[0.98] group italic shadow-xl shadow-primary/10">
              <Camera className="mr-2 h-5 w-5" />Capture Reflection
            </Button>
          </div>
        )}

        {hasCameraPermission === false && step === 0 && (
          <Alert variant="destructive" className="bg-destructive/10 border-destructive/20">
            <AlertTitle className="italic">Camera access required</AlertTitle>
            <AlertDescription className="italic">
              Please enable camera permissions or upload a photo to continue.
            </AlertDescription>
          </Alert>
        )}
      </main>

      {/* Manual Date Picker Dialog */}
      <Dialog open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
        <DialogContent className="max-w-sm bg-background border-white/10 p-6">
          <DialogHeader>
            <DialogTitle className="italic">When was this vision?</DialogTitle>
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
              onClick={handleConfirmTempDate} 
              className="w-full bg-primary text-background font-bold italic h-12"
            >
              Confirm Date
            </Button>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDatePickerOpen(false)} className="italic text-xs">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </>
  );
}
