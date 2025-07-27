"use client"

import { useState, useEffect, useRef } from "react"
import { View, StyleSheet, FlatList, KeyboardAvoidingView, Platform } from "react-native"
import { Text, TextInput, IconButton, Card } from "react-native-paper"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useAuth } from "../../contexts/AuthContext"
import { supabase } from "../../lib/supabase"
import type { Message, Match, User } from "../../types"

export default function ChatPage() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>()
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [match, setMatch] = useState<Match | null>(null)
  const [otherUser, setOtherUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const flatListRef = useRef<FlatList>(null)
  const router = useRouter()

  useEffect(() => {
    if (matchId && user) {
      loadMatch()
      loadMessages()
      subscribeToMessages()
    }
  }, [matchId, user])

  const loadMatch = async () => {
    try {
      const { data: matchData, error } = await supabase
        .from("matches")
        .select(`
          *,
          user1:user1_id(id, prenom, photo_url),
          user2:user2_id(id, prenom, photo_url)
        `)
        .eq("id", matchId)
        .single()

      if (error) throw error

      setMatch(matchData)
      const other = matchData.user1_id === user?.id ? matchData.user2 : matchData.user1
      setOtherUser(other)
    } catch (error) {
      console.error("Erreur chargement match:", error)
      router.back()
    }
  }

  const loadMessages = async () => {
    try {
      const { data: messagesData, error } = await supabase
        .from("messages")
        .select(`
          *,
          sender:sender_id(id, prenom, photo_url)
        `)
        .eq("match_id", matchId)
        .order("timestamp", { ascending: true })

      if (error) throw error

      setMessages(messagesData || [])
    } catch (error) {
      console.error("Erreur chargement messages:", error)
    } finally {
      setLoading(false)
    }
  }

  const subscribeToMessages = () => {
    const subscription = supabase
      .channel(`messages:${matchId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `match_id=eq.${matchId}`,
        },
        async (payload) => {
          const { data: senderData } = await supabase
            .from("users")
            .select("id, prenom, photo_url")
            .eq("id", payload.new.sender_id)
            .single()

          const newMessage = {
            ...payload.new,
            sender: senderData,
          } as Message

          setMessages((prev) => [...prev, newMessage])
        },
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !matchId) return

    try {
      const { error } = await supabase.from("messages").insert({
        match_id: matchId,
        sender_id: user.id,
        texte: newMessage.trim(),
      })

      if (error) throw error

      setNewMessage("")
    } catch (error) {
      console.error("Erreur envoi message:", error)
    }
  }

  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.sender_id === user?.id

    return (
      <View style={[styles.messageContainer, isMyMessage ? styles.myMessage : styles.otherMessage]}>
        <Card style={[styles.messageCard, isMyMessage ? styles.myMessageCard : styles.otherMessageCard]}>
          <Card.Content style={styles.messageContent}>
            <Text style={[styles.messageText, isMyMessage ? styles.myMessageText : styles.otherMessageText]}>
              {item.texte}
            </Text>
            <Text style={styles.messageTime}>
              {new Date(item.timestamp).toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </Card.Content>
        </Card>
      </View>
    )
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Chargement de la conversation...</Text>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={() => router.back()} />
        <Text variant="titleLarge" style={styles.headerTitle}>
          {otherUser?.prenom}
        </Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        onLayout={() => flatListRef.current?.scrollToEnd()}
      />

      <View style={styles.inputContainer}>
        <TextInput
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Tapez votre message..."
          style={styles.textInput}
          multiline
          right={<TextInput.Icon icon="send" onPress={sendMessage} disabled={!newMessage.trim()} />}
        />
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#e91e63",
    paddingTop: 50,
  },
  headerTitle: {
    color: "white",
    flex: 1,
    textAlign: "center",
    marginRight: 48,
  },
  messagesList: {
    flex: 1,
    padding: 10,
  },
  messageContainer: {
    marginBottom: 10,
    maxWidth: "80%",
  },
  myMessage: {
    alignSelf: "flex-end",
  },
  otherMessage: {
    alignSelf: "flex-start",
  },
  messageCard: {
    borderRadius: 15,
  },
  myMessageCard: {
    backgroundColor: "#e91e63",
  },
  otherMessageCard: {
    backgroundColor: "white",
  },
  messageContent: {
    padding: 10,
  },
  messageText: {
    fontSize: 16,
  },
  myMessageText: {
    color: "white",
  },
  otherMessageText: {
    color: "black",
  },
  messageTime: {
    fontSize: 12,
    marginTop: 5,
    opacity: 0.7,
  },
  inputContainer: {
    padding: 10,
    backgroundColor: "white",
  },
  textInput: {
    backgroundColor: "white",
  },
})
