import type { IDecodedMessage, IDecoder, IEncoder, LightNode } from '@waku/sdk';
import {
    createLightNode,
    HealthStatus,
    Protocols,
    ReliableChannel,
    WakuEvent,
} from '@waku/sdk';
import { nanoid } from 'nanoid';
import { atom, effect } from 'nanostores';
import protobuf from 'protobufjs';
import {
    type CountrySearchResponse,
    emptyCountrySearchResponse,
    emptyLocalitySearchResponse,
    type LocalitySearchResponse,
} from '../interfaces/localitysrv';
import { NetworkStatus } from '../interfaces/networkStatus';

interface LightPushChannel {
    contentTopic: string;
    encoder: IEncoder;
    decoder: IDecoder<IDecodedMessage>;
    countryProto: protobuf.Type;
    localityProto: protobuf.Type;
    countryQueryProto: protobuf.Type;
    countryRespProto: protobuf.Type;
    localityQueryProto: protobuf.Type;
    localityRespProto: protobuf.Type;
}

export const $wakuLightNode = atom<LightNode | null>(null);
export const $isWakuDialogOpened = atom(false);
export const $wakuChatChannel = atom<ReliableChannel<IDecodedMessage> | null>(
    null,
);
export const $wakuServerChannel = atom<LightPushChannel | null>(null);
export const $wakuStatus = atom<NetworkStatus>(NetworkStatus.Offline);
export const $wakuError = atom<string | null>(null);
export const $wakuSentMessages = atom<Record<string, Record<string, string>>>(
    {},
);

export async function createWakuNode() {
    try {
        console.log('Creating a Waku light node...');
        $wakuStatus.set(NetworkStatus.Pending);

        const customBootstrap = [
            '/dns4/waku-test.bloxy.one/tcp/8000/wss/p2p/16Uiu2HAmSZbDB7CusdRhgkD81VssRjQV5ZH13FbzCGcdnbbh6VwZ',
            '/dns4/waku.fryorcraken.xyz/tcp/8000/wss/p2p/16Uiu2HAmMRvhDHrtiHft1FTUYnn6cVA8AWVrTyLUayJJ3MWpUZDB',
        ];
        const wakuLightNode = await createLightNode({
            defaultBootstrap: false,
            bootstrapPeers: customBootstrap,
            userAgent: 'ash',
        });

        console.log(wakuLightNode);

        wakuLightNode.events.addEventListener(
            WakuEvent.Health,
            (event: CustomEvent) => {
                console.log('health', event);
                const health = event.detail;

                if (health === HealthStatus.SufficientlyHealthy) {
                    console.log('Waku node is sufficiently healthy');
                    $wakuStatus.set(NetworkStatus.Online);
                } else if (health === HealthStatus.MinimallyHealthy) {
                    console.log('Waku node is minimally healthy');
                    $wakuStatus.set(NetworkStatus.Pending);
                } else {
                    console.log('Waku node is not healthy');
                    if ($wakuStatus.get() === NetworkStatus.Online) {
                        createWakuNode().then(() => createWakuServerChannel());
                    }
                    $wakuStatus.set(NetworkStatus.Offline);
                }
            },
        );

        const health = wakuLightNode.health;
        if (health === HealthStatus.SufficientlyHealthy) {
            $wakuStatus.set(NetworkStatus.Online);
        } else if (health === HealthStatus.MinimallyHealthy) {
            $wakuStatus.set(NetworkStatus.Pending);
        } else {
            $wakuStatus.set(NetworkStatus.Offline);
        }

        console.log('Waku node created');
        $wakuLightNode.set(wakuLightNode);
    } catch (error) {
        console.error('Failed to create a Waku light node:', error);
        $wakuStatus.set(NetworkStatus.Offline);
    }
}

export async function createReliableChannel(
    channelId: string,
    senderId: string,
    contentTopic: string,
    onMessageReceived: (() => void) | null = null,
    onMessageSent: (() => void) | null = null,
    onMessageAcknowledged: (() => void) | null = null,
    onFatalError: (() => void) | null = null,
) {
    const node = $wakuLightNode.get();
    if (!node) return;
    const encoder = node.createEncoder({
        contentTopic: contentTopic,
    });
    const decoder = node.createDecoder({
        contentTopic: contentTopic,
    });

    const reliableChannel = await ReliableChannel.create(
        node,
        channelId,
        senderId,
        encoder,
        decoder,
    );
    reliableChannel.addEventListener('message-received', onMessageReceived);
    reliableChannel.addEventListener('message-sent', onMessageSent);
    reliableChannel.addEventListener(
        'message-acknowledged',
        onMessageAcknowledged,
    );
    reliableChannel.addEventListener(
        'sending-message-irrecoverable-error',
        onFatalError,
    );

    $wakuChatChannel.set(reliableChannel);
    console.log('Reliable Channel created');
}

export async function createWakuServerChannel() {
    const node = $wakuLightNode.get();
    if (!node) {
        console.error('Waku node has not been initialized yet');
        return;
    }

    try {
        console.log('Creating Waku countries channel...');

        await node.waitForPeers([Protocols.LightPush, Protocols.Filter]);

        const contentTopic = '/ash/1/localitysrv/proto';

        const encoder = node.createEncoder({
            contentTopic: contentTopic,
        });
        const decoder = node.createDecoder({
            contentTopic: contentTopic,
        });

        await node.filter.subscribe(
            [decoder],
            (wakuMessage: IDecodedMessage) => {
                if (!wakuMessage.payload) return;

                console.log('Received server message:', wakuMessage);
            },
        );

        // Define protobuf message types to match server implementation
        const Country = new protobuf.Type('Country')
            .add(new protobuf.Field('country_code', 1, 'string'))
            .add(new protobuf.Field('country_name', 2, 'string'))
            .add(new protobuf.Field('locality_count', 3, 'uint32'));

        const Locality = new protobuf.Type('Locality')
            .add(new protobuf.Field('id', 1, 'string'))
            .add(new protobuf.Field('name', 2, 'string'))
            .add(new protobuf.Field('country', 3, 'string'))
            .add(new protobuf.Field('placetype', 4, 'string'))
            .add(new protobuf.Field('latitude', 5, 'float'))
            .add(new protobuf.Field('longitude', 6, 'float'))
            .add(new protobuf.Field('min_longitude', 7, 'float'))
            .add(new protobuf.Field('min_latitude', 8, 'float'))
            .add(new protobuf.Field('max_longitude', 9, 'float'))
            .add(new protobuf.Field('max_latitude', 10, 'float'))
            .add(new protobuf.Field('file_size', 11, 'uint64'))
            .add(new protobuf.Field('onion_link', 12, 'string'));

        const countryQueryProtoType = new protobuf.Type('CountrySearchQuery')
            .add(new protobuf.Field('query_id', 1, 'string'))
            .add(new protobuf.Field('query_method', 2, 'string'))
            .add(new protobuf.Field('query', 3, 'string'))
            .add(new protobuf.Field('page', 4, 'uint32'))
            .add(new protobuf.Field('limit', 5, 'uint32'));

        const countryRespProtoType = new protobuf.Type('CountrySearchResponse')
            .add(new protobuf.Field('query_id', 1, 'string'))
            .add(new protobuf.Field('countries', 2, 'Country', 'repeated'))
            .add(new protobuf.Field('total', 3, 'uint32'))
            .add(new protobuf.Field('page', 4, 'uint32'))
            .add(new protobuf.Field('total_pages', 5, 'uint32'));

        const localityQueryProtoType = new protobuf.Type('LocalitySearchQuery')
            .add(new protobuf.Field('query_id', 1, 'string'))
            .add(new protobuf.Field('query_method', 2, 'string'))
            .add(new protobuf.Field('country_code', 3, 'string'))
            .add(new protobuf.Field('query', 4, 'string'))
            .add(new protobuf.Field('page', 5, 'uint32'))
            .add(new protobuf.Field('limit', 6, 'uint32'));

        const localityRespProtoType = new protobuf.Type(
            'LocalitySearchResponse',
        )
            .add(new protobuf.Field('query_id', 1, 'string'))
            .add(new protobuf.Field('localities', 2, 'Locality', 'repeated'))
            .add(new protobuf.Field('total', 3, 'uint32'))
            .add(new protobuf.Field('page', 4, 'uint32'))
            .add(new protobuf.Field('total_pages', 5, 'uint32'));

        // Create a root namespace and add the message types
        const root = new protobuf.Root();
        root.add(Country);
        root.add(Locality);
        root.add(countryQueryProtoType);
        root.add(countryRespProtoType);
        root.add(localityQueryProtoType);
        root.add(localityRespProtoType);

        const serverChannel: LightPushChannel = {
            contentTopic,
            encoder,
            decoder,
            countryProto: Country,
            localityProto: Locality,
            countryQueryProto: countryQueryProtoType,
            countryRespProto: countryRespProtoType,
            localityQueryProto: localityQueryProtoType,
            localityRespProto: localityRespProtoType,
        };
        $wakuServerChannel.set(serverChannel);
        console.log('Waku server channel created');
    } catch (error) {
        console.error('Failed to create Waku server channel:', error);
    }
}

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

                console.log('message', wakuMessage);

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

        console.log('waku countries resp', resp);
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

                console.log('message', wakuMessage);

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

export async function sendCountryMessage(countries: any[]) {
    const node = $wakuLightNode.get();
    if (!node) {
        console.error('Waku node has not been initialized yet');
        return;
    }

    try {
        console.log('Sending country message...');

        const contentTopic = '/ash/countries/1.0.0/proto';
        const encoder = node.createEncoder({
            contentTopic: contentTopic,
        });

        // Create a message structure for countries
        const CountriesPacket = new protobuf.Type('CountriesPacket')
            .add(new protobuf.Field('timestamp', 1, 'uint64'))
            .add(new protobuf.Field('countries', 2, 'string')); // JSON string of countries array

        // Create the message object
        const protoMessage = CountriesPacket.create({
            timestamp: Date.now(),
            countries: JSON.stringify(countries),
        });

        // Serialize the message using Protobuf
        const payload = CountriesPacket.encode(protoMessage).finish();

        // Send the message using Light Push
        await node.lightPush.send(encoder, {
            payload: payload,
        });

        console.log('Country message sent successfully');
    } catch (error) {
        console.error('Failed to send country message:', error);
    }
}

export async function sendChatMessage(sender: string, message: string) {
    const reliableChannel = $wakuChatChannel.get();
    if (!reliableChannel) {
        console.error('Reliable Channel has not been initialized yet');
        return;
    }

    try {
        console.info('Sending message:', { message, sender });

        const DataPacket = new protobuf.Type('DataPacket')
            .add(new protobuf.Field('timestamp', 1, 'uint64'))
            .add(new protobuf.Field('sender', 2, 'string'))
            .add(new protobuf.Field('message', 3, 'string'));

        const protoMessage = DataPacket.create({
            timestamp: Date.now(),
            sender,
            message,
        });
        const payload = DataPacket.encode(protoMessage).finish();

        const messageId = reliableChannel.send(payload);
        console.log('Message sent with ID:', messageId);

        const sentMessages = $wakuSentMessages.get();
        sentMessages[messageId] = protoMessage.toJSON();
        $wakuSentMessages.set(sentMessages);
        return messageId;
    } catch (error) {
        console.error('Failed to send message:', error);
    }
}

effect($wakuStatus, () => {
    $wakuError.set(null);
});
