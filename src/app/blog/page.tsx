
"use client"

import { useState } from 'react';
import { Search, Bookmark, Share2, ArrowUpRight, Users, BookOpen, Clock, User, ChevronRight, Flower2 } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';

const ARTICLES = [
  {
    id: '1',
    category: 'Wisdom',
    title: 'Honoring the Coil: The Sacred Nature of 4C Hair',
    excerpt: 'Understanding the spirit of your crown goes beyond moisture—it starts with respect.',
    content: `Peace and blessings. For too long, the narrative around our hair has been one of struggle. But in this circle, we speak only of the magic. Your coils are like antennae, reaching for the sun.
    
    In this deep dive, we explore how chemical treatments, environmental stressors, and even the pH of your water can shift your hair's porosity levels. We provide a 4-week protocol for restoring cuticle integrity using protein treatments and sealing oils specifically tailored for type 4 textures.`,
    image: 'https://picsum.photos/seed/article1/800/600',
    readTime: '5 min of quiet',
    author: 'Mama Sarah',
    authorRole: 'Guide'
  },
  {
    id: '2',
    category: 'Heritage',
    title: 'The Breath of the Braid: Ancestral Protection',
    excerpt: 'How our mothers before us turned strands into stories and safety.',
    content: `Protective styling has evolved from a simple maintenance routine into a profound cultural art form. Modern locticians and braiders are blending traditional techniques with architectural design to create styles like Halo Braids and Butterfly Locs that serve as both expression and preservation.
    
    However, the "utility" aspect is often lost in the "aesthetic." We interview three top stylists on how to balance the weight of extensions with the health of the scalp to ensure that your style truly is protective, not destructive.`,
    image: 'https://picsum.photos/seed/article2/800/600',
    readTime: '8 min of quiet',
    author: 'Elder Marcus',
    authorRole: 'Storyteller'
  },
  {
    id: '3',
    category: 'Vibe',
    title: 'Living Free: The CROWN Act and Our Shared Future',
    excerpt: 'Reflecting on the space we have claimed for our natural selves.',
    content: `The CROWN Act was first signed into law five years ago. Since then, it has transformed corporate culture across dozens of states.
    
    But legal protection is only the first step. We look at the data on bias in the workplace and how professional "grooming" standards are being redefined by the natural hair movement. We also provide tips on how to advocate for inclusive policies in your own organization.`,
    image: 'https://picsum.photos/seed/article3/800/600',
    readTime: '4 min of quiet',
    author: 'Sister Alicia',
    authorRole: 'Witness'
  }
];

export default function BlogPage() {
  const [selectedArticle, setSelectedArticle] = useState<typeof ARTICLES[0] | null>(null);

  return (
    <>
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md p-5 border-b border-white/5">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-white italic">The Archive of Wisdom</h1>
          <div className="flex gap-2">
            <Link href="/blog/directory">
              <Button variant="ghost" size="sm" className="text-primary gap-2 hover:bg-primary/10">
                <Users className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest italic">Directory</span>
              </Button>
            </Link>
            <button className="text-muted-foreground hover:text-primary transition-colors">
              <Bookmark className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Search the collective memory..." 
            className="pl-10 h-12 bg-white/5 border-white/10 focus:border-primary/50 italic"
          />
        </div>
      </header>

      <main className="flex-1 px-5 pt-4 pb-24 space-y-8">
        <Dialog>
          <DialogTrigger asChild>
            <section className="relative group cursor-pointer" onClick={() => setSelectedArticle(ARTICLES[0])}>
              <div className="aspect-[16/9] rounded-2xl overflow-hidden border border-white/10 glow-primary">
                <img 
                  src={ARTICLES[0].image} 
                  alt={ARTICLES[0].title} 
                  className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
                <div className="absolute bottom-0 p-5 space-y-2">
                  <Badge className="bg-primary text-background font-bold px-3 py-1 italic">GUIDING LIGHT</Badge>
                  <h2 className="text-xl font-bold text-white line-clamp-2 italic">{ARTICLES[0].title}</h2>
                  <div className="flex items-center gap-3 text-[10px] text-white/60 font-medium uppercase tracking-widest italic">
                    <span>{ARTICLES[0].readTime}</span>
                    <span>•</span>
                    <span>Shared by {ARTICLES[0].author}</span>
                  </div>
                </div>
              </div>
            </section>
          </DialogTrigger>
          <ArticleDialogContent article={ARTICLES[0]} />
        </Dialog>

        <section className="space-y-6">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground border-b border-white/5 pb-2 italic">Whispers of the Collective</h3>
          
          {ARTICLES.slice(1).map((article) => (
            <Dialog key={article.id}>
              <DialogTrigger asChild>
                <div className="flex gap-4 group cursor-pointer" onClick={() => setSelectedArticle(article)}>
                  <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 border border-white/5">
                    <img src={article.image} alt={article.title} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-bold text-primary uppercase tracking-widest italic">{article.category}</span>
                      <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <h4 className="text-sm font-bold leading-snug group-hover:text-primary transition-colors text-white italic">{article.title}</h4>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed italic">{article.excerpt}</p>
                  </div>
                </div>
              </DialogTrigger>
              <ArticleDialogContent article={article} />
            </Dialog>
          ))}
        </section>

        <section className="bg-primary/5 rounded-2xl p-6 border border-primary/20 text-center space-y-4">
          <Flower2 className="w-6 h-6 text-primary mx-auto" />
          <h3 className="text-lg font-bold text-primary italic">Join the Circle</h3>
          <p className="text-xs text-muted-foreground leading-relaxed italic">Gentle reminders and soul-deep hair wisdom delivered to your spirit weekly.</p>
          <div className="flex gap-2">
            <Input placeholder="Your spirit's email" className="bg-background border-white/10 italic" />
            <Button size="sm" className="bg-primary text-background font-bold px-6 italic">Enter</Button>
          </div>
        </section>
      </main>

      <BottomNav />
    </>
  );
}

function ArticleDialogContent({ article }: { article: typeof ARTICLES[0] }) {
  return (
    <DialogContent className="max-w-md bg-background border-white/10 h-[90vh] p-0 flex flex-col gap-0 overflow-hidden">
      <div className="relative aspect-video w-full flex-shrink-0">
        <img src={article.image} alt={article.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
      </div>
      
      <ScrollArea className="flex-1 p-6">
        <div className="space-y-6">
          <div className="space-y-3">
            <Badge className="bg-primary text-background font-bold italic">{article.category}</Badge>
            <h2 className="text-2xl font-bold leading-tight text-white italic">{article.title}</h2>
            <div className="flex items-center gap-4 text-muted-foreground italic">
              <div className="flex items-center gap-1.5">
                <User className="w-3 h-3" />
                <span className="text-[10px] font-bold uppercase tracking-widest">{article.author}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3 h-3" />
                <span className="text-[10px] font-bold uppercase tracking-widest">{article.readTime}</span>
              </div>
            </div>
          </div>

          <div className="bg-white/5 p-4 rounded-xl border border-white/10">
            <p className="text-sm font-medium italic text-white/80 leading-relaxed">
              "{article.excerpt}"
            </p>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap italic">
              {article.content}
            </p>
          </div>

          <div className="pt-8 border-t border-white/5 space-y-4">
             <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20 font-bold italic">
                 {article.author[0]}
               </div>
               <div>
                 <p className="text-sm font-bold text-white italic">{article.author}</p>
                 <p className="text-[10px] text-muted-foreground uppercase tracking-widest italic">{article.authorRole}</p>
               </div>
               <Button variant="outline" size="sm" className="ml-auto border-white/10 italic">Listen</Button>
             </div>
          </div>
        </div>
      </ScrollArea>
      
      <div className="p-4 border-t border-white/5 bg-background/80 backdrop-blur-md flex gap-3">
        <Button className="flex-1 bg-primary text-background font-bold italic">Share the Wisdom</Button>
        <Button variant="ghost" size="icon" className="text-muted-foreground"><Bookmark className="w-5 h-5" /></Button>
      </div>
    </DialogContent>
  );
}
