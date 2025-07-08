import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog.jsx'
import { Hotel, Plus, Edit, Trash2, Users, ExternalLink, Star } from 'lucide-react'
import { apiUrl } from '../utils/api'

function HotelManagement({ onUpdate }) {
  const [hoteis, setHoteis] = useState([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingHotel, setEditingHotel] = useState(null)
  const [selectedHotel, setSelectedHotel] = useState(null)
  const [formData, setFormData] = useState({
    nome: '',
    booking_url: '',
    categoria: '',
    localizacao: ''
  })

  const fetchHoteis = async () => {
    try {
      setLoading(true)
      const response = await fetch(apiUrl('/api/hoteis'))
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setHoteis(data.hoteis)
        }
      }
    } catch (error) {
      console.error('Erro ao buscar hotéis:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const url = editingHotel ? `/api/hoteis/${editingHotel.id}` : '/api/hoteis'
      const method = editingHotel ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          categoria: formData.categoria ? parseInt(formData.categoria) : null
        })
      })

      const data = await response.json()
      
      if (data.success) {
        await fetchHoteis()
        setShowForm(false)
        setEditingHotel(null)
        setFormData({ nome: '', booking_url: '', categoria: '', localizacao: '' })
        if (onUpdate) onUpdate()
      } else {
        alert(data.error || 'Erro ao salvar hotel')
      }
    } catch (error) {
      console.error('Erro ao salvar hotel:', error)
      alert('Erro ao salvar hotel')
    }
  }

  const handleEdit = (hotel) => {
    setEditingHotel(hotel)
    setFormData({
      nome: hotel.nome,
      booking_url: hotel.booking_url || '',
      categoria: hotel.categoria ? hotel.categoria.toString() : '',
      localizacao: hotel.localizacao || ''
    })
    setShowForm(true)
  }

  const handleDelete = async (hotel) => {
    if (!confirm(`Tem certeza que deseja excluir o hotel "${hotel.nome}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/hoteis/${hotel.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      
      if (data.success) {
        await fetchHoteis()
        if (onUpdate) onUpdate()
      } else {
        alert(data.error || 'Erro ao excluir hotel')
      }
    } catch (error) {
      console.error('Erro ao excluir hotel:', error)
      alert('Erro ao excluir hotel')
    }
  }

  const openConcorrentes = async (hotel) => {
    try {
      const response = await fetch(`/api/hoteis/${hotel.id}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setSelectedHotel(data.hotel)
        }
      }
    } catch (error) {
      console.error('Erro ao buscar detalhes do hotel:', error)
    }
  }

  useEffect(() => {
    fetchHoteis()
  }, [])

  const renderStars = (categoria) => {
    if (!categoria) return null
    return (
      <div className="flex items-center">
        {[...Array(categoria)].map((_, i) => (
          <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="lista" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="lista">Lista de Hotéis</TabsTrigger>
          <TabsTrigger value="novo">Novo Hotel</TabsTrigger>
        </TabsList>

        <TabsContent value="lista" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Hotéis Cadastrados</h3>
            <Button onClick={() => fetchHoteis()} variant="outline" size="sm">
              🔄 Atualizar
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8">Carregando hotéis...</div>
          ) : hoteis.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Hotel className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum hotel cadastrado ainda</p>
                <p className="text-sm text-gray-400 mt-2">
                  Use a aba "Novo Hotel" para cadastrar seu primeiro hotel
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {hoteis.map((hotel) => (
                <Card key={hotel.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-lg font-semibold">{hotel.nome}</h4>
                          {hotel.categoria && renderStars(hotel.categoria)}
                        </div>
                        
                        {hotel.localizacao && (
                          <p className="text-sm text-gray-600 mb-2">📍 {hotel.localizacao}</p>
                        )}
                        
                        {hotel.booking_url && (
                          <a 
                            href={hotel.booking_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            <span>Ver na Booking.com</span>
                          </a>
                        )}
                        
                        <div className="flex items-center space-x-4 mt-3">
                          <Badge variant="secondary">
                            {hotel.total_tarifas} tarifas
                          </Badge>
                          <Badge variant="outline">
                            {hotel.total_concorrentes} concorrentes
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => openConcorrentes(hotel)}
                            >
                              <Users className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Concorrentes - {selectedHotel?.nome}</DialogTitle>
                              <DialogDescription>
                                Gerencie os concorrentes deste hotel
                              </DialogDescription>
                            </DialogHeader>
                            {selectedHotel && (
                              <ConcorrentesManager 
                                hotel={selectedHotel} 
                                hoteis={hoteis}
                                onUpdate={fetchHoteis}
                              />
                            )}
                          </DialogContent>
                        </Dialog>
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEdit(hotel)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDelete(hotel)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="novo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plus className="h-5 w-5" />
                <span>{editingHotel ? 'Editar Hotel' : 'Novo Hotel'}</span>
              </CardTitle>
              <CardDescription>
                {editingHotel ? 'Atualize as informações do hotel' : 'Cadastre um novo hotel no sistema'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome do Hotel *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({...formData, nome: e.target.value})}
                      placeholder="Ex: Hotel Copacabana Palace"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="categoria">Categoria (Estrelas)</Label>
                    <Select 
                      value={formData.categoria} 
                      onValueChange={(value) => setFormData({...formData, categoria: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">⭐ 1 Estrela</SelectItem>
                        <SelectItem value="2">⭐⭐ 2 Estrelas</SelectItem>
                        <SelectItem value="3">⭐⭐⭐ 3 Estrelas</SelectItem>
                        <SelectItem value="4">⭐⭐⭐⭐ 4 Estrelas</SelectItem>
                        <SelectItem value="5">⭐⭐⭐⭐⭐ 5 Estrelas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="booking_url">URL da Booking.com</Label>
                  <Input
                    id="booking_url"
                    value={formData.booking_url}
                    onChange={(e) => setFormData({...formData, booking_url: e.target.value})}
                    placeholder="https://www.booking.com/hotel/br/..."
                    type="url"
                  />
                  <p className="text-xs text-gray-500">
                    Cole aqui o link da página do hotel na Booking.com
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="localizacao">Localização</Label>
                  <Input
                    id="localizacao"
                    value={formData.localizacao}
                    onChange={(e) => setFormData({...formData, localizacao: e.target.value})}
                    placeholder="Ex: Copacabana, Rio de Janeiro"
                  />
                </div>
                
                <div className="flex space-x-2">
                  <Button type="submit" className="flex-1">
                    {editingHotel ? 'Atualizar Hotel' : 'Cadastrar Hotel'}
                  </Button>
                  {editingHotel && (
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => {
                        setEditingHotel(null)
                        setFormData({ nome: '', booking_url: '', categoria: '', localizacao: '' })
                      }}
                    >
                      Cancelar
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog para edição inline */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Hotel</DialogTitle>
            <DialogDescription>
              Atualize as informações do hotel
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-nome">Nome do Hotel *</Label>
              <Input
                id="edit-nome"
                value={formData.nome}
                onChange={(e) => setFormData({...formData, nome: e.target.value})}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-categoria">Categoria</Label>
              <Select 
                value={formData.categoria} 
                onValueChange={(value) => setFormData({...formData, categoria: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">⭐ 1 Estrela</SelectItem>
                  <SelectItem value="2">⭐⭐ 2 Estrelas</SelectItem>
                  <SelectItem value="3">⭐⭐⭐ 3 Estrelas</SelectItem>
                  <SelectItem value="4">⭐⭐⭐⭐ 4 Estrelas</SelectItem>
                  <SelectItem value="5">⭐⭐⭐⭐⭐ 5 Estrelas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-booking">URL da Booking.com</Label>
              <Input
                id="edit-booking"
                value={formData.booking_url}
                onChange={(e) => setFormData({...formData, booking_url: e.target.value})}
                type="url"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-localizacao">Localização</Label>
              <Input
                id="edit-localizacao"
                value={formData.localizacao}
                onChange={(e) => setFormData({...formData, localizacao: e.target.value})}
              />
            </div>
            
            <div className="flex space-x-2">
              <Button type="submit" className="flex-1">
                Salvar Alterações
              </Button>
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setShowForm(false)}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ConcorrentesManager({ hotel, hoteis, onUpdate }) {
  const [concorrentes, setConcorrentes] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchConcorrentes = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/hoteis/${hotel.id}/concorrentes`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setConcorrentes(data.concorrentes)
        }
      }
    } catch (error) {
      console.error('Erro ao buscar concorrentes:', error)
    } finally {
      setLoading(false)
    }
  }

  const adicionarConcorrente = async (concorrenteId) => {
    try {
      const response = await fetch(`/api/hoteis/${hotel.id}/concorrentes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ concorrente_id: parseInt(concorrenteId) })
      })

      const data = await response.json()
      
      if (data.success) {
        await fetchConcorrentes()
        if (onUpdate) onUpdate()
      } else {
        alert(data.error || 'Erro ao adicionar concorrente')
      }
    } catch (error) {
      console.error('Erro ao adicionar concorrente:', error)
      alert('Erro ao adicionar concorrente')
    }
  }

  const removerConcorrente = async (concorrenteId) => {
    try {
      const response = await fetch(`/api/hoteis/${hotel.id}/concorrentes/${concorrenteId}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      
      if (data.success) {
        await fetchConcorrentes()
        if (onUpdate) onUpdate()
      } else {
        alert(data.error || 'Erro ao remover concorrente')
      }
    } catch (error) {
      console.error('Erro ao remover concorrente:', error)
      alert('Erro ao remover concorrente')
    }
  }

  useEffect(() => {
    fetchConcorrentes()
  }, [hotel.id])

  const hoteisDisponiveis = hoteis.filter(h => 
    h.id !== hotel.id && !concorrentes.some(c => c.id === h.id)
  )

  return (
    <div className="space-y-4">
      {/* Adicionar novo concorrente */}
      <div className="space-y-2">
        <Label>Adicionar Concorrente</Label>
        <Select onValueChange={adicionarConcorrente}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione um hotel concorrente" />
          </SelectTrigger>
          <SelectContent>
            {hoteisDisponiveis.map((h) => (
              <SelectItem key={h.id} value={h.id.toString()}>
                {h.nome} {h.localizacao && `- ${h.localizacao}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Lista de concorrentes */}
      <div className="space-y-2">
        <Label>Concorrentes Atuais ({concorrentes.length})</Label>
        {loading ? (
          <div className="text-center py-4">Carregando...</div>
        ) : concorrentes.length === 0 ? (
          <p className="text-gray-500 text-sm">Nenhum concorrente cadastrado</p>
        ) : (
          <div className="space-y-2">
            {concorrentes.map((concorrente) => (
              <div key={concorrente.id} className="flex justify-between items-center p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{concorrente.nome}</p>
                  {concorrente.localizacao && (
                    <p className="text-sm text-gray-500">{concorrente.localizacao}</p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removerConcorrente(concorrente.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default HotelManagement

