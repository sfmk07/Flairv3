import { Tabs } from "expo-router"
import { MaterialIcons } from "@expo/vector-icons"

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#e91e63",
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="swipe"
        options={{
          title: "Découvrir",
          tabBarIcon: ({ color, size }) => <MaterialIcons name="favorite" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="matches"
        options={{
          title: "Matches",
          tabBarIcon: ({ color, size }) => <MaterialIcons name="chat" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="carte"
        options={{
          title: "Carte",
          tabBarIcon: ({ color, size }) => <MaterialIcons name="map" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: "Profil",
          tabBarIcon: ({ color, size }) => <MaterialIcons name="person" size={size} color={color} />,
        }}
      />
    </Tabs>
  )
}
