import { useState, useEffect } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const PlanilhasManagement = () => {
  const [planilhas, setPlanilhas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPlanilhas()
  }, [])

  const fetchPlanilhas = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/api/planilhas`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setPlanilhas(data.data || [])
        }
      }
    } catch (error) {
      console.error('Erro ao buscar planilhas:', error)
    } finally {
      setLoading(false)
    }
  }

  const deletePlanilha = async (planilhaId) => {
    if (!confirm('Tem certeza que deseja excluir esta planilha? Esta ação não pode ser desfeita.')) {
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/planilhas/${planilhaId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          alert(`Planilha removida com sucesso! ${data.tarifas_removidas} tarifas foram excluídas.`)
          fetchPlanilhas() // Recarregar a lista
        }
      }
    } catch (error) {
      console.error('Erro ao excluir planilha:', error)
      alert('Erro ao excluir planilha. Tente novamente.')
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('pt-BR')
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Gerenciamento de Planilhas</h1>
        <div className="text-center py-8">
          <p>Carregando planilhas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Gerenciamento de Planilhas</h1>
      <p className="text-gray-600 mb-8">Gerencie as planilhas de tarifas importadas no sistema</p>

      {planilhas.length === 0 ? (
        <div className="text-center py-8">
          <div className="bg-gray-50 rounded-lg p-8">
            <p className="text-gray-500 text-lg mb-4">Nenhuma planilha encontrada</p>
            <p className="text-gray-400">Faça upload de uma planilha na página de Upload para começar</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {planilhas.map((planilha) => (
            <div key={planilha.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {planilha.nome_arquivo}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Hotel:</span> {planilha.hotel_nome}
                    </div>
                    <div>
                      <span className="font-medium">Data de Importação:</span> {formatDate(planilha.data_importacao)}
                    </div>
                    <div>
                      <span className="font-medium">Tarifas:</span> {planilha.quantidade_tarifas}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => deletePlanilha(planilha.id)}
                  className="ml-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default PlanilhasManagement

