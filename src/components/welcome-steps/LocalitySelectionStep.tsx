import { useStore } from '@nanostores/react';
import {
    Autocomplete,
    Button,
    Card,
    CardContent,
    Checkbox,
    Label,
    Typography,
} from '@nipsysdev/lsd-react';
import { invoke } from '@tauri-apps/api/core';
import { load } from '@tauri-apps/plugin-store';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Country } from '../../interfaces/country.ts';
import type { Locality } from '../../interfaces/locality.ts';
import { TorStatus } from '../../interfaces/tor.ts';
import { $isTorDialogOpened, $torStatus } from '../../stores/torStore.ts';

interface LocalitySelectionStepProps {
    onStepChange: (stepChange: number) => void;
}

export default function LocalitySelectionStep({
    onStepChange,
}: LocalitySelectionStepProps) {
    const torStatus = useStore($torStatus);
    const [countries, setCountries] = useState<Country[]>([]);
    const hasFetchedCountries = useRef(false);
    const [isFetchingCountries, setIsFetchingCountries] = useState(false);
    const [selectedCountry, setSelectedCountry] = useState<Country | null>(
        null,
    );
    const [selectedLocality, setSelectedLocality] = useState<Locality | null>(
        null,
    );
    const [selectedLocalities, setSelectedLocalities] = useState<Locality[]>(
        [],
    );
    const fetchedLocalities = useRef<Locality[]>([]);

    const fetchCountries = useCallback(async () => {
        setIsFetchingCountries(true);
        try {
            const countriesData = await invoke<Country[]>('get_countries');
            setCountries(countriesData);
        } catch (error) {
            console.error('Failed to fetch countries:', error);
        }
        setIsFetchingCountries(false);
    }, []);

    useEffect(() => {
        if (torStatus === TorStatus.Online && !hasFetchedCountries.current) {
            hasFetchedCountries.current = true;
            fetchCountries();
        }
    }, [torStatus, fetchCountries]);

    const fetchLocalities = async (query: string): Promise<Locality[]> => {
        if (!selectedCountry) return [];
        let localities: Locality[] = [];
        try {
            localities = await invoke<Locality[]>('get_localities', {
                countryCode: selectedCountry.country_code,
                query,
            });
        } catch (error) {
            console.error('Failed to fetch localities:', error);
        }
        fetchedLocalities.current = localities;
        return localities;
    };

    useEffect(() => {
        if (torStatus !== TorStatus.Online) {
            $isTorDialogOpened.set(true);
        }
    }, [torStatus]);

    return (
        <div className="flex flex-col gap-y-10 size-full">
            <div className="flex-auto flex flex-col">
                <div className="mb-5">
                    <Typography variant="h3" className="pb-2">
                        Where do you operate?
                    </Typography>
                    <Typography variant="subtitle2">
                        Let's determine which map data you need
                    </Typography>
                </div>

                <div className="flex flex-col flex-auto gap-y-5">
                    <Autocomplete
                        className="min-w-full"
                        label="Countries"
                        isLoading={isFetchingCountries}
                        placeholder={
                            hasFetchedCountries
                                ? 'Select a country'
                                : 'Fetching countries...'
                        }
                        options={countries.map((c) => ({
                            label: c.country_name,
                            value: c.country_code,
                        }))}
                        onValueChange={(value) => {
                            setSelectedCountry(
                                countries.find(
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
