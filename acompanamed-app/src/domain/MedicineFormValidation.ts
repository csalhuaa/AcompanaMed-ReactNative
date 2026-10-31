export interface MedicineFormInput {
  name: string;
  dose: string;
  scheduleTime: string;
  stock: string;
  minAlert: string;
}

export type MedicineFormErrors = Partial<Record<keyof MedicineFormInput, string>>;

export type MedicineFormResult =
  | { valid: false; errors: MedicineFormErrors }
  | {
      valid: true;
      value: {
        name: string;
        doseDescription: string;
        scheduleTime: string;
        stock: number;
        minStockAlert: number;
      };
    };

export function validateMedicineForm(input: MedicineFormInput): MedicineFormResult {
  const errors: MedicineFormErrors = {};
  const name = input.name.trim();
  const doseDescription = input.dose.trim();
  const scheduleTime = input.scheduleTime.trim();
  const stock = input.stock.trim();
  const minAlert = input.minAlert.trim();
  const isInventoryCount = (value: string) => /^\d+$/.test(value) && Number.isSafeInteger(Number(value));

  if (!name) errors.name = 'Indique el nombre del medicamento.';
  if (!doseDescription) errors.dose = 'Indique la dosis de su receta, por ejemplo 50 mg.';
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(scheduleTime)) {
    errors.scheduleTime = 'Use el formato de 24 horas HH:MM, por ejemplo 08:00 o 00:30.';
  }
  if (!isInventoryCount(stock)) errors.stock = 'Ingrese una cantidad entera de 0 o más unidades.';
  if (!isInventoryCount(minAlert)) errors.minAlert = 'Ingrese un umbral entero de 0 o más unidades.';

  if (Object.keys(errors).length > 0) return { valid: false, errors };
  return {
    valid: true,
    value: { name, doseDescription, scheduleTime, stock: Number(stock), minStockAlert: Number(minAlert) },
  };
}
