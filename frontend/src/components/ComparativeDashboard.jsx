import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import { TrendingUp, Hotel, Calendar, BarChart3, Search, LineChart } from 'lucide-react'
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// Cores para o gráfico
const CHART_COLORS = [
  '#3b82f6', // Azul (hotel principal)
  '#ef4444', // Vermelho
  '#f97316', // Laranja
  '#10b981', // Verde
  '#8b5cf6', // Roxo
  '#ec4899', // Rosa
  '#6366f1', // Índigo
  '#14b8a6', // Teal
  '#f59e0b', // Âmbar
  '#64748b'  // Cinza azulado
]

const ComparativeDashboard = () => {
  const [hotels, setHotels] = useState([])
  const [selectedHotel, setSelectedHotel] = useState('')
  const [dateRange, setDateRange] = useState({
    inicio: '',
    fim: ''
  })
  const [analysisData, setAnalysisData] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchHotels = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/hotels`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setHotels(data.data || [])
        }
      }
    } catch (error) {
      console.error('Erro ao buscar hotéis:', error)
      setHotels([])
    }
  }

  useEffect(() => {
    fetchHotels()
  }, [])

  const handleAnalysis = async () => {
    if (!selectedHotel || !dateRange.inicio || !dateRange.fim) {
      alert('Por favor, selecione um hotel e defina o período de análise')
      return
    }

    setLoading(true)
    try {
      const params = new URLSearchParams({
        hotel_id: selectedHotel,
        data_inicio: dateRange.inicio,
        data_fim: dateRange.fim
      })

      const response = await fetch(`${API_BASE_URL}/api/analise/comparativo?${params}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          console.log('Dados da análise:', data.data)
          setAnalysisData(data.data)
        } else {
          alert(data.error || 'Erro na análise')
          setAnalysisData(null)
        }
      } else {
        const data = await response.json()
        alert(data.error || 'Erro na análise')
        setAnalysisData(null)
      }
    } catch (error) {
      console.error('Erro na análise:', error)
      alert('Erro de conexão')
      setAnalysisData(null)
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price) => {
    if (price === null || price === undefined) return '-'
    try {
      return parseFloat(price || 0).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      })
    } catch {
      return 'R$ 0,00'
    }
  }

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('pt-BR')
    } catch {
      return 'Data inválida'
    }
  }

  // Função para determinar a cor do preço com base na comparação
  const getPriceColorClass = (hotelPrice, competitorPrice) => {
    if (hotelPrice === null || competitorPrice === null) return ''
    
    // Se o preço do concorrente for mais alto que o preço do hotel
    if (competitorPrice > hotelPrice) {
      return 'text-green-600 font-medium'
    }
    
    // Calcular a diferença percentual
    const percentDiff = ((hotelPrice - competitorPrice) / hotelPrice) * 100
    
    // Se o preço do concorrente for até 10% mais barato
    if (percentDiff <= 10) {
      return 'text-orange-500 font-medium'
    }
    
    // Se o preço do concorrente for mais de 10% mais barato
    return 'text-red-600 font-medium'
  }

  // Preparar dados para o gráfico Recharts
  const prepareChartData = () => {
    if (!analysisData || !analysisData.dados_grafico) return []
    
    const { datas, series } = analysisData.dados_grafico
    
    return datas.map((data, index) => {
      const dataObj = {
        data: formatDate(data)
      }
      
      series.forEach(serie => {
        dataObj[serie.nome] = serie.valores[index]
      })
      
      return dataObj
    })
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Dashboard Comparativo</h2>
        <p className="text-gray-600">Análise comparativa de tarifas entre concorrentes</p>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="w-5 h-5" />
            <span>Filtros de Análise</span>
          </CardTitle>
          <CardDescription>
            Selecione o hotel foco e o período para análise comparativa
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Seleção de Hotel */}
            <div className="space-y-2">
              <Label htmlFor="hotel-select">Hotel Foco</Label>
              <Select value={selectedHotel} onValueChange={setSelectedHotel}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um hotel" />
                </SelectTrigger>
                <SelectContent>
                  {hotels.map((hotel) => (
                    <SelectItem key={hotel.id} value={hotel.id.toString()}>
                      <div className="flex items-center space-x-2">
                        <Hotel className="w-4 h-4" />
                        <span>{hotel.nome}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Data Início */}
            <div className="space-y-2">
              <Label htmlFor="date-start">Data Início</Label>
              <Input
                id="date-start"
                type="date"
                value={dateRange.inicio}
                onChange={(e) => setDateRange({ ...dateRange, inicio: e.target.value })}
              />
            </div>

            {/* Data Fim */}
            <div className="space-y-2">
              <Label htmlFor="date-end">Data Fim</Label>
              <Input
                id="date-end"
                type="date"
                value={dateRange.fim}
                onChange={(e) => setDateRange({ ...dateRange, fim: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button 
              onClick={handleAnalysis}
              disabled={loading || !selectedHotel || !dateRange.inicio || !dateRange.fim}
              className="flex items-center space-x-2"
            >
              <BarChart3 className="w-4 h-4" />
              <span>{loading ? 'Analisando...' : 'Analisar'}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resultados da Análise */}
      {loading && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Processando análise...</span>
          </CardContent>
        </Card>
      )}

      {analysisData && !loading && (
        <div className="space-y-6">
          {/* Resumo Geral */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>Resumo da Análise</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-600 font-medium">Período Analisado</p>
                  <p className="text-lg font-bold text-blue-700">
                    {formatDate(dateRange.inicio)} - {formatDate(dateRange.fim)}
                  </p>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-600 font-medium">Preço Médio</p>
                  <p className="text-lg font-bold text-green-700">
                    {formatPrice(analysisData.hotel_principal?.preco_medio || 0)}
                  </p>
                </div>
                
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-purple-600 font-medium">Concorrentes</p>
                  <p className="text-lg font-bold text-purple-700">
                    {analysisData.concorrentes?.length || 0}
                  </p>
                </div>
                
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <p className="text-sm text-orange-600 font-medium">Tarifas Analisadas</p>
                  <p className="text-lg font-bold text-orange-700">
                    {analysisData.hotel_principal?.total_tarifas || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de Preços */}
          {analysisData.grafico_evolucao && analysisData.grafico_evolucao.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5" />
                  <span>Tabela Comparativa de Preços</span>
                </CardTitle>
                <CardDescription>
                  Comparação de preços diários entre o hotel e seus concorrentes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="border border-gray-200 bg-gray-50 p-2 text-left">Hotel</th>
                        {analysisData.grafico_evolucao.map((item, index) => (
                          <th key={index} className="border border-gray-200 bg-gray-50 p-2 text-center min-w-[100px]">
                            {item.data}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {/* Hotel Principal */}
                      <tr className="bg-blue-50">
                        <td className="border border-gray-200 p-2 font-medium text-blue-700">
                          {analysisData.hotel_principal?.nome}
                          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Seu Hotel</span>
                        </td>
                        {analysisData.grafico_evolucao.map((item, idx) => (
                          <td key={idx} className="border border-gray-200 p-2 text-center text-blue-700">
                            {formatPrice(item[analysisData.hotel_principal?.nome] || 0)}
                          </td>
                        ))}
                      </tr>
                      
                      {/* Concorrentes */}
                      {analysisData.concorrentes?.map((concorrente) => (
                        <tr key={concorrente.id}>
                          <td className="border border-gray-200 p-2 font-medium">
                            {concorrente.nome}
                          </td>
                          {analysisData.grafico_evolucao.map((item, idx) => {
                            const mainHotelPrice = item[analysisData.hotel_principal?.nome] || 0;
                            const concorrentePrice = item[concorrente.nome] || 0;
                            const colorClass = getPriceColorClass(mainHotelPrice, concorrentePrice);
                            
                            return (
                              <td key={idx} className={`border border-gray-200 p-2 text-center ${colorClass}`}>
                                {formatPrice(concorrentePrice)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Legenda das cores */}
                <div className="mt-4 flex flex-wrap gap-4 justify-end">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-600 rounded-full mr-2"></div>
                    <span className="text-sm">Preço mais alto que o seu hotel</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                    <span className="text-sm">Até 10% mais barato que o seu hotel</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-600 rounded-full mr-2"></div>
                    <span className="text-sm">Mais de 10% mais barato que o seu hotel</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Gráfico de Linhas */}
          {analysisData.grafico_evolucao && analysisData.grafico_evolucao.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <LineChart className="w-5 h-5" />
                  <span>Evolução de Preços</span>
                </CardTitle>
                <CardDescription>
                  Gráfico comparativo da evolução de preços no período
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart
                      data={analysisData.grafico_evolucao}
                      margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="data" 
                        angle={-45} 
                        textAnchor="end" 
                        height={70} 
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        tickFormatter={(value) => `R$${value}`}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip 
                        formatter={(value) => [`${formatPrice(value)}`, '']}
                        labelFormatter={(label) => `Data: ${label}`}
                      />
                      <Legend />
                      {/* Hotel Principal */}
                      <Line
                        type="monotone"
                        dataKey={analysisData.hotel_principal?.nome}
                        stroke="#2563eb"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                      {/* Concorrentes */}
                      {analysisData.concorrentes?.map((concorrente, index) => (
                        <Line
                          key={concorrente.id}
                          type="monotone"
                          dataKey={concorrente.nome}
                          stroke={CHART_COLORS[(index + 1) % CHART_COLORS.length]}
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      ))}
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Insights */}
          {analysisData.insights && (
            <Card>
              <CardHeader>
                <CardTitle>Insights da Análise</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysisData.insights.map((insight, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <p className="text-blue-800">{insight}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Estado Inicial */}
      {!analysisData && !loading && (
        <Card>
          <CardContent className="text-center py-12">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Análise Comparativa
            </h3>
            <p className="text-gray-600 mb-4">
              Selecione um hotel e período para iniciar a análise comparativa
            </p>
            <p className="text-sm text-gray-500">
              A análise irá comparar as tarifas do hotel selecionado com seus concorrentes
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default ComparativeDashboard

