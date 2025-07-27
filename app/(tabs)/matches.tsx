"use client"

import { useState, useEffect } from "react"
import { View, StyleSheet, FlatList, TouchableOpacity, Image } from "react-native"
import { Text, Card, Searchbar } from "react-native-paper"
import { useRouter } from "expo-router"
import { useAuth } from "../../contexts/AuthContext"
import { supabase } from "../../lib/supabase"
import type { Match, User } from "../../types"

export default function MatchesPage() {
  const { user } = useAuth()
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()

  useEffect(() => {
    if (user) {
      loadMatches()
    }
  }, [user])

  const loadMatches = async () => {
    if (!user) return

    try {
      const { data: matchesData, error } = await supabase
        .from("matches")
        .select(`
          *,
          user1:user1_id(id, prenom, photo_url),
          user2:user2_id(id, prenom, photo_url)
        `)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order("created_at", { ascending: false })

      if (error) throw error

      setMatches(matchesData || [])
    } catch (error) {
      console.error("Erreur chargement matches:", error)
    } finally {
      setLoading(false)
    }
  }

  const getOtherUser = (match: Match): User => {
    return match.user1_id === user?.id ? match.user2 : match.user1
  }

  const filteredMatches = matches.filter((match) => {
    const otherUser = getOtherUser(match)
    return otherUser?.prenom.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const renderMatch = ({ item }: { item: Match }) => {
    const otherUser = getOtherUser(item)

    return (
      <TouchableOpacity onPress={() => router.push(`/chat/${item.id}`)} style={styles.matchItem}>
        <Card style={styles.matchCard}>
          <Card.Content style={styles.matchContent}>
            <Image
              source={{ uri: otherUser?.photo_url || "/placeholder.svg?height=60&width=60" }}
              style={styles.avatar}
            />
            <View style={styles.matchInfo}>
              <Text variant="titleMedium">{otherUser?.prenom}</Text>
              <Text variant="bodySmall" style={styles.matchDate}>
                Match du {new Date(item.created_at).toLocaleDateString("fr-FR")}
              </Text>
            </View>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    )
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Chargement des matches...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Mes Matches
      </Text>

      <Searchbar
        placeholder="Rechercher un match..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      {filteredMatches.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text variant="bodyLarge" style={styles.emptyText}>
            {matches.length === 0
              ? "Aucun match pour le moment. Continuez à swiper !"
              : "Aucun match trouvé pour cette recherche."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredMatches}
          renderItem={renderMatch}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  title: {
    textAlign: "center",
    marginBottom: 20,
    color: "#e91e63",
    marginTop: 40,
  },
  searchbar: {
    marginBottom: 20,
  },
  listContainer: {
    paddingBottom: 20,
  },
  matchItem: {
    marginBottom: 10,
  },
  matchCard: {
    borderRadius: 15,
  },
  matchContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  matchInfo: {
    flex: 1,
  },
  matchDate: {
    color: "#666",
    marginTop: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    textAlign: "center",
    color: "#666",
  },
})
