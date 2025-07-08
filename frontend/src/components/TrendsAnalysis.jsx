import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import { TrendingUp, TrendingDown, Calendar, BarChart3, AlertCircle, Search } from 'lucide-react'

const TrendsAnalysis = () => {
  const [filters, setFilters] = useState({
    hotel: '',
    data_inicio: '',
    data_fim: '',
    tipo_quarto: ''
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

      const response = await fetch(`/api/tendencias?${params}`)
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

  const getTrendIcon = (variacao) => {
    if (variacao > 0) {
      return <TrendingUp className="h-5 w-5 text-green-600" />
    } else if (variacao < 0) {
      return <TrendingDown className="h-5 w-5 text-red-600" />
    } else {
      return <BarChart3 className="h-5 w-5 text-gray-600" />
    }
  }

  const getTrendColor = (variacao) => {
    if (variacao > 0) return 'text-green-600'
    if (variacao < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Análise de Tendências</h2>
        <p className="text-gray-600">Acompanhe a evolução das tarifas ao longo do tempo</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Filtros de Análise</span>
          </CardTitle>
          <CardDescription>
            Configure os parâmetros para análise de tendências
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <div className="space-y-2">
              <Label htmlFor="tipo_quarto">Tipo de Quarto</Label>
              <Input
                id="tipo_quarto"
                placeholder="Ex: Standard, Deluxe"
                value={filters.tipo_quarto}
                onChange={(e) => handleFilterChange('tipo_quarto', e.target.value)}
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
                <CardTitle className="text-sm font-medium">Total de Registros</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {analysis.resumo.total_registros.toLocaleString()}
                </div>
                <p className="text-xs text-gray-600">
                  Tarifas analisadas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Período</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm font-bold text-gray-700">
                  {analysis.resumo.periodo_inicio}
                </div>
                <div className="text-sm font-bold text-gray-700">
                  {analysis.resumo.periodo_fim}
                </div>
                <p className="text-xs text-gray-600">
                  Início - Fim
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Variação Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold flex items-center space-x-2 ${getTrendColor(analysis.resumo.variacao_percentual)}`}>
                  {getTrendIcon(analysis.resumo.variacao_percentual)}
                  <span>{analysis.resumo.variacao_percentual.toFixed(1)}%</span>
                </div>
                <p className="text-xs text-gray-600">
                  No período analisado
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Tarifa Média</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  R$ {analysis.resumo.tarifa_media_periodo.toFixed(2)}
                </div>
                <p className="text-xs text-gray-600">
                  Média do período
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Daily Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Tendência Diária</span>
              </CardTitle>
              <CardDescription>
                Evolução das tarifas por dia
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {analysis.tendencia_diaria.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.data}</p>
                      <p className="text-xs text-gray-600">
                        {item.count} tarifas
                      </p>
                    </div>
                    <div className="text-center mx-4">
                      <p className="text-sm font-bold text-blue-600">
                        R$ {item.mean.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">
                        R$ {item.min.toFixed(2)} - R$ {item.max.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Monthly Trends */}
          {analysis.tendencia_mensal.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Tendência Mensal</span>
                </CardTitle>
                <CardDescription>
                  Evolução das tarifas por mês
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {analysis.tendencia_mensal.map((item, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <h4 className="font-medium text-lg">{item.mes}</h4>
                        <div className="text-2xl font-bold text-blue-600 mt-2">
                          R$ {item.mean.toFixed(2)}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {item.count} tarifas
                        </p>
                        <div className="flex justify-between text-xs text-gray-500 mt-2">
                          <span>Min: R$ {item.min.toFixed(2)}</span>
                          <span>Max: R$ {item.max.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

export default TrendsAnalysis

