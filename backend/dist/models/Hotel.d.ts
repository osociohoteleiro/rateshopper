import { Model, Association } from 'sequelize';
import { IHotel } from '../types';
declare class Hotel extends Model<IHotel> implements IHotel {
    id: number;
    nome: string;
    url_booking?: string;
    localizacao?: string;
    readonly created_at: Date;
    readonly updated_at: Date;
    static associations: {
        tarifas: Association<Hotel, any>;
        concorrentes: Association<Hotel, Hotel>;
        concorrentesDe: Association<Hotel, Hotel>;
    };
}
export default Hotel;
//# sourceMappingURL=Hotel.d.ts.map