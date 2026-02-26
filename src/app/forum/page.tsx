
"use client"

import { useState, useRef } from 'react';
import { Search, MessageCircle, ThumbsUp, Plus, Filter, MessageSquare, User, Clock, ChevronRight, Loader2, Flower2, Camera, ImageIcon, X, Info } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUser, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { collection, query, orderBy, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { AuthGate } from '@/components/AuthGate';

const CATEGORIES = ['Advice', 'Inspiration', 'Knowledge'];

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
    img.onerror = reject;
    img.src = dataUri;
  });
}

export default function ForumPage() {
  const { toast } = useToast();
  const { user } = useUser();
  const db = useFirestore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '', category: 'Advice', imageUrl: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const postsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'forumPosts'), orderBy('createdAt', 'desc'));
  }, [db]);

  const { data: posts, isLoading } = useCollection(postsQuery);

  const filteredPosts = posts?.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         post.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory ? post.category === activeCategory : true;
    return matchesSearch && matchesCategory;
  });

  const handleCreatePost = async () => {
    if (!db || !user || !newPost.title || !newPost.content) return;
    setIsAdding(true);
    try {
      await addDoc(collection(db, 'forumPosts'), {
        ...newPost,
        userId: user.uid,
        userName: user.displayName || 'Anonymous User',
        upvotes: 0,
        createdAt: serverTimestamp()
      });
      setNewPost({ title: '', content: '', category: 'Advice', imageUrl: '' });
      toast({
        title: "Voice shared",
        description: "Your vision has been sent to the Circle.",
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: "Update failed",
        description: "Could not share your post.",
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const originalUri = event.target?.result as string;
      const compressedUri = await compressImage(originalUri);
      setNewPost({ ...newPost, imageUrl: compressedUri });
    };
    reader.readAsDataURL(file);
  };

  const handleUpvote = async (postId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!db) return;
    const postRef = doc(db, 'forumPosts', postId);
    await updateDoc(postRef, {
      upvotes: increment(1)
    });
  };

  return (
    <>
      <AuthGate>
        <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md p-5 border-b border-white/5">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-white italic">The Village Circle</h1>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="icon" className="rounded-full bg-primary text-background hover:bg-primary/90">
                  <Plus className="w-5 h-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-background border-white/10 max-w-md h-[85vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2">
                  <DialogTitle className="italic text-xl">Speak to the Village</DialogTitle>
                  <DialogDescription className="italic text-muted-foreground">Ask a question, share a vision, or pass down wisdom.</DialogDescription>
                </DialogHeader>
                
                <ScrollArea className="flex-1 px-6">
                  <div className="space-y-6 py-4">
                    <section className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex gap-3 items-start">
                      <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
                        <Info className="w-3.5 h-3.5" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary italic">Expert Directions</h4>
                        <p className="text-[11px] text-white/70 leading-relaxed italic">
                          For the best advice, share a clear photo of your crown. Use natural light and show the rhythm of your roots.
                        </p>
                      </div>
                    </section>

                    <div className="space-y-2">
                      <Label className="italic text-xs text-white/70">The subject of your heart</Label>
                      <Input 
                        placeholder="What's on your mind, spirit?" 
                        value={newPost.title} 
                        onChange={(e) => setNewPost({...newPost, title: e.target.value})} 
                        className="bg-white/5 border-white/10 italic text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="italic text-xs text-white/70">Choose your path</Label>
                      <Select value={newPost.category} onValueChange={(v) => setNewPost({...newPost, category: v})}>
                        <SelectTrigger className="bg-white/5 border-white/10 italic text-sm">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border-white/10 italic">
                          {CATEGORIES.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="italic text-xs text-white/70">Reflect your crown (Optional)</Label>
                      <div className="flex flex-col gap-3">
                        {newPost.imageUrl ? (
                          <div className="relative aspect-video rounded-xl overflow-hidden border border-white/10 group">
                            <img src={newPost.imageUrl} alt="Upload preview" className="w-full h-full object-cover" />
                            <button 
                              onClick={() => setNewPost({ ...newPost, imageUrl: '' })}
                              className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white hover:text-primary transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full aspect-video rounded-xl border-2 border-dashed border-white/10 bg-white/5 flex flex-col items-center justify-center gap-2 hover:bg-white/[0.08] hover:border-primary/30 transition-all group"
                          >
                            <div className="p-3 rounded-full bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                              <Camera className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground italic">Add a Reflection</span>
                          </button>
                        )}
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          className="hidden" 
                          accept="image/*" 
                          onChange={handleImageUpload} 
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="italic text-xs text-white/70">The full story</Label>
                      <Textarea 
                        placeholder="Speak freely..." 
                        value={newPost.content} 
                        onChange={(e) => setNewPost({...newPost, content: e.target.value})} 
                        className="bg-white/5 border-white/10 min-h-[120px] italic text-sm"
                      />
                    </div>
                  </div>
                </ScrollArea>

                <DialogFooter className="p-6 border-t border-white/5">
                  <Button onClick={handleCreatePost} disabled={isAdding || !newPost.title || !newPost.content} className="w-full font-bold italic h-12">
                    {isAdding ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Send to the Circle
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Find a voice..." 
                className="pl-10 bg-white/5 border-white/10 italic"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <Badge 
                variant={activeCategory === null ? 'default' : 'outline'} 
                className="cursor-pointer italic px-4"
                onClick={() => setActiveCategory(null)}
              >
                Everyone
              </Badge>
              {CATEGORIES.map(cat => (
                <Badge 
                  key={cat} 
                  variant={activeCategory === cat ? 'default' : 'outline'} 
                  className="cursor-pointer whitespace-nowrap italic px-4"
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </Badge>
              ))}
            </div>
          </div>
        </header>

        <main className="flex-1 px-5 pt-4 pb-24 space-y-4 min-h-[60vh]">
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : filteredPosts && filteredPosts.length > 0 ? (
            filteredPosts.map((post) => (
              <Dialog key={post.id}>
                <DialogTrigger asChild>
                  <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3 cursor-pointer hover:bg-white/[0.08] transition-colors group">
                    <div className="flex justify-between items-start">
                      <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-widest border-primary/30 text-primary italic">
                        {post.category}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground italic">{new Date(post.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                    </div>
                    
                    {post.imageUrl && (
                      <div className="relative aspect-video rounded-xl overflow-hidden border border-white/5">
                        <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" />
                      </div>
                    )}

                    <h3 className="font-bold text-white group-hover:text-primary transition-colors line-clamp-2 italic">{post.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed italic">{post.content}</p>
                    
                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium italic">
                        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[8px] font-bold">
                          {post.userName[0]}
                        </div>
                        <span>{post.userName}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={(e) => handleUpvote(post.id, e)} 
                          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors italic"
                        >
                          <ThumbsUp className="w-3 h-3" />
                          <span>{post.upvotes || 0}</span>
                        </button>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground italic">
                          <MessageCircle className="w-3 h-3" />
                          <span>Join in</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </DialogTrigger>
                <PostDetailContent post={post} />
              </Dialog>
            ))
          ) : (
            <div className="text-center py-20 space-y-3 italic">
              <Flower2 className="w-10 h-10 text-muted-foreground mx-auto opacity-20" />
              <p className="text-sm text-muted-foreground">The village is quiet. Will you be the first to speak?</p>
            </div>
          )}
        </main>
      </AuthGate>
      <BottomNav />
    </>
  );
}

function PostDetailContent({ post }: { post: any }) {
  const { user } = useUser();
  const db = useFirestore();
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const commentsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'forumPosts', post.id, 'comments'), orderBy('createdAt', 'asc'));
  }, [db, post.id]);

  const { data: comments, isLoading } = useCollection(commentsQuery);

  const handlePostComment = async () => {
    if (!db || !user || !commentText) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'forumPosts', post.id, 'comments'), {
        postId: post.id,
        userId: user.uid,
        userName: user.displayName || 'Anonymous User',
        content: commentText,
        createdAt: serverTimestamp()
      });
      setCommentText('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DialogContent className="max-w-md bg-background border-white/10 h-[90vh] p-0 flex flex-col gap-0 overflow-hidden">
      <ScrollArea className="flex-1 p-6">
        <div className="space-y-6">
          <div className="space-y-3">
            <Badge variant="outline" className="text-[10px] font-bold text-primary border-primary/30 uppercase tracking-widest italic">{post.category}</Badge>
            <h2 className="text-xl font-bold text-white leading-tight italic">{post.title}</h2>
            
            {post.imageUrl && (
              <div className="relative aspect-video rounded-xl overflow-hidden border border-white/5 my-4">
                <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" />
              </div>
            )}

            <div className="flex items-center gap-3 italic">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[10px] font-bold">
                {post.userName[0]}
              </div>
              <div>
                <p className="text-xs font-bold text-white">{post.userName}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                  {post.createdAt ? new Date(post.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                </p>
              </div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap italic">
            {post.content}
          </p>

          <div className="pt-6 border-t border-white/5 space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-primary italic">The Discussion</h3>
            
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            ) : comments && comments.length > 0 ? (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="space-y-2">
                    <div className="flex items-center gap-2 italic">
                      <span className="text-[10px] font-bold text-white">{comment.userName}</span>
                      <span className="text-[8px] text-muted-foreground uppercase tracking-widest">
                        {comment.createdAt ? new Date(comment.createdAt.seconds * 1000).toLocaleDateString() : 'Now'}
                      </span>
                    </div>
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                      <p className="text-xs text-muted-foreground leading-relaxed italic">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest italic opacity-50">No voices here yet. Will you share yours?</p>
            )}
          </div>
        </div>
      </ScrollArea>
      
      <div className="p-4 border-t border-white/5 bg-background/80 backdrop-blur-md">
        <div className="flex gap-2">
          <Input 
            placeholder="Add your voice..." 
            className="bg-white/5 border-white/10 text-xs italic"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
          />
          <Button size="icon" className="bg-primary text-background flex-shrink-0" disabled={!commentText || isSubmitting} onClick={handlePostComment}>
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-5 h-5" />}
          </Button>
        </div>
      </div>
    </DialogContent>
  );
}
