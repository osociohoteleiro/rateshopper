import { Model, Association } from 'sequelize';
import { IImportacaoLog } from '../types';
import Hotel from './Hotel';
declare class ImportacaoLog extends Model<IImportacaoLog> implements IImportacaoLog {
    id: number;
    hotel_id: number;
    arquivo_nome: string;
    total_registros: number;
    registros_sucesso: number;
    registros_erro: number;
    status: 'processando' | 'sucesso' | 'erro' | 'sucesso_com_erros';
    readonly created_at: Date;
    readonly updated_at: Date;
    static associations: {
        hotel: Association<ImportacaoLog, Hotel>;
    };
}
export default ImportacaoLog;
//# sourceMappingURL=ImportacaoLog.d.ts.map