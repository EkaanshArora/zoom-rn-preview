import { useRef, useCallback, useEffect } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import { EventType, ZoomVideoSdkUserType } from "@zoom/react-native-videosdk";
import { ZoomVideoSdkContext } from "@zoom/react-native-videosdk/lib/typescript/Context";
import { EmitterSubscription } from "react-native";

export async function requestCameraAndAudioPermission() {
  try {
    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.CAMERA,
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    ]);
    if (
      granted["android.permission.RECORD_AUDIO"] ===
      PermissionsAndroid.RESULTS.GRANTED &&
      granted["android.permission.CAMERA"] ===
      PermissionsAndroid.RESULTS.GRANTED
    ) {
      console.log("You can use the cameras & mic");
    } else {
      console.log("Permission denied");
    }
  } catch (err) {
    console.warn(err);
  }
}

export const usePermission = () => {
  useEffect(() => {
    if (Platform.OS === "android") {
      requestCameraAndAudioPermission().then(() => {
        console.log("requested!");
      });
    }
  }, []);
}


declare module "@zoom/react-native-videosdk" {
  export function useZoom(): Omit<ZoomVideoSdkContext, "addListener"> &
    CustomEvents;
  export function getRemoteUsers(): Promise<ZoomVideoSdkUserType[]>;
  export interface CustomEvents {
    addListener(
      event: EventType.onSessionJoin,
      handler: (event: { mySelf: userFromEvent }) => void
    ): EmitterSubscription;
    addListener(
      event: EventType.onUserJoin,
      handler: (event: {
        joinedUsers: userFromEvent[];
        remoteUsers: userFromEvent[];
      }) => void
    ): EmitterSubscription;
    addListener(
      event: EventType.onUserLeave,
      handler: (event: {
        leftUsers: userFromEvent[];
        remoteUsers: userFromEvent[];
      }) => void
    ): EmitterSubscription;
    addListener(
      event: EventType.onUserAudioStatusChanged,
      handler: (event: { changedUsers: userFromEvent[] }) => void
    ): EmitterSubscription;
    addListener(
      event: EventType.onUserVideoStatusChanged,
      handler: (event: { changedUsers: userFromEvent[] }) => void
    ): EmitterSubscription;
    addListener(
      event: EventType,
      handler: (data?: any) => void
    ): EmitterSubscription;
  }
}

type userFromEvent = ZoomVideoSdkUserType; // this type isn't correct i think, missing methods
// type userFromEvent = {
//   customUserId: string;
//   isHost: boolean;
//   isManager: boolean;
//   userId: string;
//   userName: string;
// };
