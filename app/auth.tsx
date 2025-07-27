"use client"

import { useState } from "react"
import { View, StyleSheet, Alert } from "react-native"
import { TextInput, Button, Text, Card } from "react-native-paper"
import { useRouter } from "expo-router"
import { useAuth } from "../contexts/AuthContext"

export default function Auth() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const router = useRouter()

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs")
      return
    }

    setLoading(true)
    try {
      await signIn(email, password)
    } catch (error: any) {
      Alert.alert("Erreur de connexion", error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineMedium" style={styles.title}>
            Connexion à Flair
          </Text>

          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />

          <TextInput
            label="Mot de passe"
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            secureTextEntry
            style={styles.input}
          />

          <Button mode="contained" onPress={handleSignIn} loading={loading} style={styles.button}>
            Se connecter
          </Button>

          <Button mode="text" onPress={() => router.push("/inscription")} style={styles.linkButton}>
            Pas encore de compte ? S'inscrire
          </Button>
        </Card.Content>
      </Card>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  card: {
    padding: 20,
  },
  title: {
    textAlign: "center",
    marginBottom: 30,
    color: "#e91e63",
  },
  input: {
    marginBottom: 15,
  },
  button: {
    marginTop: 10,
    backgroundColor: "#e91e63",
  },
  linkButton: {
    marginTop: 10,
  },
})
