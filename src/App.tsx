import './App.css';
import { useStore } from '@nanostores/react';
import { useEffect, useRef } from 'react';
import TorStatusDialog from './components/tor/TorStatusDialog.tsx';
import { useSetupStatus } from './hooks/useSetupStatus.ts';
import { TorStatus } from './interfaces/tor.ts';
import { $torStatus, connectToTor } from './stores/torStore.ts';
import MainView from './views/MainView.tsx';
import WelcomeView from './views/WelcomeView.tsx';

export default function App() {
    const hasRequestedBootstrap = useRef(false);
    const torStatus = useStore($torStatus);
    const { isSetupDone, setSetupDone } = useSetupStatus();

    useEffect(() => {
        if (!hasRequestedBootstrap.current && torStatus === TorStatus.Offline) {
            hasRequestedBootstrap.current = true;
            connectToTor();
        }
    }, [torStatus]);

    if (isSetupDone === null) {
        return null;
    }

    return (
        <div className="size-full">
            <TorStatusDialog />
            {isSetupDone ? (
                <MainView />
            ) : (
                <WelcomeView onSetupComplete={setSetupDone} />
            )}
        </div>
    );
}
