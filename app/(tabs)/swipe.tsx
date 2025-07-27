"use client"

import { useState, useEffect } from "react"
import { View, StyleSheet, Dimensions, Image, Alert } from "react-native"
import { Text, Card, Button, Chip } from "react-native-paper"
import { PanGestureHandler } from "react-native-gesture-handler"
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from "react-native-reanimated"
import { useAuth } from "../../contexts/AuthContext"
import { supabase } from "../../lib/supabase"
import type { User } from "../../types"
import { calculateDistance } from "../../utils/distance"

const { width: screenWidth } = Dimensions.get("window")

export default function SwipePage() {
  const { user } = useAuth()
  const [profiles, setProfiles] = useState<User[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  const translateX = useSharedValue(0)
  const rotate = useSharedValue(0)

  useEffect(() => {
    if (user) {
      loadProfiles()
    }
  }, [user])

  const loadProfiles = async () => {
    if (!user) return

    try {
      // Récupérer les utilisateurs déjà likés
      const { data: likedUsers } = await supabase.from("likes").select("liked_user_id").eq("user_id", user.id)

      const likedIds = likedUsers?.map((like) => like.liked_user_id) || []

      // Récupérer les utilisateurs bloqués
      const { data: blockedUsers } = await supabase.from("blocks").select("blocked_id").eq("blocker_id", user.id)

      const blockedIds = blockedUsers?.map((block) => block.blocked_id) || []

      // Récupérer les profils compatibles
      const { data: potentialMatches, error } = await supabase
        .from("users")
        .select("*")
        .neq("id", user.id)
        .eq("is_visible", true)
        .not("id", "in", `(${[...likedIds, ...blockedIds, user.id].join(",")})`)

      if (error) throw error

      // Filtrer par distance (par défaut 20km)
      const maxDistance = 20 // km
      const filteredByDistance =
        potentialMatches?.filter((profile) => {
          if (!profile.latitude || !profile.longitude || !user.latitude || !user.longitude) {
            return false
          }
          const distance = calculateDistance(user.latitude, user.longitude, profile.latitude, profile.longitude)
          return distance <= maxDistance
        }) || []

      // Filtrer par orientation et genre
      const filteredProfiles = filteredByDistance.filter((profile) => {
        const isCompatible = checkCompatibility(user, profile)
        return isCompatible
      })

      setProfiles(filteredProfiles)
    } catch (error) {
      console.error("Erreur chargement profils:", error)
    } finally {
      setLoading(false)
    }
  }

  const checkCompatibility = (currentUser: User, targetUser: User) => {
    // Logique de compatibilité basée sur l'orientation
    if (currentUser.orientation === "heterosexuel") {
      return currentUser.genre !== targetUser.genre
    } else if (currentUser.orientation === "homosexuel") {
      return currentUser.genre === targetUser.genre
    }
    return true // bisexuel
  }

  const handleLike = async (likedUserId: string) => {
    if (!user) return

    try {
      // Enregistrer le like
      await supabase.from("likes").insert({
        user_id: user.id,
        liked_user_id: likedUserId,
      })

      // Vérifier si c'est un match mutuel
      const { data: mutualLike } = await supabase
        .from("likes")
        .select("*")
        .eq("user_id", likedUserId)
        .eq("liked_user_id", user.id)
        .single()

      if (mutualLike) {
        // Créer le match
        await supabase.from("matches").insert({
          user1_id: user.id,
          user2_id: likedUserId,
        })

        Alert.alert("🎉 Match !", "Vous avez un nouveau match !")
      }

      nextProfile()
    } catch (error) {
      console.error("Erreur like:", error)
    }
  }

  const handlePass = () => {
    nextProfile()
  }

  const nextProfile = () => {
    setCurrentIndex((prev) => prev + 1)
    translateX.value = withSpring(0)
    rotate.value = withSpring(0)
  }

  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, context) => {
      context.startX = translateX.value
    },
    onActive: (event, context) => {
      translateX.value = context.startX + event.translationX
      rotate.value = (event.translationX / screenWidth) * 30
    },
    onEnd: (event) => {
      const shouldDismiss = Math.abs(event.translationX) > screenWidth * 0.3

      if (shouldDismiss) {
        const direction = event.translationX > 0 ? 1 : -1
        translateX.value = withSpring(direction * screenWidth * 1.5)

        if (direction > 0) {
          runOnJS(handleLike)(profiles[currentIndex]?.id)
        } else {
          runOnJS(handlePass)()
        }
      } else {
        translateX.value = withSpring(0)
        rotate.value = withSpring(0)
      }
    },
  })

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }, { rotate: `${rotate.value}deg` }],
    }
  })

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Chargement des profils...</Text>
      </View>
    )
  }

  if (currentIndex >= profiles.length) {
    return (
      <View style={styles.container}>
        <Text variant="headlineSmall" style={styles.noMoreText}>
          Plus de profils à découvrir !
        </Text>
        <Button mode="contained" onPress={loadProfiles} style={styles.reloadButton}>
          Recharger
        </Button>
      </View>
    )
  }

  const currentProfile = profiles[currentIndex]

  return (
    <View style={styles.container}>
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View style={[styles.cardContainer, animatedStyle]}>
          <Card style={styles.profileCard}>
            <Image
              source={{ uri: currentProfile.photo_url || "/placeholder.svg?height=400&width=300" }}
              style={styles.profileImage}
            />
            <Card.Content style={styles.cardContent}>
              <Text variant="headlineSmall">
                {currentProfile.prenom}, {currentProfile.age}
              </Text>
              <Text variant="bodyMedium" style={styles.location}>
                📍 {currentProfile.ville}
              </Text>
              <Text variant="bodySmall" style={styles.bio}>
                {currentProfile.bio}
              </Text>
              <View style={styles.tagsContainer}>
                {currentProfile.tags?.map((tag, index) => (
                  <Chip key={index} style={styles.tag} compact>
                    {tag}
                  </Chip>
                ))}
              </View>
            </Card.Content>
          </Card>
        </Animated.View>
      </PanGestureHandler>

      <View style={styles.buttonsContainer}>
        <Button mode="contained" onPress={handlePass} style={[styles.actionButton, styles.passButton]} icon="close">
          Passer
        </Button>
        <Button
          mode="contained"
          onPress={() => handleLike(currentProfile.id)}
          style={[styles.actionButton, styles.likeButton]}
          icon="heart"
        >
          J'aime
        </Button>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  cardContainer: {
    width: screenWidth * 0.9,
    height: "70%",
  },
  profileCard: {
    flex: 1,
    borderRadius: 20,
    overflow: "hidden",
  },
  profileImage: {
    width: "100%",
    height: "60%",
  },
  cardContent: {
    flex: 1,
    padding: 20,
  },
  location: {
    color: "#666",
    marginBottom: 10,
  },
  bio: {
    marginBottom: 15,
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  tag: {
    margin: 2,
    backgroundColor: "#e91e63",
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "80%",
    marginTop: 20,
  },
  actionButton: {
    width: 120,
  },
  passButton: {
    backgroundColor: "#757575",
  },
  likeButton: {
    backgroundColor: "#e91e63",
  },
  noMoreText: {
    textAlign: "center",
    marginBottom: 20,
  },
  reloadButton: {
    backgroundColor: "#e91e63",
  },
})
