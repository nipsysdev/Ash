import { Button } from "@nipsysdev/lsd-react/client/Button";
import { Typography } from "@nipsysdev/lsd-react/client/Typography";
import { Autocomplete } from "@nipsysdev/lsd-react/client/Autocomplete";

interface LocalitySelectionStepProps {
    onStepChange: (stepChange: number) => void;
    activeStep: number;
}

export default function LocalitySelectionStep(
    { onStepChange }: LocalitySelectionStepProps,
) {
    return (
        <div className="flex flex-col gap-y-10 size-full justify-around">
            <div className="flex flex-col gap-y-5">
                <Typography variant="h2">
                    Where do you operate?
                </Typography>
                <Typography variant="subtitle1">
                    Let's determine which map data you need
                </Typography>
            </div>

            <div>
                <Autocomplete
                    label="Countries"
                    placeholder="Search a country"
                />
                <Autocomplete
                    label="Localities"
                    placeholder="Search a locality"
                    disabled
                />
            </div>

            <div className="flex justify-between">
                <Button onClick={() => onStepChange(-1)}>Previous</Button>
                <Button
                    onClick={() => onStepChange(1)}
                    variant="filled"
                    disabled
                >
                    Next
                </Button>
            </div>
        </div>
    );
}
