import { useStore } from '@nanostores/react';
import {
    Badge,
    Button,
    ButtonGroup,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    Label,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Sheet,
    SheetContent,
    SheetTrigger,
    Typography,
} from '@nipsysdev/lsd-react';
import { MessageSquare } from 'lucide-react';
import GroupChatComponent from '../components/GroupChatComponent.tsx';
import MapComponent from '../components/MapComponent.tsx';
import {
    $storeGroups,
    $storeLocalities,
    $storeSelectedGroup,
    setStoreSelectedGroup,
} from '../stores/jsonStore.ts';
import {
    $isGroupInviteDialogOpened,
    $isGroupJoinDialogOpened,
    $isNewGroupDialogOpened,
    $isSheetOpened,
    $mapSelectedLocality,
} from '../stores/mainViewStore.ts';
import {
    $isWakuDialogOpened,
    $wakuChatChannel,
    $wakuStatus,
} from '../stores/wakuStore.ts';

export default function MainView() {
    const isSheetOpened = useStore($isSheetOpened);
    const storeLocalities = useStore($storeLocalities);
    const selectedLocality = useStore($mapSelectedLocality);
    const storeGroups = useStore($storeGroups);
    const selectedGroup = useStore($storeSelectedGroup);
    const wakuStatus = useStore($wakuStatus);
    const wakuChatChannel = useStore($wakuChatChannel);

    if (!storeLocalities.length || !selectedLocality) {
        return null;
    }

    function openNewGroupDialog() {
        $isSheetOpened.set(false);
        $isNewGroupDialogOpened.set(true);
    }

    function onGroupChange(groupId: string) {
        setStoreSelectedGroup(
            storeGroups.find((group) => group.id === groupId) ?? null,
        );
    }

    function openGroupInviteDialog() {
        if (!selectedGroup) return;
        $isSheetOpened.set(false);
        $isGroupInviteDialogOpened.set(true);
    }

    function openGroupJoinDialog() {
        $isSheetOpened.set(false);
        $isGroupJoinDialogOpened.set(true);
    }

    return (
        <Sheet
            open={isSheetOpened}
            onOpenChange={(open) => $isSheetOpened.set(open)}
        >
            <div className="size-full flex flex-col">
                <MapComponent locality={selectedLocality} />

                <div className="absolute top-0 left-0 p-5 mt-[env(safe-area-inset-top)] flex w-full justify-between items-center">
                    <SheetTrigger asChild>
                        <Button variant="outlined">Menu</Button>
                    </SheetTrigger>

                    <div className="flex gap-x-2">
                        <Badge
                            variant="outlined"
                            size="sm"
                            onClick={() => $isWakuDialogOpened.set(true)}
                        >
                            Waku: {wakuStatus}
                        </Badge>
                    </div>
                </div>

                <Dialog>
                    <DialogTrigger asChild>
                        <Button
                            variant="outlined-icon"
                            size="icon-xl"
                            aria-label="Add"
                            className="absolute bottom-1/12 right-5 mb-[env(safe-area-inset-bottom)]"
                            disabled={!wakuChatChannel}
                        >
                            <MessageSquare size={20} />
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Group Chat</DialogTitle>
                            <DialogDescription>
                                Communicate safely and privately through Waku.
                            </DialogDescription>
                        </DialogHeader>
                        <GroupChatComponent />
                    </DialogContent>
                </Dialog>

                <div className="absolute bottom-0 mb-[env(safe-area-inset-top)] left-5 opacity-80">
                    <Typography variant="subtitle4" color="secondary">
                        © MapLibre © Protomaps © OpenStreetMap
                    </Typography>
                </div>
            </div>
            <SheetContent side="left" className="flex flex-col p-5">
                <div>
                    <Label className="mb-2">Change locality</Label>
                    <Select
                        value={selectedLocality.id.toString()}
                        onValueChange={(value) => {
                            const locality = storeLocalities.find(
                                (l) => l.id.toString() === value,
                            );
                            if (locality) {
                                $mapSelectedLocality.set(locality);
                            }
                        }}
                    >
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Select a locality" />
                        </SelectTrigger>
                        <SelectContent>
                            {storeLocalities.map((locality) => (
                                <SelectItem
                                    key={locality.id}
                                    value={locality.id.toString()}
                                >
                                    {locality.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="w-fit">
                    <Label className="mb-2">Active group</Label>
                    <Select
                        value={selectedGroup?.id}
                        onValueChange={onGroupChange}
                    >
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="No active group" />
                        </SelectTrigger>
                        <SelectContent>
                            {storeGroups.map((group) => (
                                <SelectItem key={group.id} value={group.id}>
                                    {group.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <div className="flex justify-between w-full mt-2">
                        <Button
                            size="sm"
                            variant="outlined"
                            disabled={!selectedGroup}
                            onClick={openGroupInviteDialog}
                        >
                            Invite
                        </Button>
                        <ButtonGroup>
                            <Button
                                size="sm"
                                variant="outlined"
                                onClick={openGroupJoinDialog}
                            >
                                Join
                            </Button>
                            <Button
                                size="sm"
                                variant="outlined"
                                onClick={openNewGroupDialog}
                            >
                                New
                            </Button>
                        </ButtonGroup>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
