import { useRef, useState } from "react";
import {
  Button,
  EmitterSubscription,
  SafeAreaView,
  Text,
  View,
} from "react-native";
import { usePermission } from "./utils/hooks";
import { styles } from "./utils/styles";
import generateJwt from "./utils/jwt";
import {
  EventType,
  VideoAspect,
  ZoomVideoSdkProvider,
  ZoomVideoSdkUser,
  ZoomView,
  useZoom,
} from "@zoom/react-native-videosdk";
import { config } from "./config";

export default function App() {
  usePermission();

  return (
    <ZoomVideoSdkProvider
      config={{ appGroupId: "test", domain: "zoom.us", enableLog: true }}
    >
      <SafeAreaView style={styles.container}>
        <Call />
      </SafeAreaView>
    </ZoomVideoSdkProvider>
  );
}

const Call = () => {
  const zoom = useZoom();
  const listeners = useRef<EmitterSubscription[]>([]);
  const [users, setUsersInSession] = useState<ZoomVideoSdkUser[]>([]);
  const [isInSession, setIsInSession] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(true);
  const [isVideoMuted, setIsVideoMuted] = useState(true);

  const join = async () => {
    const token = await generateJwt(config.sessionName, config.roleType);

    const sessionJoin = zoom.addListener(EventType.onSessionJoin, async () => {
      const mySelf = new ZoomVideoSdkUser(await zoom.session.getMySelf());
      const remoteUsers = await zoom.session.getRemoteUsers();
      setUsersInSession([mySelf, ...remoteUsers]);
      setIsInSession(true);
    });
    listeners.current.push(sessionJoin);

    const userJoin = zoom.addListener(EventType.onUserJoin, async (event) => {
      const { remoteUsers } = event;
      const mySelf = await zoom.session.getMySelf();
      const remote = remoteUsers.map((user) => new ZoomVideoSdkUser(user));
      setUsersInSession([mySelf, ...remote]);
    });
    listeners.current.push(userJoin);

    const userLeave = zoom.addListener(EventType.onUserLeave, async (event) => {
      const { remoteUsers } = event;
      const mySelf = await zoom.session.getMySelf();
      const remote = remoteUsers.map((user) => new ZoomVideoSdkUser(user));
      setUsersInSession([mySelf, ...remote]);
    });
    listeners.current.push(userLeave);

    const userVideo = zoom.addListener(
      EventType.onUserVideoStatusChanged,
      async ({ changedUsers }) => {
        const mySelf = new ZoomVideoSdkUser(await zoom.session.getMySelf());
        changedUsers.find((user) => user.userId === mySelf.userId) &&
          mySelf.videoStatus.isOn().then((on) => setIsVideoMuted(!on));
      }
    );
    listeners.current.push(userVideo);

    const userAudio = zoom.addListener(
      EventType.onUserAudioStatusChanged,
      async ({ changedUsers }) => {
        const mySelf = new ZoomVideoSdkUser(await zoom.session.getMySelf());
        changedUsers.find((user) => user.userId === mySelf.userId) &&
          mySelf.audioStatus.isMuted().then((muted) => setIsAudioMuted(muted));
      }
    );
    listeners.current.push(userAudio);

    const sessionLeave = zoom.addListener(EventType.onSessionLeave, () => {
      setIsInSession(false);
      setUsersInSession([]);
      sessionLeave.remove();
    });

    try {
      await zoom.joinSession({
        sessionName: config.sessionName,
        sessionPassword: config.sessionPassword,
        token: token,
        userName: config.displayName,
        audioOptions: {
          connect: true,
          mute: true,
          autoAdjustSpeakerVolume: false,
        },
        videoOptions: { localVideoOn: true },
        sessionIdleTimeoutMins: config.sessionIdleTimeoutMins,
      });
    } catch (e) {
      console.log(e);
    }
  };

  const leaveSession = () => {
    zoom.leaveSession(false);
    listeners.current.forEach((listener) => listener.remove());
    listeners.current = [];
  };

  return isInSession ? (
    <View style={styles.container}>
      {users.map((user) => (
        <View style={styles.container} key={user.userId}>
          <ZoomView
            style={styles.container}
            userId={user.userId}
            fullScreen
            videoAspect={VideoAspect.Original}
          />
        </View>
      ))}
      <Button
        title="Leave Session"
        color={"#f01040"}
        onPress={async () => {
          leaveSession();
        }}
      />
    </View>
  ) : (
    <View style={styles.container}>
      <Text style={styles.heading}>Zoom Video SDK</Text>
      <Text style={styles.heading}>React Native Quickstart</Text>
      <View style={styles.spacer} />
      <View style={{ alignItems: "center" }}>
        <Text>Preview:</Text>
        <ZoomView
          // userId={null}
          style={{ width: 500, height: 500 }}
          preview
          fullScreen
        />
        <Button title="Join Session" onPress={join} />
      </View>
    </View>
  );
};
