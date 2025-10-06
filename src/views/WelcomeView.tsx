import { useCallback, useState } from 'react';
import LocalitySelectionStep from '../components/welcome-steps/LocalitySelectionStep.tsx';
import MapDownloadStep from '../components/welcome-steps/MapDownloadStep.tsx';
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
        <div className="flex justify-center items-center size-full p-10">
            {ActiveStepComponent && (
                <ActiveStepComponent
                    onStepChange={handleStepChange}
                    onSetupComplete={onSetupComplete}
                />
            )}
        </div>
    );
}
