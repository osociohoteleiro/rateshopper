export interface IHotel {
    id?: number;
    nome: string;
    url_booking?: string;
    localizacao?: string;
    created_at?: Date;
    updated_at?: Date;
}
export interface ITarifa {
    id?: number;
    hotel_id: number;
    data_checkin: Date;
    data_checkout: Date;
    preco: number;
    moeda?: string;
    canal?: string;
    tipo_quarto?: string;
    created_at?: Date;
    updated_at?: Date;
}
export interface IImportacaoLog {
    id?: number;
    hotel_id: number;
    arquivo_nome: string;
    total_registros: number;
    registros_sucesso: number;
    registros_erro: number;
    status: 'processando' | 'sucesso' | 'erro' | 'sucesso_com_erros';
    created_at?: Date;
    updated_at?: Date;
}
export interface IEstatisticas {
    total_tarifas: number;
    total_hoteis: number;
    total_concorrentes: number;
    ultima_importacao?: IImportacaoLog | null;
}
export interface IUploadResult {
    success: boolean;
    message: string;
    total_registros?: number;
    registros_sucesso?: number;
    registros_erro?: number;
    erros?: string[];
}
export interface IAnaliseComparativa {
    hotel_foco: string;
    periodo: {
        data_inicio: Date;
        data_fim: Date;
    };
    dados_foco: ITarifa[];
    dados_concorrentes: ITarifa[];
    estatisticas: {
        preco_medio_foco: number;
        preco_medio_concorrentes: number;
        diferenca_percentual: number;
    };
}
export interface IApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}
export interface IPaginacao {
    page: number;
    per_page: number;
    total: number;
    pages: number;
}
export interface IPaginatedResponse<T> extends IApiResponse<T> {
    pagination: IPaginacao;
}
export interface IFiltroTarifa {
    hotel_id?: number;
    data_inicio?: Date;
    data_fim?: Date;
    preco_min?: number;
    preco_max?: number;
    canal?: string;
    tipo_quarto?: string;
}
export interface IDadosExcel {
    data_checkin: string;
    data_checkout: string;
    preco: string | number;
    canal?: string;
    tipo_quarto?: string;
}
//# sourceMappingURL=index.d.ts.map