import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Badge } from './ui/badge'
import { Trash2, FileSpreadsheet, Calendar, Building, AlertTriangle } from 'lucide-react'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const PlanilhasManagement = () => {
  const [planilhas, setPlanilhas] = useState([])
  const [hotels, setHotels] = useState([])
  const [selectedHotel, setSelectedHotel] = useState('')
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(null)

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

  const fetchPlanilhas = async (hotelId = '') => {
    setLoading(true)
    try {
      const url = hotelId 
        ? `${API_BASE_URL}/api/planilhas?hotel_id=${hotelId}`
        : `${API_BASE_URL}/api/planilhas`
      
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setPlanilhas(data.data || [])
        }
      }
    } catch (error) {
      console.error('Erro ao buscar planilhas:', error)
      setPlanilhas([])
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePlanilha = async (planilhaId, nomeArquivo) => {
    if (!confirm(`Tem certeza que deseja excluir a planilha "${nomeArquivo}"?\n\nTodas as tarifas associadas a esta planilha serão removidas permanentemente.`)) {
      return
    }

    setDeleting(planilhaId)
    try {
      const response = await fetch(`${API_BASE_URL}/api/planilhas/${planilhaId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          alert(`✅ ${data.message}\n\nTarifas removidas: ${data.tarifas_removidas}`)
          // Recarregar a lista de planilhas
          fetchPlanilhas(selectedHotel)
        } else {
          alert(`❌ Erro: ${data.error}`)
        }
      } else {
        alert('❌ Erro ao excluir planilha')
      }
    } catch (error) {
      console.error('Erro ao excluir planilha:', error)
      alert('❌ Erro de conexão ao excluir planilha')
    } finally {
      setDeleting(null)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  useEffect(() => {
    fetchHotels()
    fetchPlanilhas()
  }, [])

  useEffect(() => {
    fetchPlanilhas(selectedHotel)
  }, [selectedHotel])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gerenciar Planilhas</h1>
        <p className="text-gray-600 mt-2">
          Visualize e remova planilhas de tarifas importadas
        </p>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileSpreadsheet className="w-5 h-5" />
            <span>Filtros</span>
          </CardTitle>
          <CardDescription>
            Filtre as planilhas por hotel para facilitar o gerenciamento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hotel
              </label>
              <Select value={selectedHotel} onValueChange={setSelectedHotel}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os hotéis" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os hotéis</SelectItem>
                  {hotels.map((hotel) => (
                    <SelectItem key={hotel.id} value={hotel.id.toString()}>
                      <div className="flex items-center space-x-2">
                        <Building className="w-4 h-4" />
                        <span>{hotel.nome}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={() => fetchPlanilhas(selectedHotel)}
              disabled={loading}
            >
              {loading ? 'Carregando...' : 'Atualizar'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Planilhas */}
      <Card>
        <CardHeader>
          <CardTitle>Planilhas Importadas</CardTitle>
          <CardDescription>
            {planilhas.length} planilha(s) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Carregando planilhas...</p>
            </div>
          ) : planilhas.length === 0 ? (
            <div className="text-center py-8">
              <FileSpreadsheet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhuma planilha encontrada
              </h3>
              <p className="text-gray-600">
                {selectedHotel 
                  ? 'Não há planilhas importadas para o hotel selecionado'
                  : 'Não há planilhas importadas no sistema'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {planilhas.map((planilha) => (
                <div 
                  key={planilha.id} 
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                        <h3 className="font-semibold text-gray-900">
                          {planilha.nome_arquivo}
                        </h3>
                        <Badge variant="outline">
                          {planilha.quantidade_tarifas} tarifa(s)
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Building className="w-4 h-4" />
                          <span>{planilha.hotel_nome}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(planilha.data_importacao)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                            ID: {planilha.id}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-4">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeletePlanilha(planilha.id, planilha.nome_arquivo)}
                        disabled={deleting === planilha.id}
                        className="flex items-center space-x-2"
                      >
                        {deleting === planilha.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Excluindo...</span>
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4" />
                            <span>Excluir</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Aviso */}
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-orange-900 mb-1">
                Atenção
              </h3>
              <p className="text-orange-800 text-sm">
                A exclusão de uma planilha remove permanentemente todas as tarifas associadas a ela. 
                Esta ação não pode ser desfeita. Certifique-se de que realmente deseja excluir antes de confirmar.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default PlanilhasManagement

