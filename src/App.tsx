import React, { useState, useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';

import { initDatabase } from './data/db';
import { mobileEngine } from './services/mobile/MobileExperienceEngine';
import { logger } from './lib/logger';

import { AppProviders } from './providers/AppProviders';
import { StationProvider } from './contexts/StationContext';
import { useNativeAuth } from './contexts/NativeAuthContext';

import { SplashSequence } from './components/features/SplashSequence';
import { LanguageSelect } from './components/features/Onboarding/LanguageSelect';
import { WelcomeCarousel } from './components/features/Onboarding/WelcomeCarousel';
import LoadingScreen from './components/ui/LoadingScreen';
import { SecurityScreen } from './components/features/SecurityScreen';

const SecureApp = ({ children }: { children: React.ReactNode }) => {
 const { isLocked } = useNativeAuth();
 return (
 <>
 {isLocked && <SecurityScreen />}
 <div style={{ display: isLocked ? 'none' : 'block', height: '100%', width: '100%' }}>
 {children}
 </div>
 </>
 );
};

export default function App() {
 const [dbReady, setDbReady] = useState(false);
 const [splashDone, setSplashDone] = useState(true); // SKIPPED: was false by default, keeping existing state
 const [languageSelected, setLanguageSelected] = useState(() => {
 return !!localStorage.getItem('fuelpro_language');
 });
 const [carouselDone, setCarouselDone] = useState(() => {
 return !!localStorage.getItem('fuelpro_seen_carousel');
 });
 const [preferredLang, setPreferredLang] = useState<'en'|'ur'>(() => {
 return (localStorage.getItem('fuelpro_language') as 'en'|'ur') || 'ur';
 });

 useEffect(() => {
 initDatabase().then(() => setDbReady(true)).catch(logger.error);
 mobileEngine.initialize();
 }, []);

 const handleLanguageSelect = (lang: 'en'|'ur') => {
 localStorage.setItem('fuelpro_language', lang);
 setPreferredLang(lang);
 setLanguageSelected(true);
 };

 const handleCarouselComplete = () => {
 localStorage.setItem('fuelpro_seen_carousel', 'true');
 setCarouselDone(true);
 };

 return (
 <>
 {!splashDone && <SplashSequence onComplete={() => setSplashDone(true)} />}
 
 {splashDone && !languageSelected && (
 <LanguageSelect onSelect={handleLanguageSelect} />
 )}

 {splashDone && languageSelected && !carouselDone && (
 <React.Suspense fallback={<LoadingScreen message="Loading Welcome Experience..." />}>
 <WelcomeCarousel language={preferredLang} onComplete={handleCarouselComplete} />
 </React.Suspense>
 )}

 {splashDone && languageSelected && carouselDone && !dbReady && <LoadingScreen />}
 
 {splashDone && languageSelected && carouselDone && dbReady && (
 <AppProviders>
 <SecureApp>
 <StationProvider>
 <RouterProvider router={router} />
 </StationProvider>
 </SecureApp>
 </AppProviders>
 )}
 </>
 );
}
