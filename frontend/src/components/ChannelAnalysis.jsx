import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import { FileSpreadsheet, TrendingUp, TrendingDown, DollarSign, AlertCircle, Search, Users } from 'lucide-react'

const ChannelAnalysis = () => {
  const [filters, setFilters] = useState({
    hotel: '',
    data_inicio: '',
    data_fim: ''
  })
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const runAnalysis = async () => {
    setLoading(true)
    setError(null)
    setAnalysis(null)

    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value.trim()) {
          params.append(key, value.trim())
        }
      })

      const response = await fetch(`/api/canais?${params}`)
      const data = await response.json()

      if (response.ok) {
        setAnalysis(data)
      } else {
        setError(data.error || 'Erro na análise')
      }
    } catch (error) {
      setError('Erro de conexão. Verifique se o servidor está rodando.')
    } finally {
      setLoading(false)
    }
  }

  const getShareBadge = (share) => {
    if (share >= 30) {
      return <Badge className="bg-green-100 text-green-800">Dominante</Badge>
    } else if (share >= 20) {
      return <Badge className="bg-blue-100 text-blue-800">Forte</Badge>
    } else if (share >= 10) {
      return <Badge className="bg-yellow-100 text-yellow-800">Moderado</Badge>
    } else {
      return <Badge className="bg-gray-100 text-gray-800">Baixo</Badge>
    }
  }

  const getPriceIcon = (isHighest, isLowest) => {
    if (isHighest) {
      return <TrendingUp className="h-4 w-4 text-red-600" />
    } else if (isLowest) {
      return <TrendingDown className="h-4 w-4 text-green-600" />
    } else {
      return <DollarSign className="h-4 w-4 text-blue-600" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Análise de Canais</h2>
        <p className="text-gray-600">Compare performance entre canais de distribuição</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Filtros de Análise</span>
          </CardTitle>
          <CardDescription>
            Configure os parâmetros para análise de canais
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hotel">Hotel</Label>
              <Input
                id="hotel"
                placeholder="Nome do hotel (opcional)"
                value={filters.hotel}
                onChange={(e) => handleFilterChange('hotel', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data_inicio">Data Início</Label>
              <Input
                id="data_inicio"
                placeholder="DD/MM/AAAA"
                value={filters.data_inicio}
                onChange={(e) => handleFilterChange('data_inicio', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data_fim">Data Fim</Label>
              <Input
                id="data_fim"
                placeholder="DD/MM/AAAA"
                value={filters.data_fim}
                onChange={(e) => handleFilterChange('data_fim', e.target.value)}
              />
            </div>
          </div>
          <div className="mt-6">
            <Button onClick={runAnalysis} disabled={loading} className="w-full md:w-auto">
              {loading ? 'Analisando...' : 'Executar Análise'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total de Canais</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {analysis.resumo.total_canais}
                </div>
                <p className="text-xs text-gray-600">
                  Canais analisados
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Canal Mais Caro</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm font-bold text-red-600">
                  {analysis.resumo.canal_mais_caro.nome}
                </div>
                <p className="text-xs text-gray-600">
                  R$ {analysis.resumo.canal_mais_caro.tarifa_media.toFixed(2)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Canal Mais Barato</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm font-bold text-green-600">
                  {analysis.resumo.canal_mais_barato.nome}
                </div>
                <p className="text-xs text-gray-600">
                  R$ {analysis.resumo.canal_mais_barato.tarifa_media.toFixed(2)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Diferença</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {analysis.resumo.diferenca_percentual.toFixed(1)}%
                </div>
                <p className="text-xs text-gray-600">
                  Entre mais caro e mais barato
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileSpreadsheet className="h-5 w-5" />
                <span>Análise Detalhada por Canal</span>
              </CardTitle>
              <CardDescription>
                Performance completa de cada canal de distribuição
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analysis.analise_detalhada.map((canal, index) => {
                  const isHighest = canal.canal === analysis.resumo.canal_mais_caro.nome
                  const isLowest = canal.canal === analysis.resumo.canal_mais_barato.nome
                  
                  return (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            {getPriceIcon(isHighest, isLowest)}
                            <h4 className="font-bold text-lg">{canal.canal}</h4>
                          </div>
                          {getShareBadge(canal.share_percentual)}
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">
                            R$ {canal.tarifa_media.toFixed(2)}
                          </div>
                          <p className="text-xs text-gray-600">Tarifa média</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Tarifas</p>
                          <p className="font-medium">{canal.total_tarifas.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Hotéis</p>
                          <p className="font-medium">{canal.total_hoteis}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Share</p>
                          <p className="font-medium">{canal.share_percentual.toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Faixa</p>
                          <p className="font-medium">
                            R$ {canal.tarifa_min.toFixed(2)} - R$ {canal.tarifa_max.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      
                      {/* Progress bar for share */}
                      <div className="mt-3">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(canal.share_percentual, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Insights */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-blue-800">
                <Users className="h-5 w-5" />
                <span>Insights da Análise</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-blue-700">
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <p>
                    <strong>{analysis.resumo.canal_mais_caro.nome}</strong> apresenta as tarifas mais altas 
                    (R$ {analysis.resumo.canal_mais_caro.tarifa_media.toFixed(2)} em média)
                  </p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <p>
                    <strong>{analysis.resumo.canal_mais_barato.nome}</strong> oferece as melhores oportunidades 
                    (R$ {analysis.resumo.canal_mais_barato.tarifa_media.toFixed(2)} em média)
                  </p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <p>
                    A diferença entre o canal mais caro e mais barato é de{' '}
                    <strong>{analysis.resumo.diferenca_percentual.toFixed(1)}%</strong>
                  </p>
                </div>
                {analysis.analise_detalhada.length > 0 && (
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    <p>
                      Canal com maior volume:{' '}
                      <strong>
                        {analysis.analise_detalhada.reduce((prev, current) => 
                          prev.total_tarifas > current.total_tarifas ? prev : current
                        ).canal}
                      </strong>
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default ChannelAnalysis

