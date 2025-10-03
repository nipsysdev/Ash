import { useState } from "react";
import IntroStep from "./WelcomeIntroStep.tsx";
import LocalitySelectionStep from "./LocalitySelectionStep.tsx";

export default function WelcomeStepper() {
    const [activeStep, setActiveStep] = useState(0);

    const steps = [
        { component: IntroStep, props: { key: "intro" } },
        { component: LocalitySelectionStep, props: { key: "locality" } },
    ];

    const handleStepChange = (stepChange: number) => {
        setActiveStep((prevStep) => {
            const newStep = prevStep + stepChange;
            return Math.max(0, Math.min(newStep, steps.length - 1));
        });
    };

    const StepComponent = steps[activeStep].component;

    return (
        <div className="flex justify-center items-center size-full p-10">
            <StepComponent
                onStepChange={handleStepChange}
                activeStep={activeStep}
                {...steps[activeStep].props}
            />
        </div>
    );
}
