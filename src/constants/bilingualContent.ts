
export interface BilingualPair {
  en: string;
  es: string;
  category: string;
}

export const BILINGUAL_WORDS: BilingualPair[] = [
  { en: 'Apple', es: 'Manzana', category: 'Food' },
  { en: 'Dog', es: 'Perro', category: 'Animals' },
  { en: 'Cat', es: 'Gato', category: 'Animals' },
  { en: 'Sun', es: 'Sol', category: 'Nature' },
  { en: 'Moon', es: 'Luna', category: 'Nature' },
  { en: 'Happy', es: 'Feliz', category: 'Emotions' },
  { en: 'Water', es: 'Agua', category: 'Basic' },
  { en: 'House', es: 'Casa', category: 'Basic' },
  { en: 'Bird', es: 'Pájaro', category: 'Animals' },
  { en: 'Tree', es: 'Árbol', category: 'Nature' },
  { en: 'Book', es: 'Libro', category: 'Objects' },
  { en: 'Star', es: 'Estrella', category: 'Nature' },
];

export const BILINGUAL_PHRASES: BilingualPair[] = [
  { en: 'Good morning', es: 'Buenos días', category: 'Greetings' },
  { en: 'How are you?', es: '¿Cómo estás?', category: 'Social' },
  { en: 'I like apples', es: 'Me gustan las manzanas', category: 'Food' },
  { en: 'My name is...', es: 'Mi nombre es...', category: 'Social' },
  { en: 'Thank you', es: 'Gracias', category: 'Basic' },
  { en: 'Good night', es: 'Buenas noches', category: 'Greetings' },
  { en: 'Where is it?', es: '¿Dónde está?', category: 'Questions' },
  { en: 'See you later', es: 'Hasta luego', category: 'Greetings' },
];
