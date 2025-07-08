import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import { Users, TrendingUp, TrendingDown, Target, AlertCircle, Search } from 'lucide-react'

const BenchmarkingAnalysis = () => {
  const [filters, setFilters] = useState({
    hotel_foco: '',
    data_inicio: '',
    data_fim: '',
    tipo_quarto: '',
    canal: '',
    localizacao: ''
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
    if (!filters.hotel_foco.trim()) {
      setError('Hotel foco é obrigatório para análise de benchmarking')
      return
    }

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

      const response = await fetch(`/api/benchmarking?${params}`)
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

  const getPositionBadge = (posicao, total) => {
    const percentil = (posicao / total) * 100
    if (percentil <= 25) {
      return <Badge className="bg-green-100 text-green-800">Top 25%</Badge>
    } else if (percentil <= 50) {
      return <Badge className="bg-blue-100 text-blue-800">Top 50%</Badge>
    } else if (percentil <= 75) {
      return <Badge className="bg-yellow-100 text-yellow-800">Top 75%</Badge>
    } else {
      return <Badge className="bg-red-100 text-red-800">Bottom 25%</Badge>
    }
  }

  const getOpportunityIcon = (tipo) => {
    switch (tipo) {
      case 'aumento_preco':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'reducao_preco':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <Target className="h-4 w-4 text-blue-600" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Análise de Benchmarking</h2>
        <p className="text-gray-600">Compare seu hotel com a concorrência</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Filtros de Análise</span>
          </CardTitle>
          <CardDescription>
            Configure os parâmetros para análise de benchmarking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hotel_foco">Hotel Foco *</Label>
              <Input
                id="hotel_foco"
                placeholder="Nome do hotel para análise"
                value={filters.hotel_foco}
                onChange={(e) => handleFilterChange('hotel_foco', e.target.value)}
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
            <div className="space-y-2">
              <Label htmlFor="canal">Canal</Label>
              <Input
                id="canal"
                placeholder="Ex: Booking.com, Direto"
                value={filters.canal}
                onChange={(e) => handleFilterChange('canal', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="localizacao">Localização</Label>
              <Input
                id="localizacao"
                placeholder="Ex: Copacabana, Ipanema"
                value={filters.localizacao}
                onChange={(e) => handleFilterChange('localizacao', e.target.value)}
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
                <CardTitle className="text-sm font-medium">Hotel Foco</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-blue-600">
                  {analysis.hotel_foco}
                </div>
                <p className="text-xs text-gray-600">
                  {analysis.resumo_foco.total_tarifas} tarifas analisadas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Tarifa Média</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-green-600">
                  R$ {analysis.resumo_foco.tarifa_media.toFixed(2)}
                </div>
                <p className="text-xs text-gray-600">
                  Min: R$ {analysis.resumo_foco.tarifa_min.toFixed(2)} | 
                  Max: R$ {analysis.resumo_foco.tarifa_max.toFixed(2)}
                </p>
              </CardContent>
            </Card>

            {analysis.resumo_mercado && (
              <>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Posicionamento</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2">
                      {analysis.comparacao_mercado.posicionamento === 'acima' ? (
                        <TrendingUp className="h-5 w-5 text-red-500" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-green-500" />
                      )}
                      <span className="text-lg font-bold">
                        {analysis.comparacao_mercado.diferenca_percentual.toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">
                      {analysis.comparacao_mercado.posicionamento} do mercado
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Mercado</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold text-purple-600">
                      {analysis.resumo_mercado.total_hoteis} hotéis
                    </div>
                    <p className="text-xs text-gray-600">
                      Média: R$ {analysis.resumo_mercado.tarifa_media.toFixed(2)}
                    </p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Ranking por Tipo de Quarto */}
          {Object.keys(analysis.ranking_por_tipo).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Ranking por Tipo de Quarto</span>
                </CardTitle>
                <CardDescription>
                  Posicionamento competitivo por categoria
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(analysis.ranking_por_tipo).map(([tipo, dados]) => (
                    <div key={tipo} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{tipo}</h4>
                        <p className="text-sm text-gray-600">
                          Posição {dados.posicao} de {dados.total_hoteis}
                        </p>
                      </div>
                      <div className="text-center mx-4">
                        <div className="text-lg font-bold text-blue-600">
                          R$ {dados.tarifa_media_foco.toFixed(2)}
                        </div>
                        <p className="text-xs text-gray-500">vs R$ {dados.tarifa_media_mercado.toFixed(2)}</p>
                      </div>
                      <div>
                        {getPositionBadge(dados.posicao, dados.total_hoteis)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Oportunidades */}
          {analysis.oportunidades.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>Oportunidades Identificadas</span>
                </CardTitle>
                <CardDescription>
                  Recomendações baseadas na análise competitiva
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysis.oportunidades.map((oportunidade, index) => (
                    <div key={index} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                      <div className="mt-1">
                        {getOpportunityIcon(oportunidade.tipo)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{oportunidade.categoria}</h4>
                        <p className="text-sm text-gray-600 mb-2">
                          {oportunidade.descricao}
                        </p>
                        <div className="flex items-center space-x-4 text-sm">
                          <span>
                            <strong>Atual:</strong> R$ {oportunidade.valor_atual.toFixed(2)}
                          </span>
                          <span>
                            <strong>Sugerido:</strong> R$ {oportunidade.valor_sugerido.toFixed(2)}
                          </span>
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

export default BenchmarkingAnalysis

