"use client"

import { useState, useRef, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Brain, Send, Loader2, Sparkles, User, AlertCircle } from "lucide-react"
import Link from "next/link"

interface Message {
  role: "user" | "assistant"
  content: string
}

export default function AsistentePage() {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "¡Hola! Soy tu asistente financiero IA. Puedo ayudarte con preguntas sobre tus finanzas, recomendaciones para ahorrar, estrategias para pagar deudas, y más. ¿En qué puedo ayudarte?"
    }
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [needsKey, setNeedsKey] = useState(false)
  const chatEnd = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch("/api/user").then(r => r.json()).then(data => {
      if (!data.openrouterApiKey) setNeedsKey(true)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function handleSend() {
    if (!input.trim() || loading) return

    const userMsg = input.trim()
    setInput("")
    setMessages(prev => [...prev, { role: "user", content: userMsg }])
    setLoading(true)

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }])
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Ocurrió un error. Intenta de nuevo." }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Asistente Financiero</h1>
        <p className="text-muted-foreground mt-1">Consulta tus finanzas con IA</p>
      </div>

      {needsKey && (
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="flex items-start gap-3 pt-6">
            <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                API Key no configurada
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Ve a <Link href="/configuracion" className="text-primary hover:underline">Configuración</Link> y agrega tu API Key de OpenRouter para usar el asistente. Sin key, esta sección no funcionará.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="flex flex-col h-[65vh]">
        <CardHeader className="border-b shrink-0">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Brain className="h-5 w-5 text-primary" />
            Chat IA
            <Sparkles className="h-4 w-4 text-amber-400" />
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
              {msg.role === "assistant" && (
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 shrink-0">
                  <Brain className="h-4 w-4 text-primary" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                    : "bg-muted rounded-tl-sm"
                }`}
              >
                {msg.content}
              </div>
              {msg.role === "user" && (
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary shrink-0">
                  <User className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                <Brain className="h-4 w-4 text-primary" />
              </div>
              <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-2.5">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
          <div ref={chatEnd} />
        </CardContent>
        <div className="border-t p-4 shrink-0">
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend() }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pregúntame sobre tus finanzas..."
              disabled={loading || needsKey}
              className="flex-1"
            />
            <Button type="submit" disabled={loading || !input.trim() || needsKey} size="icon">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mt-2">
            Powered by Qwen AI via OpenRouter
          </p>
        </div>
      </Card>
    </div>
  )
}
