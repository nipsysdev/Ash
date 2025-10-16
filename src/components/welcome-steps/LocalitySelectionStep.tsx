import { useStore } from '@nanostores/react';
import {
    Autocomplete,
    Badge,
    Button,
    Card,
    CardContent,
    Checkbox,
    Label,
    Typography,
} from '@nipsysdev/lsd-react';
import { load } from '@tauri-apps/plugin-store';
import { useRef, useState } from 'react';
import type { Country, Locality } from '../../interfaces/localitysrv.ts';
import {
    $isWakuDialogOpened,
    $wakuStatus,
    searchCountries,
    searchLocalities,
} from '../../stores/wakuStore.ts';

interface LocalitySelectionStepProps {
    onStepChange: (stepChange: number) => void;
}

export default function LocalitySelectionStep({
    onStepChange,
}: LocalitySelectionStepProps) {
    const wakuStatus = useStore($wakuStatus);
    const [selectedCountry, setSelectedCountry] = useState<Country | null>(
        null,
    );
    const [selectedLocality, setSelectedLocality] = useState<Locality | null>(
        null,
    );
    const [selectedLocalities, setSelectedLocalities] = useState<Locality[]>(
        [],
    );
    const fetchedCountries = useRef<Country[]>([]);
    const fetchedLocalities = useRef<Locality[]>([]);

    const fetchLocalities = async (query: string): Promise<Locality[]> => {
        if (!selectedCountry) return [];
        let localities: Locality[] = [];
        try {
            localities = (
                await searchLocalities(selectedCountry.country_code, query)
            ).localities;
            console.log('squad', localities);
        } catch (error) {
            console.error('Failed to fetch localities:', error);
        }
        fetchedLocalities.current = localities;
        return localities;
    };

    const fetchCountries = async (query: string): Promise<Country[]> => {
        let countries: Country[] = [];
        try {
            countries = (await searchCountries(query)).countries;
        } catch (error) {
            console.error('Failed to fetch countries:', error);
        }
        fetchedCountries.current = countries;
        return countries;
    };

    return (
        <div className="flex flex-col gap-y-10 size-full">
            <div className="flex-auto flex flex-col">
                <div className="mb-2">
                    <Typography variant="h3" className="pb-2">
                        Where do you operate?
                    </Typography>
                    <Typography variant="subtitle2">
                        Let's determine which map data you need
                    </Typography>
                </div>

                <div className="mb-3 flex justify-end">
                    <Badge
                        variant="outlined"
                        size="sm"
                        onClick={() => $isWakuDialogOpened.set(true)}
                    >
                        Waku: {wakuStatus}
                    </Badge>
                </div>

                <div className="flex flex-col flex-auto gap-y-5">
                    <Autocomplete
                        className="min-w-full"
                        label="Countries"
                        placeholder="Search a country"
                        loadingText="Loading countries"
                        onOptionsFetch={async (searchText) => {
                            return (await fetchCountries(searchText)).map(
                                (c) => ({
                                    label: c.country_name,
                                    value: `${c.country_code}`,
                                }),
                            );
                        }}
                        onValueChange={(value) => {
                            setSelectedCountry(
                                fetchedCountries.current.find(
                                    (c) => c.country_code === value,
                                ) ?? null,
                            );
                            setSelectedLocality(null);
                        }}
                        clearable
                    />

                    <div className="flex justify-between items-end gap-x-5">
                        <Autocomplete
                            label="Localities"
                            placeholder="Search a locality"
                            loadingText="Loading localities"
                            value={selectedLocality?.id.toString() ?? ''}
                            onOptionsFetch={async (searchText) => {
                                return (await fetchLocalities(searchText)).map(
                                    (l) => ({
                                        label: l.name,
                                        value: `${l.id}`,
                                    }),
                                );
                            }}
                            disabled={!selectedCountry}
                            onValueChange={(localityId) =>
                                setSelectedLocality(
                                    fetchedLocalities.current.find(
                                        (l) => `${l.id}` === localityId,
                                    ) ?? null,
                                )
                            }
                            onClear={() => setSelectedLocality(null)}
                            clearable
                        />
                        <Button
                            size="lg"
                            variant="outlined"
                            disabled={!selectedLocality}
                            onClick={() => {
                                if (!selectedLocality) return;
                                setSelectedLocalities([
                                    ...selectedLocalities,
                                    selectedLocality,
                                ]);
                                setSelectedLocality(null);
                            }}
                        >
                            Add
                        </Button>
                    </div>

                    <Card className="flex-auto">
                        <CardContent className="flex flex-col gap-y-1">
                            {!selectedLocalities.length && (
                                <Typography
                                    variant="subtitle3"
                                    color="secondary"
                                >
                                    Add one or more localities to continue
                                </Typography>
                            )}
                            {selectedLocalities.map((locality) => (
                                <div
                                    key={locality.id}
                                    className="flex items-center gap-x-2"
                                >
                                    <Checkbox
                                        id={`${locality.id}`}
                                        defaultChecked
                                        onCheckedChange={() =>
                                            setSelectedLocalities(
                                                selectedLocalities.filter(
                                                    (l) => l.id !== locality.id,
                                                ),
                                            )
                                        }
                                    />
                                    <Label htmlFor={`${locality.id}`}>
                                        {locality.name}
                                    </Label>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div className="flex justify-between">
                <Button variant="outlined" onClick={() => onStepChange(-1)}>
                    Previous
                </Button>
                <Button
                    onClick={async () => {
                        const store = await load('store.json');
                        await store.set(
                            'active_localities',
                            selectedLocalities,
                        );
                        onStepChange(1);
                    }}
                    variant="filled"
                    disabled={!selectedLocalities.length}
                >
                    Next
                </Button>
            </div>
        </div>
    );
}
