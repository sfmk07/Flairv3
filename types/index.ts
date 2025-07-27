export interface User {
  id: string
  prenom: string
  email: string
  genre: "homme" | "femme" | "autre"
  orientation: "heterosexuel" | "homosexuel" | "bisexuel"
  age: number
  ville: string
  bio: string
  photo_url: string
  tags: string[]
  latitude: number
  longitude: number
  is_admin: boolean
  is_visible: boolean
}

export interface Match {
  id: string
  user1_id: string
  user2_id: string
  created_at: string
  user1?: User
  user2?: User
}

export interface Message {
  id: string
  match_id: string
  sender_id: string
  texte: string
  timestamp: string
  sender?: User
}

export interface Report {
  id: string
  user_id: string
  reported_user_id: string
  raison: string
  created_at: string
}
