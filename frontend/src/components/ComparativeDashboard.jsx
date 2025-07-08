import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { Hotel, Calendar, TrendingUp, TrendingDown, Minus, AlertTriangle, Target } from 'lucide-react'
import { apiUrl } from '../utils/api'

function ComparativeDashboard() {
  const [hoteis, setHoteis] = useState([])
  const [selectedHotel, setSelectedHotel] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [loading, setLoading] = useState(false)
  const [dadosComparativos, setDadosComparativos] = useState(null)
  const [timeline, setTimeline] = useState(null)
  const [oportunidades, setOportunidades] = useState(null)

  const fetchHoteis = async () => {
    try {
      const response = await fetch(apiUrl('/api/hoteis'))
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setHoteis(data.hoteis)
        }
      }
    } catch (error) {
      console.error('Erro ao buscar hotéis:', error)
    }
  }

  const fetchDadosComparativos = async () => {
    if (!selectedHotel) return

    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (dataInicio) params.append('data_inicio', dataInicio)
      if (dataFim) params.append('data_fim', dataFim)

      const response = await fetch(`/api/comparativo/${selectedHotel}?${params}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setDadosComparativos(data)
        }
      }
    } catch (error) {
      console.error('Erro ao buscar dados comparativos:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTimeline = async () => {
    if (!selectedHotel || !dataInicio || !dataFim) return

    try {
      const params = new URLSearchParams({
        data_inicio: dataInicio,
        data_fim: dataFim
      })

      const response = await fetch(`/api/comparativo/${selectedHotel}/timeline?${params}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setTimeline(data)
        }
      }
    } catch (error) {
      console.error('Erro ao buscar timeline:', error)
    }
  }

  const fetchOportunidades = async () => {
    if (!selectedHotel) return

    try {
      const params = new URLSearchParams()
      if (dataInicio) params.append('data_inicio', dataInicio)
      if (dataFim) params.append('data_fim', dataFim)

      const response = await fetch(`/api/comparativo/${selectedHotel}/oportunidades?${params}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setOportunidades(data)
        }
      }
    } catch (error) {
      console.error('Erro ao buscar oportunidades:', error)
    }
  }

  const handleAnalyze = () => {
    fetchDadosComparativos()
    fetchTimeline()
    fetchOportunidades()
  }

  useEffect(() => {
    fetchHoteis()
    
    // Definir período padrão (próximos 30 dias)
    const hoje = new Date()
    const em30Dias = new Date(hoje)
    em30Dias.setDate(hoje.getDate() + 30)
    
    setDataInicio(hoje.toISOString().split('T')[0])
    setDataFim(em30Dias.toISOString().split('T')[0])
  }, [])

  const prepareTimelineData = () => {
    if (!timeline) return []

    const data = []
    Object.entries(timeline.timeline).forEach(([date, hotelsData]) => {
      const entry = { date: new Date(date).toLocaleDateString('pt-BR') }
      Object.entries(hotelsData).forEach(([hotelName, hotelData]) => {
        entry[hotelName] = hotelData.preco
      })
      data.push(entry)
    })
    return data
  }

  const getPositionIcon = (posicionamento) => {
    switch (posicionamento) {
      case 'alto':
        return <TrendingUp className="h-4 w-4 text-red-500" />
      case 'baixo':
        return <TrendingDown className="h-4 w-4 text-green-500" />
      default:
        return <Minus className="h-4 w-4 text-blue-500" />
    }
  }

  const getPositionColor = (posicionamento) => {
    switch (posicionamento) {
      case 'alto':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'baixo':
        return 'text-green-600 bg-green-50 border-green-200'
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200'
    }
  }

  const getOportunidadeIcon = (tipo) => {
    switch (tipo) {
      case 'aumentar_preco':
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'reduzir_preco':
        return <TrendingDown className="h-4 w-4 text-red-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Análise Comparativa</span>
          </CardTitle>
          <CardDescription>
            Compare tarifas do seu hotel com os concorrentes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hotel">Hotel Foco *</Label>
              <Select value={selectedHotel} onValueChange={setSelectedHotel}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o hotel" />
                </SelectTrigger>
                <SelectContent>
                  {hoteis.map((hotel) => (
                    <SelectItem key={hotel.id} value={hotel.id.toString()}>
                      {hotel.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="data-inicio">Data Início</Label>
              <Input
                id="data-inicio"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="data-fim">Data Fim</Label>
              <Input
                id="data-fim"
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>
            
            <div className="flex items-end">
              <Button 
                onClick={handleAnalyze}
                disabled={!selectedHotel || loading}
                className="w-full"
              >
                {loading ? 'Analisando...' : 'Analisar'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      {dadosComparativos && (
        <Tabs defaultValue="resumo" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="resumo">Resumo</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="oportunidades">Oportunidades</TabsTrigger>
            <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
          </TabsList>

          <TabsContent value="resumo" className="space-y-4">
            {/* Cards de Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Posicionamento</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    {getPositionIcon(dadosComparativos.analise.posicionamento)}
                    <span className={`text-lg font-bold ${getPositionColor(dadosComparativos.analise.posicionamento).split(' ')[0]}`}>
                      {dadosComparativos.analise.posicionamento.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    vs. concorrência
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Preço Médio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    R$ {dadosComparativos.analise.hotel_foco.preco_medio.toFixed(2)}
                  </div>
                  <p className="text-xs text-gray-500">
                    Concorrência: R$ {dadosComparativos.analise.concorrencia.preco_medio.toFixed(2)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Diferença</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${dadosComparativos.analise.diferenca_media >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {dadosComparativos.analise.diferenca_media >= 0 ? '+' : ''}
                    {dadosComparativos.analise.percentual_diferenca.toFixed(1)}%
                  </div>
                  <p className="text-xs text-gray-500">
                    R$ {Math.abs(dadosComparativos.analise.diferenca_media).toFixed(2)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Concorrentes */}
            <Card>
              <CardHeader>
                <CardTitle>Concorrentes no Período</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(dadosComparativos.analise.concorrentes).map(([id, concorrente]) => (
                    <div key={id} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{concorrente.nome}</p>
                        <p className="text-sm text-gray-500">{concorrente.total_dias} dias com dados</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">R$ {concorrente.preco_medio.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">
                          R$ {concorrente.preco_min.toFixed(2)} - R$ {concorrente.preco_max.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-4">
            {timeline && (
              <Card>
                <CardHeader>
                  <CardTitle>Evolução de Preços</CardTitle>
                  <CardDescription>
                    Comparação temporal entre {dadosComparativos.hotel_foco.nome} e concorrentes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={prepareTimelineData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value) => [`R$ ${value?.toFixed(2)}`, 'Preço']}
                          labelFormatter={(label) => `Data: ${label}`}
                        />
                        <Legend />
                        {timeline.hoteis.map((hotel, index) => (
                          <Line
                            key={hotel.id}
                            type="monotone"
                            dataKey={hotel.nome}
                            stroke={hotel.is_foco ? '#2563eb' : `hsl(${index * 60}, 70%, 50%)`}
                            strokeWidth={hotel.is_foco ? 3 : 2}
                            dot={hotel.is_foco}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="oportunidades" className="space-y-4">
            {oportunidades && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Oportunidades de Pricing</span>
                    <Badge variant="outline">
                      {oportunidades.total_oportunidades} oportunidades
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Análise de oportunidades para {oportunidades.hotel.nome}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {oportunidades.total_oportunidades === 0 ? (
                    <div className="text-center py-8">
                      <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Nenhuma oportunidade identificada no período</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {oportunidades.oportunidades.map((oportunidade, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3">
                              {getOportunidadeIcon(oportunidade.tipo)}
                              <div>
                                <p className="font-medium">
                                  {new Date(oportunidade.data).toLocaleDateString('pt-BR')}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {oportunidade.descricao}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold">R$ {oportunidade.preco_atual.toFixed(2)}</p>
                              <p className="text-xs text-gray-500">
                                Concorrência: R$ {oportunidade.preco_min_concorrencia.toFixed(2)} - R$ {oportunidade.preco_max_concorrencia.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="detalhes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Dados Detalhados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Hotel Foco: {dadosComparativos.hotel_foco.nome}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Preço Mínimo:</span>
                        <p className="font-medium">R$ {dadosComparativos.analise.hotel_foco.preco_min.toFixed(2)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Preço Máximo:</span>
                        <p className="font-medium">R$ {dadosComparativos.analise.hotel_foco.preco_max.toFixed(2)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Preço Médio:</span>
                        <p className="font-medium">R$ {dadosComparativos.analise.hotel_foco.preco_medio.toFixed(2)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Total de Dias:</span>
                        <p className="font-medium">{dadosComparativos.analise.hotel_foco.total_dias}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Concorrência</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Preço Mínimo:</span>
                        <p className="font-medium">R$ {dadosComparativos.analise.concorrencia.preco_min.toFixed(2)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Preço Máximo:</span>
                        <p className="font-medium">R$ {dadosComparativos.analise.concorrencia.preco_max.toFixed(2)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Preço Médio:</span>
                        <p className="font-medium">R$ {dadosComparativos.analise.concorrencia.preco_medio.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Estado vazio */}
      {!dadosComparativos && !loading && (
        <Card>
          <CardContent className="text-center py-12">
            <Hotel className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Análise Comparativa
            </h3>
            <p className="text-gray-500 mb-4">
              Selecione um hotel e período para começar a análise
            </p>
            <div className="text-sm text-gray-400">
              <p>• Compare tarifas com concorrentes</p>
              <p>• Identifique oportunidades de pricing</p>
              <p>• Visualize tendências temporais</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default ComparativeDashboard

