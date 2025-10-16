import { useCallback, useState } from 'react';
import LocalitySelectionStep from '../components/welcome-steps/LocalitySelectionStep.tsx';
import MapDownloadStep from '../components/welcome-steps/MapDownloadStep.tsx';
import NetworkSetupStep from '../components/welcome-steps/NetworkSetupStep.tsx';
import IntroStep from '../components/welcome-steps/WelcomeIntroStep.tsx';

interface StepConfig {
    component: React.ComponentType<{
        onStepChange: (stepChange: number) => void;
        onSetupComplete?: () => void;
    }>;
}

interface WelcomeViewProps {
    onSetupComplete?: () => void;
}

export default function WelcomeView({ onSetupComplete }: WelcomeViewProps) {
    const [activeStep, setActiveStep] = useState(1);

    const steps: StepConfig[] = [
        { component: IntroStep },
        { component: NetworkSetupStep },
        { component: LocalitySelectionStep },
        { component: MapDownloadStep },
    ];

    const handleStepChange = useCallback(
        (stepChange: number) => {
            setActiveStep((prevStep) => {
                const newStep = prevStep + stepChange;
                return Math.max(1, Math.min(newStep, steps.length));
            });
        },
        [steps.length],
    );

    const ActiveStepComponent = steps[activeStep - 1]?.component;

    return (
        <div className="size-full pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
            <div className="flex justify-center items-center size-full p-5 box-border">
                {ActiveStepComponent && (
                    <ActiveStepComponent
                        onStepChange={handleStepChange}
                        onSetupComplete={onSetupComplete}
                    />
                )}
            </div>
        </div>
    );
}
