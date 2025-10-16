import type { IDecodedMessage, IDecoder, IEncoder, LightNode } from '@waku/sdk';
import {
    createLightNode,
    HealthStatus,
    Protocols,
    ReliableChannel,
    WakuEvent,
} from '@waku/sdk';
import { atom, effect } from 'nanostores';
import protobuf from 'protobufjs';
import { NetworkStatus } from '../interfaces/networkStatus';
import { $storeDeviceId, $storeSelectedGroup } from './jsonStore';

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

const backendContentTopic = '/ash/1/localitysrv/proto';
const groupChatContentTopic = '/ash/1/groupchat/proto';
const channelCreationTimeout = 1500;

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
export const $reconnectId = atom<number | null>(null);

effect($wakuStatus, (wakuStatus) => {
    $wakuError.set(null);
    if (wakuStatus === NetworkStatus.Online) {
        setTimeout(createWakuServerChannel, channelCreationTimeout);
    }
});

effect(
    [$storeSelectedGroup, $storeDeviceId, $wakuStatus],
    (selectedGroup, deviceId, wakuStatus) => {
        if (!selectedGroup || !deviceId || wakuStatus !== NetworkStatus.Online)
            return;
        setTimeout(() => {
            createReliableChannel(
                selectedGroup.id,
                deviceId,
                groupChatContentTopic,
                (event) => {
                    console.log('testefefe', event.detail);
                },
            );
        }, channelCreationTimeout);
    },
);

export async function createWakuNode() {
    try {
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

        wakuLightNode.events.addEventListener(
            WakuEvent.Health,
            (event: CustomEvent) => {
                console.log('health', event);
                const health = event.detail;

                if (health === HealthStatus.SufficientlyHealthy) {
                    console.log('Waku node is sufficiently healthy');
                    $wakuStatus.set(NetworkStatus.Online);

                    const reconnectId = $reconnectId.get();
                    if (reconnectId) {
                        clearTimeout(reconnectId);
                    }
                } else if (health === HealthStatus.MinimallyHealthy) {
                    console.log('Waku node is minimally healthy');
                    $wakuStatus.set(NetworkStatus.Pending);
                } else {
                    console.log('Waku node is not healthy');
                    $wakuStatus.set(NetworkStatus.Offline);
                    $reconnectId.set(
                        setTimeout(() => {
                            createWakuNode();
                        }, 5000),
                    );
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
    onMessageReceived: ((event: any) => void) | null = null,
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
        await node.waitForPeers([Protocols.LightPush, Protocols.Filter]);

        const encoder = node.createEncoder({
            contentTopic: backendContentTopic,
        });
        const decoder = node.createDecoder({
            contentTopic: backendContentTopic,
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
            contentTopic: backendContentTopic,
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
            .add(new protobuf.Field('time', 1, 'string'))
            .add(new protobuf.Field('countries', 2, 'string')); // JSON string of countries array

        // Create the message object
        const protoMessage = CountriesPacket.create({
            time: new Date().toISOString(),
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
            .add(new protobuf.Field('time', 1, 'string'))
            .add(new protobuf.Field('sender', 2, 'string'))
            .add(new protobuf.Field('message', 3, 'string'));

        const protoMessage = DataPacket.create({
            time: Date.toString(),
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
