
const Prestamo = require('../../models/Prestamo');
const Pagos = require('../../models/Pagos');
const payAPI = (ipcMain) =>{
    ipcMain.handle('db:registerPayment', async (_, data) => {
        const { id_Prestamo_fk, Fecha_Pago, Fecha_Catorcena, Monto_Pago, Monto_Pago_Capital, Monto_Pago_Intereses, Periodo_Catorcenal, Metodo_Pago } = data;
    
        console.log('db:registerPayment', data);
    
        try {
            // Buscar el préstamo por su ID
            const prestamo = await Prestamo.findByPk(id_Prestamo_fk);
    
            if (!prestamo) {
                throw new Error('Préstamo no encontrado');
            }
    
            let montoRestante = Monto_Pago;
    
            // Verificar si hay un abono restante en el préstamo
            let abonoPendiente = parseFloat(prestamo.Resto_Abono || 0);
    
            // Si hay un abono pendiente, intentar cubrirlo
            if (abonoPendiente > 0) {
                if (montoRestante >= abonoPendiente) {
                    // Cubrir el abono pendiente completamente
                    montoRestante -= abonoPendiente;
                    abonoPendiente = 0;
                    prestamo.Pagos_Completados = (prestamo.Pagos_Completados || 0) + 1;
                } else {
                    // Cubrir parcialmente el abono pendiente
                    abonoPendiente -= montoRestante;
                    montoRestante = 0;
                }
            }
    
            // Si queda un monto restante, aplicarlo al abono actual
            if (montoRestante > 0) {
                const abonoActual = parseFloat(prestamo.Abono);
    
                if (montoRestante >= abonoActual) {
                    // Pago completo del abono
                    montoRestante -= abonoActual;
                    abonoPendiente = 0;
                    prestamo.Pagos_Completados = (prestamo.Pagos_Completados || 0) + 1;
                } else {
                    // Pago parcial del abono
                    abonoPendiente = abonoActual - montoRestante;
                    montoRestante = 0;
                }
            }
    
            // Calcular el nuevo saldo del préstamo
            const nuevoSaldo = parseFloat(prestamo.Saldo) - Monto_Pago;
    
            // Registrar el pago
            const pago = await Pagos.create({
                Fecha_Pago,
                Fecha_Catorcena,
                Monto_Pago,
                Monto_Pago_Capital,
                Monto_Pago_Intereses,
                Periodo_Catorcenal,
                Metodo_Pago,
                Saldo_Actual: nuevoSaldo,
                id_Prestamo_fk,
            });
    
            // Actualizar el préstamo
            const totalPagosEsperados = parseInt(prestamo.No_Catorcenas || 0); // Asumiendo que este campo representa el total de pagos esperados
            let nuevoEstado = prestamo.EstadoPrestamo;
    
            if (nuevoSaldo <= 0 || (prestamo.Pagos_Completados || 0) >= totalPagosEsperados) {
                nuevoEstado = 'Pagado';
            }
    
            await prestamo.update({
                Saldo: nuevoSaldo,
                Resto_Abono: abonoPendiente,
                Pagos_Completados: prestamo.Pagos_Completados,
                EstadoPrestamo: nuevoEstado,
            });
    
            // Crear mensaje de resultado
            const mensaje = abonoPendiente === 0
                ? 'Pago registrado como completo.'
                : `Pago registrado. Resta ${abonoPendiente.toFixed(2)} para completar el abono.`;
    
            return {
                message: mensaje,
                pago,
            };
        } catch (error) {
            console.error('Error registrando el pago:', error);
            throw new Error('Error registrando el pago');
        }
    });
    
    
      ipcMain.handle('db:deletePayment', async (_, idPago) => {
        try {
            // Buscar el pago por su ID
            const pago = await Pagos.findByPk(idPago);
            if (!pago) {
                throw new Error('Pago no encontrado');
            }
    
            // Buscar el préstamo relacionado con el pago
            const prestamo = await Prestamo.findByPk(pago.id_Prestamo_fk);
            if (!prestamo) {
                throw new Error('Préstamo relacionado no encontrado');
            }
    
            // Recuperar montos del pago y del préstamo
            const montoPago = parseFloat(pago.Monto_Pago);
            const montoCapital = parseFloat(pago.Monto_Pago_Capital);
            const montoIntereses = parseFloat(pago.Monto_Pago_Intereses);
    
            // Revertir el saldo del préstamo
            const nuevoSaldo = parseFloat(prestamo.Saldo) + montoPago;
    
            // Determinar ajustes para pagos completados y abono pendiente
            let abonoPendiente = parseFloat(prestamo.Resto_Abono || 0);
            let pagosCompletados = prestamo.Pagos_Completados || 0;
            let Capital;
    
            // Si el pago eliminado incluía abono y el resto del abono es 0
            const abonoActual = parseFloat(prestamo.Abono);
            
            if (abonoPendiente === 0 && abonoActual === montoPago) {
                pagosCompletados -= 1;
            } else {
                abonoPendiente += montoPago;
                if(abonoPendiente == abonoActual){
                    abonoPendiente =0;
                }
      
            }
    
            // Actualizar el total pagado de capital e intereses
            const totalPagadoCapital = parseFloat(prestamo.Total_Pagado_Capital || 0) - montoCapital;
            const totalPagadoIntereses = parseFloat(prestamo.Total_Pagado_Intereses || 0) - montoIntereses;
    
            // Validar que los totales no sean negativos
            const totalCapitalValidado = totalPagadoCapital >= 0 ? totalPagadoCapital : 0;
            const totalInteresesValidado = totalPagadoIntereses >= 0 ? totalPagadoIntereses : 0;
    
            Capital = parseFloat(prestamo.Total_Capital) + montoCapital;
            // Eliminar el pago
            await pago.destroy();
    
            // Actualizar el préstamo
            await prestamo.update({
                Saldo: nuevoSaldo,
                Resto_Abono: abonoPendiente,
                Pagos_Completados: pagosCompletados,
                Total_Pagado_Capital: totalCapitalValidado,
                Total_Pagado_Intereses: totalInteresesValidado,
                Total_Capital: Capital
            });
    
            return {
                message: 'Pago eliminado exitosamente.',
            };
        } catch (error) {
            console.error('Error eliminando el pago:', error);
            throw new Error('Error eliminando el pago');
        }
    });
}

module.exports = payAPI; 