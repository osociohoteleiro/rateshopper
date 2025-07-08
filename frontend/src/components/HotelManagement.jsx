import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Hotel, Plus, Edit, Trash2, MapPin, ExternalLink, Users, UserPlus, UserMinus } from 'lucide-react'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const HotelManagement = ({ onRefresh }) => {
  const [hotels, setHotels] = useState([])
  const [loading, setLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isConcorrenteDialogOpen, setIsConcorrenteDialogOpen] = useState(false)
  const [editingHotel, setEditingHotel] = useState(null)
  const [selectedConcorrente, setSelectedConcorrente] = useState('')
  const [formData, setFormData] = useState({
    nome: '',
    url_booking: '',
    localizacao: ''
  })

  const fetchHotels = async () => {
    setLoading(true)
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
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHotels()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.nome.trim()) {
      alert('Nome do hotel é obrigatório')
      return
    }

    try {
      console.log('Enviando dados do hotel:', formData)
      
      const url = editingHotel 
        ? `${API_BASE_URL}/api/hotels/${editingHotel.id}`
        : `${API_BASE_URL}/api/hotels`
      
      const method = editingHotel ? 'PUT' : 'POST'
      
      // Garantir que url_booking não seja undefined
      const dataToSend = {
        ...formData,
        url_booking: formData.url_booking || ''
      }
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSend)
      })

      console.log('Status da resposta:', response.status)
      
      const data = await response.json()
      console.log('Resposta do servidor:', data)
      
      if (response.ok && data.success) {
        setIsDialogOpen(false)
        setEditingHotel(null)
        setFormData({ nome: '', url_booking: '', localizacao: '' })
        fetchHotels()
        onRefresh()
      } else {
        alert(data.error || 'Erro ao salvar hotel')
      }
    } catch (error) {
      console.error('Erro ao salvar hotel:', error)
      alert('Erro ao salvar hotel: ' + error.message)
    }
  }

  const handleEdit = (hotel) => {
    setEditingHotel(hotel)
    setFormData({
      nome: hotel.nome || '',
      url_booking: hotel.url_booking || '',
      localizacao: hotel.localizacao || ''
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (hotel) => {
    if (!confirm(`Tem certeza que deseja excluir o hotel "${hotel.nome}"?`)) {
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/hotels/${hotel.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          fetchHotels()
          onRefresh()
        } else {
          alert(data.error || 'Erro ao excluir hotel')
        }
      } else {
        const data = await response.json()
        alert(data.error || 'Erro ao excluir hotel')
      }
    } catch (error) {
      console.error('Erro ao excluir hotel:', error)
      alert('Erro ao excluir hotel')
    }
  }

  const openNewHotelDialog = () => {
    setEditingHotel(null)
    setFormData({ nome: '', url_booking: '', localizacao: '' })
    setIsDialogOpen(true)
  }

  const openConcorrenteDialog = (hotel) => {
    setEditingHotel(hotel)
    setSelectedConcorrente('')
    setIsConcorrenteDialogOpen(true)
  }

  const handleAddConcorrente = async () => {
    if (!selectedConcorrente || !editingHotel) {
      alert('Selecione um hotel concorrente')
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/hotels/${editingHotel.id}/concorrentes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ concorrente_id: selectedConcorrente })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setIsConcorrenteDialogOpen(false)
          setSelectedConcorrente('')
          fetchHotels()
          onRefresh()
        } else {
          alert(data.error || 'Erro ao adicionar concorrente')
        }
      } else {
        const data = await response.json()
        alert(data.error || 'Erro ao adicionar concorrente')
      }
    } catch (error) {
      console.error('Erro ao adicionar concorrente:', error)
      alert('Erro ao adicionar concorrente')
    }
  }

  const handleRemoveConcorrente = async (hotel, concorrenteId) => {
    if (!confirm('Tem certeza que deseja remover este concorrente?')) {
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/hotels/${hotel.id}/concorrentes/${concorrenteId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          fetchHotels()
          onRefresh()
        } else {
          alert(data.error || 'Erro ao remover concorrente')
        }
      } else {
        const data = await response.json()
        alert(data.error || 'Erro ao remover concorrente')
      }
    } catch (error) {
      console.error('Erro ao remover concorrente:', error)
      alert('Erro ao remover concorrente')
    }
  }

  // Filtrar hotéis disponíveis para serem concorrentes (excluindo o hotel atual e os que já são concorrentes)
  const getAvailableConcorrentes = (hotel) => {
    if (!hotel) return []
    
    const concorrentesIds = (hotel.concorrentes || []).map(c => c.id)
    return hotels.filter(h => h.id !== hotel.id && !concorrentesIds.includes(h.id))
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Gestão de Hotéis</h2>
          <p className="text-gray-600">Gerencie os hotéis cadastrados no sistema</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewHotelDialog} className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Novo Hotel</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingHotel ? 'Editar Hotel' : 'Novo Hotel'}
              </DialogTitle>
              <DialogDescription>
                {editingHotel 
                  ? 'Edite as informações do hotel abaixo.'
                  : 'Preencha as informações do novo hotel.'
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome do Hotel *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Hotel Copacabana Palace"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="url_booking">URL Booking.com</Label>
                <Input
                  id="url_booking"
                  type="url"
                  value={formData.url_booking || ''}
                  onChange={(e) => setFormData({ ...formData, url_booking: e.target.value })}
                  placeholder="https://www.booking.com/hotel/..."
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="localizacao">Localização</Label>
                <Input
                  id="localizacao"
                  value={formData.localizacao || ''}
                  onChange={(e) => setFormData({ ...formData, localizacao: e.target.value })}
                  placeholder="Ex: Copacabana, Rio de Janeiro"
                />
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingHotel ? 'Salvar' : 'Criar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog para adicionar concorrentes */}
        <Dialog open={isConcorrenteDialogOpen} onOpenChange={setIsConcorrenteDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Adicionar Concorrente</DialogTitle>
              <DialogDescription>
                Selecione um hotel para adicionar como concorrente de {editingHotel?.nome}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="concorrente">Hotel Concorrente</Label>
                <Select value={selectedConcorrente} onValueChange={setSelectedConcorrente}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um hotel" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableConcorrentes(editingHotel).map((hotel) => (
                      <SelectItem key={hotel.id} value={hotel.id.toString()}>
                        {hotel.nome}
                      </SelectItem>
                    ))}
                    {getAvailableConcorrentes(editingHotel).length === 0 && (
                      <SelectItem value="none" disabled>
                        Nenhum hotel disponível
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsConcorrenteDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleAddConcorrente}
                  disabled={!selectedConcorrente || getAvailableConcorrentes(editingHotel).length === 0}
                >
                  Adicionar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de Hotéis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Hotel className="w-5 h-5" />
            <span>Hotéis Cadastrados</span>
          </CardTitle>
          <CardDescription>
            Lista de todos os hotéis cadastrados no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Carregando...</span>
            </div>
          ) : hotels.length === 0 ? (
            <div className="text-center py-8">
              <Hotel className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum hotel cadastrado</p>
              <p className="text-sm text-gray-400">Clique em "Novo Hotel" para começar</p>
            </div>
          ) : (
            <div className="space-y-4">
              {hotels.map((hotel) => (
                <div key={hotel.id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Hotel className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{hotel.nome}</h3>
                        <div className="flex items-center space-x-4 mt-1">
                          {hotel.localizacao && (
                            <span className="flex items-center space-x-1 text-sm text-gray-600">
                              <MapPin className="w-4 h-4" />
                              <span>{hotel.localizacao}</span>
                            </span>
                          )}
                          {hotel.url_booking && (
                            <a 
                              href={hotel.url_booking} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800"
                            >
                              <ExternalLink className="w-4 h-4" />
                              <span>Booking.com</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openConcorrenteDialog(hotel)}
                        className="flex items-center space-x-1"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>Concorrente</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(hotel)}
                        className="flex items-center space-x-1"
                      >
                        <Edit className="w-4 h-4" />
                        <span>Editar</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(hotel)}
                        className="flex items-center space-x-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Excluir</span>
                      </Button>
                    </div>
                  </div>
                  
                  {/* Lista de Concorrentes */}
                  {hotel.concorrentes && hotel.concorrentes.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <Users className="w-4 h-4 text-purple-600" />
                        <h4 className="font-medium text-purple-600">Concorrentes</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {hotel.concorrentes.map((concorrente) => (
                          <div 
                            key={concorrente.id} 
                            className="flex items-center justify-between p-2 bg-white rounded border border-gray-200"
                          >
                            <div className="flex items-center space-x-2">
                              <Hotel className="w-4 h-4 text-gray-600" />
                              <span className="text-sm">{concorrente.nome}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveConcorrente(hotel, concorrente.id)}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <UserMinus className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default HotelManagement

