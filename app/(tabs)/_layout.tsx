import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../src/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { useColors } from "../../src/hooks/useColors";
import { View } from "react-native";
import { Platform } from "react-native";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

function TabIcon({
  name,
  focusedName,
  color,
  size,
  focused,
}: {
  name: IoniconsName;
  focusedName: IoniconsName;
  color: string;
  size: number;
  focused: boolean;
}) {
  const Colors = useColors();

  if (Platform.OS === "web") {
    const emojiMap: Partial<Record<IoniconsName, string>> = {
      "home-outline": "🏠",
      "list-outline": "📋",
      "newspaper-outline": "📰",
      "play-circle-outline": "▶️",
      "chatbubble-outline": "💬",
      "person-outline": "👤",
    };
    return (
      <View
        style={{
          alignItems: "center",
          justifyContent: "center",
          width: 44,
          height: 44,
          borderRadius: 12,
          backgroundColor: focused ? color + "18" : "transparent",
        }}
      >
        <span style={{ fontSize: size }}>{emojiMap[name]}</span>
      </View>
    );
  }

  return (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: focused ? color + "18" : "transparent",
      }}
    >
      <Ionicons name={focused ? focusedName : name} size={size} color={color} />
    </View>
  );
}

export default function TabLayout() {
  const { userData, setUser } = useAuth();
  const { t } = useTranslation();
  const Colors = useColors();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.tabBar,
          borderTopWidth: 0,
          height: 115,
          paddingBottom: 24,
          paddingTop: 8,
          // iOS shadow
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          // Android
          elevation: 20,
        },
        tabBarActiveTintColor: Colors.tabBarActive,
        tabBarInactiveTintColor: Colors.text,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("tabs.home"),
          // home
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon
              name="home-outline"
              focusedName="home"
              color={color}
              size={size}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="leagues"
        options={{
          title: t("tabs.leagues"),
          // leagues
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon
              name="list-outline"
              focusedName="list"
              color={color}
              size={size}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="news"
        options={{
          title: t("tabs.news"),
          // news
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon
              name="newspaper-outline"
              focusedName="newspaper"
              color={color}
              size={size}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="feed"
        options={{
          title: t("tabs.feed"),
          // feed
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon
              name="play-circle-outline"
              focusedName="play-circle"
              color={color}
              size={size}
              focused={focused}
            />
          ),
          tabBarStyle: { display: "none" },
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: t("tabs.chat"),
          // chat
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon
              name="chatbubble-outline"
              focusedName="chatbubble"
              color={color}
              size={size}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("tabs.profile"),
          // profile
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon
              name="person-outline"
              focusedName="person"
              color={color}
              size={size}
              focused={focused}
            />
          ),
        }}
      />
    </Tabs>
  );
}
