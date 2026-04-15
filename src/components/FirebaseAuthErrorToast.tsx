'use client';

import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';

export function FirebaseAuthErrorToast() {
  const { toast } = useToast();

  useEffect(() => {
    const handleError = (error: { code?: string; message?: string }) => {
      const details = [error.code, error.message].filter(Boolean).join(' — ');
      toast({
        variant: 'destructive',
        title: 'Sign-in failed',
        description: details || 'An unknown auth error occurred.',
      });
    };

    errorEmitter.on('auth-error', handleError);
    return () => errorEmitter.off('auth-error', handleError);
  }, [toast]);

  return null;
}

