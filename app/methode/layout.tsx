import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Ma méthode - Marie-Line Pilates',
  description: 'Découvrez la méthode unique de Marie-Line Bouley : une approche holistique du Pilates combinant technique proprioceptive, nutrition et bien-être spirituel',
}

export default function MethodeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

