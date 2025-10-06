import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@nipsysdev/lsd-react';
import MapComponent from '../components/MapComponent.tsx';
import { useLocalities } from '../hooks/useLocalities.ts';

export default function MainView() {
    const { localities, selectedLocality, setSelectedLocality, isLoading } =
        useLocalities();

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (!selectedLocality) {
        return <div>No locality selected</div>;
    }

    return (
        <div className="flex flex-col size-full p-4 gap-4">
            <Select
                value={selectedLocality.id.toString()}
                onValueChange={(value) => {
                    const locality = localities.find(
                        (l) => l.id.toString() === value,
                    );
                    if (locality) {
                        setSelectedLocality(locality);
                    }
                }}
            >
                <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select a locality" />
                </SelectTrigger>
                <SelectContent>
                    {localities.map((locality) => (
                        <SelectItem
                            key={locality.id}
                            value={locality.id.toString()}
                        >
                            {locality.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <div className="flex-auto">
                <MapComponent locality={selectedLocality} />
            </div>
        </div>
    );
}
