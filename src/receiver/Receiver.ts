export interface Receiver {
  onMessage(callback: (message: string) => void): () => void
}
