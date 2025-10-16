import type { IDecodedMessage } from '@waku/sdk';
import { nanoid } from 'nanoid';
import {
    type CountrySearchResponse,
    emptyCountrySearchResponse,
    emptyLocalitySearchResponse,
    type LocalitySearchResponse,
} from '../interfaces/localitysrv';
import { $wakuLightNode, $wakuServerChannel } from '../stores/wakuStore';

export async function searchCountries(
    query: string,
    page: number = 1,
    limit: number = 10,
): Promise<CountrySearchResponse> {
    const node = $wakuLightNode.get();
    const wakuServerChannel = $wakuServerChannel.get();

    if (!node) {
        console.error('Waku node has not been initialized yet');
        return emptyCountrySearchResponse;
    }

    if (!wakuServerChannel) {
        console.error('Server channel has not been initialized yet');
        return emptyCountrySearchResponse;
    }

    try {
        console.log('Searching countries...');

        // Generate a random query ID
        const queryId = nanoid();

        // Create a promise that will resolve when we receive a response
        const resp = await new Promise<any>((resolve) => {
            // Create a callback function for processing messages
            const callback = (wakuMessage: IDecodedMessage) => {
                // Check if there is a payload on the message
                if (!wakuMessage.payload) return;

                try {
                    // Decode the message using the dataPacket
                    const messageObj =
                        wakuServerChannel.countryRespProto.decode(
                            wakuMessage.payload,
                        ) as unknown as CountrySearchResponse;
                    console.log('Received country response:', messageObj);

                    // Check if this response has a query_id and it matches our query ID
                    if (
                        messageObj.query_id &&
                        messageObj.query_id === queryId &&
                        messageObj.page !== undefined
                    ) {
                        // Resolve the promise with the received data
                        resolve(messageObj);
                    }
                } catch (error) {
                    console.error('Failed to decode country message:', error);
                }
            };

            // Subscribe to the filter to receive messages
            node.filter.subscribe([wakuServerChannel.decoder], callback);

            // Create the search request message
            const protoMessage = wakuServerChannel.countryQueryProto.create({
                query_id: queryId,
                query_method: 'search_country',
                query,
                page,
                limit,
            });

            // Serialize the message using Protobuf
            const payload = wakuServerChannel.countryQueryProto
                .encode(protoMessage)
                .finish();

            // Send the search request using Light Push
            node.lightPush.send(wakuServerChannel.encoder, {
                payload: payload,
            });

            console.log('Country search request sent');
        });
        node.filter.unsubscribe([wakuServerChannel.decoder]);
        return resp;
    } catch (error) {
        console.error('Failed to search countries:', error);
        return emptyCountrySearchResponse;
    }
}

export async function searchLocalities(
    countryCode: string,
    query: string,
    page: number = 1,
    limit: number = 10,
): Promise<LocalitySearchResponse> {
    const node = $wakuLightNode.get();
    const wakuServerChannel = $wakuServerChannel.get();

    if (!node) {
        console.error('Waku node has not been initialized yet');
        return emptyLocalitySearchResponse;
    }

    if (!wakuServerChannel) {
        console.error('Server channel has not been initialized yet');
        return emptyLocalitySearchResponse;
    }

    try {
        console.log('Searching localities...');

        // Generate a random query ID
        const queryId = nanoid();

        // Create a promise that will resolve when we receive a response
        const resp = await new Promise<any>((resolve) => {
            // Create a callback function for processing messages
            const callback = (wakuMessage: IDecodedMessage) => {
                // Check if there is a payload on the message
                if (!wakuMessage.payload) return;

                try {
                    // Decode the message using the dataPacket
                    const messageObj =
                        wakuServerChannel.localityRespProto.decode(
                            wakuMessage.payload,
                        ) as unknown as LocalitySearchResponse;
                    console.log(
                        'Received locality response:',
                        JSON.stringify(messageObj),
                    );

                    // Check if this response has a query_id and it matches our query ID
                    if (
                        messageObj.query_id &&
                        messageObj.query_id === queryId &&
                        messageObj.page !== undefined
                    ) {
                        // Resolve the promise with the received data
                        resolve(messageObj);
                    }
                } catch (error) {
                    console.error('Failed to decode locality message:', error);
                }
            };

            // Subscribe to the filter to receive messages
            node.filter.subscribe([wakuServerChannel.decoder], callback);

            // Create the search request message
            const protoMessage = wakuServerChannel.localityQueryProto.create({
                query_id: queryId,
                query_method: 'search_locality',
                country_code: countryCode,
                query,
                page,
                limit,
            });

            // Serialize the message using Protobuf
            const payload = wakuServerChannel.localityQueryProto
                .encode(protoMessage)
                .finish();

            // Send the search request using Light Push
            node.lightPush.send(wakuServerChannel.encoder, {
                payload: payload,
            });

            console.log('Locality search request sent');
        });
        node.filter.unsubscribe([wakuServerChannel.decoder]);

        console.log('waku localities resp', resp);
        return resp;
    } catch (error) {
        console.error('Failed to search localities:', error);
        return emptyLocalitySearchResponse;
    }
}
