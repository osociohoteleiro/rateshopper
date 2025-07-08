import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { BarChart3, TrendingUp, Users, FileSpreadsheet, RefreshCw, Calendar, DollarSign } from 'lucide-react'
import { apiUrl } from '../utils/api'

const Dashboard = ({ stats, onRefresh }) => {
  const [recentTarifas, setRecentTarifas] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchRecentData = async () => {
    try {
      // Buscar tarifas recentes
      const tarifasResponse = await fetch(apiUrl('/api/tarifas?per_page=10'))
      if (tarifasResponse.ok) {
        const tarifasData = await tarifasResponse.json()
        setRecentTarifas(tarifasData.tarifas || [])
      } else {
        console.error('Erro na resposta da API de tarifas:', tarifasResponse.status)
        setRecentTarifas([])
      }

      // Logs de importação serão implementados futuramente
      setLogs([])
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
      setRecentTarifas([])
      setLogs([])
    }
  }

  useEffect(() => {
    fetchRecentData()
  }, [])

  const getStatusBadge = (status) => {
    const statusConfig = {
      'sucesso': { variant: 'default', className: 'bg-green-100 text-green-800' },
      'sucesso_com_erros': { variant: 'secondary', className: 'bg-yellow-100 text-yellow-800' },
      'erro': { variant: 'destructive', className: 'bg-red-100 text-red-800' },
      'processando': { variant: 'outline', className: 'bg-blue-100 text-blue-800' }
    }
    
    const config = statusConfig[status] || statusConfig['processando']
    return (
      <Badge variant={config.variant} className={config.className}>
        {status === 'sucesso' ? 'Sucesso' : 
         status === 'sucesso_com_erros' ? 'Sucesso c/ Erros' :
         status === 'erro' ? 'Erro' : 'Processando'}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Refresh */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-600">Visão geral dos dados de tarifas</p>
        </div>
        <Button 
          onClick={async () => {
            try {
              setLoading(true)
              await onRefresh()
              await fetchRecentData()
            } catch (error) {
              console.error('Erro ao atualizar:', error)
            } finally {
              setLoading(false)
            }
          }} 
          disabled={loading}
          variant="outline"
          className="flex items-center space-x-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Atualizar</span>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Tarifas</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.total_tarifas.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Registros de tarifas importados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hotéis Únicos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.total_hoteis}
            </div>
            <p className="text-xs text-muted-foreground">
              Hotéis diferentes no sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Canais de Distribuição</CardTitle>
            <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {stats.total_canais}
            </div>
            <p className="text-xs text-muted-foreground">
              Canais diferentes monitorados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Última Importação</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold text-gray-700">
              {stats.ultima_importacao ? 
                stats.ultima_importacao.data_importacao : 
                'Nenhuma'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.ultima_importacao ? 
                `${stats.ultima_importacao.registros_validos} registros` : 
                'Faça sua primeira importação'
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tarifas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5" />
              <span>Tarifas Recentes</span>
            </CardTitle>
            <CardDescription>
              Últimas 10 tarifas importadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentTarifas.length > 0 ? (
              <div className="space-y-3">
                {recentTarifas.map((tarifa, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-sm">Hotel ID: {tarifa.hotel_id}</p>
                      <p className="text-xs text-gray-600">
                        {tarifa.data_checkin} - {tarifa.data_checkout}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">
                        {tarifa.moeda} {(tarifa.preco || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Nenhuma tarifa encontrada</p>
                <p className="text-sm">Faça upload de uma planilha para começar</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Import Logs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileSpreadsheet className="h-5 w-5" />
              <span>Histórico de Importações</span>
            </CardTitle>
            <CardDescription>
              Últimas importações realizadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {logs.length > 0 ? (
              <div className="space-y-3">
                {logs.slice(0, 5).map((log, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{log.nome_arquivo}</p>
                      <p className="text-xs text-gray-600">
                        {log.data_importacao}
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      {getStatusBadge(log.status)}
                      <p className="text-xs text-gray-600">
                        {log.registros_validos}/{log.total_registros}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Nenhuma importação realizada</p>
                <p className="text-sm">Vá para a aba Upload para começar</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      {stats.total_tarifas > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>
              Acesse rapidamente as principais funcionalidades
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                <Users className="h-6 w-6" />
                <span>Análise de Benchmarking</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                <TrendingUp className="h-6 w-6" />
                <span>Análise de Tendências</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                <BarChart3 className="h-6 w-6" />
                <span>Análise de Canais</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default Dashboard

