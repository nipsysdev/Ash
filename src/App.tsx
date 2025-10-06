import './App.css';
import { useSetupStatus } from './hooks/useSetupStatus.ts';
import MainView from './views/MainView.tsx';
import WelcomeView from './views/WelcomeView.tsx';

export default function App() {
    const { isSetupDone, setSetupDone } = useSetupStatus();

    if (isSetupDone === null) {
        return;
    }

    return isSetupDone ? (
        <MainView />
    ) : (
        <WelcomeView onSetupComplete={setSetupDone} />
    );
}
