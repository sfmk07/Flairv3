import { Stack } from "expo-router"
import { PaperProvider } from "react-native-paper"
import { AuthProvider } from "../contexts/AuthContext"

export default function RootLayout() {
  return (
    <PaperProvider>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="auth" />
          <Stack.Screen name="inscription" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="chat/[matchId]" />
          <Stack.Screen name="profil/[userId]" />
          <Stack.Screen name="admin" />
        </Stack>
      </AuthProvider>
    </PaperProvider>
  )
}
