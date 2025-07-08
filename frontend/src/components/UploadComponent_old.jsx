import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent } from '@/components/ui/card.jsx'
import { Progress } from '@/components/ui/progress.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Download, Hotel } from 'lucide-react'

const UploadComponent = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null)
  const [selectedHotel, setSelectedHotel] = useState('')
  const [hoteis, setHoteis] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef(null)

  const fetchHoteis = async () => {
    try {
      const response = await fetch('/api/hoteis')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setHoteis(data.hoteis)
        }
      }
    } catch (error) {
      console.error('Erro ao buscar hotéis:', error)
    }
  }

  useEffect(() => {
    fetchHoteis()
  }, [])

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile.type.includes('sheet') || droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls')) {
        setFile(droppedFile)
        setUploadResult(null)
      } else {
        setUploadResult({
          error: 'Tipo de arquivo não suportado. Use arquivos .xlsx ou .xls'
        })
      }
    }
  }

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setUploadResult(null)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setUploadResult({ error: 'Selecione um arquivo primeiro' })
      return
    }

    if (!selectedHotel) {
      setUploadResult({ error: 'Selecione um hotel primeiro' })
      return
    }

    setUploading(true)
    setUploadResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('hotel_id', selectedHotel)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()
      
      if (result.success) {
        setUploadResult({
          success: true,
          message: result.message,
          hotel: result.hotel,
          resultado: result.resultado
        })
        setFile(null)
        setSelectedHotel('')
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        if (onUploadSuccess) {
          onUploadSuccess()
        }
      } else {
        setUploadResult({
          error: result.error || 'Erro no upload'
        })
      }
    } catch (error) {
      setUploadResult({
        error: 'Erro de conexão. Tente novamente.'
      })
    } finally {
      setUploading(false)
    }
  }
    if (!file) return

    setUploading(true)
    setUploadResult(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (response.ok) {
        setUploadResult({
          success: true,
          ...result
        })
        setFile(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        if (onUploadSuccess) {
          onUploadSuccess()
        }
      } else {
        setUploadResult({
          error: result.error || 'Erro no upload'
        })
      }
    } catch (error) {
      setUploadResult({
        error: 'Erro de conexão. Verifique se o servidor está rodando.'
      })
    } finally {
      setUploading(false)
    }
  }

  const downloadTemplate = () => {
    // Criar link para download do modelo
    const link = document.createElement('a')
    link.href = '/modelo_rate_shopper.xlsx'
    link.download = 'modelo_rate_shopper.xlsx'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      {/* Download Template */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Upload de Planilha</h3>
          <p className="text-sm text-gray-600">
            Faça upload de arquivos Excel (.xlsx, .xls) com dados de tarifas
          </p>
        </div>
        <Button variant="outline" onClick={downloadTemplate} className="flex items-center space-x-2">
          <Download className="h-4 w-4" />
          <span>Baixar Modelo</span>
        </Button>
      </div>

      {/* Upload Area */}
      <Card 
        className={`border-2 border-dashed transition-colors ${
          dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : file 
              ? 'border-green-500 bg-green-50' 
              : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <CardContent className="p-8">
          <div className="text-center">
            {file ? (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <FileSpreadsheet className="h-12 w-12 text-green-600" />
                </div>
                <div>
                  <p className="text-lg font-medium text-green-700">{file.name}</p>
                  <p className="text-sm text-gray-600">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <div className="flex justify-center space-x-3">
                  <Button onClick={handleUpload} disabled={uploading}>
                    {uploading ? 'Enviando...' : 'Fazer Upload'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setFile(null)
                      if (fileInputRef.current) {
                        fileInputRef.current.value = ''
                      }
                    }}
                  >
                    Remover
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <Upload className="h-12 w-12 text-gray-400" />
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-700">
                    Arraste e solte sua planilha aqui
                  </p>
                  <p className="text-sm text-gray-500">
                    ou clique para selecionar um arquivo
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => fileInputRef.current?.click()}
                >
                  Selecionar Arquivo
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Progress Bar */}
      {uploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Processando planilha...</span>
            <span>Aguarde</span>
          </div>
          <Progress value={50} className="w-full" />
        </div>
      )}

      {/* Upload Result */}
      {uploadResult && (
        <div className="space-y-4">
          {uploadResult.success ? (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <div className="space-y-2">
                  <p className="font-medium">Upload realizado com sucesso!</p>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Total:</span> {uploadResult.total_registros}
                    </div>
                    <div>
                      <span className="font-medium">Válidos:</span> {uploadResult.registros_validos}
                    </div>
                    <div>
                      <span className="font-medium">Erros:</span> {uploadResult.registros_erro}
                    </div>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <p className="font-medium">Erro no upload:</p>
                <p>{uploadResult.error}</p>
              </AlertDescription>
            </Alert>
          )}

          {/* Detailed Errors */}
          {uploadResult.erros && uploadResult.erros.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium text-red-700 mb-2">Erros Detalhados:</h4>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {uploadResult.erros.map((erro, index) => (
                    <p key={index} className="text-sm text-red-600">
                      {erro}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <h4 className="font-medium text-blue-800 mb-2">Instruções:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Use o modelo de planilha fornecido para garantir compatibilidade</li>
            <li>• Campos obrigatórios: Hotel, Data, Tipo_Quarto, Tarifa, Moeda, Canal</li>
            <li>• Formato de data: DD/MM/AAAA (ex: 15/03/2024)</li>
            <li>• Tamanho máximo: 10MB</li>
            <li>• Máximo de 10.000 registros por planilha</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

export default UploadComponent

