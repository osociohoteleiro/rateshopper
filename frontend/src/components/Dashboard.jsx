import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Calendar, MapPin, DollarSign, Building } from 'lucide-react'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const Dashboard = ({ onRefresh }) => {
  const [recentTarifas, setRecentTarifas] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchRecentData = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/tarifas?per_page=10`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setRecentTarifas(data.data || [])
        }
      }
    } catch (error) {
      console.error('Erro ao buscar tarifas recentes:', error)
      setRecentTarifas([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecentData()
  }, [])

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('pt-BR')
    } catch {
      return 'Data inválida'
    }
  }

  const formatPrice = (price) => {
    try {
      return parseFloat(price || 0).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      })
    } catch {
      return 'R$ 0,00'
    }
  }

  return (
    <div className="space-y-6">
      {/* Título da Seção */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-600">Visão geral das tarifas e atividades recentes</p>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Tarifas Hoje</p>
                <p className="text-2xl font-bold text-blue-700">
                  {recentTarifas.filter(t => {
                    const today = new Date().toDateString()
                    const tarifaDate = new Date(t.created_at || t.data_checkin).toDateString()
                    return today === tarifaDate
                  }).length}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Preço Médio</p>
                <p className="text-2xl font-bold text-green-700">
                  {recentTarifas.length > 0 
                    ? formatPrice(recentTarifas.reduce((acc, t) => acc + (parseFloat(t.preco) || 0), 0) / recentTarifas.length)
                    : 'R$ 0,00'
                  }
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Hotéis Ativos</p>
                <p className="text-2xl font-bold text-purple-700">
                  {new Set(recentTarifas.map(t => t.hotel_id)).size}
                </p>
              </div>
              <Building className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Canais</p>
                <p className="text-2xl font-bold text-orange-700">
                  {new Set(recentTarifas.map(t => t.canal).filter(Boolean)).size}
                </p>
              </div>
              <MapPin className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tarifas Recentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Tarifas Recentes</span>
          </CardTitle>
          <CardDescription>
            Últimas tarifas importadas no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Carregando...</span>
            </div>
          ) : recentTarifas.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma tarifa encontrada</p>
              <p className="text-sm text-gray-400">Faça upload de uma planilha para começar</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentTarifas.map((tarifa, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Building className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {tarifa.hotel?.nome || `Hotel ID: ${tarifa.hotel_id}`}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(tarifa.data_checkin)} - {formatDate(tarifa.data_checkout)}</span>
                        </span>
                        {tarifa.canal && (
                          <Badge variant="secondary" className="text-xs">
                            {tarifa.canal}
                          </Badge>
                        )}
                        {tarifa.tipo_quarto && (
                          <Badge variant="outline" className="text-xs">
                            {tarifa.tipo_quarto}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">
                      {formatPrice(tarifa.preco)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {tarifa.moeda || 'BRL'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default Dashboard

