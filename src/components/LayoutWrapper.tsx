'use client';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import ParticleBackground from './ParticleBackground';
import ScrollAnimation from './ScrollAnimation';
import MaintenanceScreen from './MaintenanceScreen';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAdmin = pathname?.startsWith('/admin');
    const [settings, setSettings] = useState<{ maintenanceMode: boolean; maintenanceNotice?: string; estimatedEndTime?: string } | null>(null);

    useEffect(() => {
        if (!isAdmin) {
            fetch('/api/settings')
                .then(r => r.json())
                .then(d => {
                    if (d.success && d.settings) {
                        setSettings(d.settings);
                    }
                })
                .catch(err => console.error('Settings load err:', err));
        }
    }, [isAdmin, pathname]);

    if (isAdmin) {
        // Render only the admin content, without public navbar/footer/particles
        return <main className="admin-root min-h-screen bg-gray-50">{children}</main>;
    }

    if (settings?.maintenanceMode) {
        return (
            <MaintenanceScreen 
                notice={settings.maintenanceNotice}
                estimatedEndTime={settings.estimatedEndTime}
            />
        );
    }

    return (
        <>
            <ParticleBackground />
            <ScrollAnimation />
            <Navbar />
            <main>{children}</main>
            <Footer />
        </>
    );
}
