'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

// Page legacy - redirection vers le flux moderne
export default function SuccessPageLegacy() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('id');

  useEffect(() => {
    // Si on a un ID de booking, rediriger vers la page success moderne
    if (bookingId) {
      router.replace(`/success/${bookingId}`);
      return;
    }
    
    // Sinon, rediriger vers le catalogue
    setTimeout(() => {
      router.replace('/catalogue');
    }, 3000);
  }, [bookingId, router]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center p-6">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ExclamationTriangleIcon className="w-8 h-8 text-amber-600" />
        </div>
        <h2 className="text-xl font-semibold mb-2 text-slate-800">Page dépréciée</h2>
        <p className="mb-4 text-slate-600">
          {bookingId 
            ? 'Redirection vers la page de succès moderne...'
            : 'Redirection vers le catalogue...'
          }
        </p>
        <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
      </div>
    </div>
  );
} 