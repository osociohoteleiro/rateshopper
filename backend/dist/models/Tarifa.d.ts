import { Model, Association } from 'sequelize';
import { ITarifa } from '../types';
import Hotel from './Hotel';
declare class Tarifa extends Model<ITarifa> implements ITarifa {
    id: number;
    hotel_id: number;
    data_checkin: Date;
    data_checkout: Date;
    preco: number;
    moeda?: string;
    canal?: string;
    tipo_quarto?: string;
    readonly created_at: Date;
    readonly updated_at: Date;
    static associations: {
        hotel: Association<Tarifa, Hotel>;
    };
}
export default Tarifa;
//# sourceMappingURL=Tarifa.d.ts.map