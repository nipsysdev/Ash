import './App.css';
import { useStore } from '@nanostores/react';
import { useEffect, useRef } from 'react';
import NetworkStatusDialog from './components/network/NetworkStatusDialog.tsx';
import { NetworkStatus } from './interfaces/networkStatus.ts';
import { $storeSetupDone } from './stores/jsonStore.ts';
import { $wakuStatus, createWakuNode } from './stores/wakuStore.ts';
import MainView from './views/MainView.tsx';
import WelcomeView from './views/WelcomeView.tsx';

export default function App() {
    const wakuStatus = useStore($wakuStatus);
    const isSetupDone = useStore($storeSetupDone);
    const hasRequestedWakuConnect = useRef(false);

    useEffect(() => {
        if (
            !hasRequestedWakuConnect.current &&
            wakuStatus === NetworkStatus.Offline
        ) {
            hasRequestedWakuConnect.current = true;
            createWakuNode();
        }
    }, [wakuStatus]);

    if (isSetupDone === null) {
        return null;
    }

    return (
        <div className="size-full">
            <NetworkStatusDialog />
            {isSetupDone ? <MainView /> : <WelcomeView />}
        </div>
    );
}
