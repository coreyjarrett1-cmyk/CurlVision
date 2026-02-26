
"use client"

import { useState } from 'react';
import { Star, MapPin, Calendar, MessageSquare, ChevronLeft, ExternalLink, Search, Filter } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useUser } from '@/firebase';
import { AuthGate } from '@/components/AuthGate';
import Link from 'next/link';

const CREATORS = [
  {
    id: 'c1',
    name: 'Marcus "The Loc King"',
    role: 'Master Loctician',
    bio: 'Specializing in micro-locs and traditional maintenance for 12+ years.',
    location: 'Brooklyn, NY',
    rating: 4.9,
    reviewCount: 128,
    imageUrl: 'https://picsum.photos/seed/cre1/200/200',
    bookingUrl: 'https://example.com/book/marcus'
  },
  {
    id: 'c2',
    name: 'Tasha Braids',
    role: 'Stylist',
    bio: 'Architectural braiding and scalp health preservation.',
    location: 'Atlanta, GA',
    rating: 4.8,
    reviewCount: 95,
    imageUrl: 'https://picsum.photos/seed/cre2/200/200',
    bookingUrl: 'https://example.com/book/tasha'
  },
  {
    id: 'c3',
    name: 'Dr. Sarah Jenkins',
    role: 'Trichologist',
    bio: 'Clinical approach to hair loss and scalp health for curly hair.',
    location: 'Remote / Houston, TX',
    rating: 5.0,
    reviewCount: 210,
    imageUrl: 'https://picsum.photos/seed/cre3/200/200',
    bookingUrl: 'https://example.com/book/sarah'
  }
];

export default function DirectoryPage() {
  const [search, setSearch] = useState('');
  const { user } = useUser();
  const isAuthenticated = user && !user.isAnonymous;

  return (
    <>
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md p-5 border-b border-white/5">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/blog">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ChevronLeft className="w-6 h-6" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white italic">Expert Directory</h1>
            <p className="text-[10px] text-primary font-bold uppercase tracking-widest italic">Book Verified Pros</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search by specialty or city..." 
              className="pl-10 h-10 bg-white/5 border-white/10 italic"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" className="border-white/10">
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <main className="flex-1 px-5 pt-6 pb-24 space-y-4">
        {CREATORS.map((creator) => (
          <div key={creator.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4 transition-all hover:bg-white/[0.07] group">
            <div className="flex gap-4">
              <Avatar className="w-16 h-16 rounded-xl border border-white/10 shadow-lg">
                <AvatarImage src={creator.imageUrl} className="object-cover" />
                <AvatarFallback className="bg-primary/20 text-primary font-bold">{creator.name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-white group-hover:text-primary transition-colors italic">{creator.name}</h3>
                  <div className="flex items-center gap-1 text-primary">
                    <Star className="w-3 h-3 fill-primary" />
                    <span className="text-xs font-black">{creator.rating}</span>
                  </div>
                </div>
                <Badge variant="outline" className="bg-primary/5 border-primary/20 text-[9px] text-primary py-0 font-black tracking-widest uppercase italic">
                  {creator.role}
                </Badge>
                <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] pt-1 italic">
                  <MapPin className="w-3 h-3" />
                  <span>{creator.location}</span>
                </div>
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed italic">
              "{creator.bio}"
            </p>

            <div className="flex gap-2 pt-2">
              <Button asChild className="flex-1 bg-primary text-background font-bold gap-2 italic">
                <a href={creator.bookingUrl} target="_blank" rel="noopener noreferrer">
                  <Calendar className="w-4 h-4" />
                  Book Now
                </a>
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex-1 border-white/10 gap-2 italic">
                    <MessageSquare className="w-4 h-4" />
                    Reviews
                  </Button>
                </DialogTrigger>
                {isAuthenticated ? (
                  <ReviewDialog creator={creator} />
                ) : (
                  <DialogContent className="max-w-md bg-background border-white/10 p-0 overflow-hidden">
                    <AuthGate>
                      <div className="p-8 text-center italic">
                        <p className="text-sm">You've entered the Village Circle sanctuary.</p>
                      </div>
                    </AuthGate>
                  </DialogContent>
                )}
              </Dialog>
            </div>
          </div>
        ))}

        <div className="p-8 text-center bg-primary/5 rounded-2xl border border-dashed border-primary/20 mt-8 italic">
           <h4 className="text-sm font-bold text-primary mb-1">Are you an expert?</h4>
           <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-4">Join our verified network</p>
           <Button size="sm" variant="outline" className="border-primary/50 text-primary hover:bg-primary/10 italic">Apply to Directory</Button>
        </div>
      </main>

      <BottomNav />
    </>
  );
}

function ReviewDialog({ creator }: { creator: typeof CREATORS[0] }) {
  const [comment, setComment] = useState('');
  
  return (
    <DialogContent className="max-w-md bg-background border-white/10">
      <DialogHeader>
        <DialogTitle className="text-xl font-bold italic">Reviews for {creator.name}</DialogTitle>
      </DialogHeader>
      
      <div className="py-4 space-y-6">
        <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
          <div>
            <p className="text-2xl font-black text-white">{creator.rating}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest italic">Average Rating</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-white">{creator.reviewCount}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest italic">Total Reviews</p>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-widest text-primary border-b border-white/5 pb-2 italic">Top Reviews</h4>
          <div className="space-y-4">
            <div className="space-y-1 italic">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-white">Jasmine R.</span>
                <span className="text-[10px] text-muted-foreground">2 weeks ago</span>
              </div>
              <div className="flex text-primary">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-2.5 h-2.5 fill-primary" />)}
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Absolutely incredible experience. My scalp feels so much better after the deep cleanse. Marcus really knows his stuff.
              </p>
            </div>
            <div className="space-y-1 italic">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-white">Kelvin D.</span>
                <span className="text-[10px] text-muted-foreground">1 month ago</span>
              </div>
              <div className="flex text-primary">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-2.5 h-2.5 fill-primary" />)}
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Best loctician in Brooklyn, hands down. Efficient and gentle.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3 pt-4 italic">
          <h4 className="text-xs font-bold uppercase tracking-widest text-white">Write a Review</h4>
          <Textarea 
            placeholder="Share your experience..." 
            className="bg-white/5 border-white/10 text-xs min-h-[80px] italic"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <Button className="w-full bg-primary text-background font-bold text-xs italic" disabled={!comment}>
            Submit Review
          </Button>
        </div>
      </div>
    </DialogContent>
  );
}
