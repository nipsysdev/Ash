import { Button, Typography } from '@nipsysdev/lsd-react';
import logo from '../../assets/logos.svg';

interface IntroStepProps {
    onStepChange: (stepChange: number) => void;
}

export default function IntroStep({ onStepChange }: IntroStepProps) {
    return (
        <div className="flex flex-col pt-15 size-full">
            <div className="flex flex-col flex-auto items-center justify-center">
                <div className="flex flex-col w-full h-3/5 justify-around">
                    <div>
                        <Typography variant="h1" className="pb-2.5">
                            Ash
                        </Typography>
                        <Typography variant="subtitle1">
                            Your path through the fire
                        </Typography>
                    </div>

                    <div className="text-end">
                        <Button
                            onClick={() => onStepChange(1)}
                            variant="filled"
                        >
                            Get started
                        </Button>
                    </div>
                </div>
            </div>

            <div className="flex justify-end w-full">
                <img src={logo} alt="Logos" className="size-15" />
            </div>
        </div>
    );
}
