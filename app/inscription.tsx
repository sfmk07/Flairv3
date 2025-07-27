"use client"

import { useState, useEffect } from "react"
import { View, StyleSheet, ScrollView, Alert, Image } from "react-native"
import { TextInput, Button, Text, Card, Chip, RadioButton } from "react-native-paper"
import { useRouter } from "expo-router"
import * as Location from "expo-location"
import * as ImagePicker from "expo-image-picker"
import { useAuth } from "../contexts/AuthContext"
import { supabase } from "../lib/supabase"

const TAGS_DISPONIBLES = [
  "Sport",
  "Musique",
  "Cinéma",
  "Lecture",
  "Voyage",
  "Cuisine",
  "Art",
  "Technologie",
  "Nature",
  "Danse",
  "Photographie",
  "Gaming",
]

export default function Inscription() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    prenom: "",
    age: "",
    genre: "homme",
    orientation: "heterosexuel",
    ville: "",
    bio: "",
    photo_url: "",
    tags: [] as string[],
  })
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()
  const router = useRouter()

  useEffect(() => {
    getLocation()
  }, [])

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== "granted") {
        Alert.alert("Permission refusée", "La géolocalisation est nécessaire pour trouver des personnes près de vous")
        return
      }

      const location = await Location.getCurrentPositionAsync({})
      setLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      })

      // Géocodage inverse pour obtenir la ville
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      })

      if (reverseGeocode.length > 0) {
        const city = reverseGeocode[0].city || reverseGeocode[0].district || "Ville inconnue"
        setFormData((prev) => ({ ...prev, ville: city }))
      }
    } catch (error) {
      console.error("Erreur géolocalisation:", error)
    }
  }

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })

    if (!result.canceled) {
      setFormData((prev) => ({ ...prev, photo_url: result.assets[0].uri }))
    }
  }

  const toggleTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag],
    }))
  }

  const handleSubmit = async () => {
    if (!formData.email || !formData.password || !formData.prenom || !formData.age) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs obligatoires")
      return
    }

    if (Number.parseInt(formData.age) < 18) {
      Alert.alert("Erreur", "Vous devez avoir au moins 18 ans")
      return
    }

    if (!location) {
      Alert.alert("Erreur", "La géolocalisation est requise")
      return
    }

    setLoading(true)
    try {
      // Inscription auth
      await signUp(formData.email, formData.password)

      // Créer le profil utilisateur
      const { error } = await supabase.from("users").insert({
        email: formData.email,
        prenom: formData.prenom,
        age: Number.parseInt(formData.age),
        genre: formData.genre,
        orientation: formData.orientation,
        ville: formData.ville,
        bio: formData.bio,
        photo_url: formData.photo_url,
        tags: formData.tags,
        latitude: location.latitude,
        longitude: location.longitude,
      })

      if (error) throw error

      Alert.alert("Succès", "Compte créé avec succès !", [
        { text: "OK", onPress: () => router.replace("/(tabs)/swipe") },
      ])
    } catch (error: any) {
      Alert.alert("Erreur", error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineMedium" style={styles.title}>
            Rejoindre Flair
          </Text>

          <TextInput
            label="Email *"
            value={formData.email}
            onChangeText={(text) => setFormData((prev) => ({ ...prev, email: text }))}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />

          <TextInput
            label="Mot de passe *"
            value={formData.password}
            onChangeText={(text) => setFormData((prev) => ({ ...prev, password: text }))}
            mode="outlined"
            secureTextEntry
            style={styles.input}
          />

          <TextInput
            label="Prénom *"
            value={formData.prenom}
            onChangeText={(text) => setFormData((prev) => ({ ...prev, prenom: text }))}
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="Âge *"
            value={formData.age}
            onChangeText={(text) => setFormData((prev) => ({ ...prev, age: text }))}
            mode="outlined"
            keyboardType="numeric"
            style={styles.input}
          />

          <Text variant="titleMedium" style={styles.sectionTitle}>
            Genre
          </Text>
          <RadioButton.Group
            onValueChange={(value) => setFormData((prev) => ({ ...prev, genre: value }))}
            value={formData.genre}
          >
            <View style={styles.radioRow}>
              <RadioButton value="homme" />
              <Text>Homme</Text>
            </View>
            <View style={styles.radioRow}>
              <RadioButton value="femme" />
              <Text>Femme</Text>
            </View>
            <View style={styles.radioRow}>
              <RadioButton value="autre" />
              <Text>Autre</Text>
            </View>
          </RadioButton.Group>

          <Text variant="titleMedium" style={styles.sectionTitle}>
            Orientation
          </Text>
          <RadioButton.Group
            onValueChange={(value) => setFormData((prev) => ({ ...prev, orientation: value }))}
            value={formData.orientation}
          >
            <View style={styles.radioRow}>
              <RadioButton value="heterosexuel" />
              <Text>Hétérosexuel(le)</Text>
            </View>
            <View style={styles.radioRow}>
              <RadioButton value="homosexuel" />
              <Text>Homosexuel(le)</Text>
            </View>
            <View style={styles.radioRow}>
              <RadioButton value="bisexuel" />
              <Text>Bisexuel(le)</Text>
            </View>
          </RadioButton.Group>

          <TextInput
            label="Ville"
            value={formData.ville}
            onChangeText={(text) => setFormData((prev) => ({ ...prev, ville: text }))}
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="Bio"
            value={formData.bio}
            onChangeText={(text) => setFormData((prev) => ({ ...prev, bio: text }))}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={styles.input}
          />

          <Button mode="outlined" onPress={pickImage} style={styles.input}>
            {formData.photo_url ? "Changer la photo" : "Ajouter une photo"}
          </Button>

          {formData.photo_url && <Image source={{ uri: formData.photo_url }} style={styles.imagePreview} />}

          <Text variant="titleMedium" style={styles.sectionTitle}>
            Centres d'intérêt
          </Text>
          <View style={styles.tagsContainer}>
            {TAGS_DISPONIBLES.map((tag) => (
              <Chip key={tag} selected={formData.tags.includes(tag)} onPress={() => toggleTag(tag)} style={styles.tag}>
                {tag}
              </Chip>
            ))}
          </View>

          <Button mode="contained" onPress={handleSubmit} loading={loading} style={styles.submitButton}>
            Créer mon compte
          </Button>

          <Button mode="text" onPress={() => router.back()} style={styles.linkButton}>
            Déjà un compte ? Se connecter
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  card: {
    margin: 20,
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
  sectionTitle: {
    marginTop: 20,
    marginBottom: 10,
    color: "#e91e63",
  },
  radioRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: "center",
    marginBottom: 15,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 20,
  },
  tag: {
    margin: 5,
  },
  submitButton: {
    marginTop: 20,
    backgroundColor: "#e91e63",
  },
  linkButton: {
    marginTop: 10,
  },
})
