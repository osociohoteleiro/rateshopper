import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Progress } from './ui/progress'
import { Alert, AlertDescription } from './ui/alert'
import { Upload, Download, FileSpreadsheet, CheckCircle, AlertCircle, Hotel } from 'lucide-react'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const UploadComponent = ({ onRefresh }) => {
  const [hotels, setHotels] = useState([])
  const [selectedHotel, setSelectedHotel] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadResult, setUploadResult] = useState(null)

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

  useEffect(() => {
    fetchHotels()
  }, [])

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Verificar se é um arquivo Excel
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        '' // Para permitir arquivos sem tipo MIME detectado
      ]
      
      // Verificar pela extensão se o tipo MIME não for reconhecido
      const fileName = file.name.toLowerCase()
      const isExcel = allowedTypes.includes(file.type) || 
                     fileName.endsWith('.xlsx') || 
                     fileName.endsWith('.xls')
      
      if (!isExcel) {
        alert('Por favor, selecione um arquivo Excel (.xlsx ou .xls)')
        e.target.value = ''
        return
      }
      
      setSelectedFile(file)
      setUploadResult(null)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !selectedHotel) {
      alert('Por favor, selecione um hotel e um arquivo')
      return
    }

    setUploading(true)
    setUploadProgress(0)
    setUploadResult(null)

    try {
      const formData = new FormData()
      formData.append('arquivo', selectedFile)
      formData.append('hotelId', selectedHotel)

      // Simular progresso
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 200)

      console.log('Enviando para:', `${API_BASE_URL}/api/upload`)
      console.log('Hotel ID:', selectedHotel)
      console.log('Arquivo:', selectedFile.name)

      const response = await fetch(`${API_BASE_URL}/api/upload`, {
        method: 'POST',
        body: formData,
        // Não definir Content-Type, deixar o navegador configurar com o boundary correto para multipart/form-data
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!response.ok) {
        console.error('Erro na resposta:', response.status, response.statusText)
        throw new Error(`Erro no servidor: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.success) {
        setUploadResult({
          success: true,
          message: 'Upload realizado com sucesso!',
          ...data.data
        })
        if (onRefresh && typeof onRefresh === 'function') {
          onRefresh()
        }
      } else {
        setUploadResult({
          success: false,
          message: data.error || 'Erro no upload'
        })
      }
    } catch (error) {
      console.error('Erro no upload:', error)
      setUploadResult({
        success: false,
        message: `Erro de conexão: ${error.message}`
      })
    } finally {
      setUploading(false)
      setTimeout(() => setUploadProgress(0), 2000)
    }
  }

  const downloadModel = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/upload/modelo`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'modelo_tarifas.xlsx'
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        alert('Erro ao baixar modelo')
      }
    } catch (error) {
      console.error('Erro ao baixar modelo:', error)
      alert('Erro ao baixar modelo')
    }
  }

  const resetForm = () => {
    setSelectedFile(null)
    setSelectedHotel('')
    setUploadResult(null)
    setUploadProgress(0)
    // Limpar input file
    const fileInput = document.getElementById('file-upload')
    if (fileInput) fileInput.value = ''
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Upload de Planilhas</h2>
          <p className="text-gray-600">Importe tarifas através de planilhas Excel</p>
        </div>
        
        <Button 
          onClick={downloadModel}
          variant="outline"
          className="flex items-center space-x-2"
        >
          <Download className="w-4 h-4" />
          <span>Baixar Modelo</span>
        </Button>
      </div>

      {/* Instruções */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800 flex items-center space-x-2">
            <FileSpreadsheet className="w-5 h-5" />
            <span>Como usar</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-700">
          <ol className="list-decimal list-inside space-y-2">
            <li>Baixe o modelo de planilha clicando no botão "Baixar Modelo"</li>
            <li>A planilha deve conter 3 colunas: Data Check-in, Data Check-out e Preço</li>
            <li>Selecione o hotel de destino</li>
            <li>Faça o upload do arquivo preenchido</li>
          </ol>
        </CardContent>
      </Card>

      {/* Formulário de Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="w-5 h-5" />
            <span>Upload de Arquivo</span>
          </CardTitle>
          <CardDescription>
            Selecione um hotel e faça upload da planilha de tarifas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Seleção de Hotel */}
          <div className="space-y-2">
            <Label htmlFor="hotel-select">Hotel de Destino *</Label>
            <Select value={selectedHotel} onValueChange={setSelectedHotel}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um hotel" />
              </SelectTrigger>
              <SelectContent>
                {hotels.map((hotel) => (
                  <SelectItem key={hotel.id} value={hotel.id.toString()}>
                    <div className="flex items-center space-x-2">
                      <Hotel className="w-4 h-4" />
                      <span>{hotel.nome}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Seleção de Arquivo */}
          <div className="space-y-2">
            <Label htmlFor="file-upload">Arquivo Excel *</Label>
            <Input
              id="file-upload"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              disabled={uploading}
            />
            {selectedFile && (
              <p className="text-sm text-gray-600">
                Arquivo selecionado: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          {/* Progresso do Upload */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Processando arquivo...</span>
                <span className="text-sm text-gray-600">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}

          {/* Resultado do Upload */}
          {uploadResult && (
            <Alert className={uploadResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <div className="flex items-center space-x-2">
                {uploadResult.success ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600" />
                )}
                <AlertDescription className={uploadResult.success ? 'text-green-800' : 'text-red-800'}>
                  {uploadResult.message}
                </AlertDescription>
              </div>
              
              {uploadResult.success && uploadResult.total_registros && (
                <div className="mt-3 text-sm text-green-700">
                  <p><strong>Total de registros:</strong> {uploadResult.total_registros}</p>
                  <p><strong>Importados com sucesso:</strong> {uploadResult.registros_sucesso}</p>
                  {uploadResult.registros_erro > 0 && (
                    <p><strong>Registros com erro:</strong> {uploadResult.registros_erro}</p>
                  )}
                </div>
              )}
              
              {uploadResult.erros && uploadResult.erros.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-red-700">Erros encontrados:</p>
                  <ul className="text-sm text-red-600 list-disc list-inside mt-1">
                    {uploadResult.erros.slice(0, 5).map((erro, index) => (
                      <li key={index}>{erro}</li>
                    ))}
                    {uploadResult.erros.length > 5 && (
                      <li>... e mais {uploadResult.erros.length - 5} erro(s)</li>
                    )}
                  </ul>
                </div>
              )}
            </Alert>
          )}

          {/* Botões */}
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={resetForm}
              disabled={uploading}
            >
              Limpar
            </Button>
            <Button 
              onClick={handleUpload}
              disabled={!selectedFile || !selectedHotel || uploading}
              className="flex items-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>{uploading ? 'Processando...' : 'Fazer Upload'}</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default UploadComponent

