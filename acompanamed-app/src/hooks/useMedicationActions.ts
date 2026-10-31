import React, { useState, useRef } from 'react';
import { Medicine, DoseLog, ActorRole, EmergencyProfile } from '../domain/types';
import {
  canRegisterDose,
  decrementStock,
  ScheduledDoseItem,
} from '../domain';
import {
  defaultSpeechService,
  defaultHapticService,
  defaultNotificationService,
  formatConfirmationSpeech,
} from '../infrastructure';
import { getScheduledDate } from '../domain/LocalWorkflow';
import { showNotice } from '../data/initialData';
import { NewMedicineData } from '../components';

interface UseMedicationActionsProps {
  medicines: Medicine[];
  setMedicines: React.Dispatch<React.SetStateAction<Medicine[]>>;
  scheduleTimes: Record<string, string>;
  setScheduleTimes: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  logs: DoseLog[];
  setLogs: React.Dispatch<React.SetStateAction<DoseLog[]>>;
  emergencyProfile: EmergencyProfile;
  activeRole: ActorRole;
  dailySchedule: ScheduledDoseItem[];
  syncToCloud: (
    overrideMeds?: Medicine[],
    overrideLogs?: DoseLog[],
    overrideTimes?: Record<string, string>
  ) => Promise<void>;
  setExpandedMedId: React.Dispatch<React.SetStateAction<string>>;
}

export function useMedicationActions({
  medicines,
  setMedicines,
  scheduleTimes,
  setScheduleTimes,
  logs,
  setLogs,
  emergencyProfile,
  activeRole,
  dailySchedule,
  syncToCloud,
  setExpandedMedId,
}: UseMedicationActionsProps) {
  const doseActionBusy = useRef(false);

  // Estados de modales de medicación
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [isRestockModalVisible, setIsRestockModalVisible] = useState(false);
  const [restockingMedicine, setRestockingMedicine] = useState<Medicine | null>(null);
  const [isDeleteConfirmVisible, setIsDeleteConfirmVisible] = useState(false);
  const [deletingMedicine, setDeletingMedicine] = useState<Medicine | null>(null);

  const handleTakeDose = (medId: string, actor: ActorRole = activeRole) => {
    if (doseActionBusy.current) return;
    const med = medicines.find((m) => m.id === medId);
    if (!med) return;
    if (dailySchedule.find((item) => item.medicine.id === medId)?.isTakenToday) {
      showNotice('Toma ya registrada', 'Esta dosis diaria ya fue confirmada hoy.');
      return;
    }
    if (med.stock <= 0) {
      showNotice('Sin existencias', 'Reponga este medicamento antes de registrar la toma.');
      return;
    }

    const check = canRegisterDose(medId, logs, new Date());
    if (!check.allowed) {
      showNotice('Protección de Seguridad Médica', check.reason);
      return;
    }

    doseActionBusy.current = true;
    const updated = decrementStock(med, 1);
    const newMeds = medicines.map((m) => (m.id === updated.id ? updated : m));

    const newLog: DoseLog = {
      id: `log-${Date.now()}`,
      medicineId: medId,
      scheduledTime: getScheduledDate(scheduleTimes[medId] || '08:00', new Date()).toISOString(),
      takenTime: new Date().toISOString(),
      status: 'taken',
      registeredBy: actor,
    };
    const newLogs = [newLog, ...logs];

    setMedicines(newMeds);
    setLogs(newLogs);
    setTimeout(() => {
      doseActionBusy.current = false;
    }, 500);

    defaultNotificationService.cancelSnoozeReminder(medId).catch(() => {
      showNotice('Aviso pendiente', 'La toma se guardó, pero no se pudo cancelar el aviso pospuesto.');
    });
    syncToCloud(newMeds, newLogs);

    if (actor === 'patient') {
      defaultHapticService.vibrateSuccess();
      defaultSpeechService.speak(formatConfirmationSpeech(emergencyProfile.patientFullName, med.name, updated.stock));
    }

    showNotice('Dosis Confirmada', `Toma de ${med.name} registrada. Quedan ${updated.stock} comprimidos.`);
  };

  const handlePostponeDose = async (medId: string) => {
    if (doseActionBusy.current) return;
    const med = medicines.find((m) => m.id === medId);
    if (!med || dailySchedule.find((item) => item.medicine.id === medId)?.isTakenToday) return;
    doseActionBusy.current = true;
    let reminder: string | null = null;
    try {
      reminder = await defaultNotificationService.scheduleSnoozeReminder(med, 15);
    } catch {
      // Sigue pendiente si falla
    } finally {
      doseActionBusy.current = false;
    }

    if (!reminder) {
      showNotice(
        'Recordatorio no programado',
        'Habilite las notificaciones para recibir avisos pospuestos. La dosis sigue pendiente.'
      );
      return;
    }

    const newLog: DoseLog = {
      id: `log-${Date.now()}`,
      medicineId: medId,
      scheduledTime: getScheduledDate(scheduleTimes[medId] || '08:00', new Date()).toISOString(),
      status: 'postponed',
      registeredBy: activeRole,
      notes: 'Pospuesto 15 minutos por el paciente',
    };
    const newLogs = [newLog, ...logs];
    setLogs(newLogs);
    syncToCloud(undefined, newLogs);

    defaultHapticService.vibrateWarning();
    defaultSpeechService.speak(`Toma de ${med.name} pospuesta 15 minutos.`);
    showNotice('Dosis Pospuesta', `Le recordaremos tomar ${med.name} en 15 minutos.`);
  };

  const handleOpenRestockModal = (med: Medicine) => {
    setRestockingMedicine(med);
    setIsRestockModalVisible(true);
  };

  const handleConfirmRestock = (medId: string, amount: number) => {
    if (!Number.isSafeInteger(amount) || amount <= 0) return;
    const newMeds = medicines.map((m) => (m.id === medId ? { ...m, stock: m.stock + amount } : m));
    setMedicines(newMeds);
    syncToCloud(newMeds);
    const target = medicines.find((m) => m.id === medId);
    const name = target ? target.name : 'medicamento';
    showNotice('Inventario Actualizado', `Se añadieron ${amount} unidades al stock de ${name}.`);
  };

  const handleOpenAddModal = () => {
    setEditingMedicine(null);
    setIsAddModalVisible(true);
  };

  const handleOpenEditModal = (med: Medicine) => {
    setEditingMedicine(med);
    setIsAddModalVisible(true);
  };

  const handleSaveMedicine = async (data: NewMedicineData) => {
    let savedMedicine: Medicine | undefined;
    if (data.id) {
      const newMeds = medicines.map((m) =>
        m.id === data.id
          ? {
              ...m,
              name: data.name,
              doseDescription: data.doseDescription,
              instructions: data.instructions,
              visualPill: {
                ...m.visualPill,
                shape: data.shape,
                colorHex: data.color.hex,
                colorName: data.color.name,
                photoUri: data.photoUri || m.visualPill.photoUri,
                imprint: data.imprint !== undefined ? data.imprint : m.visualPill.imprint,
                canSplit: data.canSplit !== undefined ? data.canSplit : m.visualPill.canSplit,
              },
              stock: data.stock,
              minStockAlert: data.minStockAlert,
            }
          : m
      );
      const newTimes = { ...scheduleTimes, [data.id!]: data.scheduleTime };
      setMedicines(newMeds);
      setScheduleTimes(newTimes);
      syncToCloud(newMeds, undefined, newTimes);
      savedMedicine = newMeds.find((m) => m.id === data.id);
    } else {
      const newId = `med-${Date.now()}`;
      const newMed: Medicine = {
        id: newId,
        name: data.name,
        doseDescription: data.doseDescription,
        intervalHours: 24,
        instructions: data.instructions,
        visualPill: {
          shape: data.shape,
          colorHex: data.color.hex,
          colorName: data.color.name,
          photoUri: data.photoUri,
          imprint: data.imprint,
          canSplit: data.canSplit,
        },
        stock: data.stock,
        minStockAlert: data.minStockAlert,
        createdAt: new Date().toISOString(),
      };
      const newMeds = [...medicines, newMed];
      const newTimes = { ...scheduleTimes, [newId]: data.scheduleTime };
      setMedicines(newMeds);
      setScheduleTimes(newTimes);
      syncToCloud(newMeds, undefined, newTimes);
      savedMedicine = newMed;
      setExpandedMedId(newId);
    }

    setIsAddModalVisible(false);
    setEditingMedicine(null);
    if (savedMedicine) {
      let reminder: string | null = null;
      try {
        reminder = await defaultNotificationService.scheduleDoseReminder(savedMedicine, data.scheduleTime);
      } catch {
        // Guardado local asegurado
      }
      showNotice(
        'Medicamento guardado',
        reminder
          ? `${data.name}: aviso diario a las ${data.scheduleTime}.`
          : `${data.name} se guardó correctamente.`
      );
    }
  };

  const handleRequestDelete = (med: Medicine) => {
    setDeletingMedicine(med);
    setIsDeleteConfirmVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingMedicine) return;
    const id = deletingMedicine.id;
    const name = deletingMedicine.name;
    try {
      await defaultNotificationService.cancelMedicineReminders(id);
    } catch {
      showNotice('No se pudo retirar', 'No se pudieron cancelar sus avisos. Intente nuevamente.');
      return;
    }

    const newMeds = medicines.filter((m) => m.id !== id);
    const newTimes = { ...scheduleTimes };
    delete newTimes[id];

    setMedicines(newMeds);
    setScheduleTimes(newTimes);
    syncToCloud(newMeds, undefined, newTimes);

    setExpandedMedId((prev) => (prev === id && newMeds.length > 0 ? newMeds[0].id : prev));
    setIsDeleteConfirmVisible(false);
    setDeletingMedicine(null);
    showNotice('Medicamento Retirado', `${name} fue retirado del pastillero familiar.`);
  };

  return {
    isAddModalVisible,
    setIsAddModalVisible,
    editingMedicine,
    setEditingMedicine,
    isRestockModalVisible,
    setIsRestockModalVisible,
    restockingMedicine,
    setRestockingMedicine,
    isDeleteConfirmVisible,
    setIsDeleteConfirmVisible,
    deletingMedicine,
    setDeletingMedicine,
    handleTakeDose,
    handlePostponeDose,
    handleOpenRestockModal,
    handleConfirmRestock,
    handleOpenAddModal,
    handleOpenEditModal,
    handleSaveMedicine,
    handleRequestDelete,
    handleConfirmDelete,
  };
}
