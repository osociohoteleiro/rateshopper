import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Upload, BarChart3, TrendingUp, Users, FileSpreadsheet, AlertCircle, Hotel, GitCompare } from 'lucide-react'
import UploadComponent from './components/UploadComponent'
import Dashboard from './components/Dashboard'
import HotelManagement from './components/HotelManagement'
import ComparativeDashboard from './components/ComparativeDashboard'
import BenchmarkingAnalysis from './components/BenchmarkingAnalysis'
import TrendsAnalysis from './components/TrendsAnalysis'
import ChannelAnalysis from './components/ChannelAnalysis'
import { apiUrl } from './utils/api'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [stats, setStats] = useState({
    total_tarifas: 0,
    total_hoteis: 0,
    total_concorrentes: 0,
    ultima_importacao: null
  })

  const fetchStats = async () => {
    try {
      const response = await fetch(apiUrl('/api/estatisticas'))
      if (response.ok) {
        const data = await response.json()
        setStats({
          total_tarifas: data.total_tarifas || 0,
          total_hoteis: data.total_hoteis || 0,
          total_concorrentes: data.total_concorrentes || 0,
          ultima_importacao: data.ultima_importacao || null
        })
      } else {
        console.error('Erro na resposta da API:', response.status)
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error)
      // Manter valores padrão em caso de erro
      setStats({
        total_tarifas: 0,
        total_hoteis: 0,
        total_concorrentes: 0,
        ultima_importacao: null
      })
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Rate Shopper</h1>
                <p className="text-sm text-gray-600">Sistema de Benchmarking Hoteleiro</p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{(stats.total_tarifas || 0).toLocaleString()}</div>
                <div className="text-xs text-gray-500">Tarifas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.total_hoteis || 0}</div>
                <div className="text-xs text-gray-500">Hotéis</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.total_concorrentes || 0}</div>
                <div className="text-xs text-gray-500">Concorrentes</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 bg-white shadow-sm">
            <TabsTrigger value="dashboard" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="hoteis" className="flex items-center space-x-2">
              <Hotel className="h-4 w-4" />
              <span>Hotéis</span>
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center space-x-2">
              <Upload className="h-4 w-4" />
              <span>Upload</span>
            </TabsTrigger>
            <TabsTrigger value="comparativo" className="flex items-center space-x-2">
              <GitCompare className="h-4 w-4" />
              <span>Comparativo</span>
            </TabsTrigger>
            <TabsTrigger value="benchmarking" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Benchmarking</span>
            </TabsTrigger>
            <TabsTrigger value="trends" className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>Tendências</span>
            </TabsTrigger>
            <TabsTrigger value="channels" className="flex items-center space-x-2">
              <FileSpreadsheet className="h-4 w-4" />
              <span>Canais</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <Dashboard stats={stats} onRefresh={fetchStats} />
          </TabsContent>

          <TabsContent value="hoteis" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Hotel className="h-5 w-5" />
                  <span>Gestão de Hotéis</span>
                </CardTitle>
                <CardDescription>
                  Cadastre hotéis e gerencie seus concorrentes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <HotelManagement onUpdate={fetchStats} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upload" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Upload className="h-5 w-5" />
                  <span>Upload de Planilha</span>
                </CardTitle>
                <CardDescription>
                  Faça upload de planilhas Excel com tarifas de hotéis para análise
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UploadComponent onUploadSuccess={fetchStats} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comparativo" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <GitCompare className="h-5 w-5" />
                  <span>Dashboard Comparativo</span>
                </CardTitle>
                <CardDescription>
                  Compare tarifas entre hotéis concorrentes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ComparativeDashboard />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="benchmarking" className="space-y-6">
            <BenchmarkingAnalysis />
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <TrendsAnalysis />
          </TabsContent>

          <TabsContent value="channels" className="space-y-6">
            <ChannelAnalysis />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              © 2024 Rate Shopper. Sistema de benchmarking hoteleiro.
            </p>
            {stats.ultima_importacao && (
              <p className="text-sm text-gray-500">
                Última importação: {stats.ultima_importacao.data_importacao}
              </p>
            )}
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App

