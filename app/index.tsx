"use client"

import { useEffect } from "react"
import { useRouter } from "expo-router"
import { View, ActivityIndicator } from "react-native"
import { useAuth } from "../contexts/AuthContext"

export default function Index() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace("/(tabs)/swipe")
      } else {
        router.replace("/auth")
      }
    }
  }, [user, loading])

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" color="#e91e63" />
    </View>
  )
}
